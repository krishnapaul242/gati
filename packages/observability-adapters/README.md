# @gati-framework/observability-adapters

Cloud provider and APM adapters for Gati observability framework.

## Installation

```bash
npm install @gati-framework/observability-adapters
```

## Overview

This package provides adapters for various observability providers, allowing you to integrate Gati with your preferred monitoring stack. All adapters implement the contracts defined in `@gati-framework/contracts`.

## Supported Providers

### AWS Stack
- **CloudWatch Metrics** - Metrics collection
- **CloudWatch Logs** - Centralized logging
- **X-Ray** - Distributed tracing

### APM Providers
- **Datadog** - Full-stack monitoring
- **New Relic** - Application performance monitoring

### Open Source
- **Jaeger** - Distributed tracing
- **Zipkin** - Distributed tracing

### Error Tracking
- **Sentry** - Error tracking and performance monitoring

## Quick Start with Presets

### AWS Stack

```typescript
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

const observability = createAWSPreset({
  region: 'us-east-1',
  namespace: 'my-app',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
  serviceName: 'my-app',
});

// Use with Gati runtime
const gctx = await GlobalContext.create({
  config,
  metricsProvider: observability.metrics,
  tracingProvider: observability.tracing,
  logger: observability.logging,
});
```

### Datadog Stack

```typescript
import { createDatadogPreset } from '@gati-framework/observability-adapters/presets';

const observability = createDatadogPreset({
  apiKey: process.env.DD_API_KEY!,
  service: 'my-app',
  env: 'production',
  version: '1.0.0',
});
```

### Self-Hosted (Jaeger)

```typescript
import { createSelfHostedPreset } from '@gati-framework/observability-adapters/presets';

const observability = createSelfHostedPreset({
  serviceName: 'my-app',
  tracingProvider: 'jaeger',
  jaegerConfig: {
    agentHost: 'localhost',
    agentPort: 6832,
  },
});
```

### Sentry Error Tracking

```typescript
import { createSentryPreset } from '@gati-framework/observability-adapters/presets';

const observability = createSentryPreset({
  dsn: process.env.SENTRY_DSN!,
  environment: 'production',
  tracesSampleRate: 1.0,
});
```

## Custom Mix & Match

You can mix and match providers for different concerns:

```typescript
import { 
  CloudWatchMetricsAdapter,
  JaegerAdapter,
  SentryAdapter 
} from '@gati-framework/observability-adapters';

const observability = {
  metrics: new CloudWatchMetricsAdapter({
    region: 'us-east-1',
    namespace: 'my-app',
  }),
  tracing: new JaegerAdapter({
    serviceName: 'my-app',
    agentHost: 'jaeger',
  }),
  logging: new SentryAdapter({
    dsn: process.env.SENTRY_DSN!,
  }),
};
```

## Individual Adapters

### AWS CloudWatch Metrics

```typescript
import { CloudWatchMetricsAdapter } from '@gati-framework/observability-adapters/aws';

const metrics = new CloudWatchMetricsAdapter({
  region: 'us-east-1',
  namespace: 'my-app',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

metrics.incrementCounter('requests', { endpoint: '/api/users' });
metrics.setGauge('active_connections', 42);
metrics.recordHistogram('request_duration', 123.45);
```

### AWS X-Ray

```typescript
import { XRayAdapter } from '@gati-framework/observability-adapters/aws';

const tracing = new XRayAdapter({
  serviceName: 'my-app',
  daemonAddress: 'localhost:2000',
  plugins: ['EC2Plugin', 'ECSPlugin'],
});

await tracing.withSpan('database-query', async (span) => {
  span.setAttribute('query', 'SELECT * FROM users');
  // Your code here
});
```

### Datadog APM

```typescript
import { DatadogAPMAdapter } from '@gati-framework/observability-adapters/apm';

const tracing = new DatadogAPMAdapter({
  service: 'my-app',
  env: 'production',
  version: '1.0.0',
});
```

### Jaeger

```typescript
import { JaegerAdapter } from '@gati-framework/observability-adapters/oss';

const tracing = new JaegerAdapter({
  serviceName: 'my-app',
  agentHost: 'localhost',
  agentPort: 6832,
  samplerType: 'const',
  samplerParam: 1,
});
```

### Sentry

```typescript
import { SentryAdapter } from '@gati-framework/observability-adapters/error-tracking';

const sentry = new SentryAdapter({
  dsn: process.env.SENTRY_DSN!,
  environment: 'production',
  release: 'my-app@1.0.0',
  tracesSampleRate: 1.0,
});

// Use as logger
sentry.error('Something went wrong', { userId: '123' });

// Use as tracing provider
await sentry.withSpan('api-call', async (span) => {
  // Your code here
});
```

## Peer Dependencies

Install only the dependencies you need:

```bash
# AWS
npm install @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs aws-xray-sdk-core

# Datadog
npm install dd-trace

# New Relic
npm install newrelic

# Jaeger
npm install jaeger-client

# Zipkin
npm install zipkin zipkin-context-cls zipkin-transport-http

# Sentry
npm install @sentry/node @sentry/tracing
```

## License

MIT
