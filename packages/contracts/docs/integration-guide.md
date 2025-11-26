# Observability Integration Guide

This guide shows how to integrate different observability providers with Gati using the contracts-based architecture.

## Quick Start

### 1. Install Packages

```bash
# Core packages
npm install @gati-framework/contracts @gati-framework/observability

# Optional: Adapters for cloud providers
npm install @gati-framework/observability-adapters
```

### 2. Choose Your Stack

#### Option A: Default Stack (Prometheus + OpenTelemetry + Pino)

```typescript
import { GlobalContext } from '@gati-framework/runtime';
import { 
  PrometheusAdapter, 
  OpenTelemetryAdapter, 
  PinoAdapter 
} from '@gati-framework/observability';

const gctx = await GlobalContext.create({
  config,
  metricsProvider: new PrometheusAdapter(),
  tracingProvider: new OpenTelemetryAdapter({ serviceName: 'my-app' }),
  logger: new PinoAdapter({ level: 'info' })
});
```

#### Option B: AWS Stack (CloudWatch + X-Ray)

```typescript
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

const observability = createAWSPreset({
  region: 'us-east-1',
  namespace: 'my-app',
  logGroupName: '/aws/gati/my-app',
  serviceName: 'my-app'
});

const gctx = await GlobalContext.create({
  config,
  ...observability
});
```

#### Option C: Datadog Stack

```typescript
import { createDatadogPreset } from '@gati-framework/observability-adapters/presets';

const observability = createDatadogPreset({
  apiKey: process.env.DD_API_KEY!,
  service: 'my-app',
  env: 'production',
  version: '1.0.0'
});

const gctx = await GlobalContext.create({
  config,
  ...observability
});
```

#### Option D: Custom Mix

```typescript
import { PrometheusAdapter } from '@gati-framework/observability';
import { JaegerAdapter, SentryAdapter } from '@gati-framework/observability-adapters';

const gctx = await GlobalContext.create({
  config,
  metricsProvider: new PrometheusAdapter(),
  tracingProvider: new JaegerAdapter({ serviceName: 'my-app', agentHost: 'jaeger' }),
  logger: new SentryAdapter({ dsn: process.env.SENTRY_DSN! })
});
```

## Provider Configuration

### Metrics Providers

#### Prometheus (Default)

```typescript
import { PrometheusAdapter } from '@gati-framework/observability';

const metrics = new PrometheusAdapter({
  prefix: 'gati_',
  defaultLabels: {
    app: 'my-app',
    env: 'production'
  }
});
```

#### AWS CloudWatch

```typescript
import { CloudWatchMetricsAdapter } from '@gati-framework/observability-adapters/aws';

const metrics = new CloudWatchMetricsAdapter({
  region: 'us-east-1',
  namespace: 'MyApp',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});
```

#### Datadog

```typescript
import { DatadogMetricsAdapter } from '@gati-framework/observability-adapters/apm';

const metrics = new DatadogMetricsAdapter({
  apiKey: process.env.DD_API_KEY!,
  site: 'datadoghq.com',
  service: 'my-app'
});
```

### Tracing Providers

#### OpenTelemetry (Default)

```typescript
import { OpenTelemetryAdapter } from '@gati-framework/observability';

const tracing = new OpenTelemetryAdapter({
  serviceName: 'my-app',
  endpoint: 'http://jaeger:14268/api/traces',
  samplingRate: 1.0
});
```

#### AWS X-Ray

```typescript
import { XRayAdapter } from '@gati-framework/observability-adapters/aws';

const tracing = new XRayAdapter({
  serviceName: 'my-app',
  daemonAddress: 'localhost:2000',
  plugins: ['EC2Plugin', 'ECSPlugin']
});
```

#### Jaeger

```typescript
import { JaegerAdapter } from '@gati-framework/observability-adapters/oss';

const tracing = new JaegerAdapter({
  serviceName: 'my-app',
  agentHost: 'localhost',
  agentPort: 6832,
  samplerType: 'probabilistic',
  samplerParam: 0.1 // 10% sampling
});
```

#### Zipkin

```typescript
import { ZipkinAdapter } from '@gati-framework/observability-adapters/oss';

const tracing = new ZipkinAdapter({
  serviceName: 'my-app',
  endpoint: 'http://zipkin:9411/api/v2/spans',
  sampleRate: 0.1
});
```

### Logging Providers

#### Pino (Default)

```typescript
import { PinoAdapter } from '@gati-framework/observability';

const logger = new PinoAdapter({
  level: 'info',
  prettyPrint: process.env.NODE_ENV === 'development',
  redact: ['password', 'token', 'apiKey']
});
```

