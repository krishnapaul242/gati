# Observability Demo

Demonstrates Gati's observability features with Prometheus, OpenTelemetry, and Pino.

## Features

- **Metrics**: Prometheus metrics collection
- **Tracing**: OpenTelemetry distributed tracing
- **Logging**: Structured logging with Pino

## Prerequisites

```bash
# Install dependencies
pnpm install

# Start Jaeger (for tracing visualization)
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

## Running

```bash
# Start development server
pnpm dev

# Make requests
curl http://localhost:3000/api/demo

# View metrics
curl http://localhost:3000/metrics

# View traces
open http://localhost:16686
```

## What's Happening

### Metrics (Prometheus)

The handler collects:
- `demo_requests_total` - Total requests counter
- `demo_request_duration_ms` - Request duration histogram
- `db_queries_total` - Database query counter
- `cache_operations_total` - Cache operation counter

View at: http://localhost:3000/metrics

### Tracing (OpenTelemetry → Jaeger)

The handler creates spans for:
- `demo-handler` - Main handler span
- `database-query` - Simulated DB query
- `cache-lookup` - Simulated cache lookup

View at: http://localhost:16686

### Logging (Pino)

Structured logs include:
- Request received
- Request completed
- Duration and request ID

Logs appear in console with pretty formatting.

## Example Output

### Request
```bash
curl http://localhost:3000/api/demo
```

### Response
```json
{
  "message": "Observability demo",
  "requestId": "req-abc123",
  "duration": 65,
  "observability": {
    "metrics": "Prometheus",
    "tracing": "OpenTelemetry",
    "logging": "Pino"
  }
}
```

### Logs
```
[INFO] Demo request received
  requestId: "req-abc123"
  path: "/api/demo"
  method: "GET"

[INFO] Demo request completed
  requestId: "req-abc123"
  duration: 65
```

### Metrics
```
# HELP demo_requests_total Total demo requests
# TYPE demo_requests_total counter
demo_requests_total{endpoint="/demo",method="GET"} 1

# HELP demo_request_duration_ms Demo request duration
# TYPE demo_request_duration_ms histogram
demo_request_duration_ms_bucket{le="100",endpoint="/demo"} 1
demo_request_duration_ms_sum{endpoint="/demo"} 65
demo_request_duration_ms_count{endpoint="/demo"} 1
```

## Switching Providers

### AWS CloudWatch

```typescript
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

const config: GatiConfig = {
  observability: createAWSPreset({
    region: 'us-east-1',
    namespace: 'observability-demo',
    logGroupName: '/aws/gati/demo',
    serviceName: 'demo',
  }),
};
```

### Datadog

```typescript
import { createDatadogPreset } from '@gati-framework/observability-adapters/presets';

const config: GatiConfig = {
  observability: createDatadogPreset({
    apiKey: process.env.DD_API_KEY!,
    service: 'observability-demo',
    env: 'development',
  }),
};
```

### Self-Hosted (Jaeger + Loki)

```typescript
import { createSelfHostedPreset } from '@gati-framework/observability-adapters/presets';

const config: GatiConfig = {
  observability: createSelfHostedPreset({
    serviceName: 'observability-demo',
    tracingProvider: 'jaeger',
    jaegerConfig: {
      agentHost: 'localhost',
      agentPort: 6832,
    },
  }),
};
```

## Learn More

- [Observability Guide](../../docs/guides/observability.md)
- [Integration Guide](../../packages/contracts/docs/integration-guide.md)
- [AWS Setup](../../packages/observability-adapters/docs/aws-setup.md)
