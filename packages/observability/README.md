# @gati-framework/observability

> Observability stack for Gati - Prometheus, Grafana, Loki, and distributed tracing

[![npm version](https://img.shields.io/npm/v/@gati-framework/observability.svg)](https://www.npmjs.com/package/@gati-framework/observability)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Complete observability solution with metrics, logging, and distributed tracing for Gati applications.

## Installation

```bash
npm install @gati-framework/observability
```

## Quick Start

```typescript
import { setupObservability } from '@gati-framework/observability';

setupObservability({
  serviceName: 'my-app',
  metrics: { enabled: true, port: 9090 },
  logging: { enabled: true, level: 'info' },
  tracing: { enabled: true, endpoint: 'http://jaeger:14268' }
});
```

## Features

- ✅ **Prometheus Metrics** - Request rate, latency, errors
- ✅ **Grafana Dashboards** - Pre-built visualizations
- ✅ **Loki Logging** - Structured log aggregation
- ✅ **Distributed Tracing** - OpenTelemetry integration
- ✅ **Custom Metrics** - Application-specific metrics
- ✅ **Alerting** - Prometheus alert rules

## Metrics

```typescript
import { metrics } from '@gati-framework/observability';

// Counter
metrics.counter('requests_total', { method: 'GET', path: '/users' }).inc();

// Histogram
metrics.histogram('request_duration_seconds').observe(0.123);

// Gauge
metrics.gauge('active_connections').set(42);
```

## Logging

```typescript
import { logger } from '@gati-framework/observability';

logger.info('User created', { userId: '123' });
logger.error('Database error', { error: err });
logger.debug('Request received', { method: 'GET', path: '/users' });
```

## Tracing

```typescript
import { tracer } from '@gati-framework/observability';

const span = tracer.startSpan('database-query');
try {
  const result = await db.query('SELECT * FROM users');
  span.setStatus({ code: 0 });
  return result;
} finally {
  span.end();
}
```

## Dashboards

Pre-built Grafana dashboards included:
- Request rate and latency
- Error rates
- Resource usage
- Handler performance

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/contracts](../contracts) - Observability contracts
- [@gati-framework/observability-adapters](../observability-adapters) - Cloud adapters

## Documentation

- [Observability Guide](https://krishnapaul242.github.io/gati/guides/observability)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
