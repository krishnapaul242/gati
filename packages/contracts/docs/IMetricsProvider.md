# IMetricsProvider

The `IMetricsProvider` interface defines the contract for metrics collection in Gati applications.

## Interface

```typescript
interface IMetricsProvider {
  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  getMetrics(): Promise<string>;
}
```

## Methods

### incrementCounter

Increments a counter metric by a specified value.

**Parameters:**
- `name` (string): The metric name
- `labels` (Record<string, string>, optional): Key-value pairs for metric dimensions
- `value` (number, optional): Amount to increment (default: 1)

**Example:**
```typescript
metrics.incrementCounter('http_requests_total', { method: 'GET', status: '200' });
metrics.incrementCounter('api_calls', { endpoint: '/users' }, 5);
```

### setGauge

Sets a gauge metric to a specific value.

**Parameters:**
- `name` (string): The metric name
- `value` (number): The value to set
- `labels` (Record<string, string>, optional): Key-value pairs for metric dimensions

**Example:**
```typescript
metrics.setGauge('active_connections', 42);
metrics.setGauge('memory_usage_bytes', process.memoryUsage().heapUsed, { type: 'heap' });
```

### recordHistogram

Records a value in a histogram metric (for distributions like latency).

**Parameters:**
- `name` (string): The metric name
- `value` (number): The value to record
- `labels` (Record<string, string>, optional): Key-value pairs for metric dimensions

**Example:**
```typescript
metrics.recordHistogram('http_request_duration_ms', 123.45, { endpoint: '/api/users' });
metrics.recordHistogram('db_query_duration_ms', 45.2, { query: 'SELECT' });
```

### getMetrics

Returns all metrics in a format suitable for the provider (e.g., Prometheus text format).

**Returns:** Promise<string>

**Example:**
```typescript
const metricsText = await metrics.getMetrics();
console.log(metricsText);
// Output (Prometheus format):
// # HELP http_requests_total Total HTTP requests
// # TYPE http_requests_total counter
// http_requests_total{method="GET",status="200"} 42
```

## Implementations

### Built-in
- **PrometheusAdapter** - Prometheus metrics (prom-client)

### Cloud Providers
- **CloudWatchMetricsAdapter** - AWS CloudWatch
- **DatadogMetricsAdapter** - Datadog
- **NewRelicAdapter** - New Relic

## Usage with Gati

```typescript
import { GlobalContext } from '@gati-framework/runtime';
import { PrometheusAdapter } from '@gati-framework/observability';

const metrics = new PrometheusAdapter();

const gctx = await GlobalContext.create({
  config,
  metricsProvider: metrics,
});

// In your handler
export const handler: Handler = async (req, res, gctx) => {
  gctx.metrics.incrementCounter('api_requests', { endpoint: req.path });
  
  const start = Date.now();
  // ... your logic
  const duration = Date.now() - start;
  
  gctx.metrics.recordHistogram('request_duration_ms', duration);
  res.json({ success: true });
};
```

## Best Practices

1. **Use consistent naming**: Follow conventions like `http_requests_total`, `db_query_duration_ms`
2. **Add meaningful labels**: Include dimensions like `method`, `status`, `endpoint`
3. **Avoid high cardinality**: Don't use user IDs or timestamps as labels
4. **Use appropriate metric types**:
   - Counters: Things that only increase (requests, errors)
   - Gauges: Values that go up and down (connections, memory)
   - Histograms: Distributions (latency, response size)

## See Also

- [ITracingProvider](./ITracingProvider.md)
- [ILogger](./ILogger.md)
