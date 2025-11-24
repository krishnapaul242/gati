/**
 * @module runtime/examples/queue-fabric-example
 * @description Example usage of the Queue Fabric for pub/sub messaging
 */

import { createQueueFabric } from '../queue-fabric.js';
import type { MessageMetadata } from '../types/queue-fabric.js';

/**
 * Example 1: Basic pub/sub messaging
 */
async function basicPubSubExample() {
  console.log('\n=== Basic Pub/Sub Example ===\n');

  const queueFabric = createQueueFabric({
    maxQueueDepth: 1000,
    defaultTtl: 60000, // 60 seconds
  });

  // Subscribe to a topic
  const subscription = queueFabric.subscribe('user.created', (payload, metadata: MessageMetadata) => {
    console.log(`Received user.created event:`, payload);
    console.log(`Message ID: ${metadata.messageId}`);
    console.log(`Delivery attempt: ${metadata.deliveryAttempt}`);
  });

  // Publish messages
  await queueFabric.publish('user.created', {
    userId: '123',
    email: 'user@example.com',
    name: 'John Doe',
  });

  await queueFabric.publish('user.created', {
    userId: '456',
    email: 'jane@example.com',
    name: 'Jane Smith',
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Unsubscribe
  subscription.unsubscribe();

  await queueFabric.shutdown();
}

/**
 * Example 2: Priority-based message ordering
 */
async function priorityOrderingExample() {
  console.log('\n=== Priority Ordering Example ===\n');

  const queueFabric = createQueueFabric();
  const receivedMessages: string[] = [];

  queueFabric.subscribe('tasks', (payload) => {
    receivedMessages.push(payload.name);
    console.log(`Processing task: ${payload.name} (priority: ${payload.priority})`);
  });

  // Publish tasks with different priorities
  await queueFabric.publish('tasks', { name: 'Low priority task', priority: 1 }, { priority: 1 });
  await queueFabric.publish('tasks', { name: 'High priority task', priority: 10 }, { priority: 10 });
  await queueFabric.publish('tasks', { name: 'Medium priority task', priority: 5 }, { priority: 5 });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 150));

  console.log('\nProcessing order:', receivedMessages);
  // Expected: ['High priority task', 'Medium priority task', 'Low priority task']

  await queueFabric.shutdown();
}

/**
 * Example 3: Backpressure handling
 */
async function backpressureExample() {
  console.log('\n=== Backpressure Example ===\n');

  const queueFabric = createQueueFabric({
    maxQueueDepth: 5, // Small queue for demonstration
  });

  // Don't subscribe, so messages stay in queue

  try {
    // Fill the queue
    for (let i = 1; i <= 5; i++) {
      await queueFabric.publish('events', { id: i });
      console.log(`Published message ${i}`);
    }

    // This should trigger backpressure
    await queueFabric.publish('events', { id: 6 });
  } catch (error) {
    console.log(`\nBackpressure triggered: ${(error as Error).message}`);
  }

  const stats = queueFabric.getStats();
  console.log(`\nQueue stats:`, {
    messagesPublished: stats.messagesPublished,
    queueDepth: stats.queueDepth,
    backpressureActive: stats.backpressure.active,
  });

  await queueFabric.shutdown();
}

/**
 * Example 4: Exactly-once delivery semantics
 */
async function exactlyOnceExample() {
  console.log('\n=== Exactly-Once Delivery Example ===\n');

  const queueFabric = createQueueFabric();
  let deliveryCount = 0;

  queueFabric.subscribe('orders', (payload) => {
    deliveryCount++;
    console.log(`Processing order ${payload.orderId} (delivery #${deliveryCount})`);
  });

  // Publish with exactly-once semantics
  await queueFabric.publish(
    'orders',
    { orderId: 'ORD-123', amount: 99.99 },
    { deliverySemantics: 'exactly-once' }
  );

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log(`\nTotal deliveries: ${deliveryCount}`);
  // Expected: 1 (exactly once)

  await queueFabric.shutdown();
}

/**
 * Example 5: Result delivery to request context
 */
async function resultDeliveryExample() {
  console.log('\n=== Result Delivery Example ===\n');

  const queueFabric = createQueueFabric();

  // Simulate a request context
  const requestId = 'req-123';
  const results: any[] = [];

  // Register result handler for the request
  (queueFabric as any).registerResultHandler(requestId, (result: any) => {
    results.push(result);
    console.log(`Request ${requestId} received result:`, result);
  });

  // Simulate async processing that delivers results back
  setTimeout(async () => {
    await queueFabric.deliverResult(requestId, {
      status: 'success',
      data: { userId: '123', token: 'abc-xyz' },
    });
  }, 50);

  // Wait for result delivery
  await new Promise(resolve => setTimeout(resolve, 150));

  console.log(`\nTotal results received: ${results.length}`);

  await queueFabric.shutdown();
}

/**
 * Example 6: Multiple subscribers to same topic
 */
async function multipleSubscribersExample() {
  console.log('\n=== Multiple Subscribers Example ===\n');

  const queueFabric = createQueueFabric();

  // Multiple services subscribe to the same event
  queueFabric.subscribe('payment.completed', (payload) => {
    console.log(`[Email Service] Sending receipt to ${payload.email}`);
  });

  queueFabric.subscribe('payment.completed', (payload) => {
    console.log(`[Analytics Service] Recording payment of $${payload.amount}`);
  });

  queueFabric.subscribe('payment.completed', (payload) => {
    console.log(`[Inventory Service] Updating stock for order ${payload.orderId}`);
  });

  // Publish event
  await queueFabric.publish('payment.completed', {
    orderId: 'ORD-456',
    email: 'customer@example.com',
    amount: 149.99,
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  await queueFabric.shutdown();
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await basicPubSubExample();
    await priorityOrderingExample();
    await backpressureExample();
    await exactlyOnceExample();
    await resultDeliveryExample();
    await multipleSubscribersExample();

    console.log('\n=== All examples completed ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export {
  basicPubSubExample,
  priorityOrderingExample,
  backpressureExample,
  exactlyOnceExample,
  resultDeliveryExample,
  multipleSubscribersExample,
};
