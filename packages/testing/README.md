# @gati-framework/testing

Testing utilities for Gati handlers with fake contexts and module mocks.

## Installation

```bash
pnpm add -D @gati-framework/testing
```

## Quick Start

```typescript
import { testHandler, createMockModule } from '@gati-framework/testing';
import { getUserHandler } from './handlers/users';

const mockDb = createMockModule({
  findUser: async (id: string) => ({ id, name: 'John' }),
});

const result = await testHandler(
  getUserHandler,
  { method: 'GET', path: '/users/123', params: { id: '123' } },
  { db: mockDb.module }
);

expect(result.response.statusCode).toBe(200);
expect(mockDb.calls.findUser).toHaveLength(1);
```

## Core Concepts

### Test Harness

The test harness executes handlers with fake contexts and captures lifecycle events.

### Module Mocks

Mock modules track method calls and provide controlled responses.

### Context Builders

Builders create fake LocalContext and GlobalContext with custom properties.

## API Reference

### testHandler(handler, request?, modules?)

Execute a handler with minimal setup.

```typescript
const result = await testHandler(
  myHandler,
  { method: 'POST', path: '/users', body: { name: 'John' } },
  { db: mockDb }
);
```

**Returns**: `Promise<TestResult>`

### createTestHarness(options?)

Create a test harness for multiple handler executions.

```typescript
const harness = createTestHarness({
  modules: { db: mockDb, cache: mockCache },
  config: { apiKey: 'test' },
});

const result = await harness.executeHandler(myHandler, {
  request: { method: 'GET', path: '/test' },
});

await harness.cleanup();
```

**Options**:
- `modules` - Module instances
- `config` - Configuration object

**Methods**:
- `executeHandler(handler, options?)` - Execute handler
- `getLocalContext()` - Get current LocalContext
- `getGlobalContext()` - Get GlobalContext
- `cleanup()` - Clean up resources

### createMockModule(methods)

Create a mock module with automatic call tracking.

```typescript
const mockDb = createMockModule({
  findUser: async (id: string) => ({ id, name: 'Test' }),
  saveUser: async (user: User) => user,
});

// Use in tests
await mockDb.module.findUser('123');

// Check calls
expect(mockDb.calls.findUser).toHaveLength(1);
expect(mockDb.calls.findUser[0].args).toEqual(['123']);
expect(mockDb.calls.findUser[0].result).toEqual({ id: '123', name: 'Test' });

// Reset
mockDb.reset();
```

**Returns**: `MockModule<T>`

**Properties**:
- `module` - The mocked module
- `calls` - Call records per method
- `reset()` - Clear call history

### createStubModule(stubs)

Create a simple stub module with predefined values.

```typescript
const stubCache = createStubModule({
  get: () => 'cached-value',
  set: () => true,
});
```

### createFakeLocalContext(options?)

Create a fake LocalContext with test defaults.

```typescript
const lctx = createFakeLocalContext({
  requestId: 'test-123',
  state: { userId: '456' },
  meta: { method: 'POST', path: '/api/users' },
});
```

**Options**:
- `requestId` - Custom request ID
- `traceId` - Custom trace ID
- `clientId` - Custom client ID
- `state` - Initial state
- `meta` - Metadata overrides

### FakeLocalContextBuilder

Builder for creating LocalContext with fluent API.

```typescript
const lctx = new FakeLocalContextBuilder()
  .withRequestId('test-123')
  .withState({ count: 0 })
  .withMetadata({ method: 'POST' })
  .build();
```

### createFakeGlobalContext(options?)

Create a fake GlobalContext with test defaults.

```typescript
const gctx = createFakeGlobalContext({
  modules: { db: mockDb },
  config: { env: 'test' },
  instanceId: 'test-instance',
});
```

**Options**:
- `modules` - Module instances
- `config` - Configuration
- `instanceId` - Instance ID
- `region` - Region name

### FakeGlobalContextBuilder

Builder for creating GlobalContext with fluent API.

```typescript
const gctx = new FakeGlobalContextBuilder()
  .withModule('db', mockDb)
  .withConfig({ apiKey: 'test' })
  .withRegion('us-east-1')
  .build();
```

### Helper Functions

#### createTestRequest(options?)

Create a test request with defaults.

```typescript
const req = createTestRequest({
  method: 'POST',
  path: '/users',
  body: { name: 'John' },
});
```

#### createTestResponse()

Create a test response.

