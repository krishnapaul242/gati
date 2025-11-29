/**
 * Integration benchmarks - Full pipeline performance
 */

import { bench, describe } from 'vitest';
import { createE2EIntegration } from '../src/e2e-integration.js';
import type { Handler } from '../src/types/handler.js';
import { Readable } from 'stream';
import type { IncomingMessage, ServerResponse } from 'http';

describe('E2E Pipeline', () => {
  const integration = createE2EIntegration();

  const simpleHandler: Handler = (req, res) => {
    res.json({ ok: true });
  };

  const gctx = integration.getGlobalContext();
  gctx.modules['db'] = {
    getUser: async (id: string) => ({ id, name: 'Test' }),
  };

  const moduleHandler: Handler = async (req, res, gctx) => {
    const user = await (gctx.modules['db'] as any).getUser('123');
    res.json({ user });
  };

  const hooksHandler: Handler = async (req, res, gctx, lctx) => {
    lctx.lifecycle.onCleanup(() => {});
    res.json({ ok: true });
  };

  integration.registerHandler('GET', '/simple', simpleHandler);
  integration.registerHandler('GET', '/module', moduleHandler);
  integration.registerHandler('GET', '/hooks', hooksHandler);

  const createMockRequest = (path: string): IncomingMessage => {
    const req = new Readable() as IncomingMessage;
    req.method = 'GET';
    req.url = path;
    req.headers = { host: 'localhost' };
    req.push(null);
    return req;
  };

  const createMockResponse = (): ServerResponse => {
    return {
      statusCode: 200,
      setHeader: () => {},
      end: () => {},
    } as any;
  };

  bench('simple handler', async () => {
    const req = createMockRequest('/simple');
    const res = createMockResponse();
    await integration.handleRequest(req, res);
  });

  bench('handler with module', async () => {
    const req = createMockRequest('/module');
    const res = createMockResponse();
    await integration.handleRequest(req, res);
  });

  bench('handler with hooks', async () => {
    const req = createMockRequest('/hooks');
    const res = createMockResponse();
    await integration.handleRequest(req, res);
  });
});
