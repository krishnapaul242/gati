import { describe, it, expect } from 'vitest';
import { simulateRuntime } from './simulate-runtime.js';
import type { Handler } from '@gati-framework/runtime';

describe('simulateRuntime', () => {
  it('should execute basic request', async () => {
    const handler: Handler = (req, res) => {
      res.json({ message: 'Hello' });
    };

    const runtime = simulateRuntime({
      handlers: { hello: handler },
      routes: [{ path: '/hello', handler: 'hello' }]
    });

    const response = await runtime.request('GET', '/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello' });
  });

  it('should return 404 for unknown routes', async () => {
    const runtime = simulateRuntime({
      handlers: {},
      routes: []
    });

    const response = await runtime.request('GET', '/unknown');

    expect(response.status).toBe(404);
  });

  it('should pass path parameters to handler', async () => {
    const handler: Handler = (req, res) => {
      res.json({ userId: req.params.id });
    };

    const runtime = simulateRuntime({
      handlers: { getUser: handler },
      routes: [{ path: '/users/[id]', handler: 'getUser' }]
    });

    const response = await runtime.request('GET', '/users/123');

    expect(response.body).toEqual({ userId: '123' });
  });

  it('should provide module access', async () => {
    const handler: Handler = async (req, res, gctx) => {
      const user = await gctx.modules.db.findUser(req.params.id);
      res.json({ user });
    };

    const runtime = simulateRuntime({
      handlers: { getUser: handler },
      modules: {
        db: { findUser: async (id: string) => ({ id, name: 'Alice' }) }
      },
      routes: [{ path: '/users/[id]', handler: 'getUser' }]
    });

    const response = await runtime.request('GET', '/users/123');

    expect(response.body).toEqual({ user: { id: '123', name: 'Alice' } });
  });

  it('should execute hooks', async () => {
    const order: string[] = [];
    const handler: Handler = (req, res) => {
      order.push('handler');
      res.json({ ok: true });
    };

    const runtime = simulateRuntime({
      handlers: { test: handler },
      hooks: {
        before: [async () => { order.push('before'); }],
        after: [async () => { order.push('after'); }]
      },
      routes: [{ path: '/test', handler: 'test' }]
    });

    await runtime.request('GET', '/test');

    expect(order).toEqual(['before', 'handler', 'after']);
  });

  it('should handle errors', async () => {
    const handler: Handler = () => {
      throw new Error('Handler error');
    };

    const runtime = simulateRuntime({
      handlers: { failing: handler },
      routes: [{ path: '/fail', handler: 'failing' }]
    });

    const response = await runtime.request('GET', '/fail');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Handler error');
  });

  it('should collect metrics', async () => {
    const handler: Handler = (req, res) => {
      res.json({ ok: true });
    };

    const runtime = simulateRuntime({
      handlers: { test: handler },
      routes: [{ path: '/test', handler: 'test' }]
    });

    await runtime.request('GET', '/test');
    await runtime.request('GET', '/test');

    const metrics = runtime.getMetrics();

    expect(metrics.requests.total).toBe(2);
    expect(metrics.hooks.executions).toBe(2);
  });

  it('should cleanup on shutdown', async () => {
    const runtime = simulateRuntime({
      handlers: {},
      routes: []
    });

    await expect(runtime.shutdown()).resolves.toBeUndefined();
  });
});
