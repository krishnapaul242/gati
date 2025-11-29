# Context

Global and local context objects provide shared state and request-scoped data.

## Overview

Gati provides two types of context:

1. **Global Context (gctx)** - Shared across all requests
2. **Local Context (lctx)** - Scoped to a single request

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  // Access modules via gctx
  const db = gctx.modules.database;
  
  // Access request ID via lctx
  const requestId = lctx.requestId;
};
```

## Global Context (gctx)

Shared application state available to all requests.

### `gctx.modules`

Registered modules (database, auth, etc.)

```typescript
export const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules.database;
  const users = await db.users.findAll();
  res.json({ users });
};
```

### `gctx.config`

Application configuration

```typescript
export const handler: Handler = (req, res, gctx) => {
  const apiKey = gctx.config.apiKey;
  const environment = gctx.config.env;
};
```

### `gctx.logger`

Application-wide logger

```typescript
export const handler: Handler = (req, res, gctx) => {
  gctx.logger.info('Application event', { event: 'user_signup' });
};
```

## Local Context (lctx)

Request-scoped data unique to each request.

### `lctx.requestId`

Unique identifier for this request

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  const id = lctx.requestId; // 'req_abc123'
  res.json({ requestId: id });
};
```

### `lctx.logger`

Request-scoped logger (includes request ID)

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  lctx.logger.info('Processing request');
  // Logs: {"msg":"Processing request","requestId":"req_abc123"}
};
```

### `lctx.startTime`

Request start timestamp

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  const duration = Date.now() - lctx.startTime;
  lctx.logger.info('Request completed', { duration });
};
```

## Examples

### Using Modules

```typescript
// Register module in startup
import { db } from './database';

app.registerModule('database', db);

// Use in handler
export const handler: Handler = async (req, res, gctx) => {
  const database = gctx.modules.database;
  const user = await database.users.findById(req.params.id);
  res.json({ user });
};
```

### Request Tracking

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  lctx.logger.info('User login attempt', { 
    email: req.body.email 
  });
  
  try {
    const user = await authenticate(req.body);
    lctx.logger.info('Login successful', { userId: user.id });
    res.json({ user });
  } catch (error) {
    lctx.logger.error('Login failed', { error });
    res.status(401).json({ error: 'Invalid credentials' });
  }
};
```

### Measuring Performance

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  const start = lctx.startTime;
  
  const result = await expensiveOperation();
  
  const duration = Date.now() - start;
  lctx.logger.info('Operation completed', { duration });
  
  res.json({ result, duration });
};
```

## Context Lifecycle

### Global Context Creation

```typescript
import { createApp } from '@gati-framework/runtime';

const app = createApp({
  modules: {
    database: dbModule,
    cache: cacheModule,
    auth: authModule,
  },
  config: {
    env: 'production',
    apiKey: process.env.API_KEY,
  },
});

// gctx is created once at startup
// Available to all handlers
```

### Local Context Creation

```typescript
// lctx is created for each request
// Automatically includes:
// - requestId: unique identifier
// - startTime: request timestamp
// - logger: request-scoped logger

export const handler: Handler = (req, res, gctx, lctx) => {
  // lctx is unique to this request
  console.log(lctx.requestId); // 'req_abc123'
};
```

## Advanced Patterns

### Extending Context

```typescript
// Add custom data to local context via middleware
const authMiddleware: Middleware = async (req, res, gctx, lctx, next) => {
  const token = req.headers.authorization;
  const user = await verifyToken(token);
  
  // Extend lctx with user data
  (lctx as any).user = user;
  
  await next();
};

// Access in handler
export const handler: Handler = (req, res, gctx, lctx) => {
  const user = (lctx as any).user;
  res.json({ user });
};
```

### Module Communication

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  const db = gctx.modules['database'];
  const cache = gctx.modules['cache'];
  
  // Check cache first
  const cached = await cache.get(`user:${req.params.id}`);
  if (cached) {
    lctx.logger.info('Cache hit');
    return res.json({ user: cached });
  }
  
  // Fetch from database
  const user = await db.users.findById(req.params.id);
  
  // Update cache
  await cache.set(`user:${req.params.id}`, user, 3600);
  
  lctx.logger.info('Cache miss');
  res.json({ user });
};
```

### Cleanup Hooks

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  const connection = await openConnection();
  
  // Register cleanup
  lctx.onCleanup(() => {
    connection.close();
    lctx.logger.info('Connection closed');
  });
  
  const result = await connection.query('SELECT * FROM users');
  res.json({ result });
  
  // Cleanup runs automatically after response
};
```

## Best Practices

### 1. Use lctx.logger for Request Tracking

```typescript
// ✅ Good - Request-scoped logging
export const handler: Handler = (req, res, gctx, lctx) => {
  lctx.logger.info('Processing request');
  // Automatically includes requestId
};

// ❌ Bad - No request context
export const handler: Handler = (req, res) => {
  console.log('Processing request');
  // Can't correlate with specific request
};
```

### 2. Don't Mutate Global Context

```typescript
// ❌ Bad - Mutating shared state
export const handler: Handler = (req, res, gctx) => {
  gctx.requestCount = (gctx.requestCount || 0) + 1;
  // Race conditions across requests!
};

// ✅ Good - Use modules for shared state
export const handler: Handler = async (req, res, gctx) => {
  await gctx.modules['metrics'].incrementCounter('requests');
};
```

### 3. Include Request ID in Error Responses

```typescript
// ✅ Good - Traceable errors
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    const result = await operation();
    res.json({ result });
  } catch (error) {
    lctx.logger.error('Operation failed', { error });
    res.status(500).json({
      error: 'Internal server error',
      requestId: lctx.requestId, // Include for debugging
    });
  }
};
```

### 4. Measure Request Duration

```typescript
// ✅ Good - Track performance
export const handler: Handler = async (req, res, gctx, lctx) => {
  const result = await operation();
  
  const duration = Date.now() - lctx.startTime;
  lctx.logger.info('Request completed', { duration });
  
  res.header('X-Response-Time', `${duration}ms`);
  res.json({ result });
};
```

## Type Definitions

```typescript
interface GlobalContext {
  modules: Record<string, any>;
  config: Record<string, any>;
  logger: Logger;
  onShutdown: (callback: () => void | Promise<void>) => void;
}

interface LocalContext {
  requestId: string;
  startTime: number;
  logger: Logger;
  onCleanup: (callback: () => void | Promise<void>) => void;
}

interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}
```

## Related

- [Handler API](/api-reference/handler) - Handler function signature
- [Request API](/api-reference/request) - Accessing request data
- [Response API](/api-reference/response) - Sending responses
- [Modules Guide](/guides/modules) - Creating and using modules
- [Error Handling](/guides/error-handling) - Error patterns
