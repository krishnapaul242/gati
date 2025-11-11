# Middleware

Composable request processing with middleware functions.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

## Overview

Middleware functions are executed before your handler, allowing you to:
- Authenticate requests
- Log requests
- Validate input
- Transform data
- Handle CORS

```typescript
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

export const handler: Handler = [authMiddleware, (req, res) => {
  res.json({ protected: 'data' });
}];
```

## Built-in Middleware

### CORS

```typescript
import { cors } from '@gati-framework/runtime';

export const handler: Handler = [
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }),
  (req, res) => {
    res.json({ ok: true });
  }
];
```

## Creating Middleware

```typescript
export const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  // Verify token...
  next();
};
```

## Related

- [Handler API](/api-reference/handler) - Handler function signature
- [CORS Guide](./middleware.md) - CORS configuration
