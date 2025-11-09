# Context

Global and local context objects provide shared state and request-scoped data.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

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

## Related

- [Handler API](/api/handler) - Handler function signature
- [Request API](/api/request) - Accessing request data
- [Response API](/api/response) - Sending responses
