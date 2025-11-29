import { describe, it, expect } from 'vitest';
import { createTestApp } from './test-harness.js';

describe('TestHarness', () => {
  it('should create test app', () => {
    const app = createTestApp();
    expect(app).toBeDefined();
    expect(app.request).toBeInstanceOf(Function);
  });

  it('should handle GET requests', async () => {
    const app = createTestApp();
    app.get('/test', (req, res) => {
      res.json({ message: 'hello' });
    });

    const response = await app.request('/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'hello' });
  });

  it('should handle POST requests', async () => {
    const app = createTestApp();
    app.post('/users', (req, res) => {
      res.status(201).json({ id: '123', ...req.body });
    });

    const response = await app.request('/users', {
      method: 'POST',
      body: { name: 'John' }
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: '123', name: 'John' });
  });

  it('should return 404 for unknown routes', async () => {
    const app = createTestApp();
    const response = await app.request('/unknown');
    expect(response.status).toBe(404);
  });

  it('should handle middleware', async () => {
    const app = createTestApp();
    
    app.use((req, res, gctx, lctx, next) => {
      if (!req.headers.authorization) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    });

    app.get('/protected', (req, res) => {
      res.json({ data: 'secret' });
    });

    const unauthorized = await app.request('/protected');
    expect(unauthorized.status).toBe(401);

    const authorized = await app.request('/protected', {
      headers: { authorization: 'Bearer token' }
    });
    expect(authorized.status).toBe(200);
  });

  it('should provide modules from options', async () => {
    const mockDb = {
      users: {
        findById: async (id: string) => ({ id, name: 'John' })
      }
    };

    const app = createTestApp({ modules: { db: mockDb } });
    app.get('/users/123', async (req, res, gctx) => {
      const user = await gctx.modules['db'].users.findById('123');
      res.json({ user });
    });

    const response = await app.request('/users/123');
    expect(response.body.user).toEqual({ id: '123', name: 'John' });
  });
});
