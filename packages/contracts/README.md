# @gati-framework/contracts

Type-safe contracts for Gati framework integrations. This package defines interfaces that allow pluggable implementations of observability, storage, and other infrastructure concerns.

## Installation

```bash
npm install @gati-framework/contracts
```

## Observability Contracts

### Metrics Provider

```typescript
import { IMetricsProvider } from '@gati-framework/contracts';

class MyMetricsProvider implements IMetricsProvider {
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
    // Return formatted metrics
  }
}
```

### Tracing Provider

```typescript
import { ITracingProvider, ISpan } from '@gati-framework/contracts';

class MyTracingProvider implements ITracingProvider {
  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    // Your implementation
  }
  
  async withSpan<T>(name: string, fn: (span: ISpan) => Promise<T>): Promise<T> {
    // Your implementation
  }
  
  getTraceContext(): string | undefined {
    // Your implementation
  }
}
```

### Logger

```typescript
import { ILogger } from '@gati-framework/contracts';

class MyLogger implements ILogger {
  debug(message: string, context?: Record<string, any>): void {
    // Your implementation
  }
  
  info(message: string, context?: Record<string, any>): void {
    // Your implementation
  }
  
  // ... other methods
}
```

## Compatible Implementations

- **Metrics**: Prometheus, Datadog, CloudWatch, New Relic
- **Tracing**: OpenTelemetry, Jaeger, Zipkin, Datadog APM
- **Logging**: Pino, Winston, Loki, CloudWatch Logs

## License

MIT © Krishna Paul
