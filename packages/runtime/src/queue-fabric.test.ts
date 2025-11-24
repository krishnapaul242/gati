/**
 * @module runtime/queue-fabric.test
 * @description Tests for Queue Fabric implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createQueueFabric, InMemoryQueueFabric } from './queue-fabric.js';
import type { QueueFabric, MessageMetadata } from './types/queue-fabric.js';

describe('Queue Fabric', () => {
  let queueFabric: QueueFabric;

  beforeEach(() => {
    queueFabric = createQueueFabric({
      maxQueueDepth: 100,
      defaultTtl: 5000,
      maxDeliveryAttempts: 3,
    });
  });

  afterEach(async () => {
    await queueFabric.shutdown();
  });

  describe('Basic Pub/Sub', () => {
    it('should publish and deliver messages to subscribers', async () => {
      const messages: any[] = [];
      
      queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      await queueFabric.publish('test-topic', { data: 'test1' });
      await queueFabric.publish('test-topic', { data: 'test2' });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ data: 'test1' });
      expect(messages[1]).toEqual({ data: 'test2' });
    });

    it('should deliver messages to multiple subscribers', async () => {
      const messages1: any[] = [];
      const messages2: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => {
        messages1.push(payload);
      });

      queueFabric.subscribe('test-topic', (payload) => {
        messages2.push(payload);
      });

      await queueFabric.publish('test-topic', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
      expect(messages1[0]).toEqual({ data: 'test' });
      expect(messages2[0]).toEqual({ data: 'test' });
    });

    it('should not deliver messages to unsubscribed handlers', async () => {
      const messages: any[] = [];

      const subscription = queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      await queueFabric.publish('test-topic', { data: 'test1' });
      await new Promise(resolve => setTimeout(resolve, 100));

      subscription.unsubscribe();

      await queueFabric.publish('test-topic', { data: 'test2' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ data: 'test1' });
    });

    it('should isolate topics', async () => {
      const topic1Messages: any[] = [];
      const topic2Messages: any[] = [];

      queueFabric.subscribe('topic1', (payload) => {
        topic1Messages.push(payload);
      });

      queueFabric.subscribe('topic2', (payload) => {
        topic2Messages.push(payload);
      });

      await queueFabric.publish('topic1', { data: 'topic1-msg' });
      await queueFabric.publish('topic2', { data: 'topic2-msg' });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(topic1Messages).toHaveLength(1);
      expect(topic1Messages[0]).toEqual({ data: 'topic1-msg' });
      expect(topic2Messages).toHaveLength(1);
      expect(topic2Messages[0]).toEqual({ data: 'topic2-msg' });
    });
  });

  describe('Priority Ordering', () => {
    it('should deliver higher priority messages first', async () => {
      const messages: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      // Publish in reverse priority order
      await queueFabric.publish('test-topic', { data: 'low' }, { priority: 1 });
      await queueFabric.publish('test-topic', { data: 'high' }, { priority: 10 });
      await queueFabric.publish('test-topic', { data: 'medium' }, { priority: 5 });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(messages).toHaveLength(3);
      expect(messages[0]).toEqual({ data: 'high' });
      expect(messages[1]).toEqual({ data: 'medium' });
      expect(messages[2]).toEqual({ data: 'low' });
    });
  });

  describe('Delivery Semantics', () => {
    it('should support at-least-once delivery', async () => {
      const messages: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      await queueFabric.publish('test-topic', { data: 'test' }, {
        deliverySemantics: 'at-least-once',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it('should support exactly-once delivery', async () => {
      const messages: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      await queueFabric.publish('test-topic', { data: 'test' }, {
        deliverySemantics: 'exactly-once',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(1);
    });
  });

  describe('Backpressure', () => {
    it('should enforce backpressure when queue is full', async () => {
      const smallQueue = createQueueFabric({ maxQueueDepth: 2 });

      // Don't subscribe, so messages stay in queue
      // Fill the queue to capacity
      await smallQueue.publish('test', { data: 1 });
      await smallQueue.publish('test', { data: 2 });

      // This should trigger backpressure (queue is at capacity)
      await expect(
        smallQueue.publish('test', { data: 3 })
      ).rejects.toThrow('Backpressure active');

      await smallQueue.shutdown();
    });

    it('should report backpressure status', async () => {
      const smallQueue = createQueueFabric({ maxQueueDepth: 10 });

      const status1 = smallQueue.getBackpressureStatus();
      expect(status1.active).toBe(false);
      expect(status1.queueDepth).toBe(0);

      // Fill queue (no subscribers so messages stay in queue)
      for (let i = 0; i < 10; i++) {
        await smallQueue.publish('test', { data: i });
      }

      const status2 = smallQueue.getBackpressureStatus();
      expect(status2.active).toBe(true);
      expect(status2.queueDepth).toBe(10);
      expect(status2.capacityUsed).toBe(100);

      await smallQueue.shutdown();
    });

    it('should adjust backpressure threshold', async () => {
      const queue = createQueueFabric({ maxQueueDepth: 100 });

      // Set threshold to 50%
      queue.enforceBackpressure(0.5);

      const status = queue.getBackpressureStatus();
      expect(status.maxDepth).toBe(50);

      await queue.shutdown();
    });
  });

  describe('Result Delivery', () => {
    it('should deliver results to originating request context', async () => {
      const results: any[] = [];

      // Register result handler
      (queueFabric as InMemoryQueueFabric).registerResultHandler('req-123', (result) => {
        results.push(result);
      });

      // Deliver result
      await queueFabric.deliverResult('req-123', { status: 'success' });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ status: 'success' });
    });

    it('should handle multiple result handlers for same request', async () => {
      const results1: any[] = [];
      const results2: any[] = [];

      (queueFabric as InMemoryQueueFabric).registerResultHandler('req-123', (result) => {
        results1.push(result);
      });

      (queueFabric as InMemoryQueueFabric).registerResultHandler('req-123', (result) => {
        results2.push(result);
      });

      await queueFabric.deliverResult('req-123', { data: 'test' });

      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);
    });

    it('should clean up context after result delivery', async () => {
      (queueFabric as InMemoryQueueFabric).registerResultHandler('req-123', () => {});

      await queueFabric.deliverResult('req-123', { data: 'test' });

      // Second delivery should not find the context
      await expect(
        queueFabric.deliverResult('req-123', { data: 'test2' })
      ).resolves.toBeUndefined();
    });
  });

  describe('Message Metadata', () => {
    it('should include metadata in message delivery', async () => {
      let receivedMetadata: MessageMetadata | undefined;

      queueFabric.subscribe('test-topic', (payload, metadata) => {
        receivedMetadata = metadata;
      });

      await queueFabric.publish('test-topic', { data: 'test' }, {
        requestId: 'req-123',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMetadata).toBeDefined();
      expect(receivedMetadata!.topic).toBe('test-topic');
      expect(receivedMetadata!.requestId).toBe('req-123');
      expect(receivedMetadata!.deliveryAttempt).toBe(1);
      expect(receivedMetadata!.messageId).toBeDefined();
      expect(receivedMetadata!.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should retry failed deliveries', async () => {
      let attempts = 0;

      queueFabric.subscribe('test-topic', () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Delivery failed');
        }
      });

      await queueFabric.publish('test-topic', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(attempts).toBeGreaterThanOrEqual(2);
    });

    it('should discard messages after max delivery attempts', async () => {
      const queue = createQueueFabric({ maxDeliveryAttempts: 2 });
      let attempts = 0;

      queue.subscribe('test-topic', () => {
        attempts++;
        throw new Error('Always fails');
      });

      await queue.publish('test-topic', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Should attempt exactly maxDeliveryAttempts times
      expect(attempts).toBe(2);

      await queue.shutdown();
    });
  });

  describe('TTL and Expiration', () => {
    it('should discard expired messages', async () => {
      const messages: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      // Publish with very short TTL
      await queueFabric.publish('test-topic', { data: 'test' }, { ttl: 1 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should track message statistics', async () => {
      queueFabric.subscribe('test-topic', () => {});

      await queueFabric.publish('test-topic', { data: 'test1' });
      await queueFabric.publish('test-topic', { data: 'test2' });

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = queueFabric.getStats();
      expect(stats.messagesPublished).toBe(2);
      expect(stats.messagesDelivered).toBeGreaterThanOrEqual(1);
    });

    it('should track active subscriptions', async () => {
      const sub1 = queueFabric.subscribe('topic1', () => {});
      const sub2 = queueFabric.subscribe('topic2', () => {});

      const stats1 = queueFabric.getStats();
      expect(stats1.activeSubscriptions).toBe(2);

      sub1.unsubscribe();

      const stats2 = queueFabric.getStats();
      expect(stats2.activeSubscriptions).toBe(1);

      sub2.unsubscribe();

      const stats3 = queueFabric.getStats();
      expect(stats3.activeSubscriptions).toBe(0);
    });
  });

  describe('Shutdown', () => {
    it('should reject new messages after shutdown', async () => {
      await queueFabric.shutdown();

      await expect(
        queueFabric.publish('test', { data: 'test' })
      ).rejects.toThrow('shutting down');
    });

    it('should drain queue before shutdown', async () => {
      const messages: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => {
        messages.push(payload);
      });

      await queueFabric.publish('test-topic', { data: 'test1' });
      await queueFabric.publish('test-topic', { data: 'test2' });

      await queueFabric.shutdown();

      // Messages should be delivered before shutdown completes
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Subscription Management', () => {
    it('should report subscription status', () => {
      const sub = queueFabric.subscribe('test-topic', () => {});

      expect(sub.isActive()).toBe(true);
      expect(sub.topic).toBe('test-topic');

      sub.unsubscribe();

      expect(sub.isActive()).toBe(false);
    });

    it('should handle multiple subscriptions to same topic', async () => {
      const messages1: any[] = [];
      const messages2: any[] = [];
      const messages3: any[] = [];

      queueFabric.subscribe('test-topic', (payload) => messages1.push(payload));
      queueFabric.subscribe('test-topic', (payload) => messages2.push(payload));
      queueFabric.subscribe('test-topic', (payload) => messages3.push(payload));

      await queueFabric.publish('test-topic', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
      expect(messages3).toHaveLength(1);
    });
  });

  describe('Property Tests', () => {
    const fc = require('fast-check');

    describe('Property 26: Event publishing scope', () => {
      // Feature: runtime-architecture, Property 26: Event publishing scope
      // For any event published via Local Context, it should be delivered only to listeners subscribed to that request-scoped topic
      // Validates: Requirements 7.4

      it('should isolate events to request-scoped topics', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                requestId: fc.string({ minLength: 5, maxLength: 20 }),
                topic: fc.string({ minLength: 3, maxLength: 15 }),
                payload: fc.anything(),
              }),
              { minLength: 2, maxLength: 5 }
            ),
            async (events) => {
              const receivedByRequest = new Map<string, any[]>();
              
              // Subscribe to each request-scoped topic
              for (const event of events) {
                const scopedTopic = `request:${event.requestId}:${event.topic}`;
                
                if (!receivedByRequest.has(event.requestId)) {
                  receivedByRequest.set(event.requestId, []);
                }
                
                queueFabric.subscribe(scopedTopic, (payload) => {
                  receivedByRequest.get(event.requestId)!.push(payload);
                });
              }
              
              // Publish events
              for (const event of events) {
                const scopedTopic = `request:${event.requestId}:${event.topic}`;
                await queueFabric.publish(scopedTopic, event.payload);
              }
              
              await new Promise(resolve => setTimeout(resolve, 150));
              
              // Each request should only receive its own events
              for (const event of events) {
                const received = receivedByRequest.get(event.requestId) || [];
                const expectedCount = events.filter(e => e.requestId === event.requestId).length;
                expect(received.length).toBe(expectedCount);
              }
            }
          ),
          { numRuns: 20, timeout: 10000 }
        );
      }, 15000);
    });

    describe('Property 31: Global pub/sub delivery', () => {
      // Feature: runtime-architecture, Property 31: Global pub/sub delivery
      // For any message published to a global topic, it should be delivered to all subscribers across all active requests
      // Validates: Requirements 8.4

      it('should deliver global messages to all subscribers', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              topic: fc.string({ minLength: 3, maxLength: 15 }),
              subscriberCount: fc.integer({ min: 1, max: 5 }),
              messageCount: fc.integer({ min: 1, max: 3 }),
            }),
            async ({ topic, subscriberCount, messageCount }) => {
              const allMessages: any[][] = Array.from({ length: subscriberCount }, () => []);
              
              // Create multiple subscribers
              for (let i = 0; i < subscriberCount; i++) {
                queueFabric.subscribe(topic, (payload) => {
                  allMessages[i].push(payload);
                });
              }
              
              // Publish messages
              const messages = Array.from({ length: messageCount }, (_, i) => ({ id: i }));
              for (const msg of messages) {
                await queueFabric.publish(topic, msg);
              }
              
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // All subscribers should receive all messages
              for (let i = 0; i < subscriberCount; i++) {
                expect(allMessages[i].length).toBe(messageCount);
              }
            }
          ),
          { numRuns: 20, timeout: 10000 }
        );
      }, 15000);
    });

    describe('Property 43: Backpressure propagation', () => {
      // Feature: runtime-architecture, Property 43: Backpressure propagation
      // For any queue fabric at capacity, the system should enforce backpressure and propagate timeouts
      // Validates: Requirements 13.3

      it('should enforce backpressure when queue is full', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 3 }),
            async (capacity) => {
              const smallQueue = createQueueFabric({ maxQueueDepth: capacity });
              
              try {
                // Fill queue to capacity (no subscribers so messages stay queued)
                for (let i = 0; i < capacity; i++) {
                  await smallQueue.publish('test', { id: i });
                }
                
                // Next publish should trigger backpressure
                await expect(
                  smallQueue.publish('test', { id: capacity })
                ).rejects.toThrow('Backpressure active');
              } finally {
                await smallQueue.shutdown();
              }
            }
          ),
          { numRuns: 10, timeout: 20000 }
        );
      }, 25000);

      it('should report accurate backpressure status', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              maxDepth: fc.integer({ min: 3, max: 10 }),
              fillCount: fc.integer({ min: 0, max: 10 }),
            }),
            async ({ maxDepth, fillCount }) => {
              const queue = createQueueFabric({ maxQueueDepth: maxDepth });
              
              try {
                // Fill queue
                const actualFill = Math.min(fillCount, maxDepth);
                for (let i = 0; i < actualFill; i++) {
                  await queue.publish('test', { id: i });
                }
                
                const status = queue.getBackpressureStatus();
                
                expect(status.queueDepth).toBe(actualFill);
                expect(status.maxDepth).toBe(maxDepth);
                expect(status.active).toBe(actualFill >= maxDepth);
              } finally {
                await queue.shutdown();
              }
            }
          ),
          { numRuns: 10, timeout: 20000 }
        );
      }, 25000);

      it('should adjust backpressure threshold dynamically', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.double({ min: 0.1, max: 1.0 }),
            async (threshold) => {
              const queue = createQueueFabric({ maxQueueDepth: 100 });
              
              queue.enforceBackpressure(threshold);
              
              const status = queue.getBackpressureStatus();
              const expectedMax = Math.floor(100 * threshold);
              
              expect(status.maxDepth).toBe(expectedMax);
              
              await queue.shutdown();
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
