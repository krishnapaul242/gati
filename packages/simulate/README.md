# @gati-framework/simulate

Runtime simulation for testing Gati applications with full request lifecycle emulation.

## Installation

```bash
pnpm add -D @gati-framework/simulate
```

## Overview

The `@gati-framework/simulate` package provides in-process runtime simulation for integration testing of Gati applications. It emulates the complete request lifecycle including Route Manager, LCC (Local Context Controller), and Module RPC without requiring Kubernetes or external infrastructure.

### When to Use

- **Integration Testing**: Test full request flows with hooks and modules
- **End-to-End Testing**: Validate complete application behavior
- **Performance Testing**: Measure request handling with realistic scenarios

For unit testing individual handlers, use `@gati-framework/testing` instead.

## Quick Start

```typescript
import { simulateRuntime } from '@gati-framework/simulate';
import type { Handler } from '@gati-framework/runtime';

const getUser: Handler = async (req, res, gctx) => {
  const user = await gctx.modules.db.findUser(req.params.id);
  res.json({ user });
};

const runtime = simulateRuntime({
  handlers: { getUser },
  modules: {
    db: { findUser: async (id) => ({ id, name: 'Alice' }) }
  },
  routes: [{ path: '/users/[id]', handler: 'getUser', method: 'GET' }]
});

const response = await runtime.request('GET', '/users/123');
console.log(response.body); // { user: { id: '123', name: 'Alice' } }
```

## Features

- ✅ **In-process Route Manager** - Pattern matching with parameterized routes
- ✅ **LCC Hook Emulation** - Full lifecycle (before, after, catch, finally)
- ✅ **Module RPC Simulation** - Call tracking and latency simulation
- ✅ **Metrics Collection** - Request, hook, and module metrics
- ✅ **Concurrent Requests** - Independent execution contexts
- ✅ **Error Handling** - Catch hooks and error propagation

## API Reference

### simulateRuntime(config)

Creates a simulated runtime environment.

**Parameters:**
- `config: SimulationConfig` - Runtime configuration

**Returns:** `SimulatedRuntime`

#### SimulationConfig

```typescript
interface SimulationConfig {
  handlers: Record<string, Handler>;  // Handler functions by name
  modules?: Record<string, any>;      // Module implementations
  hooks?: HookConfig;                 // Lifecycle hooks
  routes: RouteDefinition[];          // Route definitions
  hookTimeout?: number;               // Hook timeout in ms (default: 5000)
  moduleLatency?: number;             // Simulated module latency in ms (default: 0)
}
```

#### RouteDefinition

```typescript
interface RouteDefinition {
  path: string;      // Route pattern (e.g., '/users/[id]')
  handler: string;   // Handler name
  method?: string;   // HTTP method (optional, matches all if omitted)
}
```

#### HookConfig

```typescript
interface HookConfig {
  before?: Array<(req, res) => void | Promise<void>>;   // Before handler
  after?: Array<(req, res) => void | Promise<void>>;    // After handler
  catch?: Array<(error: Error) => void | Promise<void>>; // On error
  finally?: Array<() => void | Promise<void>>;          // Always runs
}
```

### SimulatedRuntime

#### request(method, path, body?)

Executes a simulated request.

**Parameters:**
- `method: string` - HTTP method (GET, POST, etc.)
- `path: string` - Request path
- `body?: any` - Request body (optional)

**Returns:** `Promise<SimulatedResponse>`

```typescript
interface SimulatedResponse {
  status: number;                      // HTTP status code
  body: any;                           // Response body
  headers?: Record<string, string>;    // Response headers
}
```

#### getMetrics()

Returns collected metrics.

**Returns:** `RuntimeMetrics`

```typescript
interface RuntimeMetrics {
  requests: {
    total: number;
    byRoute: Record<string, number>;
  };
  hooks: {
    executions: number;
    timeouts: number;
    errors: number;
  };
  modules: {
    calls: number;
    errors: number;
    totalLatency: number;
  };
}
```

#### shutdown()

Cleans up resources.

**Returns:** `Promise<void>`

## Usage Examples

### Basic Request

