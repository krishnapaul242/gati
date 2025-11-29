# @gati-framework/testing

> Testing utilities and mocks for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/testing.svg)](https://www.npmjs.com/package/@gati-framework/testing)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Test harness, fake contexts, module mocks, and helpers for testing Gati handlers and modules.

## Installation

```bash
npm install --save-dev @gati-framework/testing
```

## Quick Start

```typescript
import { createTestHarness } from '@gati-framework/testing';
import { handler } from './handlers/users';

const harness = createTestHarness();

const result = await harness.executeHandler(handler, {
  method: 'GET',
  path: '/users/123',
  params: { id: '123' }
});

expect(result.status).toBe(200);
expect(result.body).toEqual({ id: '123', name: 'User' });
```

## Features

- ✅ **Test Harness** - Execute handlers in isolation
- ✅ **Fake Contexts** - Mock global and local contexts
- ✅ **Module Mocks** - Mock module dependencies
- ✅ **Request Builders** - Fluent API for requests
- ✅ **Response Assertions** - Helper assertions
- ✅ **Lifecycle Testing** - Test hooks and cleanup

## Test Harness

Execute handlers with full context simulation.

```typescript
import { createTestHarness } from '@gati-framework/testing';

const harness = createTestHarness({
  modules: {
    database: {
      users: {
        findById: async (id) => ({ id, name: 'Test User' })
      }
    }
  }
});

const result = await harness.executeHandler(handler, {
  method: 'GET',
  path: '/users/123',
  params: { id: '123' }
});
```

### With Lifecycle Hooks

```typescript
const harness = createTestHarness();

const result = await harness.executeHandler(handler, {
  method: 'POST',
  path: '/users',
  body: { name: 'New User' }
});

// Check lifecycle hooks were called
expect(harness.hooks.onInit).toHaveBeenCalled();
expect(harness.hooks.onCleanup).toHaveBeenCalled();
```

## Fake Contexts

### Fake Global Context

```typescript
import { createFakeGlobalContext } from '@gati-framework/testing';

const gctx = createFakeGlobalContext({
  modules: {
    database: mockDatabase,
    logger: mockLogger
  },
  config: {
    name: 'test-app',
    version: '1.0.0'
  }
});

await handler(req, res, gctx, lctx);
```

### Fake Local Context

```typescript
import { createFakeLocalContext } from '@gati-framework/testing';

const lctx = createFakeLocalContext({
  requestId: 'test-req-123',
  traceId: 'test-trace-456',
  clientId: 'test-client-789'
});

// Test lifecycle hooks
lctx.lifecycle.onCleanup('test', async () => {
  console.log('Cleanup called');
});

await lctx.lifecycle.executeCleanup();
```

## Module Mocks

### Mock Database Module

```typescript
import { createModuleMock } from '@gati-framework/testing';

const mockDatabase = createModuleMock({
  users: {
    findById: vi.fn(async (id) => ({ id, name: 'Test User' })),
    create: vi.fn(async (data) => ({ id: '123', ...data })),
    update: vi.fn(async (id, data) => ({ id, ...data })),
    delete: vi.fn(async (id) => true)
  }
});

// Use in tests
const user = await mockDatabase.users.findById('123');
expect(mockDatabase.users.findById).toHaveBeenCalledWith('123');
```

### Mock Logger Module

```typescript
const mockLogger = createModuleMock({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
});

// Test logging
await handler(req, res, gctx, lctx);
expect(mockLogger.info).toHaveBeenCalledWith('User fetched', { id: '123' });
```

## Request Builders

Fluent API for building test requests.

```typescript
import { RequestBuilder } from '@gati-framework/testing';

const req = new RequestBuilder()
  .method('POST')
  .path('/users')
  .header('Content-Type', 'application/json')
  .body({ name: 'New User', email: 'user@example.com' })
  .query({ include: 'profile' })
  .build();

const result = await harness.executeHandler(handler, req);
```

### With Authentication

```typescript
const req = new RequestBuilder()
  .method('GET')
  .path('/users/me')
  .auth('Bearer', 'token-123')
  .build();
```

### With Params

```typescript
const req = new RequestBuilder()
  .method('GET')
  .path('/users/:id')
  .params({ id: '123' })
  .build();
```

## Response Assertions

Helper assertions for responses.

```typescript
import { assertResponse } from '@gati-framework/testing';

const result = await harness.executeHandler(handler, req);

// Status assertions
assertResponse(result).hasStatus(200);
assertResponse(result).isOk();
assertResponse(result).isCreated();
assertResponse(result).isNotFound();

// Body assertions
assertResponse(result).hasBody({ id: '123' });
assertResponse(result).bodyContains({ name: 'User' });
assertResponse(result).bodyMatches(/User/);

// Header assertions
assertResponse(result).hasHeader('Content-Type', 'application/json');
```

## Integration Testing

Test full request pipeline.

```typescript
import { createTestHarness } from '@gati-framework/testing';
import { createE2EIntegration } from '@gati-framework/runtime';

describe('User API', () => {
  let harness;

  beforeEach(() => {
    harness = createTestHarness({
      modules: { database: mockDatabase }
    });
  });

  it('creates user', async () => {
    const result = await harness.executeHandler(createUserHandler, {
      method: 'POST',
      path: '/users',
      body: { name: 'New User' }
    });

    expect(result.status).toBe(201);
    expect(result.body).toHaveProperty('id');
  });

  it('fetches user', async () => {
    const result = await harness.executeHandler(getUserHandler, {
      method: 'GET',
      path: '/users/123',
      params: { id: '123' }
    });

    expect(result.status).toBe(200);
    expect(result.body.name).toBe('Test User');
  });
});
```

## Lifecycle Testing

Test lifecycle hooks and cleanup.

```typescript
import { createFakeLocalContext } from '@gati-framework/testing';

describe('Lifecycle', () => {
  it('executes cleanup hooks', async () => {
    const lctx = createFakeLocalContext();
    const cleanup = vi.fn();

    lctx.lifecycle.onCleanup('test', cleanup);
    await lctx.lifecycle.executeCleanup();

    expect(cleanup).toHaveBeenCalled();
  });

  it('handles errors in hooks', async () => {
    const lctx = createFakeLocalContext();
    const errorHandler = vi.fn();

    lctx.lifecycle.onError('test', errorHandler);
    lctx.lifecycle.emitError(new Error('Test error'));

    expect(errorHandler).toHaveBeenCalled();
  });
});
```

## Async Testing

Test async handlers and modules.

```typescript
describe('Async Operations', () => {
  it('handles async database calls', async () => {
    const mockDb = createModuleMock({
      users: {
        findById: vi.fn(async (id) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { id, name: 'User' };
        })
      }
    });

    const harness = createTestHarness({ modules: { database: mockDb } });
    const result = await harness.executeHandler(handler, {
      method: 'GET',
      path: '/users/123',
      params: { id: '123' }
    });

    expect(result.status).toBe(200);
  });
});
```

## Error Testing

Test error handling.

```typescript
describe('Error Handling', () => {
  it('handles not found', async () => {
    const mockDb = createModuleMock({
      users: {
        findById: vi.fn(async () => null)
      }
    });

    const harness = createTestHarness({ modules: { database: mockDb } });
    const result = await harness.executeHandler(handler, {
      method: 'GET',
      path: '/users/999',
      params: { id: '999' }
    });

    expect(result.status).toBe(404);
  });

  it('handles errors', async () => {
    const mockDb = createModuleMock({
      users: {
        findById: vi.fn(async () => {
          throw new Error('Database error');
        })
      }
    });

    const harness = createTestHarness({ modules: { database: mockDb } });
    const result = await harness.executeHandler(handler, {
      method: 'GET',
      path: '/users/123',
      params: { id: '123' }
    });

    expect(result.status).toBe(500);
  });
});
```

## Best Practices

### 1. Use Test Harness

```typescript
// ✅ Good
const harness = createTestHarness();
const result = await harness.executeHandler(handler, req);

// ❌ Bad - manual setup
const gctx = createGlobalContext(...);
const lctx = createLocalContext(...);
await handler(req, res, gctx, lctx);
```

### 2. Mock External Dependencies

```typescript
// ✅ Good
const mockDb = createModuleMock({ users: { findById: vi.fn() } });

// ❌ Bad - real database
const db = new Database({ host: 'localhost' });
```

### 3. Use Request Builders

```typescript
// ✅ Good
const req = new RequestBuilder().method('GET').path('/users/123').build();

// ❌ Bad - manual object
const req = { method: 'GET', path: '/users/123', headers: {}, ... };
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:watch
```

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/core](../core) - Core types
- [@gati-framework/playground](../playground) - Visual debugging

## Documentation

- [Testing Guide](https://krishnapaul242.github.io/gati/guides/testing)
- [Testing Strategies](https://krishnapaul242.github.io/gati/blog/testing-strategies)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
