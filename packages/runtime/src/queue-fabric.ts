/**
 * @module runtime/queue-fabric
 * @description In-memory Queue Fabric implementation with pub/sub and backpressure
 */

import { randomUUID } from 'crypto';
import type {
  QueueFabric,
  QueueFabricConfig,
  MessageHandler,
  Subscription,
  PublishOptions,
  BackpressureStatus,
  QueueFabricStats,
  MessageMetadata,
  DeliverySemantics,
} from './types/queue-fabric.js';

/**
 * Internal message structure
 */
interface QueuedMessage<T = any> {
  id: string;
  topic: string;
  payload: T;
  options: Required<PublishOptions>;
  timestamp: number;
  deliveryAttempt: number;
  expiresAt: number;
}

/**
 * Internal subscription structure
 */
interface InternalSubscription<T = any> {
  id: string;
  topic: string;
  handler: MessageHandler<T>;
  active: boolean;
}

/**
 * Request context for result delivery
 */
interface RequestContext {
  requestId: string;
  resultHandlers: Set<(result: any) => void>;
}

/**
 * In-memory Queue Fabric implementation
 * 
 * Provides topic-based pub/sub messaging with:
 * - At-least-once and exactly-once delivery semantics
 * - Backpressure enforcement
 * - Result delivery to originating request contexts
 * - Priority-based message ordering
 * - TTL-based message expiration
 */
export class InMemoryQueueFabric implements QueueFabric {
  private queue: QueuedMessage[] = [];
  private subscriptions: Map<string, Set<InternalSubscription>> = new Map();
  private requestContexts: Map<string, RequestContext> = new Map();
  private deliveredMessages: Set<string> = new Set();
  private processing = false;
  private shutdownRequested = false;
  private processingInterval?: NodeJS.Timeout;

  private config: Required<QueueFabricConfig>;
  private stats = {
    messagesPublished: 0,
    messagesDelivered: 0,
  };

  constructor(config: QueueFabricConfig = {}) {
    this.config = {
      maxQueueDepth: config.maxQueueDepth ?? 10000,
      defaultDeliverySemantics: config.defaultDeliverySemantics ?? 'at-least-once',
      maxDeliveryAttempts: config.maxDeliveryAttempts ?? 3,
      defaultTtl: config.defaultTtl ?? 60000, // 60 seconds
      enableMetrics: config.enableMetrics ?? true,
    };

    // Start processing loop
    this.startProcessing();
  }

  /**
   * Publish a message to a topic
   */
  async publish<T = any>(topic: string, payload: T, options: PublishOptions = {}): Promise<void> {
    if (this.shutdownRequested) {
      throw new Error('Queue fabric is shutting down');
    }

    // Check backpressure BEFORE adding to queue
    if (this.queue.length >= this.config.maxQueueDepth) {
      const capacityUsed = (this.queue.length / this.config.maxQueueDepth) * 100;
      throw new Error(`Backpressure active: queue at ${capacityUsed.toFixed(0)}% capacity`);
    }

    const messageId = randomUUID();
    const timestamp = Date.now();
    const ttl = options.ttl ?? this.config.defaultTtl;

    const message: QueuedMessage<T> = {
      id: messageId,
      topic,
      payload,
      options: {
        deliverySemantics: options.deliverySemantics ?? this.config.defaultDeliverySemantics,
        priority: options.priority ?? 5,
        ttl,
        requestId: options.requestId,
      },
      timestamp,
      deliveryAttempt: 0,
      expiresAt: timestamp + ttl,
    };

    // Insert message in priority order (higher priority first)
    const insertIndex = this.queue.findIndex(m => m.options.priority < message.options.priority);
    if (insertIndex === -1) {
      this.queue.push(message);
    } else {
      this.queue.splice(insertIndex, 0, message);
    }

    this.stats.messagesPublished++;
  }

  /**
   * Subscribe to a topic
   */
  subscribe<T = any>(topic: string, handler: MessageHandler<T>): Subscription {
    const subscriptionId = randomUUID();
    const subscription: InternalSubscription<T> = {
      id: subscriptionId,
      topic,
      handler,
      active: true,
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(subscription as InternalSubscription);

    return {
      topic,
      unsubscribe: () => {
        subscription.active = false;
        const topicSubs = this.subscriptions.get(topic);
        if (topicSubs) {
          topicSubs.delete(subscription as InternalSubscription);
          if (topicSubs.size === 0) {
            this.subscriptions.delete(topic);
          }
        }
      },
      isActive: () => subscription.active,
    };
  }

  /**
   * Enforce backpressure when capacity is reached
   */
  enforceBackpressure(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Backpressure threshold must be between 0 and 1');
    }
    this.config.maxQueueDepth = Math.floor(this.config.maxQueueDepth * threshold);
  }

