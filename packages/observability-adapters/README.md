# @gati-framework/observability-adapters

> Cloud provider and APM adapters for Gati observability

[![npm version](https://img.shields.io/npm/v/@gati-framework/observability-adapters.svg)](https://www.npmjs.com/package/@gati-framework/observability-adapters)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Plug-and-play adapters for AWS CloudWatch, Datadog, New Relic, Jaeger, Sentry, and more.

## Installation

```bash
npm install @gati-framework/observability-adapters
```

## Quick Start

```typescript
import { AWSAdapter } from '@gati-framework/observability-adapters/aws';

const adapter = new AWSAdapter({
  region: 'us-east-1',
  logGroup: '/aws/gati/my-app'
});

await adapter.initialize();
```

## Adapters

### AWS CloudWatch & X-Ray

```typescript
import { AWSAdapter } from '@gati-framework/observability-adapters/aws';

const aws = new AWSAdapter({
  region: 'us-east-1',
  logGroup: '/aws/gati/my-app',
  enableXRay: true
});
```

### Datadog

```typescript
import { DatadogAdapter } from '@gati-framework/observability-adapters/apm';

const datadog = new DatadogAdapter({
  apiKey: process.env.DD_API_KEY,
  service: 'my-app'
});
```

### New Relic

```typescript
import { NewRelicAdapter } from '@gati-framework/observability-adapters/apm';

const newrelic = new NewRelicAdapter({
  licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  appName: 'my-app'
});
```

### Jaeger

```typescript
import { JaegerAdapter } from '@gati-framework/observability-adapters/oss';

const jaeger = new JaegerAdapter({
  endpoint: 'http://jaeger:14268/api/traces'
});
```

### Sentry

```typescript
import { SentryAdapter } from '@gati-framework/observability-adapters/error-tracking';

const sentry = new SentryAdapter({
  dsn: process.env.SENTRY_DSN,
  environment: 'production'
});
```

## Presets

```typescript
import { awsPreset, datadogPreset } from '@gati-framework/observability-adapters/presets';

// AWS preset (CloudWatch + X-Ray)
const aws = awsPreset({ region: 'us-east-1' });

// Datadog preset (APM + Logs + Traces)
const datadog = datadogPreset({ apiKey: process.env.DD_API_KEY });
```

## Related Packages

- [@gati-framework/observability](../observability) - Core observability
- [@gati-framework/contracts](../contracts) - Observability contracts

## Documentation

- [Observability Guide](https://krishnapaul242.github.io/gati/guides/observability)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
