# @gati-framework/runtime

> Production-ready TypeScript runtime for handler-based cloud-native applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/runtime.svg)](https://www.npmjs.com/package/@gati-framework/runtime)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

The Gati runtime is a high-performance execution engine that orchestrates handlers, modules, and middleware with built-in observability, lifecycle management, and distributed tracing. Achieves **172K requests/sec** with sub-millisecond latency.

## Installation

```bash
npm install @gati-framework/runtime
```

For WebSocket support, also install:

```bash
npm install ws
npm install -D @types/ws  # TypeScript only
```

## Quick Start

```typescript
import { createE2EIntegration } from '@gati-framework/runtime';

const integration = createE2EIntegration({
  handlers: [{ id: 'hello', route: '/hello', method: 'GET', filePath: './handlers/hello.ts' }],
  modules: []
});

integration.ingress.handleRequest({
  id: 'req-1',
  method: 'GET',
  path: '/hello',
  headers: {},
  query: {},
  timestamp: Date.now()
}, (result) => console.log(result));
```

## Features

- ✅ **High Performance** - 172K RPS, 2.6M route matches/sec, <6μs pipeline latency
- ✅ **WebSocket & SSE** - Real-time communication with lifecycle management
- ✅ **Auth Middleware** - JWT, API Key, RBAC, and policy-based authorization
- ✅ **Observability** - Structured logging, distributed tracing, health checks
- ✅ **Queue Fabric** - Async pub/sub coordination between components
- ✅ **Worker Pool** - Handler and module process isolation
- ✅ **Lifecycle Hooks** - onInit, onRequest, onResponse, onCleanup, onError
- ✅ **Distributed Tracing** - Request/trace/client ID propagation with W3C Trace Context
- ✅ **Hot Reload** - 50-200ms file watching and reloading
- 🚧 **Timescape** - Timestamp-based API versioning (M3)

## Architecture

```
┌─────────────┐
│   Ingress   │ ← HTTP requests
└──────┬──────┘
       │ publishes to queue fabric
       ▼
┌─────────────┐
│Queue Fabric │ ← Async pub/sub coordination
└──────┬──────┘
       │ routing topic
       ▼
┌─────────────┐
│Route Manager│ ← Pattern matching
└──────┬──────┘
       │ matched route
       ▼
┌─────────────┐
│     LCC     │ ← Context creation
└──────┬──────┘
       │ gctx + lctx
       ▼
┌─────────────┐
│Handler Worker│ ← Execute handler
└──────┬──────┘
       │ result
       ▼
┌─────────────┐
│   Response  │ → HTTP response
└─────────────┘
```

## Performance

| Component | Throughput | Latency (mean) | Latency (P99) |
|-----------|------------|----------------|---------------|
| Route matching | 2.6M ops/sec | 0.4μs | 0.9μs |
| Context creation | 505K ops/sec | 2.0μs | 4.2μs |
| Handler execution | 294K ops/sec | 3.4μs | 6.5μs |
| **Full pipeline** | **172K RPS** | **5.8μs** | **<10μs** |

**172x better than MVP target** (1K RPS) • **5000x better P99** (<50ms target)

## Core Components

### Handler Engine

Execute handlers with lifecycle hooks and error handling.

```typescript
import { HandlerEngine } from '@gati-framework/runtime/handler-engine';

const engine = new HandlerEngine();
const result = await engine.execute(handler, req, res, gctx, lctx);
```

### Route Manager

Fast pattern matching with parameter extraction.

```typescript
import { RouteManager } from '@gati-framework/runtime/route-manager';

const router = new RouteManager();
router.register('GET', '/users/:id', handler);
const match = router.match('GET', '/users/123'); // { params: { id: '123' } }
```

### Global Context

Shared state across all requests.

```typescript
import { createGlobalContext } from '@gati-framework/runtime/global-context';

const gctx = createGlobalContext({ handlers: [], modules: [] });
const dbModule = gctx.modules['database'];
```

### Local Context

Per-request state with lifecycle management.

```typescript
import { createLocalContext } from '@gati-framework/runtime/local-context';

const lctx = createLocalContext('req-id', 'trace-id', 'client-id');
lctx.lifecycle.onCleanup('cleanup', async () => { /* cleanup */ });
```

### Queue Fabric

Async pub/sub for component coordination.

```typescript
import { QueueFabric } from '@gati-framework/runtime';

const fabric = new QueueFabric();
fabric.subscribe('routing', async (msg) => { /* handle */ });
fabric.publish('routing', { type: 'request', data });
```

### WebSocket Handler

Real-time WebSocket communication with lifecycle management.

```typescript
import { createWebSocketHandler } from '@gati-framework/runtime';

const wsHandler = createWebSocketHandler({
  onConnect: async (connection, request, gctx, lctx, wsctx) => {
    console.log('New connection:', connection.id);
    connection.sendJSON({ type: 'welcome', message: 'Connected!' });
  },
  onMessage: async (message, gctx, lctx, wsctx) => {
    // Broadcast to all connections
    wsctx.broadcast({ type: 'chat', data: message.data });
  },
  onDisconnect: async (connection, code, reason, gctx, lctx, wsctx) => {
    console.log('Connection closed:', connection.id);
  },
  options: {
    heartbeatInterval: 30000,
    compress: true,
  },
}, gctx);

wsHandler.initialize(httpServer, '/ws');
```

See [WebSocket & SSE Guide](../../docs/features/websocket-sse.md) for more details.

### Authentication Middleware

JWT, API Key, RBAC, and policy-based authorization.

```typescript
import {
  createAuthMiddleware,
  createRBACMiddleware,
  JWTAuthProvider,
} from '@gati-framework/runtime';

// JWT authentication
const authMiddleware = createAuthMiddleware({
  provider: new JWTAuthProvider({
    secret: process.env.JWT_SECRET,
    issuer: 'my-app',
  }),
  skipPaths: ['/health', '/login'],
  enrichContext: true,
});

// Role-based authorization
const adminOnly = createRBACMiddleware({
  roles: ['admin'],
});

app.use(authMiddleware, { path: '/api/*', priority: 100 });
app.use(adminOnly, { path: '/admin/*', priority: 90 });
```

See [Authentication Guide](../../docs/features/authentication.md) for more details.

### Logging & Tracing

Structured logging, distributed tracing, and health checks.

```typescript
import {
  createLoggingMiddleware,
  createTracingMiddleware,
  createHealthCheckMiddleware,
} from '@gati-framework/runtime';

// Request/response logging
app.use(createLoggingMiddleware({
  logQuery: true,
  skipPaths: ['/health'],
}), { path: '*', priority: 105 });

// Distributed tracing (W3C Trace Context)
app.use(createTracingMiddleware({
  serviceName: 'my-api',
  injectTraceContext: true,
}), { path: '*', priority: 110 });

// Health checks
app.use(createHealthCheckMiddleware({
  dependencies: [
    createDatabaseHealthCheck('postgres', checkDB, true),
  ],
}));
```

See [Observability Guide](../../docs/features/observability.md) for more details.

## Handler Example

```typescript
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  // Access modules
  const db = gctx.modules['database'];
  const user = await db.users.findById(req.params.id);
  
  // Lifecycle hooks
  lctx.lifecycle.onCleanup('db', async () => db.disconnect());
  
  // Response
  res.json({ user });
};
```

## Module Example

```typescript
import type { Module } from '@gati-framework/runtime';

export const module: Module = {
  name: 'database',
  async onInit(gctx) {
    return { users: { findById: async (id) => ({ id, name: 'User' }) } };
  },
  async onShutdown() { /* cleanup */ }
};
```

## Testing

```typescript
import { createGlobalContext, createLocalContext } from '@gati-framework/runtime';

const gctx = createGlobalContext({ handlers: [], modules: [] });
const lctx = createLocalContext('test-req', 'test-trace', 'test-client');

await handler(req, res, gctx, lctx);
```

## Configuration

```typescript
interface RuntimeConfig {
  handlers: HandlerManifest[];
  modules: ModuleManifest[];
  observability?: ObservabilityConfig;
  timescape?: TimescapeConfig;
}
```

## Benchmarking

```bash
cd benchmarks
pnpm bench              # Run all benchmarks
pnpm bench:baseline     # Save baseline
pnpm bench:compare      # Compare to baseline
```

See [BENCHMARKING_STRATEGY.md](./BENCHMARKING_STRATEGY.md) for details.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:coverage
```

## Related Packages

- [@gati-framework/core](../core) - Core types and configuration
- [@gati-framework/cli](../cli) - Development and deployment tools
- [@gati-framework/testing](../testing) - Test utilities and mocks
- [@gati-framework/playground](../playground) - Visual debugging

## Documentation

- [Handler Guide](./docs/HANDLER_GUIDE.md)
- [Module Guide](./docs/MODULE_GUIDE.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
