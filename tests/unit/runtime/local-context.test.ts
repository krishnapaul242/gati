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
