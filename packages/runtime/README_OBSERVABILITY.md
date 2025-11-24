# Observability Integration Guide

## Overview

The Gati runtime now supports pluggable observability providers through a contract-based architecture. This allows you to use different metrics, tracing, and logging implementations without changing your application code.

## Quick Start

### Using Default Implementation

```typescript
import { createGlobalContext } from '@gati-framework/runtime';

// Uses built-in RuntimeMetricsClient
const gctx = createGlobalContext({
  config: { serviceName: 'my-service' }
});
```

### Using Prometheus Adapter

```typescript
import { createGlobalContext } from '@gati-framework/runtime';
import { PrometheusAdapter } from '@gati-framework/observability';

const gctx = createGlobalContext({
  observability: {
    metrics: {
      provider: new PrometheusAdapter()
    }
  }
});

// Access metrics through global context
gctx.metrics.incrementCounter('requests_total', { method: 'GET' });
gctx.metrics.setGauge('active_connections', 42);
gctx.metrics.recordHistogram('request_duration', 0.5, { endpoint: '/api/users' });
```

## Architecture

### Contracts Package

The `@gati-framework/contracts` package defines the interfaces that all observability providers must implement:

- `IMetricsProvider` - Metrics collection interface
- `ITracingProvider` - Distributed tracing interface  
- `ILogger` - Structured logging interface

### Adapters

Adapters bridge the gap between the contracts and actual implementations:

- `PrometheusAdapter` - Prometheus metrics
- `OpenTelemetryAdapter` - OpenTelemetry tracing
- `WinstonLokiAdapter` - Winston + Loki logging

### Factory Pattern

The `observability-factory.ts` module provides:

- `MetricsClientAdapter` - Wraps `IMetricsProvider` to implement `MetricsClient`
- `createMetricsClient()` - Factory function for creating metrics clients

## Configuration

### ObservabilityConfig Interface

```typescript
interface ObservabilityConfig {
  metrics?: {
    provider?: IMetricsProvider;
  };
}
```

### Example: Custom Provider

```typescript
import type { IMetricsProvider } from '@gati-framework/contracts';

class CustomMetricsProvider implements IMetricsProvider {
  incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
    // Your implementation
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    // Your implementation
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    // Your implementation
  }

  async getMetrics(): Promise<string> {
    // Return metrics in your format
    return '';
  }
}

// Use it
const gctx = createGlobalContext({
  observability: {
    metrics: {
      provider: new CustomMetricsProvider()
    }
  }
});
```

## Compatible Providers

### Metrics
- ✅ Prometheus (prom-client) - Primary
- 🔄 Datadog (dd-trace) - Planned
- 🔄 AWS CloudWatch - Planned
- 🔄 New Relic - Planned

### Tracing
- ✅ OpenTelemetry - Primary
- 🔄 Jaeger - Planned
- 🔄 Zipkin - Planned
- 🔄 Datadog APM - Planned

### Logging
- ✅ Pino - Primary
- ✅ Winston + Loki - Available
- 🔄 AWS CloudWatch Logs - Planned
- 🔄 Sentry - Planned

## Migration Guide

### From RuntimeMetricsClient to Provider

**Before:**
```typescript
const gctx = createGlobalContext({
  metricsClient: new RuntimeMetricsClient('my-service', '1.0.0')
});
```

**After:**
```typescript
const gctx = createGlobalContext({
  observability: {
    metrics: {
      provider: new PrometheusAdapter()
    }
  }
});
```

### Accessing Metrics

The API remains the same:

```typescript
// Both work identically
gctx.metrics.incrementCounter('requests', { method: 'GET' });
gctx.metrics.setGauge('memory_usage', 1024);
gctx.metrics.recordHistogram('latency', 0.5);
```

## Testing

### Mock Provider for Tests

```typescript
import type { IMetricsProvider } from '@gati-framework/contracts';

const mockProvider: IMetricsProvider = {
  incrementCounter: vi.fn(),
  setGauge: vi.fn(),
  recordHistogram: vi.fn(),
  getMetrics: async () => '',
};

const gctx = createGlobalContext({
  observability: {
    metrics: { provider: mockProvider }
  }
});
```

## Best Practices

1. **Use contracts for new providers** - Always implement `IMetricsProvider` interface
2. **Keep adapters thin** - Adapters should only translate between interfaces
3. **Test with real providers** - Integration tests should use actual implementations
4. **Configure via environment** - Use env vars to switch providers in different environments
5. **Monitor provider health** - Ensure your observability provider is working correctly

## Troubleshooting

### Provider not working

Check that:
1. Provider is properly instantiated
2. Configuration is passed to `createGlobalContext`
3. Provider dependencies are installed

### Metrics not appearing

Verify:
1. Provider's `getMetrics()` returns data
2. Metrics endpoint is exposed (e.g., `/metrics`)
3. Labels are correctly formatted

## Future Enhancements

- Auto-discovery of providers
- Provider health checks
- Metrics aggregation across providers
- Configuration validation
- Provider registry
