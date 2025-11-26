# Datadog Adapters

## Installation

```bash
npm install @gati-framework/observability-adapters
npm install dd-trace
```

## Configuration

```typescript
import { createDatadogPreset } from '@gati-framework/observability-adapters/presets';

const observability = createDatadogPreset({
  apiKey: process.env.DD_API_KEY,
  service: 'my-app',
  env: 'production',
  version: '1.0.0',
});
```

## Environment Variables

```bash
DD_API_KEY=your-api-key
DD_SITE=datadoghq.com
DD_ENV=production
DD_SERVICE=my-app
DD_VERSION=1.0.0
```
