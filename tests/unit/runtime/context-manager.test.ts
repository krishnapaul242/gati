/**
 * @file Unit tests for context manager orchestration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContextManager,
  createContextManager,
} from '../../../src/runtime/context-manager';

describe('ContextManager', () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = createContextManager();
  });

  describe('createContextManager', () => {
    it('should create a new context manager instance', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(ContextManager);
    });
  });

  describe('initializeGlobalContext', () => {
    it('should initialize global context', () => {
      const gctx = manager.initializeGlobalContext();

      expect(gctx).toBeDefined();
      expect(gctx.modules).toEqual({});
      expect(gctx.config).toEqual({});
      expect(gctx.state).toEqual({});
    });

    it('should initialize global context with options', () => {
      const gctx = manager.initializeGlobalContext({
        config: { port: 3000 },
        state: { version: '1.0.0' },
      });

      expect(gctx.config).toEqual({ port: 3000 });
      expect(gctx.state).toEqual({ version: '1.0.0' });
    });

    it('should throw error if already initialized', () => {
      manager.initializeGlobalContext();

      expect(() => {
        manager.initializeGlobalContext();
      }).toThrow('Global context is already initialized');
    });
  });

  describe('getGlobalContext', () => {
    it('should return null if not initialized', () => {
      expect(manager.getGlobalContext()).toBeNull();
    });

    it('should return global context after initialization', () => {
      const gctx = manager.initializeGlobalContext();
      const retrieved = manager.getGlobalContext();

      expect(retrieved).toBe(gctx);
    });
  });

  describe('createRequestContext', () => {
    it('should create a new request context', () => {
      const lctx = manager.createRequestContext();

      expect(lctx).toBeDefined();
      expect(lctx.requestId).toBeDefined();
      expect(lctx.timestamp).toBeTypeOf('number');
      expect(lctx.state).toEqual({});
    });

    it('should create a request context with options', () => {
      const lctx = manager.createRequestContext({
        requestId: 'custom-id',
        state: { userId: '123' },
      });

      expect(lctx.requestId).toBe('custom-id');
      expect(lctx.state).toEqual({ userId: '123' });
    });

    it('should create multiple independent request contexts', () => {
      const lctx1 = manager.createRequestContext();
      const lctx2 = manager.createRequestContext();

      expect(lctx1.requestId).not.toBe(lctx2.requestId);
      expect(lctx1).not.toBe(lctx2);
    });
  });

  describe('cleanupRequestContext', () => {
    it('should cleanup a request context', async () => {
      const lctx = manager.createRequestContext();
      lctx.state['key'] = 'value';

      await manager.cleanupRequestContext(lctx);

      expect(lctx.state).toEqual({});
      expect(lctx.lifecycle.isCleaningUp()).toBe(true);
    });

    it('should execute cleanup hooks', async () => {
      const lctx = manager.createRequestContext();
      let cleanupCalled = false;

      lctx.lifecycle.onCleanup(() => {
        cleanupCalled = true;
      });

      await manager.cleanupRequestContext(lctx);

      expect(cleanupCalled).toBe(true);
    });
  });

  describe('shutdown', () => {
    it('should shutdown global context', async () => {
      const gctx = manager.initializeGlobalContext();

      await manager.shutdown();

      expect(gctx.lifecycle.isShuttingDown()).toBe(true);
      expect(manager.getGlobalContext()).toBeNull();
    });

    it('should execute shutdown hooks', async () => {
      const gctx = manager.initializeGlobalContext();
      let shutdownCalled = false;

      gctx.lifecycle.onShutdown(() => {
        shutdownCalled = true;
      });

      await manager.shutdown();

      expect(shutdownCalled).toBe(true);
    });

    it('should handle shutdown when not initialized', async () => {
      await expect(manager.shutdown()).resolves.not.toThrow();
    });

    it('should allow re-initialization after shutdown', async () => {
      manager.initializeGlobalContext();
      await manager.shutdown();

      const gctx = manager.initializeGlobalContext();
      expect(gctx).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should handle full request lifecycle', async () => {
      // Initialize global context
      const gctx = manager.initializeGlobalContext({
        config: { appName: 'test-app' },
      });

      // Create request context
      const lctx = manager.createRequestContext({
        state: { userId: '123' },
      });

      // Simulate request processing
      expect(gctx.config['appName']).toBe('test-app');
      expect(lctx.state['userId']).toBe('123');

      // Cleanup request
      await manager.cleanupRequestContext(lctx);

      expect(lctx.lifecycle.isCleaningUp()).toBe(true);

      // Shutdown application
      await manager.shutdown();

      expect(gctx.lifecycle.isShuttingDown()).toBe(true);
    });

    it('should handle multiple requests with cleanup', async () => {
      manager.initializeGlobalContext();

      const lctx1 = manager.createRequestContext();
      const lctx2 = manager.createRequestContext();

      lctx1.state['req'] = 'req1';
      lctx2.state['req'] = 'req2';

      await manager.cleanupRequestContext(lctx1);

      expect(lctx1.lifecycle.isCleaningUp()).toBe(true);
      expect(lctx2.lifecycle.isCleaningUp()).toBe(false);

      await manager.cleanupRequestContext(lctx2);

      expect(lctx2.lifecycle.isCleaningUp()).toBe(true);
    });
  });
});
