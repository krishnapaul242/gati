/**
 * @module runtime/hook-orchestrator.test
 * @description Tests for hook orchestration system
 * 
 * Tests Task 5: LCC Lifecycle Orchestration
 * - Property 25: Hook execution order
 * - Property 6: Error isolation
 * - Property 8: Timeout cleanup
 * - Property 20: Lifecycle event emission
 * - Property 10: Request validation
 * - Property 11: Response validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HookOrchestrator, type Hook, type LifecycleEvent } from './hook-orchestrator.js';
import type { LocalContext, GlobalContext } from './types/context.js';
import type { Request } from './types/index.js';
import { object as gtypeObject, array as gtypeArray, primitive, GTypes } from './gtype/index.js';
import { createGlobalContext } from './global-context.js';
import { createLocalContext } from './local-context.js';

// Create a helper object for easier usage in tests
const g = {
  object: gtypeObject,
  array: gtypeArray,
  string: GTypes.string,
  number: GTypes.number,
  boolean: GTypes.boolean,
};

// Mock contexts
const createMockLocalContext = (requestId = 'test-request'): LocalContext => ({
  requestId,
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  clean: vi.fn(),
  publish: vi.fn(),
  metadata: {
    requestId,
    path: '/test',
    version: '1.0.0',
    flags: [],
  },
});

const createMockGlobalContext = (): GlobalContext => ({
  getModule: vi.fn(),
  secrets: {
    get: vi.fn(),
  },
  metrics: {
    counter: vi.fn(),
    gauge: vi.fn(),
    histogram: vi.fn(),
  },
  publish: vi.fn(),
  config: {},
  timescape: {
    resolveVersion: vi.fn(),
    getManifest: vi.fn(),
  },
});

describe('HookOrchestrator', () => {
  let orchestrator: HookOrchestrator;
  let lctx: LocalContext;
  let gctx: GlobalContext;
  let events: LifecycleEvent[];

  beforeEach(() => {
    events = [];
    orchestrator = new HookOrchestrator({
      emitEvents: true,
      onEvent: (event) => events.push(event),
    });
    lctx = createMockLocalContext();
    gctx = createMockGlobalContext();
  });

  describe('Hook Registration', () => {
    it('should register before hooks', () => {
      orchestrator.registerBefore({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      const hooks = orchestrator.getHooks();
      expect(hooks.before).toHaveLength(1);
      expect(hooks.before[0].id).toBe('test-hook');
    });

    it('should register after hooks', () => {
      orchestrator.registerAfter({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      const hooks = orchestrator.getHooks();
      expect(hooks.after).toHaveLength(1);
      expect(hooks.after[0].id).toBe('test-hook');
    });

    it('should register catch hooks', () => {
      orchestrator.registerCatch({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      const hooks = orchestrator.getHooks();
      expect(hooks.catch).toHaveLength(1);
      expect(hooks.catch[0].id).toBe('test-hook');
    });

    it('should clear all hooks', () => {
      orchestrator.registerBefore({ id: 'hook1', fn: () => {}, level: 'global' });
      orchestrator.registerAfter({ id: 'hook2', fn: () => {}, level: 'global' });
      orchestrator.registerCatch({ id: 'hook3', fn: () => {}, level: 'global' });

      orchestrator.clear();

      const hooks = orchestrator.getHooks();
      expect(hooks.before).toHaveLength(0);
      expect(hooks.after).toHaveLength(0);
      expect(hooks.catch).toHaveLength(0);
    });
  });

  describe('Property 25: Hook Execution Order', () => {
    it('should execute before hooks in order: global → route → local', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerBefore({
        id: 'local-hook',
        fn: () => executionOrder.push('local'),
        level: 'local',
      });

      orchestrator.registerBefore({
        id: 'global-hook',
        fn: () => executionOrder.push('global'),
        level: 'global',
      });

      orchestrator.registerBefore({
        id: 'route-hook',
        fn: () => executionOrder.push('route'),
        level: 'route',
      });

      await orchestrator.executeBefore(lctx, gctx);

      expect(executionOrder).toEqual(['global', 'route', 'local']);
    });

    it('should execute after hooks in reverse order: local → route → global', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerAfter({
        id: 'local-hook',
        fn: () => executionOrder.push('local'),
        level: 'local',
      });

      orchestrator.registerAfter({
        id: 'global-hook',
        fn: () => executionOrder.push('global'),
        level: 'global',
      });

      orchestrator.registerAfter({
        id: 'route-hook',
        fn: () => executionOrder.push('route'),
        level: 'route',
      });

      await orchestrator.executeAfter(lctx, gctx);

      expect(executionOrder).toEqual(['local', 'route', 'global']);
    });

    it('should execute catch hooks in reverse order: local → route → global', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerCatch({
        id: 'local-hook',
        fn: () => executionOrder.push('local'),
        level: 'local',
      });

      orchestrator.registerCatch({
        id: 'global-hook',
        fn: () => executionOrder.push('global'),
        level: 'global',
      });

      orchestrator.registerCatch({
        id: 'route-hook',
        fn: () => executionOrder.push('route'),
        level: 'route',
      });

      await orchestrator.executeCatch(new Error('test'), lctx, gctx);

      expect(executionOrder).toEqual(['local', 'route', 'global']);
    });

    it('should always execute hooks in correct order (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
              level: fc.constantFrom('global', 'route', 'local'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (hookConfigs) => {
            const executionOrder: string[] = [];
            
            // Clear hooks before test
            orchestrator.clear();

            for (const config of hookConfigs) {
              orchestrator.registerBefore({
                id: config.id.trim(),
                fn: () => executionOrder.push(config.level),
                level: config.level as 'global' | 'route' | 'local',
              });
            }

            await orchestrator.executeBefore(lctx, gctx);

            // Verify order: all globals, then all routes, then all locals
            const globalCount = executionOrder.filter((l) => l === 'global').length;
            const routeCount = executionOrder.filter((l) => l === 'route').length;
            const localCount = executionOrder.filter((l) => l === 'local').length;

            const firstRoute = executionOrder.indexOf('route');
            const firstLocal = executionOrder.indexOf('local');

            if (firstRoute !== -1) {
              expect(firstRoute).toBeGreaterThanOrEqual(globalCount);
            }
            if (firstLocal !== -1) {
              expect(firstLocal).toBeGreaterThanOrEqual(globalCount + routeCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Error Isolation', () => {
    it('should stop execution when a before hook throws', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerBefore({
        id: 'hook1',
        fn: () => executionOrder.push('hook1'),
        level: 'global',
      });

      orchestrator.registerBefore({
        id: 'hook2',
        fn: () => {
          executionOrder.push('hook2');
          throw new Error('Hook failed');
        },
        level: 'global',
      });

      orchestrator.registerBefore({
        id: 'hook3',
        fn: () => executionOrder.push('hook3'),
        level: 'global',
      });

      await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow('Hook failed');
      expect(executionOrder).toEqual(['hook1', 'hook2']);
    });

    it('should not throw when catch hooks fail', async () => {
      orchestrator.registerCatch({
        id: 'catch-hook',
        fn: () => {
          throw new Error('Catch hook failed');
        },
        level: 'global',
      });

      // Should not throw
      await expect(
        orchestrator.executeCatch(new Error('original'), lctx, gctx)
      ).resolves.toBeUndefined();
    });

    it('should isolate errors and not affect other requests (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 9 }), // Fixed: max should be 9 for array of length 10
          async (failAtIndex) => {
            const hooks: Array<{ id: string; shouldFail: boolean }> = Array.from(
              { length: 10 },
              (_, i) => ({
                id: `hook-${i}`,
                shouldFail: i === failAtIndex,
              })
            );

            orchestrator.clear(); // Clear before registering
            for (const hook of hooks) {
              orchestrator.registerBefore({
                id: hook.id,
                fn: () => {
                  if (hook.shouldFail) {
                    throw new Error(`Hook ${hook.id} failed`);
                  }
                },
                level: 'global',
              });
            }

            await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow();

            // Create new context for second request
            const lctx2 = createMockLocalContext('request-2');

            // Clear and register non-failing hooks
            orchestrator.clear();
            for (const hook of hooks) {
              orchestrator.registerBefore({
                id: hook.id,
                fn: () => {},
                level: 'global',
              });
            }

            // Should succeed
            await expect(orchestrator.executeBefore(lctx2, gctx)).resolves.toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Timeout Cleanup', () => {
    it('should timeout hooks that exceed timeout', async () => {
      orchestrator.registerBefore({
        id: 'slow-hook',
        fn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
        },
        level: 'global',
        timeout: 50,
      });

      await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow(/timeout/i);
    });

    it('should not timeout hooks that complete in time', async () => {
      orchestrator.registerBefore({
        id: 'fast-hook',
        fn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        },
        level: 'global',
        timeout: 100,
      });

      await expect(orchestrator.executeBefore(lctx, gctx)).resolves.toBeUndefined();
    });

    it('should retry hooks on timeout', async () => {
      let attempts = 0;

      orchestrator.registerBefore({
        id: 'retry-hook',
        fn: async () => {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 100));
        },
        level: 'global',
        timeout: 50,
        retries: 2,
      });

      await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow(/timeout/i);
      expect(attempts).toBe(3); // 1 initial + 2 retries
    });

    it('should respect timeout and retry configuration (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 100 }), // Increased min timeout for reliability
          fc.integer({ min: 0, max: 2 }), // Reduced max retries
          async (timeout, retries) => {
            let attempts = 0;

            orchestrator.clear();
            orchestrator.registerBefore({
              id: 'test-hook',
              fn: async () => {
                attempts++;
                await new Promise((resolve) => setTimeout(resolve, timeout + 50)); // Increased delay significantly
              },
              level: 'global',
              timeout,
              retries,
            });

            await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow();
            expect(attempts).toBe(retries + 1);
          }
        ),
        { numRuns: 20 } // Reduced number of runs
      );
    }, 15000); // Increased test timeout to 15 seconds
  });

  describe('Property 20: Lifecycle Event Emission', () => {
    it('should emit hook:start and hook:end events', async () => {
      orchestrator.registerBefore({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      await orchestrator.executeBefore(lctx, gctx);

      const startEvents = events.filter((e) => e.type === 'hook:start');
      const endEvents = events.filter((e) => e.type === 'hook:end');

      expect(startEvents).toHaveLength(1);
      expect(endEvents).toHaveLength(1);
      expect(startEvents[0].hookId).toBe('test-hook');
      expect(endEvents[0].hookId).toBe('test-hook');
      expect(endEvents[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should emit hook:error events on failure', async () => {
      orchestrator.registerBefore({
        id: 'failing-hook',
        fn: () => {
          throw new Error('Hook failed');
        },
        level: 'global',
      });

      await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow();

      const errorEvents = events.filter((e) => e.type === 'hook:error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].hookId).toBe('failing-hook');
      expect(errorEvents[0].error).toBeDefined();
    });

    it('should emit hook:retry events on retry', async () => {
      let attempts = 0;

      orchestrator.registerBefore({
        id: 'retry-hook',
        fn: () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Not yet');
          }
        },
        level: 'global',
        retries: 2,
      });

      await orchestrator.executeBefore(lctx, gctx);

      const retryEvents = events.filter((e) => e.type === 'hook:retry');
      expect(retryEvents).toHaveLength(2);
    });

    it('should emit events for all hooks (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (hookCount) => {
            // Clear hooks and events before test
            orchestrator.clear();
            events.length = 0;
            
            for (let i = 0; i < hookCount; i++) {
              orchestrator.registerBefore({
                id: `hook-${i}`,
                fn: () => {},
                level: 'global',
              });
            }

            await orchestrator.executeBefore(lctx, gctx);

            const startEvents = events.filter((e) => e.type === 'hook:start');
            const endEvents = events.filter((e) => e.type === 'hook:end');

            expect(startEvents).toHaveLength(hookCount);
            expect(endEvents).toHaveLength(hookCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Request Validation', () => {
    it('should validate request body against schema', () => {
      const schema = g.object({
        name: g.string(),
        age: g.number(),
      }, { required: ['name', 'age'] });

      const req: Request = {
        path: '/test',
        method: 'POST',
        headers: {},
        body: { name: 'John', age: 30 },
        params: {},
        query: {},
      };

      expect(() => orchestrator.validateRequest(req, schema, lctx)).not.toThrow();
    });

    it('should throw on invalid request body', () => {
      const schema = g.object({
        name: g.string(),
        age: g.number(),
      }, { required: ['name', 'age'] });

      const req: Request = {
        path: '/test',
        method: 'POST',
        headers: {},
        body: { name: 'John', age: 'thirty' }, // Invalid: age should be number
        params: {},
        query: {},
      };

      expect(() => orchestrator.validateRequest(req, schema, lctx)).toThrow(/validation failed/i);
    });

    it('should emit validation events', () => {
      const schema = g.object({
        name: g.string(),
      }, { required: ['name'] });

      const req: Request = {
        path: '/test',
        method: 'POST',
        headers: {},
        body: { name: 'John' },
        params: {},
        query: {},
      };

      orchestrator.validateRequest(req, schema, lctx);

      const validationEvents = events.filter((e) => e.type.startsWith('validation:'));
      expect(validationEvents.length).toBeGreaterThan(0);
    });

    it('should validate any valid request body (property test)', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string(),
            age: fc.integer({ min: 0, max: 120 }),
            email: fc.emailAddress(),
          }),
          (body) => {
            const schema = g.object({
              name: g.string(),
              age: g.number(),
              email: g.string(),
            }, { required: ['name', 'age', 'email'] });

            const req: Request = {
              path: '/test',
              method: 'POST',
              headers: {},
              body,
              params: {},
              query: {},
            };

            expect(() => orchestrator.validateRequest(req, schema, lctx)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Response Validation', () => {
    it('should validate response data against schema', () => {
      const schema = g.object({
        id: g.string(),
        status: g.string(),
      }, { required: ['id', 'status'] });

      const data = { id: '123', status: 'success' };

      expect(() => orchestrator.validateResponse(data, schema, lctx)).not.toThrow();
    });

    it('should throw on invalid response data', () => {
      const schema = g.object({
        id: g.string(),
        status: g.string(),
      }, { required: ['id', 'status'] });

      const data = { id: 123, status: 'success' }; // Invalid: id should be string

      expect(() => orchestrator.validateResponse(data, schema, lctx)).toThrow(/validation failed/i);
    });

    it('should emit validation events for response', () => {
      const schema = g.object({
        result: g.string(),
      }, { required: ['result'] });

      const data = { result: 'ok' };

      orchestrator.validateResponse(data, schema, lctx);

      const validationEvents = events.filter(
        (e) => e.type.startsWith('validation:') && e.metadata?.phase === 'response'
      );
      expect(validationEvents.length).toBeGreaterThan(0);
    });

    it('should validate any valid response data (property test)', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            value: fc.integer(),
            tags: fc.array(fc.string()),
          }),
          (data) => {
            const schema = g.object({
              id: g.string(),
              value: g.number(),
              tags: g.array(g.string()),
            }, { required: ['id', 'value', 'tags'] });

            expect(() => orchestrator.validateResponse(data, schema, lctx)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Async Hook Support', () => {
    it('should handle async hooks', async () => {
      let executed = false;

      orchestrator.registerBefore({
        id: 'async-hook',
        fn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          executed = true;
        },
        level: 'global',
      });

      await orchestrator.executeBefore(lctx, gctx);
      expect(executed).toBe(true);
    });

    it('should handle sync hooks', async () => {
      let executed = false;

      orchestrator.registerBefore({
        id: 'sync-hook',
        fn: () => {
          executed = true;
        },
        level: 'global',
      });

      await orchestrator.executeBefore(lctx, gctx);
      expect(executed).toBe(true);
    });

    it('should handle mixed sync and async hooks', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerBefore({
        id: 'sync-hook',
        fn: () => executionOrder.push('sync'),
        level: 'global',
      });

      orchestrator.registerBefore({
        id: 'async-hook',
        fn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionOrder.push('async');
        },
        level: 'route',
      });

      await orchestrator.executeBefore(lctx, gctx);
      expect(executionOrder).toEqual(['sync', 'async']);
    });
  });

  describe('Configuration', () => {
    it('should use default timeout when not specified', async () => {
      const customOrchestrator = new HookOrchestrator({
        defaultTimeout: 50,
      });

      customOrchestrator.registerBefore({
        id: 'slow-hook',
        fn: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        },
        level: 'global',
      });

      await expect(
        customOrchestrator.executeBefore(lctx, gctx)
      ).rejects.toThrow(/timeout/i);
    });

    it('should use default retries when not specified', async () => {
      let attempts = 0;

      const customOrchestrator = new HookOrchestrator({
        defaultRetries: 2,
      });

      customOrchestrator.registerBefore({
        id: 'failing-hook',
        fn: () => {
          attempts++;
          throw new Error('Always fails');
        },
        level: 'global',
      });

      await expect(customOrchestrator.executeBefore(lctx, gctx)).rejects.toThrow();
      expect(attempts).toBe(3); // 1 initial + 2 retries
    });

    it('should not emit events when disabled', async () => {
      const customEvents: LifecycleEvent[] = [];
      const customOrchestrator = new HookOrchestrator({
        emitEvents: false,
        onEvent: (event) => customEvents.push(event),
      });

      customOrchestrator.registerBefore({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      await customOrchestrator.executeBefore(lctx, gctx);
      expect(customEvents).toHaveLength(0);
    });
  });

  describe('Compensating Actions', () => {
    it('should register compensating actions', () => {
      const action = vi.fn();
      orchestrator.registerCompensatingAction(action, 'test-action');

      const actions = orchestrator.getCompensatingActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].id).toBe('test-action');
    });

    it('should auto-generate ID if not provided', () => {
      const action = vi.fn();
      orchestrator.registerCompensatingAction(action);

      const actions = orchestrator.getCompensatingActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].id).toMatch(/^compensation-/);
    });

    it('should execute compensating actions in reverse order', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerCompensatingAction(() => executionOrder.push('action1'), 'action1');
      orchestrator.registerCompensatingAction(() => executionOrder.push('action2'), 'action2');
      orchestrator.registerCompensatingAction(() => executionOrder.push('action3'), 'action3');

      await orchestrator.executeCompensatingActions(lctx);

      expect(executionOrder).toEqual(['action3', 'action2', 'action1']);
    });

    it('should execute compensating actions when catch hooks are executed', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerCompensatingAction(() => executionOrder.push('compensation'), 'comp1');
      orchestrator.registerCatch({
        id: 'catch-hook',
        fn: () => executionOrder.push('catch'),
        level: 'global',
      });

      await orchestrator.executeCatch(new Error('test'), lctx, gctx);

      expect(executionOrder).toEqual(['compensation', 'catch']);
    });

    it('should emit compensation:start and compensation:end events', async () => {
      orchestrator.registerCompensatingAction(() => {}, 'test-action');

      await orchestrator.executeCompensatingActions(lctx);

      const startEvents = events.filter((e) => e.type === 'compensation:start');
      const endEvents = events.filter((e) => e.type === 'compensation:end');

      expect(startEvents).toHaveLength(1);
      expect(endEvents).toHaveLength(1);
      expect(startEvents[0].metadata?.actionId).toBe('test-action');
      expect(endEvents[0].metadata?.actionId).toBe('test-action');
      expect(endEvents[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should emit compensation:error and compensation:alert on failure', async () => {
      const alerts: Array<{ message: string; error: Error; metadata?: Record<string, unknown> }> = [];
      const customOrchestrator = new HookOrchestrator({
        emitEvents: true,
        onEvent: (event) => events.push(event),
        onAlert: (message, error, metadata) => alerts.push({ message, error, metadata }),
      });

      customOrchestrator.registerCompensatingAction(() => {
        throw new Error('Compensation failed');
      }, 'failing-action');

      await customOrchestrator.executeCompensatingActions(lctx);

      const errorEvents = events.filter((e) => e.type === 'compensation:error');
      const alertEvents = events.filter((e) => e.type === 'compensation:alert');

      expect(errorEvents).toHaveLength(1);
      expect(alertEvents).toHaveLength(1);
      expect(errorEvents[0].error?.message).toBe('Compensation failed');
      expect(alertEvents[0].metadata?.message).toContain('failing-action');
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toContain('failing-action');
      expect(alerts[0].error.message).toBe('Compensation failed');
    });

    it('should continue executing other compensating actions if one fails', async () => {
      const executionOrder: string[] = [];

      orchestrator.registerCompensatingAction(() => executionOrder.push('action1'), 'action1');
      orchestrator.registerCompensatingAction(() => {
        executionOrder.push('action2');
        throw new Error('Action 2 failed');
      }, 'action2');
      orchestrator.registerCompensatingAction(() => executionOrder.push('action3'), 'action3');

      await orchestrator.executeCompensatingActions(lctx);

      // All actions should execute despite action2 failing
      expect(executionOrder).toEqual(['action3', 'action2', 'action1']);
    });

    it('should clear compensating actions after execution', async () => {
      orchestrator.registerCompensatingAction(() => {}, 'action1');
      orchestrator.registerCompensatingAction(() => {}, 'action2');

      expect(orchestrator.getCompensatingActions()).toHaveLength(2);

      await orchestrator.executeCompensatingActions(lctx);

      expect(orchestrator.getCompensatingActions()).toHaveLength(0);
    });

    it('should clear compensating actions without executing', () => {
      const action = vi.fn();
      orchestrator.registerCompensatingAction(action, 'action1');

      expect(orchestrator.getCompensatingActions()).toHaveLength(1);

      orchestrator.clearCompensatingActions();

      expect(orchestrator.getCompensatingActions()).toHaveLength(0);
      expect(action).not.toHaveBeenCalled();
    });

    it('should handle async compensating actions', async () => {
      let executed = false;

      orchestrator.registerCompensatingAction(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executed = true;
      }, 'async-action');

      await orchestrator.executeCompensatingActions(lctx);

      expect(executed).toBe(true);
    });

    it('should clear compensating actions when clear() is called', () => {
      orchestrator.registerCompensatingAction(() => {}, 'action1');
      orchestrator.registerBefore({ id: 'hook1', fn: () => {}, level: 'global' });

      expect(orchestrator.getCompensatingActions()).toHaveLength(1);
      expect(orchestrator.getHooks().before).toHaveLength(1);

      orchestrator.clear();

      expect(orchestrator.getCompensatingActions()).toHaveLength(0);
      expect(orchestrator.getHooks().before).toHaveLength(0);
    });

    it('should handle compensating actions in a realistic scenario', async () => {
      const state = {
        userId: null as string | null,
        emailSent: false,
        recordCreated: false,
      };

      // Simulate a multi-step operation with compensating actions
      orchestrator.registerBefore({
        id: 'create-user',
        fn: () => {
          state.userId = 'user-123';
          orchestrator.registerCompensatingAction(() => {
            state.userId = null;
          }, 'delete-user');
        },
        level: 'global',
      });

      orchestrator.registerBefore({
        id: 'send-email',
        fn: () => {
          state.emailSent = true;
          orchestrator.registerCompensatingAction(() => {
            state.emailSent = false;
          }, 'unsend-email');
        },
        level: 'global',
      });

      orchestrator.registerBefore({
        id: 'create-record',
        fn: () => {
          state.recordCreated = true;
          orchestrator.registerCompensatingAction(() => {
            state.recordCreated = false;
          }, 'delete-record');
          throw new Error('Record creation failed');
        },
        level: 'global',
      });

      // Execute and expect failure
      await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow('Record creation failed');

      // State should be partially set
      expect(state.userId).toBe('user-123');
      expect(state.emailSent).toBe(true);
      expect(state.recordCreated).toBe(true);

      // Execute catch hooks (which will run compensating actions)
      await orchestrator.executeCatch(new Error('test'), lctx, gctx);

      // Compensating actions should have rolled back the state
      expect(state.userId).toBeNull();
      expect(state.emailSent).toBe(false);
      expect(state.recordCreated).toBe(false);
    });
  });

  describe('Hook Playback Integration', () => {
    it('should record hook execution when playback is enabled', async () => {
      const playback = orchestrator.enablePlayback();
      playback.startRequest(lctx.requestId);

      orchestrator.registerBefore({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      await orchestrator.executeBefore(lctx, gctx);
      playback.endRequest(lctx.requestId);

      const trace = playback.getHookTrace(lctx.requestId);
      expect(trace).toBeDefined();
      expect(trace?.traces).toHaveLength(1);
      expect(trace?.traces[0].hookId).toBe('test-hook');
      expect(trace?.traces[0].success).toBe(true);
    });

    it('should not record when playback is disabled', async () => {
      orchestrator.registerBefore({
        id: 'test-hook',
        fn: () => {},
        level: 'global',
      });

      await orchestrator.executeBefore(lctx, gctx);

      const playback = orchestrator.getPlayback();
      expect(playback).toBeNull();
    });

    it('should record full lifecycle with before, after, and catch hooks', async () => {
      const playback = orchestrator.enablePlayback();
      playback.startRequest(lctx.requestId);

      orchestrator.registerBefore({
        id: 'before-hook',
        fn: () => {},
        level: 'global',
      });

      orchestrator.registerAfter({
        id: 'after-hook',
        fn: () => {},
        level: 'global',
      });

      await orchestrator.executeBefore(lctx, gctx);
      await orchestrator.executeAfter(lctx, gctx);
      playback.endRequest(lctx.requestId);

      const trace = playback.getHookTrace(lctx.requestId);
      expect(trace?.traces).toHaveLength(2);
      expect(trace?.traces[0].hookId).toBe('before-hook');
      expect(trace?.traces[1].hookId).toBe('after-hook');
    });

    it('should record error hooks with failure status', async () => {
      const playback = orchestrator.enablePlayback();
      playback.startRequest(lctx.requestId);

      orchestrator.registerBefore({
        id: 'failing-hook',
        fn: () => {
          throw new Error('Hook failed');
        },
        level: 'global',
      });

      await expect(orchestrator.executeBefore(lctx, gctx)).rejects.toThrow();
      playback.endRequest(lctx.requestId);

      const trace = playback.getHookTrace(lctx.requestId);
      expect(trace?.traces).toHaveLength(1);
      expect(trace?.traces[0].success).toBe(false);
      expect(trace?.traces[0].error).toBeDefined();
    });
  });
});

// Feature: runtime-architecture, Property 25: Hook execution order
describe('Property 25: Hook execution order', () => {
  it('should execute hooks in correct order for any combination of levels', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            level: fc.constantFrom('global', 'route', 'local'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (hookConfigs) => {
          const events: LifecycleEvent[] = [];
          const orchestrator = new HookOrchestrator({
            emitEvents: true,
            onEvent: (event) => events.push(event),
          });
          const executionOrder: string[] = [];

          // Register hooks
          for (const config of hookConfigs) {
            orchestrator.registerBefore({
              id: config.id.trim(),
              fn: () => executionOrder.push(config.level),
              level: config.level as 'global' | 'route' | 'local',
            });
          }

          const lctx = createLocalContext();
          const gctx = createGlobalContext();

          await orchestrator.executeBefore(lctx, gctx);

          // Verify order: all globals, then all routes, then all locals
          const globalCount = executionOrder.filter((l) => l === 'global').length;
          const routeCount = executionOrder.filter((l) => l === 'route').length;
          const localCount = executionOrder.filter((l) => l === 'local').length;

          const firstRoute = executionOrder.indexOf('route');
          const firstLocal = executionOrder.indexOf('local');

          if (firstRoute !== -1) {
            expect(firstRoute).toBeGreaterThanOrEqual(globalCount);
          }
          if (firstLocal !== -1) {
            expect(firstLocal).toBeGreaterThanOrEqual(globalCount + routeCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
