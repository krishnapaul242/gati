/**
 * @module runtime/types/queue-fabric
 * @description Queue Fabric types for pub/sub messaging and backpressure management
 */

/**
 * Delivery semantics for message publishing
 */
export type DeliverySemantics = 'at-least-once' | 'exactly-once';

/**
 * Message handler function
 */
export type MessageHandler<T = any> = (payload: T, metadata: MessageMetadata) => Promise<void> | void;

/**
 * Message metadata
 */
export interface MessageMetadata {
  /**
   * Message ID
   */
  messageId: string;

  /**
   * Topic the message was published to
   */
  topic: string;

  /**
   * Timestamp when message was published
   */
  timestamp: number;

  /**
   * Request ID if message is part of a request context
   */
  requestId?: string;

  /**
   * Number of delivery attempts
   */
  deliveryAttempt: number;
}

/**
 * Publish options
 */
export interface PublishOptions {
  /**
   * Delivery semantics (default: at-least-once)
   */
  deliverySemantics?: DeliverySemantics;

  /**
   * Message priority (0-10, higher is more important)
   */
  priority?: number;

  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;

  /**
   * Request ID for result delivery
   */
  requestId?: string;
}

/**
 * Subscription handle
 */
export interface Subscription {
  /**
   * Topic being subscribed to
   */
  topic: string;

  /**
   * Unsubscribe from the topic
   */
  unsubscribe(): void;

  /**
   * Whether the subscription is active
   */
  isActive(): boolean;
}

/**
 * Backpressure status
 */
export interface BackpressureStatus {
  /**
   * Whether backpressure is active
   */
  active: boolean;

  /**
   * Current queue depth
   */
  queueDepth: number;

  /**
   * Maximum queue depth
   */
  maxDepth: number;

  /**
   * Percentage of capacity used
   */
  capacityUsed: number;
}

/**
 * Queue Fabric statistics
 */
export interface QueueFabricStats {
  /**
   * Total messages published
   */
  messagesPublished: number;

  /**
   * Total messages delivered
   */
  messagesDelivered: number;

  /**
   * Messages currently in queue
   */
  queueDepth: number;

  /**
   * Number of active subscriptions
   */
  activeSubscriptions: number;

  /**
   * Backpressure status
   */
  backpressure: BackpressureStatus;
}

/**
 * Queue Fabric configuration
 */
export interface QueueFabricConfig {
  /**
   * Maximum queue depth before backpressure
   */
  maxQueueDepth?: number;

  /**
   * Default delivery semantics
   */
  defaultDeliverySemantics?: DeliverySemantics;

  /**
   * Maximum delivery attempts
   */
  maxDeliveryAttempts?: number;

  /**
   * Message TTL in milliseconds
   */
  defaultTtl?: number;

  /**
   * Enable metrics collection
   */
  enableMetrics?: boolean;
}

/**
 * Queue Fabric interface
 */
export interface QueueFabric {
  /**
   * Publish a message to a topic
   */
  publish<T = any>(topic: string, payload: T, options?: PublishOptions): Promise<void>;

  /**
   * Subscribe to a topic
   */
  subscribe<T = any>(topic: string, handler: MessageHandler<T>): Subscription;

  /**
   * Enforce backpressure when capacity is reached
   */
  enforceBackpressure(threshold: number): void;

  /**
   * Deliver result to originating request context
   */
  deliverResult(requestId: string, result: any): Promise<void>;

  /**
   * Get current backpressure status
   */
  getBackpressureStatus(): BackpressureStatus;

  /**
   * Get queue fabric statistics
   */
  getStats(): QueueFabricStats;

  /**
   * Shutdown the queue fabric
   */
  shutdown(): Promise<void>;
}
