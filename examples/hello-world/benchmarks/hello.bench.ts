import { bench, describe } from 'vitest';
import { RouteManager } from '../../../packages/runtime/src/route-manager.js';
import { createLocalContext } from '../../../packages/runtime/src/local-context.js';
import { createGlobalContext } from '../../../packages/runtime/src/global-context.js';
import type { Handler } from '../../../packages/runtime/src/types/index.js';

const mockHandler: Handler = async (_req, res) => {
  res.json({ message: 'Hello, World!' });
};

describe('Hello World Benchmarks', () => {
  const routeManager = new RouteManager();
  routeManager.register('GET', '/hello', mockHandler);

  const gctx = createGlobalContext({ handlers: [], modules: [] });

  bench('Route matching', () => {
    routeManager.match('GET', '/hello');
  });

  bench('Context creation', () => {
    createLocalContext('test-req', 'test-trace', 'test-client');
  });

  bench('Handler execution', async () => {
    const lctx = createLocalContext('test-req', 'test-trace', 'test-client');
    const req = { method: 'GET', path: '/hello', headers: {}, query: {}, params: {}, body: undefined };
    const res = { json: () => {}, status: () => res, send: () => {} };
    await mockHandler(req as any, res as any, gctx, lctx);
  });
});
