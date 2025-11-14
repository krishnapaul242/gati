# @gati-framework/observability

Complete observability stack for Gati applications with Prometheus, Grafana, Loki, and distributed tracing.

## Features

- ✅ **Prometheus Metrics** - Automatic metrics collection and exposure
- ✅ **Grafana Dashboards** - Pre-built dashboards for monitoring
- ✅ **Loki Integration** - Structured log aggregation
- ✅ **Distributed Tracing** - OpenTelemetry-based request tracing
- ✅ **Custom Metrics** - Easy custom metric creation
- ✅ **Auto-instrumentation** - Zero-code instrumentation

## Installation

```bash
pnpm add @gati-framework/observability
```

## Quick Start

```typescript
import { ObservabilityStack } from '@gati-framework/observability';

const observability = new ObservabilityStack({
  serviceName: 'my-gati-app',
  serviceVersion: '1.0.0',
  environment: 'production',
  prometheus: true,
  loki: {
    host: 'http://loki:3100',
    labels: { team: 'platform' },
  },
  tracing: {
    serviceName: 'my-gati-app',
    autoInstrument: true,
    metricsPort: 9464,
  },
});

// Apply middleware to your Express/HTTP server
const middleware = observability.getMiddleware();
app.use(...middleware);

// Expose metrics endpoint
app.get('/metrics', await observability.getMetricsHandler());
```

## Prometheus Metrics

### Built-in Metrics

- `gati_http_requests_total` - Total HTTP requests
- `gati_http_request_duration_seconds` - Request duration histogram
- `gati_active_connections` - Active connection count
- `gati_errors_total` - Total errors by type and route
- Process metrics (CPU, memory, etc.)

### Custom Metrics

```typescript
const { metrics } = observability;

// Create custom counter
const orderCounter = metrics.createCounter(
  'orders_total',
  'Total number of orders',
  ['status']
);
orderCounter.inc({ status: 'completed' });

// Create custom gauge
const queueSize = metrics.createGauge(
  'queue_size',
  'Current queue size',
  ['queue_name']
);
queueSize.set({ queue_name: 'emails' }, 42);

// Create custom histogram
const queryDuration = metrics.createHistogram(
  'db_query_duration_seconds',
  'Database query duration',
  ['query_type'],
  [0.01, 0.05, 0.1, 0.5, 1]
);
queryDuration.observe({ query_type: 'select' }, 0.043);
```

## Loki Logging

### Structured Logging

```typescript
const { logger } = observability;

logger.info('User logged in', { 
  userId: '123', 
  email: 'user@example.com' 
});

logger.warn('Rate limit exceeded', { 
  ip: '192.168.1.1', 
  limit: 100 
});

logger.error('Database connection failed', new Error('Connection timeout'), {
  database: 'users',
  retries: 3,
});
```

### Child Loggers

```typescript
const requestLogger = logger.child({ 
  requestId: 'abc-123',
  userId: '456',
});

requestLogger.info('Processing request');
requestLogger.debug('Query executed', { query: 'SELECT ...' });
```

## Distributed Tracing

### Automatic Instrumentation

Tracing is automatically enabled for HTTP requests when auto-instrumentation is on.

### Manual Spans

```typescript
const { tracing } = observability;

// Create and manage spans manually
await tracing.withSpan('process-order', async (span) => {
  span.setAttribute('order.id', orderId);
  span.setAttribute('order.amount', amount);
  
  // Your business logic here
  await processPayment(orderId);
  
  tracing.addEvent('payment-processed', { orderId });
  
  return result;
}, {
  'order.type': 'standard',
});
```

### Trace Context

```typescript
// Get current trace ID for correlation
const traceId = tracing.getTraceContext();
console.log('Trace ID:', traceId);
```

## Grafana Dashboards

Pre-built Grafana dashboard available at:
`node_modules/@gati-framework/observability/dashboards/gati-overview.json`

### Import Dashboard

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `gati-overview.json`
4. Select your Prometheus data source
5. Click Import

### Dashboard Panels

- HTTP Request Rate
- Request Duration (p95, p99)
- Active Connections
- Error Rate by Type
- Memory Usage
- CPU Usage
- Status Code Distribution

## Configuration

### Prometheus Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gati-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Loki Configuration

```yaml
# loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /tmp/loki/index
    cache_location: /tmp/loki/cache
  filesystem:
    directory: /tmp/loki/chunks
```

## Docker Compose Example

```yaml
version: '3'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
```

## Best Practices

1. **Use structured logging** - Always include relevant context in logs
2. **Set appropriate metric buckets** - Tailor histogram buckets to your latency profile
3. **Create custom metrics** - Track business KPIs alongside technical metrics
4. **Use trace context** - Include trace IDs in logs for correlation
5. **Monitor cardinality** - Avoid high-cardinality label values

## API Reference

See [TypeScript definitions](./src/index.ts) for complete API documentation.

## License

MIT © Krishna Paul
