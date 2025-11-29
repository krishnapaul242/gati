# Testing Guide

Comprehensive testing strategies for Gati applications using `@gati-framework/testing`.

## Overview

Gati provides a complete testing toolkit for unit tests, integration tests, and end-to-end tests with built-in support for mocking contexts, modules, and requests.

## Installation

```bash
pnpm add -D @gati-framework/testing vitest
```

## Test Harness

### Creating Test App

```typescript
import { createTestApp } from '@gati-framework/testing';
import { describe, it, expect } from 'vitest';

describe('User API', () => {
  const app = createTestApp();
  
  app.get('/users/:id', async (req, res, gctx, lctx) => {
    const user = await gctx.modules['db'].users.findById(req.params.id);
    res.json({ user });
  });
  
  it('should get user by id', async () => {
    const response = await app.request('/users/123');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });
});
```

## Mocking Contexts

### Fake Global Context

```typescript
import { createFakeGlobalContext } from '@gati-framework/testing';

const gctx = createFakeGlobalContext({
  modules: {
    db: {
      users: {
        findById: vi.fn().mockResolvedValue({ id: '123', name: 'John' })
      }
    }
  },
  config: {
    env: 'test',
    apiKey: 'test-key'
  }
});
```

### Fake Local Context

```typescript
import { createFakeLocalContext } from '@gati-framework/testing';

const lctx = createFakeLocalContext({
  requestId: 'test-req-123',
  startTime: Date.now(),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
});
```

## Request Builders

### Building Test Requests

```typescript
import { RequestBuilder } from '@gati-framework/testing';

const req = new RequestBuilder()
  .method('POST')
  .path('/users')
  .body({ email: 'test@example.com', name: 'Test User' })
  .header('Authorization', 'Bearer token123')
  .query({ include: 'profile' })
  .build();
```

### Common Request Patterns

```typescript
// GET with query params
const getReq = new RequestBuilder()
  .get('/users')
  .query({ page: '1', limit: '10' })
  .build();

// POST with JSON body
const postReq = new RequestBuilder()
  .post('/users')
  .json({ email: 'test@example.com' })
  .build();

// Authenticated request
const authReq = new RequestBuilder()
  .get('/profile')
  .auth('Bearer token123')
  .build();
```

## Response Assertions

### Testing Response Status

```typescript
import { expect } from 'vitest';

it('should return 200 OK', async () => {
  const response = await app.request('/health');
  expect(response.status).toBe(200);
});

it('should return 404 for missing user', async () => {
  const response = await app.request('/users/999');
  expect(response.status).toBe(404);
});
```

### Testing Response Body

```typescript
it('should return user data', async () => {
  const response = await app.request('/users/123');
  
  expect(response.body).toEqual({
    user: {
      id: '123',
      name: 'John',
      email: 'john@example.com'
    }
  });
});

it('should return error message', async () => {
  const response = await app.request('/users/invalid');
  
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toBe('User not found');
});
```

### Testing Headers

```typescript
it('should set correct headers', async () => {
  const response = await app.request('/api/data');
  
  expect(response.headers['content-type']).toBe('application/json');
  expect(response.headers['x-api-version']).toBe('1.0');
});
```

## Module Mocking

### Mocking Database Module

```typescript
import { vi } from 'vitest';

const mockDb = {
  users: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
};

const app = createTestApp({
  modules: { db: mockDb }
});

it('should call database', async () => {
  mockDb.users.findById.mockResolvedValue({ id: '123', name: 'John' });
  
  await app.request('/users/123');
  
  expect(mockDb.users.findById).toHaveBeenCalledWith('123');
});
```

### Mocking External APIs

```typescript
const mockHttp = {
  get: vi.fn(),
  post: vi.fn()
};

it('should call external API', async () => {
  mockHttp.get.mockResolvedValue({ data: { weather: 'sunny' } });
  
  const app = createTestApp({
    modules: { http: mockHttp }
  });
  
  await app.request('/weather');
  
  expect(mockHttp.get).toHaveBeenCalledWith('https://api.weather.com');
});
```

## Integration Tests

### Testing Handler with Real Modules

```typescript
import { createApp } from '@gati-framework/runtime';
import { createTestDatabase } from './test-helpers';

describe('User CRUD Integration', () => {
  let app;
  let db;
  
  beforeAll(async () => {
    db = await createTestDatabase();
    app = createApp({ modules: { db } });
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('should create and retrieve user', async () => {
    // Create user
    const createRes = await app.request('/users', {
      method: 'POST',
      body: { email: 'test@example.com', name: 'Test' }
    });
    
    expect(createRes.status).toBe(201);
    const userId = createRes.body.user.id;
    
    // Retrieve user
    const getRes = await app.request(`/users/${userId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.user.email).toBe('test@example.com');
  });
});
```

## Testing Middleware

```typescript
import { createTestApp } from '@gati-framework/testing';

describe('Auth Middleware', () => {
  const app = createTestApp();
  
  const authMiddleware = async (req, res, gctx, lctx, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await next();
  };
  
  app.use(authMiddleware);
  app.get('/protected', (req, res) => res.json({ data: 'secret' }));
  
  it('should block unauthenticated requests', async () => {
    const response = await app.request('/protected');
    expect(response.status).toBe(401);
  });
  
  it('should allow authenticated requests', async () => {
    const response = await app.request('/protected', {
      headers: { Authorization: 'Bearer token' }
    });
    expect(response.status).toBe(200);
  });
});
```

## Testing Error Handling

```typescript
it('should handle validation errors', async () => {
  const response = await app.request('/users', {
    method: 'POST',
    body: { email: 'invalid' } // Missing required fields
  });
  
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toContain('Validation failed');
});

it('should handle server errors', async () => {
  mockDb.users.findById.mockRejectedValue(new Error('Database error'));
  
  const response = await app.request('/users/123');
  
  expect(response.status).toBe(500);
  expect(response.body.error).toBe('Internal server error');
});
```

## Snapshot Testing

```typescript
it('should match response snapshot', async () => {
  const response = await app.request('/users/123');
  expect(response.body).toMatchSnapshot();
});
```

## Performance Testing

```typescript
import { performance } from 'perf_hooks';

it('should respond within 100ms', async () => {
  const start = performance.now();
  await app.request('/health');
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(100);
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

### 2. Clean Up After Tests

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
it('should handle empty response', async () => {
  mockDb.users.findById.mockResolvedValue(null);
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

### 4. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return 404 when user does not exist', async () => {});

// ❌ Bad
it('test user endpoint', async () => {});
```

## Related

- [Benchmarking Guide](./benchmarking.md) - Performance testing
- [Error Handling](./error-handling.md) - Error patterns
- [Handlers Guide](./handlers.md) - Writing handlers
