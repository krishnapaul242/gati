/**
 * Microbenchmarks - Component-level performance tests
 */

import { bench, describe } from 'vitest';
import { RouteManager } from '../src/route-manager.js';
import { createLocalContext } from '../src/local-context.js';
import { createGlobalContext } from '../src/global-context.js';
import { HookOrchestrator } from '../src/hook-orchestrator.js';
import { validate, object, primitive } from '../src/gtype/index.js';
import { createRequest } from '../src/request.js';
import { createResponse } from '../src/response.js';

describe('Route Matching', () => {
  const routeManager = new RouteManager();
  routeManager.register('GET', '/users/:id', async () => {});
  routeManager.register('POST', '/users', async () => {});
  routeManager.register('GET', '/posts/:id/comments/:commentId', async () => {});

  bench('simple route', () => {
    routeManager.match('GET', '/users/123');
  });

  bench('nested route', () => {
    routeManager.match('GET', '/posts/456/comments/789');
  });
});

describe('Context Creation', () => {
  bench('LocalContext creation', () => {
    createLocalContext();
  });

  bench('GlobalContext creation', () => {
    createGlobalContext();
  });
});

describe('Hook Execution', () => {
  const orchestrator = new HookOrchestrator();
  const req = createRequest({ method: 'GET', url: '/test' });
  const res = createResponse();
  const gctx = createGlobalContext();
  const lctx = createLocalContext();

  bench('before hooks (empty)', async () => {
    await orchestrator.executeBefore(req, res, gctx, lctx);
  });

  bench('after hooks (empty)', async () => {
    await orchestrator.executeAfter(req, res, gctx, lctx);
  });
});

describe('GType Validation', () => {
  const userSchema = object({
    id: primitive('string'),
    name: primitive('string'),
    email: primitive('string'),
  });

  const validUser = { id: '123', name: 'Test', email: 'test@example.com' };

  bench('valid object', () => {
    validate(userSchema, validUser);
  });
});