```typescript
const res = createTestResponse();
res.status(201);
res.json({ id: '123' });
```

#### assertStatus(response, expected)

Assert response status code.

```typescript
assertStatus(result.response, 200);
```

#### assertBody(response, expected)

Assert response body.

```typescript
assertBody(result.response, { id: '123', name: 'John' });
```

## Examples

### Basic Handler Test

```typescript
import { testHandler } from '@gati-framework/testing';

it('should return user', async () => {
  const result = await testHandler(getUserHandler, {
    method: 'GET',
    path: '/users/123',
    params: { id: '123' },
  });
  
  expect(result.response.statusCode).toBe(200);
});
```

### Testing with Modules

```typescript
import { testHandler, createMockModule } from '@gati-framework/testing';

it('should fetch from database', async () => {
  const mockDb = createMockModule({
    findUser: async (id: string) => ({ id, name: 'John' }),
  });
  
  const result = await testHandler(
    getUserHandler,
    { params: { id: '123' } },
    { db: mockDb.module }
  );
  
  expect(mockDb.calls.findUser).toHaveLength(1);
  expect(mockDb.calls.findUser[0].args).toEqual(['123']);
});
```

### Testing Error Handling

```typescript
import { testHandler, createMockModule } from '@gati-framework/testing';

it('should handle database errors', async () => {
  const mockDb = createMockModule({
    findUser: async () => {
      throw new Error('Database error');
    },
  });
  
  const result = await testHandler(
    getUserHandler,
    { params: { id: '123' } },
    { db: mockDb.module }
  );
  
  expect(result.error).toBeDefined();
  expect(result.response.statusCode).toBe(500);
});
```

### Using Test Harness

```typescript
import { createTestHarness, createMockModule } from '@gati-framework/testing';

const mockDb = createMockModule({
  findUser: async (id: string) => ({ id, name: 'John' }),
});

const harness = createTestHarness({
  modules: { db: mockDb.module },
});

const result1 = await harness.executeHandler(handler1, {
  request: { path: '/test1' },
});

const result2 = await harness.executeHandler(handler2, {
  request: { path: '/test2' },
});

await harness.cleanup();
```

### Using Builders

```typescript
import {
  FakeLocalContextBuilder,
  FakeGlobalContextBuilder,
} from '@gati-framework/testing';

const lctx = new FakeLocalContextBuilder()
  .withRequestId('test-123')
  .withState({ authenticated: true })
  .build();

const gctx = new FakeGlobalContextBuilder()
  .withModule('db', mockDb)
  .withConfig({ env: 'test' })
  .build();
```

## Best Practices

### 1. Use testHandler for Simple Tests

```typescript
// Good - minimal setup
const result = await testHandler(myHandler, { path: '/test' });

// Avoid - unnecessary complexity
const harness = createTestHarness({});
const result = await harness.executeHandler(myHandler, ...);
await harness.cleanup();
```

### 2. Reset Mocks Between Tests

```typescript
const mockDb = createMockModule({ ... });

afterEach(() => {
  mockDb.reset();
});
```

### 3. Use Assertion Helpers

```typescript
// Good - clear intent
assertStatus(result.response, 200);
assertBody(result.response, { id: '123' });

// Avoid - verbose
expect(result.response.statusCode).toBe(200);
expect(result.response.body).toEqual({ id: '123' });
```

### 4. Test Error Scenarios

```typescript
const mockDb = createMockModule({
  findUser: async () => { throw new Error('Not found'); },
});

const result = await testHandler(handler, {}, { db: mockDb.module });

expect(result.error).toBeDefined();
expect(mockDb.calls.findUser[0].error).toBeDefined();
```

### 5. Verify Module Calls

```typescript
const mockDb = createMockModule({ ... });

await testHandler(handler, {}, { db: mockDb.module });

expect(mockDb.calls.findUser).toHaveLength(1);
expect(mockDb.calls.findUser[0].args).toEqual(['123']);
expect(mockDb.calls.findUser[0].result).toBeDefined();
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
const mockDb = createMockModule({
  findUser: async (id: string) => ({ id, name: 'Test' }),
});

// Type-safe
mockDb.module.findUser('123'); // ✓
mockDb.module.findUser(123); // ✗ Type error

// Call tracking is typed
mockDb.calls.findUser[0].args; // string[]
mockDb.calls.findUser[0].result; // { id: string; name: string }
```

## License

MIT
