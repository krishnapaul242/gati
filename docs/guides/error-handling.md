# Error Handling

Production-ready error handling patterns for Gati applications.

## Overview

Proper error handling is critical for production applications. Gati provides structured error handling patterns with request-scoped logging, automatic error tracking, and consistent error responses.

## Basic Error Handling

```typescript
import type { Handler } from '@gati-framework/runtime';

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

## Validation Errors

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const handler: Handler = async (req, res, gctx, lctx) => {
  const result = UserSchema.safeParse(req.body);
  
  if (!result.success) {
    lctx.logger.warn('Validation failed', { errors: result.error.errors });
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors,
      requestId: lctx.requestId
    });
    return;
  }
  
  // Process validated data
  const user = await createUser(result.data);
  res.json({ user });
};
```

## Database Errors

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    const db = gctx.modules['database'];
    const user = await db.users.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({ 
        error: 'User not found',
        requestId: lctx.requestId 
      });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    lctx.logger.error('Database query failed', { 
      error,
      userId: req.params.id 
    });
    res.status(500).json({ 
      error: 'Failed to fetch user',
      requestId: lctx.requestId 
    });
  }
};
```

## Best Practices

### 1. Always Use Request-Scoped Logging

```typescript
// ✅ Good - Use lctx.logger for request tracking
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    lctx.logger.info('Processing request');
    const result = await operation();
    res.json({ result });
  } catch (error) {
    lctx.logger.error('Operation failed', { error });
    res.status(500).json({ error: 'Internal error' });
  }
};

// ❌ Bad - Using console.log loses request context
export const handler: Handler = async (req, res) => {
  try {
    console.log('Processing request'); // No request ID
    const result = await operation();
    res.json({ result });
  } catch (error) {
    console.error(error); // Can't correlate with request
    res.status(500).json({ error: 'Internal error' });
  }
};
```

### 2. Include Request ID in Error Responses

```typescript
// ✅ Good - Include requestId for debugging
res.status(500).json({
  error: 'Internal server error',
  requestId: lctx.requestId,
  timestamp: new Date().toISOString()
});

// ❌ Bad - No way to correlate with logs
res.status(500).json({ error: 'Internal server error' });
```

### 3. Never Expose Internal Errors in Production

```typescript
// ✅ Good - Generic error message
try {
  await operation();
} catch (error) {
  lctx.logger.error('Operation failed', { error }); // Log details
  res.status(500).json({ 
    error: 'Operation failed', // Generic message
    requestId: lctx.requestId 
  });
}

// ❌ Bad - Exposes stack traces and internals
try {
  await operation();
} catch (error) {
  res.status(500).json({ 
    error: error.message,
    stack: error.stack // Security risk!
  });
}
```

### 4. Use Appropriate Status Codes

```typescript
// 400 - Client error (bad input)
if (!req.body.email) {
  res.status(400).json({ error: 'Email is required' });
}

// 401 - Unauthorized (not authenticated)
if (!token) {
  res.status(401).json({ error: 'Authentication required' });
}

// 403 - Forbidden (authenticated but not authorized)
if (!hasPermission) {
  res.status(403).json({ error: 'Insufficient permissions' });
}

// 404 - Not found
if (!user) {
  res.status(404).json({ error: 'User not found' });
}

// 500 - Server error (unexpected)
try {
  await operation();
} catch (error) {
  res.status(500).json({ error: 'Internal server error' });
}
```

## Related

- [Handler API](/api-reference/handler) - Handler patterns
- [Context Guide](/guides/context) - Using gctx and lctx
- [Observability](/guides/observability) - Logging and monitoring
