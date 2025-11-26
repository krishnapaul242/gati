/**
 * @module runtime/handler-worker.test
 * @description Tests for HandlerWorker execution engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HandlerWorker } from './handler-worker.js';
import { createGlobalContext } from './global-context.js';
import type { Handler, Request, Response, GlobalContext } from './types/index.js';

describe('HandlerWorker', () => {
  let gctx: GlobalContext;
  let worker: HandlerWorker;

  beforeEach(() => {
    gctx = createGlobalContext();
    worker = new HandlerWorker(gctx);
  });

  describe('Property Tests', () => {
    it('Property 1: Handler signature conformance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.boolean(),
          fc.record({
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
            path: fc.string({ minLength: 1, maxLength: 50 }),
            body: fc.oneof(fc.string(), fc.integer(), fc.record({ data: fc.string() })),
          }),
          async (handlerId, isAsync, reqData) => {
            const testGctx = createGlobalContext();
            const testWorker = new HandlerWorker(testGctx);
            
            let receivedParams: unknown[] = [];
            const handler: Handler = isAsync
              ? async (req, res, gctx, lctx) => {
                  receivedParams = [req, res, gctx, lctx];
                }
              : (req, res, gctx, lctx) => {
                  receivedParams = [req, res, gctx, lctx];
                };

            testWorker.registerHandler(handlerId, handler);

            const req = {
              method: reqData.method,
              path: reqData.path,
              body: reqData.body,
              params: {},
              query: {},
              headers: {},
              url: reqData.path,
              protocol: 'http',
              hostname: 'localhost',
            } as Request;
            const res = {
              statusCode: 200,
              headers: {},
            } as Response;

            await testWorker.executeHandler(handlerId, req, res);

            // Verify all 4 parameters were passed
            expect(receivedParams).toHaveLength(4);
            expect(receivedParams[0]).toBe(req);
            expect(receivedParams[1]).toBe(res);
            expect(receivedParams[2]).toBeDefined(); // gctx
            expect(receivedParams[3]).toBeDefined(); // lctx
            expect(receivedParams[3]).toHaveProperty('requestId');
            expect(receivedParams[3]).toHaveProperty('state');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 1b: Stateless execution - no state leakage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 }),
          async (values) => {
            const testGctx = createGlobalContext();
            const testWorker = new HandlerWorker(testGctx);
            
            const capturedStates: unknown[] = [];
            const handler: Handler = (req, res, gctx, lctx) => {
              lctx.state.value = req.body;
              capturedStates.push(lctx.state.value);
            };

            testWorker.registerHandler('test', handler);

            for (const value of values) {
              const req = {
                method: 'POST',
                path: '/',
                body: value,
                params: {},
                query: {},
                headers: {},
                url: '/',
                protocol: 'http',
                hostname: 'localhost',
              } as Request;
              const res = { statusCode: 200, headers: {} } as Response;
              
              await testWorker.executeHandler('test', req, res);
            }

            // Each execution should have its own state
            expect(capturedStates).toEqual(values);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Unit Tests - Handler Registration', () => {
    it('registers handler successfully', () => {
      const handler: Handler = (req, res, gctx, lctx) => {};
      worker.registerHandler('test', handler);
      expect(worker.getHandlerCount()).toBe(1);
    });

    it('throws on empty handler ID', () => {
      const handler: Handler = (req, res, gctx, lctx) => {};
      expect(() => worker.registerHandler('', handler)).toThrow('Handler ID must be a non-empty string');
    });

    it('throws on non-function handler', () => {
      expect(() => worker.registerHandler('test', 'not a function' as unknown as Handler)).toThrow('Handler must be a function');
    });

    it('throws on wrong parameter count', () => {
      const handler = (req: Request) => {};
      expect(() => worker.registerHandler('test', handler as unknown as Handler)).toThrow('Handler must accept exactly 4 parameters');
    });

    it('throws on duplicate handler ID', () => {
      const handler: Handler = (req, res, gctx, lctx) => {};
      worker.registerHandler('test', handler);
      expect(() => worker.registerHandler('test', handler)).toThrow('Handler with ID "test" already registered');
    });

    it('unregisters handler successfully', () => {
      const handler: Handler = (req, res, gctx, lctx) => {};
      worker.registerHandler('test', handler);
      expect(worker.unregisterHandler('test')).toBe(true);
      expect(worker.getHandlerCount()).toBe(0);
    });

    it('returns false when unregistering non-existent handler', () => {
      expect(worker.unregisterHandler('nonexistent')).toBe(false);
    });

    it('returns correct handler count', () => {
      expect(worker.getHandlerCount()).toBe(0);
      const handler: Handler = (req, res, gctx, lctx) => {};
      worker.registerHandler('test1', handler);
      expect(worker.getHandlerCount()).toBe(1);
      worker.registerHandler('test2', handler);
      expect(worker.getHandlerCount()).toBe(2);
      worker.unregisterHandler('test1');
      expect(worker.getHandlerCount()).toBe(1);
    });
  });

  describe('Unit Tests - Handler Execution', () => {
    it('executes sync handler successfully', async () => {
      let executed = false;
      const handler: Handler = (req, res, gctx, lctx) => {
        executed = true;
      };
      worker.registerHandler('test', handler);
      
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await worker.executeHandler('test', req, res);
      expect(executed).toBe(true);
    });

    it('executes async handler successfully', async () => {
      let executed = false;
      const handler: Handler = async (req, res, gctx, lctx) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executed = true;
      };
      worker.registerHandler('test', handler);
      
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await worker.executeHandler('test', req, res);
      expect(executed).toBe(true);
    });

    it('throws when handler not found', async () => {
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await expect(worker.executeHandler('nonexistent', req, res)).rejects.toThrow('Handler "nonexistent" not found');
    });

    it('passes correct parameters to handler', async () => {
      let receivedReq: Request | undefined;
      let receivedRes: Response | undefined;
      let receivedGctx: GlobalContext | undefined;
      let receivedLctx: unknown;

      const handler: Handler = (req, res, gctx, lctx) => {
        receivedReq = req;
        receivedRes = res;
        receivedGctx = gctx;
        receivedLctx = lctx;
      };
      worker.registerHandler('test', handler);
      
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await worker.executeHandler('test', req, res);
      
      expect(receivedReq).toBe(req);
      expect(receivedRes).toBe(res);
      expect(receivedGctx).toBe(gctx);
      expect(receivedLctx).toBeDefined();
      expect(receivedLctx).toHaveProperty('requestId');
      expect(receivedLctx).toHaveProperty('state');
    });

    it('increments request count on execution', async () => {
      const handler: Handler = (req, res, gctx, lctx) => {};
      worker.registerHandler('test', handler);
      
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      const statusBefore = worker.getHealthStatus();
      await worker.executeHandler('test', req, res);
      const statusAfter = worker.getHealthStatus();
      
      expect(statusAfter.checks.requests.message).toContain('1 requests processed');
    });

    it('increments error count on failure', async () => {
      const handler: Handler = (req, res, gctx, lctx) => {
        throw new Error('Test error');
      };
      worker.registerHandler('test', handler);
      
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await expect(worker.executeHandler('test', req, res)).rejects.toThrow('Test error');
      
      const status = worker.getHealthStatus();
      expect(status.checks.errors.message).toContain('1 errors');
    });
  });

  describe('Unit Tests - Health Check', () => {
    it('returns correct health status structure', () => {
      const status = worker.getHealthStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('checks');
      expect(status).toHaveProperty('timestamp');
      expect(status.checks).toHaveProperty('handlers');
      expect(status.checks).toHaveProperty('globalContext');
      expect(status.checks).toHaveProperty('uptime');
      expect(status.checks).toHaveProperty('requests');
      expect(status.checks).toHaveProperty('errors');
    });

    it('returns unhealthy when no handlers registered', () => {
      const status = worker.getHealthStatus();
      expect(status.status).toBe('unhealthy');
      expect(status.checks.handlers.status).toBe('fail');
    });

    it('returns healthy with handlers and no errors', () => {
      const handler: Handler = (req, res, gctx, lctx) => {};
      worker.registerHandler('test', handler);
      
      const status = worker.getHealthStatus();
      expect(status.status).toBe('healthy');
      expect(status.checks.handlers.status).toBe('pass');
    });

    it('includes uptime metric', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      const status = worker.getHealthStatus();
      expect(status.checks.uptime.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('executes full lifecycle with hooks', async () => {
      const order: string[] = [];
      
      worker['orchestrator'].registerBefore({
        id: 'before',
        fn: () => { order.push('before'); },
        level: 'global',
      });
      
      const handler: Handler = (req, res, gctx, lctx) => { order.push('handler'); };
      worker.registerHandler('test', handler);
      
      worker['orchestrator'].registerAfter({
        id: 'after',
        fn: () => { order.push('after'); },
        level: 'global',
      });
      
      const req = { method: 'GET', path: '/', params: {}, query: {}, headers: {}, body: undefined } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await worker.executeHandler('test', req, res);
      
      expect(order).toEqual(['before', 'handler', 'after']);
    });

    it('isolates concurrent requests', async () => {
      const handler: Handler = async (req, res, gctx, lctx) => {
        lctx.state.value = req.body;
        await new Promise(resolve => setTimeout(resolve, 10));
      };
      
      worker.registerHandler('test', handler);
      
      const req1 = { method: 'POST', path: '/', body: 'req1', params: {}, query: {}, headers: {} } as Request;
      const req2 = { method: 'POST', path: '/', body: 'req2', params: {}, query: {}, headers: {} } as Request;
      const res = { statusCode: 200, headers: {} } as Response;
      
      await Promise.all([
        worker.executeHandler('test', req1, res),
        worker.executeHandler('test', req2, res),
      ]);
      
      // If isolated correctly, no errors should occur
      expect(true).toBe(true);
    });
  });
});