  /**
   * Deliver result to originating request context
   */
  async deliverResult(requestId: string, result: any): Promise<void> {
    const context = this.requestContexts.get(requestId);
    if (!context) {
      // No handlers registered for this request
      return;
    }

    // Deliver to all registered handlers
    for (const handler of context.resultHandlers) {
      try {
        handler(result);
      } catch (error) {
        console.error(`Error delivering result to request ${requestId}:`, error);
      }
    }

    // Clean up context
    this.requestContexts.delete(requestId);
  }

  /**
   * Get current backpressure status
   */
  getBackpressureStatus(): BackpressureStatus {
    const queueDepth = this.queue.length;
    const maxDepth = this.config.maxQueueDepth;
    const capacityUsed = maxDepth > 0 ? (queueDepth / maxDepth) * 100 : 0;

    return {
      active: queueDepth >= maxDepth,
      queueDepth,
      maxDepth,
      capacityUsed,
    };
  }

  /**
   * Get queue fabric statistics
   */
  getStats(): QueueFabricStats {
    const backpressure = this.getBackpressureStatus();
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.size, 0);

    return {
      messagesPublished: this.stats.messagesPublished,
      messagesDelivered: this.stats.messagesDelivered,
      queueDepth: this.queue.length,
      activeSubscriptions,
      backpressure,
    };
  }

  /**
   * Shutdown the queue fabric
   */
  async shutdown(): Promise<void> {
    this.shutdownRequested = true;

    // Stop processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    // Wait for queue to drain (with timeout)
    const timeout = 1000;
    const start = Date.now();
    while (this.queue.length > 0 && Date.now() - start < timeout) {
      await this.processQueue();
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Clear all subscriptions
    this.subscriptions.clear();
    this.requestContexts.clear();
    this.deliveredMessages.clear();
    this.queue = [];
  }

  /**
   * Register a result handler for a request context
   */
  registerResultHandler(requestId: string, handler: (result: any) => void): void {
    if (!this.requestContexts.has(requestId)) {
      this.requestContexts.set(requestId, {
        requestId,
        resultHandlers: new Set(),
      });
    }
    this.requestContexts.get(requestId)!.resultHandlers.add(handler);
  }

  /**
   * Start the message processing loop
   */
  private startProcessing(): void {
    // Use setInterval for periodic processing
    this.processingInterval = setInterval(() => {
      if (this.shutdownRequested) {
        if (this.processingInterval) {
          clearInterval(this.processingInterval);
        }
        return;
      }
      this.processQueue();
    }, 10); // Process every 10ms
  }

  /**
   * Process messages in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const now = Date.now();
      const message = this.queue[0];

      // Check if message has expired
      if (message.expiresAt <= now) {
        this.queue.shift();
        this.processing = false;
        return;
      }

      // Check if already delivered (for exactly-once semantics)
      if (message.options.deliverySemantics === 'exactly-once' && 
          this.deliveredMessages.has(message.id)) {
        this.queue.shift();
        this.processing = false;
        return;
      }

      // Get subscribers for this topic
      const subscribers = this.subscriptions.get(message.topic);
      if (!subscribers || subscribers.size === 0) {
        // No subscribers, keep message in queue (don't process it)
        this.processing = false;
        return;
      }

      // Deliver to all active subscribers
      const metadata: MessageMetadata = {
        messageId: message.id,
        topic: message.topic,
        timestamp: message.timestamp,
        requestId: message.options.requestId,
        deliveryAttempt: message.deliveryAttempt + 1,
      };

      let deliveryFailed = false;
      for (const sub of subscribers) {
        if (!sub.active) continue;

        try {
          await sub.handler(message.payload, metadata);
        } catch (error) {
          console.error(`Error delivering message ${message.id} to subscriber:`, error);
          deliveryFailed = true;
        }
      }

      // Handle delivery failure
      if (deliveryFailed) {
        message.deliveryAttempt++;
        if (message.deliveryAttempt >= this.config.maxDeliveryAttempts) {
          // Max attempts reached, discard message
          console.error(`Message ${message.id} discarded after ${message.deliveryAttempt} attempts`);
          this.queue.shift();
        } else {
          // Retry: move to end of queue
          this.queue.shift();
          this.queue.push(message);
        }
      } else {
        // Successful delivery
        this.queue.shift();
        this.stats.messagesDelivered++;

        // Mark as delivered for exactly-once semantics
        if (message.options.deliverySemantics === 'exactly-once') {
          this.deliveredMessages.add(message.id);
          // Clean up old delivered messages (keep last 10000)
          if (this.deliveredMessages.size > 10000) {
            const toDelete = Array.from(this.deliveredMessages).slice(0, 1000);
            toDelete.forEach(id => this.deliveredMessages.delete(id));
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }
}

/**
 * Create a new Queue Fabric instance
 */
export function createQueueFabric(config?: QueueFabricConfig): QueueFabric {
  return new InMemoryQueueFabric(config);
}
