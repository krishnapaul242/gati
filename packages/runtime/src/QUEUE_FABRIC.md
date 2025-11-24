# Queue Fabric

The Queue Fabric is an in-memory pub/sub messaging system that provides topic-based message delivery with backpressure management, priority ordering, and multiple delivery semantics.

## Features

- **Topic-based Pub/Sub**: Subscribe to topics and receive messages published to those topics
- **Priority Ordering**: Messages are delivered in priority order (higher priority first)
- **Delivery Semantics**: Support for both at-least-once and exactly-once delivery
- **Backpressure Management**: Automatic backpressure when queue reaches capacity
- **Result Delivery**: Deliver results back to originating request contexts
- **TTL Support**: Messages expire after their time-to-live
- **Retry Logic**: Automatic retry with configurable max attempts
- **Statistics**: Track message counts, queue depth, and backpressure status

## Basic Usage

```typescript
import { createQueueFabric } from '@gati-framework/runtime';

// Create a queue fabric instance
const queueFabric = createQueueFabric({
  maxQueueDepth: 10000,
  defaultTtl: 60000, // 60 seconds
  maxDeliveryAttempts: 3,
});

// Subscribe to a topic
const subscription = queueFabric.subscribe('user.created', (payload, metadata) => {
  console.log('User created:', payload);
  console.log('Message ID:', metadata.messageId);
});

// Publish a message
await queueFabric.publish('user.created', {
  userId: '123',
  email: 'user@example.com',
});

// Unsubscribe when done
subscription.unsubscribe();

// Shutdown gracefully
await queueFabric.shutdown();
```

## Configuration

```typescript
interface QueueFabricConfig {
  maxQueueDepth?: number;           // Default: 10000
  defaultDeliverySemantics?: string; // Default: 'at-least-once'
  maxDeliveryAttempts?: number;      // Default: 3
  defaultTtl?: number;               // Default: 60000 (60 seconds)
  enableMetrics?: boolean;           // Default: true
}
```

## Publishing Messages

### Basic Publishing

```typescript
await queueFabric.publish('topic-name', { data: 'value' });
```

### With Options

```typescript
await queueFabric.publish('topic-name', payload, {
  priority: 10,                      // Higher priority = processed first
  ttl: 30000,                        // 30 seconds
  deliverySemantics: 'exactly-once', // or 'at-least-once'
  requestId: 'req-123',              // For result delivery
});
```

## Subscribing to Topics

```typescript
const subscription = queueFabric.subscribe('topic-name', (payload, metadata) => {
  // Handle message
  console.log('Received:', payload);
  console.log('Metadata:', metadata);
});

// Check subscription status
console.log(subscription.isActive()); // true

// Unsubscribe
subscription.unsubscribe();
console.log(subscription.isActive()); // false
```

## Message Metadata

Every message handler receives metadata:

```typescript
interface MessageMetadata {
  messageId: string;      // Unique message ID
  topic: string;          // Topic name
  timestamp: number;      // When message was published
  requestId?: string;     // Optional request context
  deliveryAttempt: number; // Current delivery attempt (1-based)
}
```

## Backpressure

The Queue Fabric enforces backpressure when the queue reaches capacity:

```typescript
try {
  await queueFabric.publish('topic', payload);
} catch (error) {
  // Backpressure active: queue at 100% capacity
  console.error(error.message);
}

// Check backpressure status
const status = queueFabric.getBackpressureStatus();
console.log({
  active: status.active,
  queueDepth: status.queueDepth,
  maxDepth: status.maxDepth,
  capacityUsed: status.capacityUsed, // Percentage
});
```

## Priority Ordering

Messages with higher priority are delivered first:

```typescript
// These will be delivered in order: high, medium, low
await queueFabric.publish('tasks', { name: 'low' }, { priority: 1 });
await queueFabric.publish('tasks', { name: 'high' }, { priority: 10 });
await queueFabric.publish('tasks', { name: 'medium' }, { priority: 5 });
```

## Delivery Semantics

### At-Least-Once (Default)

Messages may be delivered multiple times if delivery fails:

```typescript
await queueFabric.publish('topic', payload, {
  deliverySemantics: 'at-least-once',
});
```

### Exactly-Once

Messages are delivered exactly once, even if processing fails:

```typescript
await queueFabric.publish('topic', payload, {
  deliverySemantics: 'exactly-once',
});
```

## Result Delivery

Deliver results back to originating request contexts:

```typescript
// Register result handler for a request
queueFabric.registerResultHandler('req-123', (result) => {
  console.log('Result:', result);
});

// Later, deliver the result
await queueFabric.deliverResult('req-123', {
  status: 'success',
  data: { userId: '123' },
});
```

## Statistics

Track queue fabric metrics:

```typescript
const stats = queueFabric.getStats();
console.log({
  messagesPublished: stats.messagesPublished,
  messagesDelivered: stats.messagesDelivered,
  queueDepth: stats.queueDepth,
  activeSubscriptions: stats.activeSubscriptions,
  backpressure: stats.backpressure,
});
```

## Error Handling

### Delivery Failures

Failed deliveries are automatically retried up to `maxDeliveryAttempts`:

```typescript
queueFabric.subscribe('topic', (payload) => {
  if (Math.random() < 0.5) {
    throw new Error('Random failure');
  }
  // Process successfully
});
```

### TTL Expiration

Messages that exceed their TTL are automatically discarded:

```typescript
await queueFabric.publish('topic', payload, {
  ttl: 1000, // 1 second
});

// If not delivered within 1 second, message is discarded
```

## Shutdown

Gracefully shutdown the queue fabric:

```typescript
// Waits for queue to drain (with timeout)
await queueFabric.shutdown();
```

## Integration with Ingress

The Queue Fabric is used by the Ingress component to publish request descriptors:

```typescript
import { createIngress } from '@gati-framework/runtime';

const ingress = createIngress(config, queueFabric);
```

## Best Practices

1. **Use appropriate priorities**: Reserve high priorities (8-10) for critical messages
2. **Set reasonable TTLs**: Avoid very long TTLs that could fill the queue
3. **Monitor backpressure**: Check backpressure status and adjust queue depth if needed
4. **Handle errors gracefully**: Implement proper error handling in subscribers
5. **Unsubscribe when done**: Always unsubscribe to prevent memory leaks
6. **Shutdown gracefully**: Call `shutdown()` to drain the queue before exiting

## Examples

See `packages/runtime/src/examples/queue-fabric-example.ts` for complete examples including:

- Basic pub/sub messaging
- Priority ordering
- Backpressure handling
- Exactly-once delivery
- Result delivery
- Multiple subscribers

## Architecture

The Queue Fabric is designed to be:

- **In-memory**: Fast, low-latency message delivery
- **Asynchronous**: Non-blocking message processing
- **Scalable**: Handles thousands of messages per second
- **Reliable**: Automatic retries and delivery guarantees
- **Observable**: Built-in statistics and monitoring

For production deployments, consider using external message brokers like:
- Kafka
- NATS
- Redis Streams
- RabbitMQ

The Queue Fabric interface is designed to be compatible with these systems.
