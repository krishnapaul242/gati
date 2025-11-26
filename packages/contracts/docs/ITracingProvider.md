# ITracingProvider

The `ITracingProvider` interface defines the contract for distributed tracing in Gati applications.

## Interface

```typescript
interface ITracingProvider {
  createSpan(name: string, attributes?: Record<string, any>): ISpan;
  withSpan<T>(name: string, fn: (span: ISpan) => Promise<T>): Promise<T>;
  getTraceContext(): string | undefined;
}

interface ISpan {
  setAttribute(key: string, value: any): void;
  setStatus(status: 'ok' | 'error', message?: string): void;
  end(): void;
}
```

## Methods

### createSpan

Creates a new span for tracing an operation.

**Parameters:**
- `name` (string): The span name (e.g., 'database-query', 'http-request')
- `attributes` (Record<string, any>, optional): Initial span attributes

**Returns:** ISpan

**Example:**
```typescript
const span = tracing.createSpan('database-query', {
  'db.system': 'postgresql',
  'db.operation': 'SELECT'
});

try {
  // Your operation
  span.setAttribute('db.rows', 42);
  span.setStatus('ok');
} catch (error) {
  span.setStatus('error', error.message);
} finally {
  span.end();
}
```

### withSpan

Executes a function within a span context (automatic span lifecycle management).

**Parameters:**
- `name` (string): The span name
- `fn` (function): Async function to execute within the span

**Returns:** Promise<T>

**Example:**
```typescript
const result = await tracing.withSpan('fetch-user', async (span) => {
  span.setAttribute('user.id', userId);
  
  const user = await db.users.findById(userId);
  
  span.setAttribute('user.found', !!user);
  return user;
});
```

### getTraceContext

Returns the current trace context for propagation (e.g., to downstream services).

**Returns:** string | undefined

**Example:**
```typescript
const traceContext = tracing.getTraceContext();

// Pass to downstream service
await fetch('https://api.example.com/data', {
  headers: {
    'traceparent': traceContext
  }
});
```

## ISpan Methods

### setAttribute

Adds metadata to the span.

**Parameters:**
- `key` (string): Attribute name
- `value` (any): Attribute value

**Example:**
```typescript
span.setAttribute('http.method', 'GET');
span.setAttribute('http.status_code', 200);
span.setAttribute('user.id', '12345');
```

### setStatus

Sets the span status.

**Parameters:**
- `status` ('ok' | 'error'): The status
- `message` (string, optional): Error message if status is 'error'

**Example:**
```typescript
span.setStatus('ok');
// or
span.setStatus('error', 'Database connection failed');
```

### end

Ends the span and records its duration.

**Example:**
```typescript
span.end();
```

## Implementations

### Built-in
- **OpenTelemetryAdapter** - OpenTelemetry tracing

### Cloud Providers
- **XRayAdapter** - AWS X-Ray
- **DatadogAPMAdapter** - Datadog APM

### Open Source
- **JaegerAdapter** - Jaeger tracing
- **ZipkinAdapter** - Zipkin tracing

## Usage with Gati

```typescript
import { GlobalContext } from '@gati-framework/runtime';
import { OpenTelemetryAdapter } from '@gati-framework/observability';

const tracing = new OpenTelemetryAdapter({
  serviceName: 'my-app',
  endpoint: 'http://jaeger:14268/api/traces'
});

const gctx = await GlobalContext.create({
  config,
  tracingProvider: tracing,
});

// In your handler
export const handler: Handler = async (req, res, gctx) => {
  await gctx.tracing.withSpan('process-request', async (span) => {
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.path', req.path);
    
    const result = await processRequest(req);
    
    span.setStatus('ok');
    res.json(result);
  });
};
```

## Best Practices

1. **Use descriptive span names**: `database-query`, `http-request`, `cache-lookup`
2. **Add relevant attributes**: Include operation details, IDs, status codes
3. **Set status appropriately**: Mark errors with `setStatus('error')`
4. **Use withSpan for automatic cleanup**: Ensures spans are always ended
5. **Propagate context**: Pass trace context to downstream services
6. **Avoid sensitive data**: Don't include passwords, tokens in attributes

## Common Attributes

Following OpenTelemetry semantic conventions:

**HTTP:**
- `http.method`: GET, POST, etc.
- `http.status_code`: 200, 404, etc.
- `http.url`: Request URL

**Database:**
- `db.system`: postgresql, mongodb, etc.
- `db.operation`: SELECT, INSERT, etc.
- `db.statement`: SQL query (sanitized)

**Custom:**
- `user.id`: User identifier
- `tenant.id`: Tenant identifier
- `operation.result`: success, failure

## See Also

- [IMetricsProvider](./IMetricsProvider.md)
- [ILogger](./ILogger.md)