```typescript
const handler: Handler = (req, res) => {
  res.json({ message: 'Hello, World!' });
};

const runtime = simulateRuntime({
  handlers: { hello: handler },
  routes: [{ path: '/hello', handler: 'hello' }]
});

const response = await runtime.request('GET', '/hello');
// { status: 200, body: { message: 'Hello, World!' } }
```

### With Path Parameters

```typescript
const handler: Handler = (req, res) => {
  res.json({ userId: req.params.id, postId: req.params.postId });
};

const runtime = simulateRuntime({
  handlers: { getPost: handler },
  routes: [{ path: '/users/[id]/posts/[postId]', handler: 'getPost' }]
});

const response = await runtime.request('GET', '/users/123/posts/456');
// { status: 200, body: { userId: '123', postId: '456' } }
```

### With Modules

```typescript
const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules.db.findUser(req.params.id);
  await gctx.modules.logger.log('User fetched', user);
  res.json({ user });
};

const runtime = simulateRuntime({
  handlers: { getUser: handler },
  modules: {
    db: {
      findUser: async (id: string) => ({ id, name: 'Alice' })
    },
    logger: {
      log: async (msg: string, data: any) => console.log(msg, data)
    }
  },
  routes: [{ path: '/users/[id]', handler: 'getUser' }]
});

const response = await runtime.request('GET', '/users/123');
```

### With Hooks

```typescript
const handler: Handler = (req, res) => {
  res.json({ data: 'response' });
};

const runtime = simulateRuntime({
  handlers: { test: handler },
  hooks: {
    before: [
      async (req) => { console.log('Before:', req.path); }
    ],
    after: [
      async (req, res) => { console.log('After:', res.statusCode); }
    ],
    catch: [
      async (error) => { console.error('Error:', error.message); }
    ],
    finally: [
      async () => { console.log('Cleanup'); }
    ]
  },
  routes: [{ path: '/test', handler: 'test' }]
});

const response = await runtime.request('GET', '/test');
```

### Error Handling

```typescript
const handler: Handler = () => {
  throw new Error('Something went wrong');
};

let errorCaught = false;

const runtime = simulateRuntime({
  handlers: { failing: handler },
  hooks: {
    catch: [async (error) => { errorCaught = true; }]
  },
  routes: [{ path: '/fail', handler: 'failing' }]
});

const response = await runtime.request('GET', '/fail');
// { status: 500, body: { error: 'Something went wrong' } }
// errorCaught === true
```

### Collecting Metrics

```typescript
const runtime = simulateRuntime({
  handlers: { test: handler },
  modules: { db: { query: async () => [] } },
  hooks: { before: [async () => {}] },
  routes: [{ path: '/test', handler: 'test' }]
});

await runtime.request('GET', '/test');
await runtime.request('GET', '/test');

const metrics = runtime.getMetrics();
console.log(metrics);
// {
//   requests: { total: 2, byRoute: { '/test': 2 } },
//   hooks: { executions: 2, timeouts: 0, errors: 0 },
//   modules: { calls: 2, errors: 0, totalLatency: 15 }
// }
```

### Simulating Latency

```typescript
const runtime = simulateRuntime({
  handlers: { test: handler },
  modules: { db: { query: async () => [] } },
  routes: [{ path: '/test', handler: 'test' }],
  moduleLatency: 100  // Simulate 100ms network latency
});

const start = Date.now();
await runtime.request('GET', '/test');
const duration = Date.now() - start;
// duration >= 100ms
```

## Comparison with @gati-framework/testing

| Feature | @gati-framework/testing | @gati-framework/simulate |
|---------|------------------------|-------------------------|
| **Purpose** | Unit testing handlers | Integration testing |
| **Scope** | Single handler | Full request lifecycle |
| **Route Manager** | No | Yes |
| **Hooks** | Manual setup | Automatic execution |
| **Modules** | Mocks/stubs | Full emulation |
| **Metrics** | No | Yes |
| **Use Case** | Fast unit tests | E2E integration tests |

## Best Practices

1. **Use for Integration Tests**: Simulate full request flows with multiple components
2. **Mock External Services**: Provide test implementations for databases, APIs, etc.
3. **Test Error Paths**: Verify catch hooks and error handling
4. **Collect Metrics**: Use metrics to validate performance characteristics
5. **Test Concurrency**: Verify independent request handling

## License

MIT © Krishna Paul