#### AWS CloudWatch Logs

```typescript
import { CloudWatchLogsAdapter } from '@gati-framework/observability-adapters/aws';

const logger = new CloudWatchLogsAdapter({
  region: 'us-east-1',
  logGroupName: '/aws/gati/my-app',
  logStreamName: 'production',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});
```

#### Sentry

```typescript
import { SentryAdapter } from '@gati-framework/observability-adapters/error-tracking';

const logger = new SentryAdapter({
  dsn: process.env.SENTRY_DSN!,
  environment: 'production',
  release: 'my-app@1.0.0',
  tracesSampleRate: 1.0
});
```

## Usage in Handlers

```typescript
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  // Metrics
  gctx.metrics.incrementCounter('api_requests', { 
    endpoint: req.path,
    method: req.method 
  });
  
  // Logging
  gctx.logger.info('Request received', {
    requestId: lctx.requestId,
    path: req.path,
    userId: req.user?.id
  });
  
  // Tracing
  await gctx.tracing.withSpan('process-request', async (span) => {
    span.setAttribute('user.id', req.user?.id);
    
    const start = Date.now();
    
    try {
      const result = await processRequest(req);
      
      const duration = Date.now() - start;
      gctx.metrics.recordHistogram('request_duration_ms', duration);
      
      span.setStatus('ok');
      res.json(result);
    } catch (error) {
      span.setStatus('error', error.message);
      gctx.logger.error('Request failed', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
```

## Environment-Based Configuration

```typescript
// config/observability.ts
import { 
  PrometheusAdapter, 
  OpenTelemetryAdapter, 
  PinoAdapter 
} from '@gati-framework/observability';
import { createAWSPreset } from '@gati-framework/observability-adapters/presets';

export function createObservability() {
  const env = process.env.NODE_ENV;
  
  // Development: Local stack
  if (env === 'development') {
    return {
      metricsProvider: new PrometheusAdapter(),
      tracingProvider: new OpenTelemetryAdapter({ 
        serviceName: 'my-app-dev',
        endpoint: 'http://localhost:14268/api/traces'
      }),
      logger: new PinoAdapter({ level: 'debug', prettyPrint: true })
    };
  }
  
  // Production: AWS stack
  if (env === 'production') {
    return createAWSPreset({
      region: process.env.AWS_REGION!,
      namespace: 'my-app',
      logGroupName: '/aws/gati/my-app',
      serviceName: 'my-app'
    });
  }
  
  // Staging: Datadog
  return createDatadogPreset({
    apiKey: process.env.DD_API_KEY!,
    service: 'my-app',
    env: 'staging'
  });
}
```

## Compatible Packages

### Metrics
- ✅ Prometheus (prom-client) - Default
- ✅ AWS CloudWatch
- ✅ Datadog
- ✅ New Relic

### Tracing
- ✅ OpenTelemetry - Default
- ✅ AWS X-Ray
- ✅ Datadog APM
- ✅ Jaeger
- ✅ Zipkin

### Logging
- ✅ Pino - Default
- ✅ Winston + Loki
- ✅ AWS CloudWatch Logs
- ✅ Sentry

## Migration Guide

### From Mock to Real Providers

If you're currently using mock providers:

```typescript
// Before (mock)
const gctx = await GlobalContext.create({ config });

// After (real providers)
import { PrometheusAdapter, OpenTelemetryAdapter, PinoAdapter } from '@gati-framework/observability';

const gctx = await GlobalContext.create({
  config,
  metricsProvider: new PrometheusAdapter(),
  tracingProvider: new OpenTelemetryAdapter({ serviceName: 'my-app' }),
  logger: new PinoAdapter({ level: 'info' })
});
```

No code changes needed in your handlers!

### Switching Providers

```typescript
// From Prometheus to CloudWatch
// Before
metricsProvider: new PrometheusAdapter()

// After
metricsProvider: new CloudWatchMetricsAdapter({
  region: 'us-east-1',
  namespace: 'my-app'
})
```

All handler code remains the same - just swap the provider!

## Troubleshooting

### Metrics not appearing

1. Check provider configuration
2. Verify `/metrics` endpoint is accessible
3. Check provider-specific requirements (API keys, credentials)

### Traces not showing up

1. Verify tracing backend is running
2. Check endpoint configuration
3. Verify sampling rate (set to 1.0 for testing)

### Logs not being sent

1. Check log level configuration
2. Verify credentials for cloud providers
3. Check network connectivity to logging backend

## See Also

- [IMetricsProvider API](./IMetricsProvider.md)
- [ITracingProvider API](./ITracingProvider.md)
- [ILogger API](./ILogger.md)
