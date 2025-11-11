/**
 * @file Unit tests for global context manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGlobalContext,
  registerModule,
  getModule,
  shutdownGlobalContext,
} from '@gati-framework/runtime/global-context';
import type { GlobalContext } from '@gati-framework/runtime/types/context';

describe('GlobalContext', () => {
  let gctx: GlobalContext;

  beforeEach(() => {
    gctx = createGlobalContext();
  });

  describe('createGlobalContext', () => {
    it('should create a global context with default values', () => {
      expect(gctx).toBeDefined();
      expect(gctx.modules).toEqual({});
      expect(gctx.config).toEqual({});
      expect(gctx.state).toEqual({});
      expect(gctx.lifecycle).toBeDefined();
      expect(gctx.lifecycle.onShutdown).toBeTypeOf('function');
      expect(gctx.lifecycle.isShuttingDown).toBeTypeOf('function');
    });

    it('should create a global context with provided options', () => {
      const modules = { db: { connect: () => 'connected' } };
      const config = { port: 3000 };
      const state = { version: '1.0.0' };

      gctx = createGlobalContext({ modules, config, state });

      expect(gctx.modules).toEqual(modules);
      expect(gctx.config).toEqual(config);
      expect(gctx.state).toEqual(state);
    });

    it('should initialize isShuttingDown as false', () => {
      expect(gctx.lifecycle.isShuttingDown()).toBe(false);
    });
  });

  describe('registerModule', () => {
    it('should register a module in global context', () => {
      const module = { test: 'value' };
      registerModule(gctx, 'testModule', module);

      expect(gctx.modules['testModule']).toEqual(module);
    });

    it('should throw error if module already exists', () => {
      const module = { test: 'value' };
      registerModule(gctx, 'testModule', module);

      expect(() => {
        registerModule(gctx, 'testModule', module);
      }).toThrow('Module "testModule" is already registered');
    });
  });

  describe('getModule', () => {
    it('should retrieve a registered module', () => {
      const module = { test: 'value' };
      registerModule(gctx, 'testModule', module);

      const retrieved = getModule(gctx, 'testModule');
      expect(retrieved).toEqual(module);
    });

    it('should return undefined for non-existent module', () => {
      const retrieved = getModule(gctx, 'nonExistent');
      expect(retrieved).toBeUndefined();
    });

    it('should support typed module retrieval', () => {
      interface TestModule {
        value: string;
      }

      const module: TestModule = { value: 'test' };
      registerModule(gctx, 'testModule', module);

      const retrieved = getModule<TestModule>(gctx, 'testModule');
      expect(retrieved?.value).toBe('test');
    });
  });

  describe('shutdown lifecycle', () => {
    it('should register shutdown hooks', () => {
      let called = false;
      gctx.lifecycle.onShutdown(() => {
        called = true;
      });

      expect(called).toBe(false); // Not called yet
    });

    it('should execute shutdown hooks on shutdown', async () => {
      const calls: string[] = [];

      gctx.lifecycle.onShutdown(() => {
        calls.push('hook1');
      });

      gctx.lifecycle.onShutdown(() => {
        calls.push('hook2');
      });

      await shutdownGlobalContext(gctx);

      expect(calls).toContain('hook1');
      expect(calls).toContain('hook2');
    });

    it('should execute async shutdown hooks', async () => {
      let resolved = false;

      gctx.lifecycle.onShutdown(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        resolved = true;
      });

      await shutdownGlobalContext(gctx);

      expect(resolved).toBe(true);
    });

    it('should mark context as shutting down', async () => {
      expect(gctx.lifecycle.isShuttingDown()).toBe(false);

      const shutdownPromise = shutdownGlobalContext(gctx);

      await shutdownPromise;

      expect(gctx.lifecycle.isShuttingDown()).toBe(true);
    });

    it('should execute multiple shutdown hooks in parallel', async () => {
      const start = Date.now();
      const delay = 50;

      gctx.lifecycle.onShutdown(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
      });

      gctx.lifecycle.onShutdown(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
      });

      await shutdownGlobalContext(gctx);

      const elapsed = Date.now() - start;

      // If parallel, should take ~50ms, not ~100ms
      // Using 2x tolerance to account for system variance
      expect(elapsed).toBeLessThan(delay * 2);
    });
  });

  describe('state management', () => {
    it('should allow setting and getting state', () => {
      gctx.state['key1'] = 'value1';
      gctx.state['key2'] = { nested: 'value2' };

      expect(gctx.state['key1']).toBe('value1');
      expect(gctx.state['key2']).toEqual({ nested: 'value2' });
    });

    it('should maintain state across operations', () => {
      gctx.state['counter'] = 0;

      gctx.state['counter'] = (gctx.state['counter'] as number) + 1;
      gctx.state['counter'] = (gctx.state['counter'] as number) + 1;

      expect(gctx.state['counter']).toBe(2);
    });
  });

  describe('config management', () => {
    it('should allow setting and getting config', () => {
      gctx.config['port'] = 3000;
      gctx.config['host'] = 'localhost';

      expect(gctx.config['port']).toBe(3000);
      expect(gctx.config['host']).toBe('localhost');
    });

    it('should allow modifying config after creation', () => {
      const originalConfig = { port: 3000 };
      gctx = createGlobalContext({ config: originalConfig });

      gctx.config['port'] = 4000;

      // Config is stored by reference, not deep copied
      expect(gctx.config['port']).toBe(4000);
      expect(originalConfig.port).toBe(4000); // Original also changed
    });
  });
});
