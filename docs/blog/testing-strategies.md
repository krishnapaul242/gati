---
title: "Testing Strategies for Gati Applications"
date: 2025-11-22
author: Krishna Paul
tags: [testing, developer-experience, best-practices]
---

# Testing Strategies for Gati Applications

Comprehensive testing with `@gati-framework/testing`.

## Test Pyramid

```
     E2E Tests (10%)
    ─────────────
   Integration Tests (30%)
  ─────────────────────────
 Unit Tests (60%)
─────────────────────────────
```

## Unit Testing

### Handler Tests

```typescript
import { createTestApp } from '@gati-framework/testing';

describe('User API', () => {
  const app = createTestApp();
  
  app.get('/users/:id', async (req, res, gctx) => {
    const user = await gctx.modules['db'].users.findById(req.params.id);
    res.json({ user });
  });
  
  it('should get user by id', async () => {
    const response = await app.request('/users/123');
    expect(response.status).toBe(200);
  });
});
```

### Module Mocking

```typescript
const mockDb = {
  users: {
    findById: vi.fn().mockResolvedValue({ id: '123', name: 'John' })
  }
};

const app = createTestApp({ modules: { db: mockDb } });
```

## Integration Testing

### Real Database

```typescript
describe('User CRUD', () => {
  let app, db;
  
  beforeAll(async () => {
    db = await createTestDatabase();
    app = createApp({ modules: { db } });
  });
  
  it('should create and retrieve user', async () => {
    const createRes = await app.request('/users', {
      method: 'POST',
      body: { email: 'test@example.com' }
    });
    
    const userId = createRes.body.user.id;
    const getRes = await app.request(`/users/${userId}`);
    
    expect(getRes.body.user.email).toBe('test@example.com');
  });
});
```

## E2E Testing

### Full Stack

```typescript
describe('E2E: User Registration Flow', () => {
  it('should complete registration', async () => {
    // 1. Register
    const registerRes = await fetch('http://localhost:3000/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'pass123' })
    });
    
    // 2. Verify email (mock)
    await verifyEmail(registerRes.body.userId);
    
    // 3. Login
    const loginRes = await fetch('http://localhost:3000/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'pass123' })
    });
    
    expect(loginRes.status).toBe(200);
  });
});
```

## Best Practices

### 1. Use Test Fixtures

```typescript
// test/fixtures/users.ts
export const testUsers = {
  john: { id: '1', name: 'John', email: 'john@example.com' },
  jane: { id: '2', name: 'Jane', email: 'jane@example.com' }
};
```

### 2. Clean Up

```typescript
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await app.close();
  await db.close();
});
```

### 3. Test Edge Cases

```typescript
it('should handle missing user', async () => {
  const response = await app.request('/users/999');
  expect(response.status).toBe(404);
});

it('should handle malformed input', async () => {
  const response = await app.request('/users', {
    method: 'POST',
    body: 'not-json'
  });
  expect(response.status).toBe(400);
});
```

## Performance Testing

```typescript
it('should respond within 100ms', async () => {
  const start = performance.now();
  await app.request('/health');
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(100);
});
```

## Coverage Goals

- **Unit tests**: >80% coverage
- **Integration tests**: Critical paths
- **E2E tests**: User journeys

## Related

- [Testing Guide](/guides/testing)
- [Benchmarking Guide](/guides/benchmarking)
- [Error Handling](/guides/error-handling)
