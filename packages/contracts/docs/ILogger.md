# ILogger

The `ILogger` interface defines the contract for structured logging in Gati applications.

## Interface

```typescript
interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  fatal(message: string, context?: Record<string, any>): void;
}
```

## Methods

All methods follow the same signature with different severity levels.

### debug

Logs debug-level messages (verbose information for development).

**Parameters:**
- `message` (string): The log message
- `context` (Record<string, any>, optional): Additional structured data

**Example:**
```typescript
logger.debug('Processing request', { 
  requestId: '123', 
  userId: '456',
  path: '/api/users'
});
```

### info

Logs informational messages (normal application flow).

**Example:**
```typescript
logger.info('User logged in', { 
  userId: '456',
  timestamp: new Date().toISOString()
});
```

### warn

Logs warning messages (potential issues that don't prevent operation).

**Example:**
```typescript
logger.warn('Rate limit approaching', { 
  userId: '456',
  currentRate: 95,
  limit: 100
});
```

### error

Logs error messages (errors that affect operation but are handled).

**Example:**
```typescript
logger.error('Database query failed', { 
  error: err.message,
  query: 'SELECT * FROM users',
  retryAttempt: 2
});
```

### fatal

Logs fatal errors (critical errors that may cause shutdown).

**Example:**
```typescript
logger.fatal('Database connection lost', { 
  error: err.message,
  host: 'db.example.com',
  port: 5432
});
```

## Implementations

### Built-in
- **PinoAdapter** - High-performance JSON logging

### Cloud Providers
- **CloudWatchLogsAdapter** - AWS CloudWatch Logs
- **WinstonLokiAdapter** - Grafana Loki

### Error Tracking
- **SentryAdapter** - Sentry error tracking

## Usage with Gati

```typescript
import { GlobalContext } from '@gati-framework/runtime';
import { PinoAdapter } from '@gati-framework/observability';

const logger = new PinoAdapter({
  level: 'info',
  prettyPrint: process.env.NODE_ENV === 'development'
});

const gctx = await GlobalContext.create({
  config,
  logger,
});

// In your handler
export const handler: Handler = async (req, res, gctx) => {
  gctx.logger.info('Request received', {
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });
  
  try {
    const result = await processRequest(req);
    gctx.logger.debug('Request processed', { result });
    res.json(result);
  } catch (error) {
    gctx.logger.error('Request failed', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

## Best Practices

1. **Use appropriate log levels**:
   - `debug`: Detailed diagnostic information
   - `info`: General informational messages
   - `warn`: Warning messages for potential issues
   - `error`: Error messages for handled errors
   - `fatal`: Critical errors requiring immediate attention

2. **Include structured context**: Add relevant data as context object
   ```typescript
   logger.info('User action', { userId, action, timestamp });
   ```

3. **Avoid logging sensitive data**: Don't log passwords, tokens, PII
   ```typescript
   // Bad
   logger.info('Login', { password: user.password });
   
   // Good
   logger.info('Login', { userId: user.id });
   ```

4. **Use consistent field names**: Standardize field names across your app
   ```typescript
   // Consistent
   logger.info('Request', { userId, requestId, duration });
   logger.error('Error', { userId, requestId, error });
   ```

5. **Log at boundaries**: Log at entry/exit points and error boundaries
   ```typescript
   logger.info('Handler started', { path: req.path });
   // ... processing
   logger.info('Handler completed', { path: req.path, duration });
   ```

## Common Context Fields

**Request Context:**
- `requestId`: Unique request identifier
- `userId`: User identifier
- `method`: HTTP method
- `path`: Request path
- `duration`: Request duration in ms

**Error Context:**
- `error`: Error message
- `stack`: Stack trace
- `code`: Error code
- `retryAttempt`: Retry attempt number

**Business Context:**
- `action`: Business action performed
- `entityId`: Entity identifier
- `entityType`: Entity type
- `result`: Operation result

## Log Levels

| Level | Use Case | Production |
|-------|----------|------------|
| debug | Development debugging | Usually disabled |
| info | Normal operations | Enabled |
| warn | Potential issues | Enabled |
| error | Handled errors | Enabled |
| fatal | Critical failures | Enabled |

## Integration with Tracing

Combine logging with tracing for complete observability:

```typescript
await gctx.tracing.withSpan('process-order', async (span) => {
  const traceId = gctx.tracing.getTraceContext();
  
  gctx.logger.info('Processing order', {
    orderId,
    traceId,
    userId
  });
  
  span.setAttribute('order.id', orderId);
  
  // ... processing
  
  gctx.logger.info('Order processed', {
    orderId,
    traceId,
    status: 'completed'
  });
});
```

## See Also

- [IMetricsProvider](./IMetricsProvider.md)
- [ITracingProvider](./ITracingProvider.md)
