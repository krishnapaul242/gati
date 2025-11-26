# Sentry Adapter

## Installation

```bash
npm install @gati-framework/observability-adapters
npm install @sentry/node @sentry/tracing
```

## Configuration

```typescript
import { SentryAdapter } from '@gati-framework/observability-adapters/error-tracking';

const sentry = new SentryAdapter({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  release: 'my-app@1.0.0',
  tracesSampleRate: 1.0,
});
```

## Usage

```typescript
// As logger
sentry.error('Payment failed', { userId: '123', amount: 99.99 });

// As tracing provider
await sentry.withSpan('process-payment', async (span) => {
  span.setAttribute('amount', 99.99);
  // Your code here
});
```

## Preset

```typescript
import { createSentryPreset } from '@gati-framework/observability-adapters/presets';

const observability = createSentryPreset({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 1.0,
});
```
