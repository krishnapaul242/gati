# Observability Contracts

## Overview

The observability contracts define interfaces for metrics, tracing, and logging providers. This allows Gati to work with any observability backend through a unified API.

## IMetricsProvider

Interface for metrics collection providers (Prometheus, CloudWatch, Datadog, etc.).

```typescript
interface IMetricsProvider {
  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  getMetrics(): Promise<string>;
}
```

### Example

```typescript
import { PrometheusAdapter } from '@gati-framework/observability';

const metrics = new PrometheusAdapter({ port: 9090 });
metrics.incrementCounter('http_requests_total', { method: 'GET' });
metrics.setGauge('active_connections', 42);
metrics.recordHistogram('request_duration_ms', 123.45);
```

## ITracingProvider

Interface for distributed tracing providers (OpenTelemetry, Jaeger, X-Ray, etc.).

```typescript
interface ITracingProvider {
  createSpan(name: string, attributes?: Record<string, any>): ISpan;
  withSpan<T>(name: string, fn: (span: ISpan) => Promise<T>, attributes?: Record<string, any>): Promise<T>;
  getTraceContext(): string | undefined;
}
```

### Example

```typescript
import { OpenTelemetryAdapter } from '@gati-framework/observability';

const tracing = new OpenTelemetryAdapter({ serviceName: 'my-app' });

await tracing.withSpan('database-query', async (span) => {
  span.setAttribute('query', 'SELECT * FROM users');
  return await db.query('SELECT * FROM users');
});
```

## ILogger

Interface for structured logging providers (Pino, Winston, CloudWatch Logs, etc.).

```typescript
interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  child(context: Record<string, any>): ILogger;
}
```

### Example

```typescript
import { PinoAdapter } from '@gati-framework/observability';

const logger = new PinoAdapter({ level: 'info' });
logger.info('User logged in', { userId: '123' });

const requestLogger = logger.child({ requestId: 'abc-123' });
requestLogger.info('Processing request');
```

## Provider Configuration

### Using with Gati Runtime

```typescript
import { GlobalContext } from '@gati-framework/runtime';
import { PrometheusAdapter, OpenTelemetryAdapter, PinoAdapter } from '@gati-framework/observability';

const gctx = await GlobalContext.create({
  config,
  metricsProvider: new PrometheusAdapter({ port: 9090 }),
  tracingProvider: new OpenTelemetryAdapter({ serviceName: 'my-app' }),
  logger: new PinoAdapter({ level: 'info' }),
});
```

### Using Presets

```typescript
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

const { metrics, tracing, logging } = createAWSPreset({
  region: 'us-east-1',
  namespace: 'my-app',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
  serviceName: 'my-app',
});
```

## Available Providers

### Core (Built-in)
- PrometheusAdapter - Metrics
- OpenTelemetryAdapter - Tracing
- PinoAdapter - Logging

### Cloud Providers (@gati-framework/observability-adapters)
- CloudWatchMetricsAdapter - AWS Metrics
- CloudWatchLogsAdapter - AWS Logging
- XRayAdapter - AWS Tracing

### APM Providers
- DatadogMetricsAdapter - Datadog Metrics
- DatadogAPMAdapter - Datadog Tracing
- NewRelicAdapter - New Relic (Metrics + Tracing)

### Open Source
- JaegerAdapter - Jaeger Tracing
- ZipkinAdapter - Zipkin Tracing

### Error Tracking
- SentryAdapter - Sentry (Logging + Tracing)
