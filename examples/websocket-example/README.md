# WebSocket Event-Driven Handler Example

This example demonstrates how to make HTTP requests wait for WebSocket events before proceeding.

## Usage

```typescript
// Handler waits for WebSocket event
const event = await lctx.websocket.waitForEvent('user_confirmation', 30000);

// Process event data
const { confirmed } = event.data;
if (confirmed) {
  // Continue processing
}
```

## WebSocket Event Flow

1. Client makes HTTP request to `/api/wait-for-event`
2. Handler calls `lctx.websocket.waitForEvent('user_confirmation')`
3. Request pauses, waiting for WebSocket event
4. WebSocket client sends confirmation event
5. Handler receives event and continues processing
6. Response sent to original HTTP client

## Testing

```bash
# Start server
gati dev

# Make HTTP request (will wait)
curl http://localhost:3000/api/wait-for-event

# Send WebSocket event to continue
# (Use WebSocket client to emit 'user_confirmation' event)
```