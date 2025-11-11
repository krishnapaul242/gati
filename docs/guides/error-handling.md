# Error Handling

Production-ready error handling patterns for Gati applications.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

## Overview

Proper error handling is critical for production applications. Gati provides structured error handling patterns.

## Basic Error Handling

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    const result = await riskyOperation();
    res.json({ result });
  } catch (error) {
    lctx.logger.error('Operation failed', { error });
    res.status(500).json({ 
      error: 'Internal server error',
      requestId: lctx.requestId 
    });
  }
};
```

## Custom Error Classes

```typescript
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const handler: Handler = (req, res) => {
  try {
    if (!req.body.email) {
      throw new ValidationError('Email is required', 'email');
    }
    // Process...
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message, field: error.field });
      return;
    }
    res.status(500).json({ error: 'Internal error' });
  }
};
```

## Error Response Format

```typescript
// Standard error response
{
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "requestId": "req_abc123",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

## Related

- [Handler API](/api/handler) - Handler patterns
- [Logging Guide](/guide/logging) - Error logging
