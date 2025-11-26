# Jaeger Adapter

## Installation

```bash
npm install @gati-framework/observability-adapters
npm install jaeger-client
```

## Configuration

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

## Docker Setup

```bash
docker run -d --name jaeger \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

Access UI at http://localhost:16686
