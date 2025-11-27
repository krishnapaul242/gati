import { describe, it, expect } from 'vitest';
import { simulateRuntime } from './simulate-runtime.js';
import type { Handler } from '@gati-framework/runtime';

describe('Integration Tests', () => {
  it('should handle full CRUD workflow', async () => {
    const users: any[] = [];

    const createUser: Handler = (req, res) => {
      const user = { id: String(users.length + 1), ...req.body };
      users.push(user);
      res.status(201).json({ user });
    };

    const getUser: Handler = (req, res) => {
      const user = users.find(u => u.id === req.params.id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      res.json({ user });
    };

    const runtime = simulateRuntime({
      handlers: { createUser, getUser },
      routes: [
        { path: '/users', handler: 'createUser', method: 'POST' },
        { path: '/users/[id]', handler: 'getUser', method: 'GET' }
      ]
    });

    const createRes = await runtime.request('POST', '/users', { name: 'Alice' });
    expect(createRes.status).toBe(201);

    const getRes = await runtime.request('GET', '/users/1');
    expect(getRes.status).toBe(200);
    expect(getRes.body.user.name).toBe('Alice');
  });

  it('should handle concurrent requests independently', async () => {
    const handler: Handler = async (req, res) => {
      await new Promise(r => setTimeout(r, 10));
      res.json({ id: req.params.id });
    };

    const runtime = simulateRuntime({
      handlers: { test: handler },
      routes: [{ path: '/test/[id]', handler: 'test' }]
    });

    const results = await Promise.all([
      runtime.request('GET', '/test/1'),
      runtime.request('GET', '/test/2'),
      runtime.request('GET', '/test/3')
    ]);

    expect(results[0].body.id).toBe('1');
    expect(results[1].body.id).toBe('2');
    expect(results[2].body.id).toBe('3');
  });

  it('should handle error with catch hooks', async () => {
    let errorCaught = false;

    const handler: Handler = () => {
      throw new Error('Test error');
    };

    const runtime = simulateRuntime({
      handlers: { failing: handler },
      hooks: {
        catch: [async () => { errorCaught = true; }]
      },
      routes: [{ path: '/fail', handler: 'failing' }]
    });

    const response = await runtime.request('GET', '/fail');

    expect(response.status).toBe(500);
    expect(errorCaught).toBe(true);
  });

  it('should work with multiple modules', async () => {
    const handler: Handler = async (req, res, gctx) => {
      const user = await gctx.modules.db.findUser(req.params.id);
      await gctx.modules.cache.set(`user:${user.id}`, user);
      const cached = await gctx.modules.cache.get(`user:${user.id}`);
      res.json({ user: cached });
    };

    const cache = new Map();

    const runtime = simulateRuntime({
      handlers: { getUser: handler },
      modules: {
        db: { findUser: async (id: string) => ({ id, name: 'Alice' }) },
        cache: {
          get: async (key: string) => cache.get(key),
          set: async (key: string, value: any) => { cache.set(key, value); }
        }
      },
      routes: [{ path: '/users/[id]', handler: 'getUser' }]
    });

    const response = await runtime.request('GET', '/users/123');

    expect(response.body.user).toEqual({ id: '123', name: 'Alice' });
  });

  it('should track metrics across multiple requests', async () => {
    const handler: Handler = async (req, res, gctx) => {
      await gctx.modules.db.query();
      res.json({ ok: true });
    };

    const runtime = simulateRuntime({
      handlers: { test: handler },
      modules: {
        db: { query: async () => [] }
      },
      hooks: {
        before: [async () => {}],
        after: [async () => {}]
      },
      routes: [{ path: '/test', handler: 'test' }]
    });

    await runtime.request('GET', '/test');
    await runtime.request('GET', '/test');
    await runtime.request('GET', '/test');

    const metrics = runtime.getMetrics();

    expect(metrics.requests.total).toBe(3);
    expect(metrics.hooks.executions).toBe(3);
    expect(metrics.modules.calls).toBe(3);
  });
});
