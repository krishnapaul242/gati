# WebSocket and Server-Sent Events (SSE) in Gati

Gati provides first-class support for real-time communication through WebSocket and Server-Sent Events (SSE) handlers.

## Table of Contents

- [WebSocket Handler](#websocket-handler)
  - [Basic Usage](#basic-usage)
  - [Connection Lifecycle](#connection-lifecycle)
  - [Broadcasting](#broadcasting)
  - [Room-Based Messaging](#room-based-messaging)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
  - [Basic Usage](#basic-usage-1)
  - [Connection Management](#connection-management)
  - [Sending Events](#sending-events)
- [Examples](#examples)
- [Best Practices](#best-practices)

## WebSocket Handler

### Basic Usage

```typescript
import {
  createWebSocketHandler,
  type WebSocketHandlerConfig,
  type GlobalContext,
} from '@gati-framework/runtime';

export function createMyWebSocketHandler(gctx: GlobalContext) {
  const config: WebSocketHandlerConfig = {
    onConnect: async (connection, request, gctx, lctx, wsctx) => {
      console.log(`New connection: ${connection.id}`);
      
      // Send welcome message
      connection.sendJSON({
        type: 'welcome',
        message: 'Connected to WebSocket server',
      });
    },

    onMessage: async (message, gctx, lctx, wsctx) => {
      console.log(`Message from ${message.connection.id}:`, message.data);
      
      // Echo back
      message.connection.sendJSON({
        type: 'echo',
        data: message.data,
      });
    },

    onDisconnect: async (connection, code, reason, gctx, lctx, wsctx) => {
      console.log(`Connection closed: ${connection.id}`);
    },

    onError: async (error, connection, gctx, lctx, wsctx) => {
      console.error(`Error on connection ${connection.id}:`, error);
    },

    options: {
      maxMessageSize: 10 * 1024, // 10KB
      heartbeatInterval: 30000, // 30 seconds
      compress: true,
    },
  };

  return createWebSocketHandler(config, gctx);
}
```

### Connection Lifecycle

WebSocket connections go through the following lifecycle:

1. **Connect**: `onConnect` is called when a client connects
2. **Message**: `onMessage` is called for each incoming message
3. **Disconnect**: `onDisconnect` is called when connection closes
4. **Error**: `onError` is called on connection errors

### Broadcasting

Send messages to all connected clients:

```typescript
onMessage: async (message, gctx, lctx, wsctx) => {
  // Broadcast to all connections
  wsctx.broadcast({
    type: 'announcement',
    message: 'Server announcement',
    timestamp: Date.now(),
  });
  
  // Broadcast with filter
  wsctx.broadcast(
    { type: 'notification', message: 'Admin only' },
    (conn) => conn.metadata.userId?.startsWith('admin')
  );
}
```

### Room-Based Messaging

Implement room-based messaging patterns:

```typescript
// Track rooms
const rooms = new Map<string, Set<string>>(); // roomId -> Set<connectionId>

onConnect: async (connection, request, gctx, lctx, wsctx) => {
  // Extract room from query params
  const url = new URL(request.url || '', 'ws://localhost');
  const roomId = url.searchParams.get('room') || 'general';
  
  // Add to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId)!.add(connection.id);
  connection.metadata.sessionId = roomId;
  
  // Notify room
  wsctx.broadcast(
    { type: 'user_joined', roomId },
    (conn) => conn.metadata.sessionId === roomId
  );
},

onMessage: async (message, gctx, lctx, wsctx) => {
  const roomId = message.connection.metadata.sessionId;
  
  // Broadcast to room
  wsctx.broadcast(
    { type: 'chat', content: message.data },
    (conn) => conn.metadata.sessionId === roomId
  );
}
```

## Server-Sent Events (SSE)

### Basic Usage

```typescript
import {
  createSSEHandler,
  type SSEHandlerConfig,
  type GlobalContext,
} from '@gati-framework/runtime';

export function createNotificationSSEHandler(gctx: GlobalContext) {
  const config: SSEHandlerConfig = {
    onConnect: async (connection, request, gctx, lctx, ssectx) => {
      console.log(`New SSE connection: ${connection.id}`);
      
      // Send initial event
      connection.send({
        event: 'connected',
        data: { message: 'Connected to notification stream' },
      });
    },

    onDisconnect: async (connection, gctx, lctx, ssectx) => {
      console.log(`SSE connection closed: ${connection.id}`);
    },

    options: {
      keepAliveInterval: 15000, // 15 seconds
      connectionTimeout: 5 * 60 * 1000, // 5 minutes
      retryInterval: 3000, // Client retry interval
    },
  };

  return createSSEHandler(config, gctx);
}
```

### Connection Management

```typescript
// Track user subscriptions
const userSubscriptions = new Map<string, Set<string>>(); // userId -> connectionIds

onConnect: async (connection, request, gctx, lctx, ssectx) => {
  // Extract user from query params
  const url = new URL(request.url || '', 'http://localhost');
  const userId = url.searchParams.get('userId') || 'anonymous';
  
  connection.metadata.userId = userId;
  
  // Track subscription
  if (!userSubscriptions.has(userId)) {
    userSubscriptions.set(userId, new Set());
  }
  userSubscriptions.get(userId)!.add(connection.id);
}
```

### Sending Events

SSE supports structured event messages:

```typescript
// Send with event type and ID
connection.send({
  event: 'notification',
  data: {
    title: 'New Message',
    body: 'You have a new message',
  },
  id: 'msg-123', // For Last-Event-ID support
  retry: 5000, // Tell client to retry after 5 seconds
});

// Convenience method for simple data events
connection.sendData({
  message: 'Simple notification',
}, 'notification', 'notif-456');

// Send keep-alive comment
connection.sendComment('keep-alive');
```

## Examples

### Chat Application (WebSocket)

See `examples/websocket-example/src/handlers/chat-ws.ts` for a complete chat application with:
- User authentication via query params
- Room-based messaging
- Typing indicators
- Private messages
- User join/leave notifications

### Real-Time Notifications (SSE)

See `examples/websocket-example/src/handlers/notifications-sse.ts` for a notification system with:
- User-specific event subscriptions
- Broadcast notifications
- Keep-alive connection management
- Automatic reconnection with retry intervals

## Best Practices

### WebSocket

1. **Authentication**: Extract user identity from query params or upgrade headers
   ```typescript
   const url = new URL(request.url || '', 'ws://localhost');
   const token = url.searchParams.get('token');
   // Verify token...
   ```

2. **Heartbeat**: Use heartbeat to detect dead connections
   ```typescript
   options: {
     heartbeatInterval: 30000, // Ping every 30 seconds
   }
   ```

3. **Message Validation**: Always validate incoming messages
   ```typescript
   onMessage: async (message, gctx, lctx, wsctx) => {
     if (typeof message.data !== 'object') {
       message.connection.sendJSON({ error: 'Invalid message format' });
       return;
     }
     // Process message...
   }
   ```

4. **Error Handling**: Handle errors gracefully
   ```typescript
   onError: async (error, connection, gctx, lctx, wsctx) => {
     logger.error({ error, connectionId: connection.id }, 'WebSocket error');
     connection.sendJSON({ error: 'An error occurred' });
   }
   ```

### SSE

1. **Keep-Alive**: Use keep-alive to prevent proxy/firewall timeouts
   ```typescript
   options: {
     keepAliveInterval: 15000, // Comment every 15 seconds
   }
   ```

2. **Event IDs**: Use event IDs for client-side event replay
   ```typescript
   connection.send({
     event: 'update',
     data: { ... },
     id: `evt-${Date.now()}`, // Unique ID
   });
   ```

3. **Retry Configuration**: Set appropriate retry intervals
   ```typescript
   options: {
     retryInterval: 3000, // Tell clients to retry after 3 seconds
   }
   ```

4. **Connection Limits**: Set connection timeouts to prevent resource exhaustion
   ```typescript
   options: {
     connectionTimeout: 5 * 60 * 1000, // 5 minutes
   }
   ```

## Integration with HTTP Server

```typescript
import { createApp } from '@gati-framework/runtime';
import { createChatWebSocketHandler } from './handlers/chat-ws.js';
import { createNotificationSSEHandler } from './handlers/notifications-sse.js';

const app = createApp({
  // ... app config
});

// Get global context after app initialization
const gctx = app.getGlobalContext();

// Initialize WebSocket handler
const wsHandler = createChatWebSocketHandler(gctx);
wsHandler.initialize(app.getHTTPServer(), '/ws');

// Initialize SSE handler
const sseHandler = createNotificationSSEHandler(gctx);

// Add SSE endpoint
app.use((req, res, gctx, lctx, next) => {
  if (req.path === '/events') {
    return sseHandler.handleConnection(req, res);
  }
  return next();
});

// Graceful shutdown
app.onShutdown(async () => {
  await wsHandler.shutdown();
  await sseHandler.shutdown();
});
```

## API Reference

### WebSocket Types

- `WebSocketConnection`: Connection wrapper with metadata
- `WebSocketContext`: Context for managing all connections
- `WebSocketHandlerConfig`: Configuration for WebSocket handler
- `WebSocketMessage`: Incoming message structure

### SSE Types

- `SSEConnection`: SSE connection wrapper
- `SSEContext`: Context for managing SSE connections
- `SSEEvent`: Event structure for SSE messages
- `SSEHandlerConfig`: Configuration for SSE handler

### Methods

#### WebSocketConnection
- `send(data)`: Send string or JSON data
- `sendJSON(data)`: Send JSON data
- `close(code?, reason?)`: Close connection
- `isOpen()`: Check if connection is open

#### WebSocketContext
- `broadcast(data, filter?)`: Broadcast to all/filtered connections
- `broadcastJSON(data, filter?)`: Broadcast JSON
- `sendTo(connectionId, data)`: Send to specific connection
- `getConnection(connectionId)`: Get connection by ID
- `closeConnection(connectionId)`: Close specific connection
- `closeAll()`: Close all connections

#### SSEConnection
- `send(event)`: Send SSE event
- `sendData(data, event?, id?)`: Send data event
- `sendComment(comment)`: Send comment (keep-alive)
- `close()`: Close connection
- `isOpen()`: Check if connection is open

#### SSEContext
- `broadcast(event, filter?)`: Broadcast to all/filtered connections
- `sendTo(connectionId, event)`: Send to specific connection
- `closeConnection(connectionId)`: Close specific connection
- `closeAll()`: Close all connections
