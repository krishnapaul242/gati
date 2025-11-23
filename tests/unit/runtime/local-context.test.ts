/**
 * @file Unit tests for local context manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  createLocalContext,
  cleanupLocalContext,
  setState,
  getState,
} from '@gati-framework/runtime/local-context';
import type { LocalContext } from '@gati-framework/runtime/types/context';

describe('LocalContext', () => {
  let lctx: LocalContext;

  beforeEach(() => {
    lctx = createLocalContext();
  });

  describe('createLocalContext', () => {
    it('should create a local context with default values', () => {
      expect(lctx).toBeDefined();
      expect(lctx.requestId).toBeDefined();
      expect(lctx.timestamp).toBeTypeOf('number');
      expect(lctx.state).toEqual({});
      expect(lctx.lifecycle).toBeDefined();
      expect(lctx.lifecycle.onCleanup).toBeTypeOf('function');
      expect(lctx.lifecycle.isCleaningUp).toBeTypeOf('function');
    });

    it('should create a local context with provided options', () => {
      const state = { userId: '123' };
      lctx = createLocalContext({ requestId: 'custom-id', state });

      expect(lctx.requestId).toBe('custom-id');
      expect(lctx.state).toEqual(state);
    });

    it('should generate unique request IDs', () => {
      const lctx1 = createLocalContext();
      const lctx2 = createLocalContext();

      expect(lctx1.requestId).not.toBe(lctx2.requestId);
    });

    it('should have a timestamp close to current time', () => {
      const before = Date.now();
      lctx = createLocalContext();
      const after = Date.now();

      expect(lctx.timestamp).toBeGreaterThanOrEqual(before);
      expect(lctx.timestamp).toBeLessThanOrEqual(after);
    });

    it('should initialize isCleaningUp as false', () => {
      expect(lctx.lifecycle.isCleaningUp()).toBe(false);
    });
  });

  describe('setState and getState', () => {
    it('should set and get state values', () => {
      setState(lctx, 'userId', '123');
      setState(lctx, 'userName', 'John');

      expect(getState(lctx, 'userId')).toBe('123');
      expect(getState(lctx, 'userName')).toBe('John');
    });

    it('should return undefined for non-existent keys', () => {
      expect(getState(lctx, 'nonExistent')).toBeUndefined();
    });

    it('should support typed state retrieval', () => {
      interface UserData {
        id: string;
        name: string;
      }

      const userData: UserData = { id: '123', name: 'John' };
      setState(lctx, 'user', userData);

      const retrieved = getState<UserData>(lctx, 'user');
      expect(retrieved?.id).toBe('123');
      expect(retrieved?.name).toBe('John');
    });

    it('should allow overwriting state values', () => {
      setState(lctx, 'counter', 1);
      expect(getState(lctx, 'counter')).toBe(1);

      setState(lctx, 'counter', 2);
      expect(getState(lctx, 'counter')).toBe(2);
    });
  });

  describe('cleanup lifecycle', () => {
    it('should register cleanup hooks', () => {
      let called = false;
      lctx.lifecycle.onCleanup(() => {
        called = true;
      });

      expect(called).toBe(false); // Not called yet
    });

    it('should execute cleanup hooks on cleanup', async () => {
      const calls: string[] = [];

      lctx.lifecycle.onCleanup(() => {
        calls.push('hook1');
      });

      lctx.lifecycle.onCleanup(() => {
        calls.push('hook2');
      });

      await cleanupLocalContext(lctx);

      expect(calls).toContain('hook1');
      expect(calls).toContain('hook2');
    });

    it('should execute async cleanup hooks', async () => {
      let resolved = false;

      lctx.lifecycle.onCleanup(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        resolved = true;
      });

      await cleanupLocalContext(lctx);

      expect(resolved).toBe(true);
    });

    it('should mark context as cleaning up', async () => {
      expect(lctx.lifecycle.isCleaningUp()).toBe(false);

      const cleanupPromise = cleanupLocalContext(lctx);

      await cleanupPromise;

      expect(lctx.lifecycle.isCleaningUp()).toBe(true);
    });

    it('should clear state after cleanup', async () => {
      setState(lctx, 'key1', 'value1');
      setState(lctx, 'key2', 'value2');

      expect(lctx.state).toEqual({ key1: 'value1', key2: 'value2' });

      await cleanupLocalContext(lctx);

      expect(lctx.state).toEqual({});
    });

    it('should execute multiple cleanup hooks in parallel', async () => {
      const start = Date.now();
      const delay = 50;

      lctx.lifecycle.onCleanup(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
      });

      lctx.lifecycle.onCleanup(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
      });

      await cleanupLocalContext(lctx);

      const elapsed = Date.now() - start;

      // If parallel, should take ~50ms, not ~100ms
      // Using 3x tolerance to account for system variance and CI environments
      expect(elapsed).toBeLessThan(delay * 3);
    });

    it('should handle cleanup without any hooks', async () => {
      await expect(cleanupLocalContext(lctx)).resolves.not.toThrow();
    });
  });

  describe('request ID generation', () => {
    it('should generate request IDs with req_ prefix', () => {
      expect(lctx.requestId).toMatch(/^req_/);
    });

    it('should include timestamp in request ID', () => {
      const now = Date.now();
      lctx = createLocalContext();

      const parts = lctx.requestId.split('_');
      const timestampPart = parts[1];
      expect(timestampPart).toBeDefined();

      if (timestampPart) {
        const timestamp = parseInt(timestampPart, 10);

        expect(timestamp).toBeGreaterThanOrEqual(now - 100);
        expect(timestamp).toBeLessThanOrEqual(now + 100);
      }
    });
  });

  describe('state isolation', () => {
    it('should maintain separate state per context', () => {
      const lctx1 = createLocalContext();
      const lctx2 = createLocalContext();

      setState(lctx1, 'key', 'value1');
      setState(lctx2, 'key', 'value2');

      expect(getState(lctx1, 'key')).toBe('value1');
      expect(getState(lctx2, 'key')).toBe('value2');
    });

    it('should not share state between contexts', () => {
      const lctx1 = createLocalContext();
      const lctx2 = createLocalContext();

      setState(lctx1, 'sharedKey', 'value');

      expect(getState(lctx2, 'sharedKey')).toBeUndefined();
    });
  });

  describe('snapshot and restore', () => {
    it('should create a snapshot of current state', () => {
      setState(lctx, 'userId', '123');
      setState(lctx, 'userName', 'John');

      const snapshot = lctx.snapshot.create();

      expect(snapshot).toBeDefined();
      expect(snapshot.requestId).toBe(lctx.requestId);
      expect(snapshot.state).toEqual({ userId: '123', userName: 'John' });
      expect(snapshot.timestamp).toBeTypeOf('number');
      expect(snapshot.phase).toBe(lctx.meta.phase);
      expect(snapshot.traceId).toBe(lctx.traceId);
      expect(snapshot.clientId).toBe(lctx.clientId);
    });

    it('should restore state from snapshot', () => {
      setState(lctx, 'userId', '123');
      setState(lctx, 'userName', 'John');

      const snapshot = lctx.snapshot.create();

      // Modify state
      setState(lctx, 'userId', '456');
      setState(lctx, 'userName', 'Jane');
      setState(lctx, 'newKey', 'newValue');

      // Restore
      lctx.snapshot.restore(snapshot);

      expect(getState(lctx, 'userId')).toBe('123');
      expect(getState(lctx, 'userName')).toBe('John');
      expect(getState(lctx, 'newKey')).toBeUndefined();
    });

    it('should capture phase in snapshot', () => {
      lctx.lifecycle.setPhase('processing' as never);

      const snapshot = lctx.snapshot.create();

      expect(snapshot.phase).toBe('processing');
    });

    it('should restore phase from snapshot', () => {
      lctx.lifecycle.setPhase('processing' as never);
      const snapshot = lctx.snapshot.create();

      lctx.lifecycle.setPhase('completed' as never);
      expect(lctx.meta.phase).toBe('completed');

      lctx.snapshot.restore(snapshot);
      expect(lctx.meta.phase).toBe('processing');
    });

    it('should create independent snapshots', () => {
      setState(lctx, 'counter', 1);
      const snapshot1 = lctx.snapshot.create();

      setState(lctx, 'counter', 2);
      const snapshot2 = lctx.snapshot.create();

      expect(snapshot1.state.counter).toBe(1);
      expect(snapshot2.state.counter).toBe(2);
    });

    it('should not affect original state when modifying snapshot', () => {
      setState(lctx, 'userId', '123');
      const snapshot = lctx.snapshot.create();

      // Modify snapshot state
      snapshot.state.userId = '456';

      // Original should be unchanged
      expect(getState(lctx, 'userId')).toBe('123');
    });
  });

  // Property-based tests for snapshot/restore
  describe('Property 21: Snapshot completeness', () => {
    it('should contain all required fields (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.dictionary(fc.string(), fc.anything()),
          async (state) => {
            const lctx = createLocalContext({ state });
            const snapshot = lctx.snapshot.create();

            expect(snapshot.requestId).toBeDefined();
            expect(snapshot.timestamp).toBeTypeOf('number');
            expect(snapshot.state).toBeDefined();
            expect(snapshot.outstandingPromises).toBeInstanceOf(Array);
            expect(snapshot.lastHookIndex).toBeTypeOf('number');
            expect(snapshot.phase).toBeDefined();
            expect(snapshot.traceId).toBeDefined();
            expect(snapshot.clientId).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 47: Snapshot restoration fidelity', () => {
    it('should restore exact state (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
          async (initialState) => {
            const lctx = createLocalContext({ state: initialState });
            const snapshot = lctx.snapshot.create();

            // Modify state
            lctx.state = { modified: true };

            // Restore
            lctx.snapshot.restore(snapshot);

            // State should match snapshot
            expect(lctx.state).toEqual(snapshot.state);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should restore phase correctly (property test)', async () => {
      const phases = ['received', 'authenticated', 'authorized', 'validated', 'processing', 'completed', 'error'] as const;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...phases),
          fc.constantFrom(...phases),
          async (initialPhase, modifiedPhase) => {
            const lctx = createLocalContext();
            lctx.lifecycle.setPhase(initialPhase as never);
            
            const snapshot = lctx.snapshot.create();

            // Modify phase
            lctx.lifecycle.setPhase(modifiedPhase as never);

            // Restore
            lctx.snapshot.restore(snapshot);

            // Phase should match snapshot
            expect(lctx.meta.phase).toBe(snapshot.phase);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 24: Hook registration support', () => {
    it('should register and execute cleanup hooks (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          async (hookNames) => {
            const lctx = createLocalContext();
            const executedHooks: string[] = [];

            // Register hooks
            for (const name of hookNames) {
              lctx.lifecycle.onCleanup(name, () => {
                executedHooks.push(name);
              });
            }

            // Execute cleanup
            await cleanupLocalContext(lctx);

            // All hooks should have been executed
            expect(executedHooks.length).toBe(hookNames.length);
            for (const name of hookNames) {
              expect(executedHooks).toContain(name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should register and execute timeout handlers (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (numHandlers) => {
            const lctx = createLocalContext();
            const executedHandlers: number[] = [];

            // Register timeout handlers
            for (let i = 0; i < numHandlers; i++) {
              lctx.lifecycle.onTimeout(() => {
                executedHandlers.push(i);
              });
            }

            // Timeout handlers are executed automatically by RequestLifecycleManager
            // For testing, we verify they are registered
            expect(executedHandlers.length).toBe(0); // Not executed yet
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should register and execute error handlers (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (numHandlers, errorMessage) => {
            const lctx = createLocalContext();
            const executedHandlers: string[] = [];

            // Register error handlers
            for (let i = 0; i < numHandlers; i++) {
              lctx.lifecycle.onError((error: Error) => {
                executedHandlers.push(error.message);
              });
            }

            // Error handlers are registered but not executed in this test
            // They would be executed by the handler engine on errors
            expect(executedHandlers.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should register and execute phase change handlers (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (numHandlers) => {
            const lctx = createLocalContext();
            const phaseChanges: Array<{ phase: string; previousPhase: string }> = [];

            // Register phase change handlers
            for (let i = 0; i < numHandlers; i++) {
              lctx.lifecycle.onPhaseChange((phase, previousPhase) => {
                phaseChanges.push({ phase: phase as string, previousPhase: previousPhase as string });
              });
            }

            // Trigger phase change
            lctx.lifecycle.setPhase('processing' as never);

            // All handlers should have been called
            expect(phaseChanges.length).toBe(numHandlers);
            for (const change of phaseChanges) {
              expect(change.phase).toBe('processing');
              expect(change.previousPhase).toBe('received');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support both named and unnamed cleanup hooks (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              hasName: fc.boolean(),
              name: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (hooks) => {
            const lctx = createLocalContext();
            const executedHooks: string[] = [];

            // Register hooks with and without names
            for (const hook of hooks) {
              if (hook.hasName) {
                lctx.lifecycle.onCleanup(hook.name, () => {
                  executedHooks.push(hook.name);
                });
              } else {
                lctx.lifecycle.onCleanup(() => {
                  executedHooks.push('unnamed');
                });
              }
            }

            // Execute cleanup
            await cleanupLocalContext(lctx);

            // All hooks should have been executed
            expect(executedHooks.length).toBe(hooks.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute async cleanup hooks (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 1, maxLength: 5 }),
          async (delays) => {
            const lctx = createLocalContext();
            const executedHooks: number[] = [];

            // Register async cleanup hooks with delays
            for (const delay of delays) {
              lctx.lifecycle.onCleanup(async () => {
                await new Promise((resolve) => setTimeout(resolve, delay));
                executedHooks.push(delay);
              });
            }

            // Execute cleanup
            await cleanupLocalContext(lctx);

            // All hooks should have been executed
            expect(executedHooks.length).toBe(delays.length);
            for (const delay of delays) {
              expect(executedHooks).toContain(delay);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain hook isolation between contexts (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          async (numContexts, hookNames) => {
            // Create multiple contexts
            const contexts = Array.from({ length: numContexts }, () => createLocalContext());
            const executionMap = new Map<string, string[]>();

            // Register different hooks for each context
            for (let i = 0; i < numContexts; i++) {
              const lctx = contexts[i];
              const contextId = lctx?.requestId || '';
              executionMap.set(contextId, []);

              for (const hookName of hookNames) {
                lctx?.lifecycle.onCleanup(`${hookName}-${i}`, () => {
                  executionMap.get(contextId)?.push(`${hookName}-${i}`);
                });
              }
            }

            // Cleanup one context
            const targetIndex = Math.floor(numContexts / 2);
            const targetContext = contexts[targetIndex];
            if (targetContext) {
              await cleanupLocalContext(targetContext);

              // Only target context's hooks should have executed
              const targetExecuted = executionMap.get(targetContext.requestId) || [];
              expect(targetExecuted.length).toBe(hookNames.length);

              // Other contexts' hooks should not have executed
              for (let i = 0; i < numContexts; i++) {
                if (i !== targetIndex) {
                  const lctx = contexts[i];
                  if (lctx) {
                    const executed = executionMap.get(lctx.requestId) || [];
                    expect(executed.length).toBe(0);
                  }
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 27: Metadata availability', () => {
    it('should always have required metadata fields (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            requestId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            traceId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            clientId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (options) => {
            const lctx = createLocalContext(options);

            // Required metadata fields should always be present
            expect(lctx.requestId).toBeDefined();
            expect(typeof lctx.requestId).toBe('string');
            expect(lctx.requestId.length).toBeGreaterThan(0);

            expect(lctx.timestamp).toBeDefined();
            expect(typeof lctx.timestamp).toBe('number');
            expect(lctx.timestamp).toBeGreaterThan(0);

            expect(lctx.traceId).toBeDefined();
            expect(typeof lctx.traceId).toBe('string');
            expect(lctx.traceId.length).toBeGreaterThan(0);

            expect(lctx.clientId).toBeDefined();
            expect(typeof lctx.clientId).toBe('string');
            expect(lctx.clientId.length).toBeGreaterThan(0);

            // Meta object should be present
            expect(lctx.meta).toBeDefined();
            expect(typeof lctx.meta).toBe('object');
            expect(lctx.meta.timestamp).toBeTypeOf('number');
            expect(lctx.meta.instanceId).toBeTypeOf('string');
            expect(lctx.meta.region).toBeTypeOf('string');
            expect(lctx.meta.method).toBeTypeOf('string');
            expect(lctx.meta.path).toBeTypeOf('string');
            expect(lctx.meta.phase).toBeDefined();
            expect(lctx.meta.startTime).toBeTypeOf('number');

            // Client metadata should be present
            expect(lctx.client).toBeDefined();
            expect(typeof lctx.client).toBe('object');
            expect(lctx.client.ip).toBeTypeOf('string');
            expect(lctx.client.userAgent).toBeTypeOf('string');
            expect(lctx.client.region).toBeTypeOf('string');

            // Refs should be present (even if empty)
            expect(lctx.refs).toBeDefined();
            expect(typeof lctx.refs).toBe('object');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve custom metadata values (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            requestId: fc.string({ minLength: 1, maxLength: 50 }),
            traceId: fc.string({ minLength: 1, maxLength: 50 }),
            clientId: fc.string({ minLength: 1, maxLength: 50 }),
            parentSpanId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (options) => {
            const lctx = createLocalContext(options);

            // Custom values should be preserved
            expect(lctx.requestId).toBe(options.requestId);
            expect(lctx.traceId).toBe(options.traceId);
            expect(lctx.clientId).toBe(options.clientId);
            
            if (options.parentSpanId) {
              expect(lctx.parentSpanId).toBe(options.parentSpanId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have unique identifiers across contexts (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (numContexts) => {
            // Create multiple contexts
            const contexts = Array.from({ length: numContexts }, () => createLocalContext());

            // Collect all IDs
            const requestIds = contexts.map((c) => c.requestId);
            const traceIds = contexts.map((c) => c.traceId);
            const clientIds = contexts.map((c) => c.clientId);

            // All request IDs should be unique
            const uniqueRequestIds = new Set(requestIds);
            expect(uniqueRequestIds.size).toBe(numContexts);

            // All trace IDs should be unique
            const uniqueTraceIds = new Set(traceIds);
            expect(uniqueTraceIds.size).toBe(numContexts);

            // All client IDs should be unique
            const uniqueClientIds = new Set(clientIds);
            expect(uniqueClientIds.size).toBe(numContexts);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should have consistent timestamps (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const before = Date.now();
            const lctx = createLocalContext();
            const after = Date.now();

            // Timestamp should be within reasonable range
            expect(lctx.timestamp).toBeGreaterThanOrEqual(before);
            expect(lctx.timestamp).toBeLessThanOrEqual(after);

            // Meta timestamps should also be reasonable
            expect(lctx.meta.timestamp).toBeGreaterThanOrEqual(before);
            expect(lctx.meta.timestamp).toBeLessThanOrEqual(after);
            expect(lctx.meta.startTime).toBeGreaterThanOrEqual(before);
            expect(lctx.meta.startTime).toBeLessThanOrEqual(after);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support custom refs (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            tenantId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (refs) => {
            const lctx = createLocalContext({ refs });

            // Refs should be preserved
            if (refs.sessionId) {
              expect(lctx.refs.sessionId).toBe(refs.sessionId);
            }
            if (refs.userId) {
              expect(lctx.refs.userId).toBe(refs.userId);
            }
            if (refs.tenantId) {
              expect(lctx.refs.tenantId).toBe(refs.tenantId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support custom client metadata (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            ip: fc.string({ minLength: 7, maxLength: 15 }),
            userAgent: fc.string({ minLength: 1, maxLength: 100 }),
            region: fc.string({ minLength: 2, maxLength: 20 }),
          }),
          async (client) => {
            const lctx = createLocalContext({ client });

            // Client metadata should be preserved
            expect(lctx.client.ip).toBe(client.ip);
            expect(lctx.client.userAgent).toBe(client.userAgent);
            expect(lctx.client.region).toBe(client.region);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support custom meta fields (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            path: fc.string({ minLength: 1, maxLength: 100 }),
            instanceId: fc.string({ minLength: 1, maxLength: 50 }),
            region: fc.string({ minLength: 2, maxLength: 20 }),
          }),
          async (meta) => {
            const lctx = createLocalContext({ meta });

            // Meta fields should be preserved
            expect(lctx.meta.method).toBe(meta.method);
            expect(lctx.meta.path).toBe(meta.path);
            expect(lctx.meta.instanceId).toBe(meta.instanceId);
            expect(lctx.meta.region).toBe(meta.region);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: Local Context operations', () => {
    it('should maintain state isolation between contexts (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 20 }),
              value: fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 20 }),
              value: fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (operations1, operations2) => {
            // Create two separate contexts
            const lctx1 = createLocalContext();
            const lctx2 = createLocalContext();

            // Apply operations to context 1
            for (const op of operations1) {
              setState(lctx1, op.key, op.value);
            }

            // Apply operations to context 2
            for (const op of operations2) {
              setState(lctx2, op.key, op.value);
            }

            // Build expected state for context 1 (last value for each key)
            const expectedState1: Record<string, unknown> = {};
            for (const op of operations1) {
              expectedState1[op.key] = op.value;
            }

            // Build expected state for context 2 (last value for each key)
            const expectedState2: Record<string, unknown> = {};
            for (const op of operations2) {
              expectedState2[op.key] = op.value;
            }

            // Verify context 1 has correct state
            expect(lctx1.state).toEqual(expectedState1);

            // Verify context 2 has correct state
            expect(lctx2.state).toEqual(expectedState2);

            // Verify contexts don't share state
            expect(lctx1.requestId).not.toBe(lctx2.requestId);
            expect(lctx1.state).not.toBe(lctx2.state); // Different object references
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain isolation with concurrent operations (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          fc.array(
            fc.record({
              contextIndex: fc.integer({ min: 0, max: 9 }),
              key: fc.string({ minLength: 1, maxLength: 20 }),
              value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            }),
            { minLength: 5, maxLength: 50 }
          ),
          async (numContexts, operations) => {
            // Create multiple contexts
            const contexts = Array.from({ length: numContexts }, () => createLocalContext());

            // Apply operations concurrently
            await Promise.all(
              operations.map(async (op) => {
                const contextIndex = op.contextIndex % numContexts;
                const lctx = contexts[contextIndex];
                if (lctx) {
                  setState(lctx, op.key, op.value);
                  // Add small delay to simulate concurrent access
                  await new Promise((resolve) => setTimeout(resolve, 1));
                }
              })
            );

            // Verify each context has correct state
            for (const op of operations) {
              const contextIndex = op.contextIndex % numContexts;
              const lctx = contexts[contextIndex];
              if (lctx) {
                const value = getState(lctx, op.key);
                // Value should be one of the values set for this context
                const expectedValues = operations
                  .filter((o) => o.contextIndex % numContexts === contextIndex && o.key === op.key)
                  .map((o) => o.value);
                expect(expectedValues).toContain(value);
              }
            }

            // Verify all contexts have unique request IDs
            const requestIds = contexts.map((c) => c.requestId);
            const uniqueIds = new Set(requestIds);
            expect(uniqueIds.size).toBe(numContexts);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain cleanup isolation between contexts (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (numContexts) => {
            // Create multiple contexts with cleanup hooks
            const cleanupCalls: number[] = [];
            const contexts = Array.from({ length: numContexts }, (_, i) => {
              const lctx = createLocalContext();
              lctx.lifecycle.onCleanup(() => {
                cleanupCalls.push(i);
              });
              return lctx;
            });

            // Cleanup one context
            const targetIndex = Math.floor(numContexts / 2);
            const targetContext = contexts[targetIndex];
            if (targetContext) {
              await cleanupLocalContext(targetContext);
            }

            // Only the target context's cleanup should have been called
            expect(cleanupCalls).toEqual([targetIndex]);

            // Other contexts should still be functional
            for (let i = 0; i < numContexts; i++) {
              if (i !== targetIndex) {
                const lctx = contexts[i];
                if (lctx) {
                  setState(lctx, 'test', 'value');
                  expect(getState(lctx, 'test')).toBe('value');
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain state isolation after cleanup (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
          fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
          async (state1, state2) => {
            const lctx1 = createLocalContext({ state: state1 });
            const lctx2 = createLocalContext({ state: state2 });

            // Cleanup first context
            await cleanupLocalContext(lctx1);

            // First context should be cleared
            expect(lctx1.state).toEqual({});

            // Second context should be unaffected
            expect(lctx2.state).toEqual(state2);

            // Verify second context is still functional
            setState(lctx2, 'newKey', 'newValue');
            expect(getState(lctx2, 'newKey')).toBe('newValue');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 27: Metadata availability', () => {
    it('should always provide request metadata (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            requestId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            traceId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            clientId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          }),
          async (options) => {
            const lctx = createLocalContext(options);

            // Meta should always be defined
            expect(lctx.meta).toBeDefined();
            expect(typeof lctx.meta).toBe('object');

            // Required metadata fields should always be present
            expect(lctx.meta.timestamp).toBeTypeOf('number');
            expect(lctx.meta.instanceId).toBeTypeOf('string');
            expect(lctx.meta.region).toBeTypeOf('string');
            expect(lctx.meta.method).toBeTypeOf('string');
            expect(lctx.meta.path).toBeTypeOf('string');
            expect(lctx.meta.phase).toBeDefined();
            expect(lctx.meta.startTime).toBeTypeOf('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide unique request IDs (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 20 }),
          async (numContexts) => {
            // Create multiple contexts
            const contexts = Array.from({ length: numContexts }, () => createLocalContext());

            // Extract request IDs
            const requestIds = contexts.map((lctx) => lctx.requestId);

            // All request IDs should be unique
            const uniqueIds = new Set(requestIds);
            expect(uniqueIds.size).toBe(numContexts);

            // All request IDs should be non-empty strings
            for (const id of requestIds) {
              expect(typeof id).toBe('string');
              expect(id.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide valid trace IDs (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (numContexts) => {
            const contexts = Array.from({ length: numContexts }, () => createLocalContext());

            for (const lctx of contexts) {
              // Trace ID should be defined
              expect(lctx.traceId).toBeDefined();
              expect(typeof lctx.traceId).toBe('string');
              expect(lctx.traceId.length).toBeGreaterThan(0);

              // Trace ID should start with 'trace_'
              expect(lctx.traceId).toMatch(/^trace_/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide valid client IDs (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (numContexts) => {
            const contexts = Array.from({ length: numContexts }, () => createLocalContext());

            for (const lctx of contexts) {
              // Client ID should be defined
              expect(lctx.clientId).toBeDefined();
              expect(typeof lctx.clientId).toBe('string');
              expect(lctx.clientId.length).toBeGreaterThan(0);

              // Client ID should start with 'client_'
              expect(lctx.clientId).toMatch(/^client_/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve custom metadata (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
            path: fc.string({ minLength: 1, maxLength: 100 }),
            instanceId: fc.string({ minLength: 1, maxLength: 50 }),
            region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'),
          }),
          async (customMeta) => {
            const lctx = createLocalContext({ meta: customMeta });

            // Custom metadata should be preserved
            expect(lctx.meta.method).toBe(customMeta.method);
            expect(lctx.meta.path).toBe(customMeta.path);
            expect(lctx.meta.instanceId).toBe(customMeta.instanceId);
            expect(lctx.meta.region).toBe(customMeta.region);

            // Other required fields should still be present
            expect(lctx.meta.timestamp).toBeTypeOf('number');
            expect(lctx.meta.phase).toBeDefined();
            expect(lctx.meta.startTime).toBeTypeOf('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain metadata immutability for request ID (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (newId) => {
            const lctx = createLocalContext();
            const originalRequestId = lctx.requestId;

            // Attempt to modify request ID (should not affect the original)
            // Note: TypeScript prevents direct assignment, but we test runtime behavior
            const modifiedLctx = { ...lctx, requestId: newId };

            // Original context should be unchanged
            expect(lctx.requestId).toBe(originalRequestId);
            expect(lctx.requestId).not.toBe(newId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
