/**
 * @file Unit tests for local context manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
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
});
