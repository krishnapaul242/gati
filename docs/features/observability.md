# Logging, Tracing, and Observability Middleware

Gati provides comprehensive middleware for logging, distributed tracing, performance monitoring, and audit logging.

## Table of Contents

- [Request Logging](#request-logging)
- [Distributed Tracing](#distributed-tracing)
- [Performance Monitoring](#performance-monitoring)
- [Audit Logging](#audit-logging)
- [Health Checks](#health-checks)
- [Best Practices](#best-practices)

## Request Logging

Log all HTTP requests and responses with structured logging:

```typescript
import { createLoggingMiddleware } from '@gati-framework/runtime';

const loggingMiddleware = createLoggingMiddleware({
  logRequestBody: false, // Security: don't log request bodies by default
  logResponseBody: false, // Performance: don't log response bodies
  logHeaders: false, // Security: don't log headers (may contain tokens)
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'], // Redact these
  logQuery: true, // Log query parameters
  skipPaths: ['/health', '/metrics'], // Don't log these endpoints
  successLevel: 'info', // Log level for successful requests
  errorLevel: 'error', // Log level for failed requests
});

app.use(loggingMiddleware, {
  path: '*',
  priority: 100,
});
```

### Log Output

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "requestId": "req-123",
  "traceId": "trace-456",
  "method": "GET",
  "path": "/api/users/123",
  "query": { "include": "profile" },
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "userId": "user-789",
  "msg": "Incoming request"
}

{
  "level": "info",
  "time": "2024-01-15T10:30:00.150Z",
  "requestId": "req-123",
  "traceId": "trace-456",
  "method": "GET",
  "path": "/api/users/123",
  "statusCode": 200,
  "duration": 150,
  "userId": "user-789",
  "msg": "Request completed"
}
```

## Distributed Tracing

Integrate with OpenTelemetry and W3C Trace Context:

```typescript
import { createTracingMiddleware } from '@gati-framework/runtime';

const tracingMiddleware = createTracingMiddleware({
  serviceName: 'my-api',
  injectTraceContext: true, // Add trace headers to responses
  extractTraceContext: (headers) => {
    // W3C Trace Context format
    const traceparent = headers.traceparent as string;
    if (traceparent) {
      const [version, traceId, spanId] = traceparent.split('-');
      return { traceId, spanId };
    }
    return {};
  },
  recordAttributes: (req, lctx) => ({
    'http.method': req.method,
    'http.url': req.path || '',
    'user.id': lctx.refs.userId || '',
  }),
});

app.use(tracingMiddleware, {
  path: '*',
  priority: 110,
});
```

### Trace Propagation

The middleware automatically:
1. Extracts trace context from incoming requests (W3C Trace Context header)
2. Propagates trace ID through the request lifecycle
3. Injects trace context into response headers

```typescript
// Response headers automatically include:
{
  'X-Trace-Id': 'trace-123',
  'X-Request-Id': 'req-456'
}
```

### Accessing Trace Data in Handlers

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  // Trace ID is automatically available
  console.log('Trace ID:', lctx.traceId);
  console.log('Request ID:', lctx.requestId);
  
  // Use metrics client for custom spans
  await gctx.metrics?.withSpan?.('database_query', async (span) => {
    span.setAttribute?.('query.table', 'users');
    span.setAttribute?.('query.id', userId);
    
    const user = await db.getUser(userId);
    return user;
  });
};
```

## Performance Monitoring

Track request performance metrics:

```typescript
import { createPerformanceMiddleware } from '@gati-framework/runtime';

const perfMiddleware = createPerformanceMiddleware();

app.use(perfMiddleware, {
  path: '*',
  priority: 105,
});
```

### Metrics Collected

- `http_request_duration_ms`: Request duration histogram
- `request_memory_bytes`: Memory used per request
- Automatically records to `gctx.metrics` if available

### Performance Log Output

```json
{
  "level": "debug",
  "requestId": "req-123",
  "path": "/api/users",
  "duration": 45,
  "memoryDelta": {
    "heapUsed": 1024,
    "external": 512
  },
  "msg": "Request performance"
}
```

## Audit Logging

Track security-sensitive operations:

```typescript
import { createAuditMiddleware } from '@gati-framework/runtime';

const auditMiddleware = createAuditMiddleware({
  extractContext: (req, lctx) => ({
    userId: lctx.refs.userId,
    action: `${req.method} ${req.path}`,
    resource: req.path,
    ip: lctx.client.ip,
  }),
  logHandler: async (auditData) => {
    // Send to audit log storage (database, Elasticsearch, etc.)
    await auditLog.save(auditData);
  },
});

app.use(auditMiddleware, {
  path: '/admin/*', // Only audit admin operations
  priority: 90,
});
```

### Audit Log Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-123",
  "traceId": "trace-456",
  "userId": "user-789",
  "action": "DELETE /admin/users/123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": 150,
  "success": true
}
```

## Health Checks

Implement comprehensive health checks with dependency validation:

```typescript
import {
  createHealthCheckMiddleware,
  createDatabaseHealthCheck,
  createRedisHealthCheck,
  createServiceHealthCheck,
  HealthStatus,
} from '@gati-framework/runtime';

const healthMiddleware = createHealthCheckMiddleware({
  path: '/health', // Main health endpoint
  livenesspath: '/health/live', // Kubernetes liveness probe
  readinessPath: '/health/ready', // Kubernetes readiness probe
  includeMetrics: true, // Include system metrics
  cacheDuration: 5000, // Cache results for 5 seconds
  
  dependencies: [
    // Database check (required)
    createDatabaseHealthCheck(
      'postgres',
      async () => {
        try {
          await db.query('SELECT 1');
          return true;
        } catch {
          return false;
        }
      },
      true // required = service unhealthy if DB is down
    ),
    
    // Redis check (optional)
    createRedisHealthCheck(
      'redis',
      async () => {
        try {
          await redis.ping();
          return true;
        } catch {
          return false;
        }
      },
      false // not required = service degraded if Redis is down
    ),
    
    // External service check
    createServiceHealthCheck(
      'auth-service',
      'https://auth.example.com/health',
      false // not required
    ),
  ],
});

app.use(healthMiddleware);
```

### Health Check Endpoints

#### `/health/live` - Liveness Probe

Basic check that service is running (always returns 200 if server is up):

```json
{
  "status": "healthy",
  "timestamp": 1705315800000
}
```

#### `/health/ready` - Readiness Probe

Checks if service is ready to accept traffic:

```json
{
  "status": "healthy",
  "checks": {
    "postgres": {
      "status": "healthy",
      "message": "Database connection OK",
      "duration": 5,
      "timestamp": 1705315800000
    },
    "redis": {
      "status": "healthy",
      "message": "Redis connection OK",
      "duration": 3,
      "timestamp": 1705315800000
    }
  },
  "metrics": {
    "memory": {
      "heapUsed": 150,
      "heapTotal": 200,
      "external": 10,
      "rss": 250
    },
    "uptime": 3600,
    "instance": {
      "id": "instance-123",
      "region": "us-east-1"
    }
  },
  "timestamp": 1705315800000,
  "duration": 8
}
```

#### Health Status Codes

- `200`: Service is healthy
- `503`: Service is unhealthy or degraded

### Custom Dependency Checks

```typescript
import type { DependencyCheck, HealthCheckResult } from '@gati-framework/runtime';

const customCheck: DependencyCheck = {
  name: 'custom-service',
  required: false,
  timeout: 5000,
  
  check: async (): Promise<HealthCheckResult> => {
    const startTime = Date.now();
    
    try {
      // Your custom check logic
      const isHealthy = await checkCustomService();
      
      return {
        status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        message: isHealthy ? 'Service OK' : 'Service degraded',
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: error.message,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  },
};
```

## Best Practices

### 1. Structured Logging

Always use structured logging (JSON) for better parsing:

```typescript
import { logger } from '@gati-framework/runtime';

// ✅ Good: Structured
logger.info({
  event: 'user_created',
  userId: user.id,
  email: user.email,
}, 'User created successfully');

// ❌ Bad: Unstructured
logger.info(`User ${user.email} created with ID ${user.id}`);
```

### 2. Log Levels

Use appropriate log levels:

```typescript
logger.trace({ ... }, 'Very detailed debug info'); // Development only
logger.debug({ ... }, 'Debug info'); // Development/staging
logger.info({ ... }, 'Normal operation'); // Production
logger.warn({ ... }, 'Warning condition'); // Production
logger.error({ ... }, 'Error occurred'); // Production
logger.fatal({ ... }, 'Critical failure'); // Production
```

### 3. Sensitive Data Redaction

Always redact sensitive data:

```typescript
const loggingMiddleware = createLoggingMiddleware({
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
  ],
  logRequestBody: false, // Don't log bodies by default
  logResponseBody: false,
});

// When logging user data, redact sensitive fields
logger.info({
  userId: user.id,
  email: user.email,
  // ❌ Don't log: password, tokens, API keys
}, 'User action');
```

### 4. Correlation IDs

Use trace and request IDs for correlation:

```typescript
logger.info({
  requestId: lctx.requestId,
  traceId: lctx.traceId,
  userId: lctx.refs.userId,
  // ... other fields
}, 'Processing request');
```

### 5. Health Check Timeouts

Set appropriate timeouts for health checks:

```typescript
const healthMiddleware = createHealthCheckMiddleware({
  dependencies: [
    createDatabaseHealthCheck('db', checkDB, true),
    {
      name: 'slow-service',
      timeout: 2000, // Max 2 seconds
      check: async () => {
        // Check logic...
      },
    },
  ],
});
```

### 6. Caching Health Results

Cache health check results to avoid overloading dependencies:

```typescript
const healthMiddleware = createHealthCheckMiddleware({
  cacheDuration: 5000, // Cache for 5 seconds
  // Prevents health endpoint spam from affecting dependencies
});
```

### 7. Performance Monitoring in Production

Use sampling for performance monitoring in high-traffic scenarios:

```typescript
const perfMiddleware = createPerformanceMiddleware();

// Only apply to sample of requests
app.use(perfMiddleware, {
  path: '*',
  // Could add custom sampling logic here
});
```

### 8. Separate Liveness and Readiness

Always implement both for Kubernetes:

```yaml
# Kubernetes deployment
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Complete Example

```typescript
import {
  createApp,
  createLoggingMiddleware,
  createTracingMiddleware,
  createPerformanceMiddleware,
  createAuditMiddleware,
  createHealthCheckMiddleware,
  createDatabaseHealthCheck,
} from '@gati-framework/runtime';

const app = createApp({ /* config */ });

// 1. Tracing (highest priority - captures everything)
app.use(createTracingMiddleware({
  serviceName: 'my-api',
  injectTraceContext: true,
}), {
  path: '*',
  priority: 110,
});

// 2. Logging (high priority)
app.use(createLoggingMiddleware({
  logQuery: true,
  skipPaths: ['/health', '/metrics'],
  successLevel: 'info',
  errorLevel: 'error',
}), {
  path: '*',
  priority: 105,
});

// 3. Performance monitoring
app.use(createPerformanceMiddleware(), {
  path: '*',
  priority: 100,
});

// 4. Audit logging (for sensitive operations)
app.use(createAuditMiddleware({
  extractContext: (req, lctx) => ({
    userId: lctx.refs.userId,
    resource: req.path,
  }),
}), {
  path: '/admin/*',
  priority: 90,
});

// 5. Health checks (always accessible)
app.use(createHealthCheckMiddleware({
  dependencies: [
    createDatabaseHealthCheck('postgres', checkDB, true),
  ],
  includeMetrics: true,
  cacheDuration: 5000,
}));

await app.listen(3000);
```

## API Reference

### Logging

- `createLoggingMiddleware(config)`: Request/response logging
- `RequestLoggingConfig`: Logging configuration

### Tracing

- `createTracingMiddleware(config)`: Distributed tracing
- `TracingConfig`: Tracing configuration

### Performance

- `createPerformanceMiddleware()`: Performance monitoring

### Audit

- `createAuditMiddleware(config)`: Audit logging
- `AuditConfig`: Audit configuration

### Health Checks

- `createHealthCheckMiddleware(config)`: Health check endpoints
- `createDatabaseHealthCheck(name, check, required)`: Database check
- `createRedisHealthCheck(name, check, required)`: Redis check
- `createServiceHealthCheck(name, url, required)`: Service check
- `HealthStatus`: Health status enum (HEALTHY, DEGRADED, UNHEALTHY)
- `HealthCheckResult`: Health check result structure
