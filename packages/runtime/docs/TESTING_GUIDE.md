# Testing Guide

## Unit Testing Handlers

```typescript
import { testHandler, createTestRequest, createTestResponse } from '@gati-framework/testing';

test('handler returns user', async () => {
  const req = createTestRequest({ params: { id: '123' } });
  const res = createTestResponse();
  
  await testHandler(myHandler, req, res);
  
  expect(res.getStatus()).toBe(200);
  expect(res.getBody()).toEqual({ user: { id: '123' } });
});
```

## Testing with Modules

```typescript
import { createTestHarness, createMockModule } from '@gati-framework/testing';

test('handler uses database', async () => {
  const mockDb = createMockModule({
    getUser: async (id: string) => ({ id, name: 'Test' }),
  });
  
  const harness = createTestHarness();
  const result = await harness.executeHandler(myHandler, {
    request: { params: { id: '123' } },
    modules: { db: mockDb.module },
  });
  
  expect(mockDb.calls.getUser).toHaveLength(1);
  expect(result.response.body).toEqual({ user: { id: '123', name: 'Test' } });
});
```

## Testing Error Handling

```typescript
test('handler returns 404 for missing user', async () => {
  const mockDb = createMockModule({
    getUser: async () => null,
  });
  
  const harness = createTestHarness();
  const result = await harness.executeHandler(myHandler, {
    modules: { db: mockDb.module },
  });
  
  expect(result.response.status).toBe(404);
});
```

## Integration Testing

```typescript
import { simulateRuntime } from '@gati-framework/simulate';

test('full request flow', async () => {
  const result = await simulateRuntime({
    handler: myHandler,
    request: { method: 'GET', path: '/users/123' },
    modules: { db: mockDb },
  });
  
  expect(result.status).toBe(200);
});
```
