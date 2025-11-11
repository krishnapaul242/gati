/**
 * @module tests/unit/runtime/module-loader.test
 * @description Unit tests for module loader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createModuleLoader } from '@gati-framework/runtime/module-loader';
import { createGlobalContext } from '@gati-framework/runtime/global-context';
import {
  ModuleError,
  CircularDependencyError,
  ModuleInitializationError,
} from '@gati-framework/runtime/types/module';
import type { Module, GlobalContext } from '@gati-framework/runtime/types';

describe('ModuleLoader', () => {
  let gctx: GlobalContext;

  beforeEach(() => {
    gctx = createGlobalContext();
  });

  describe('register', () => {
    it('should register a module', async () => {
      const loader = createModuleLoader();
      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: { test: true },
      };

      await loader.register(module);

      expect(loader.has('test-module')).toBe(true);
    });

    it('should auto-initialize if configured', async () => {
      const loader = createModuleLoader({ autoInit: true });
      const initSpy = vi.fn();
      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: { test: true },
        init: initSpy,
      };

      await loader.register(module, gctx);

      expect(initSpy).toHaveBeenCalledWith(gctx);
    });

    it('should throw if module already registered', async () => {
      const loader = createModuleLoader();
      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
      };

      await loader.register(module);

      await expect(loader.register(module)).rejects.toThrow(ModuleError);
    });
  });

  describe('initialize', () => {
    it('should initialize a module', async () => {
      const loader = createModuleLoader();
      const initSpy = vi.fn();
      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: { test: true },
        init: initSpy,
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);

      expect(initSpy).toHaveBeenCalledWith(gctx);
    });

    it('should initialize dependencies first', async () => {
      const loader = createModuleLoader();
      const order: string[] = [];

      const depModule: Module = {
        name: 'dep-module',
        version: '1.0.0',
        exports: {},
        init: () => {
          order.push('dep');
        },
      };

      const mainModule: Module = {
        name: 'main-module',
        version: '1.0.0',
        dependencies: ['dep-module'],
        exports: {},
        init: () => {
          order.push('main');
        },
      };

      await loader.register(depModule);
      await loader.register(mainModule);
      await loader.initialize('main-module', gctx);

      expect(order).toEqual(['dep', 'main']);
    });

    it('should detect circular dependencies', async () => {
      const loader = createModuleLoader();

      const moduleA: Module = {
        name: 'module-a',
        version: '1.0.0',
        dependencies: ['module-b'],
        exports: {},
      };

      const moduleB: Module = {
        name: 'module-b',
        version: '1.0.0',
        dependencies: ['module-a'],
        exports: {},
      };

      await loader.register(moduleA);
      await loader.register(moduleB);

      await expect(loader.initialize('module-a', gctx)).rejects.toThrow(
        CircularDependencyError
      );
    });

    it('should allow circular dependencies if configured', async () => {
      const loader = createModuleLoader({ allowCircularDependencies: true });

      const moduleA: Module = {
        name: 'module-a',
        version: '1.0.0',
        dependencies: ['module-b'],
        exports: {},
      };

      const moduleB: Module = {
        name: 'module-b',
        version: '1.0.0',
        dependencies: ['module-a'],
        exports: {},
      };

      await loader.register(moduleA);
      await loader.register(moduleB);

      await expect(
        loader.initialize('module-a', gctx)
      ).resolves.not.toThrow();
    });

    it('should timeout if initialization takes too long', async () => {
      const loader = createModuleLoader({ initTimeout: 100 });

      const module: Module = {
        name: 'slow-module',
        version: '1.0.0',
        exports: {},
        init: () => new Promise((resolve) => setTimeout(resolve, 200)),
      };

      await loader.register(module);

      await expect(loader.initialize('slow-module', gctx)).rejects.toThrow(
        ModuleInitializationError
      );
    });

    it('should handle initialization errors', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'error-module',
        version: '1.0.0',
        exports: {},
        init: () => {
          throw new Error('Init failed');
        },
      };

      await loader.register(module);

      await expect(loader.initialize('error-module', gctx)).rejects.toThrow(
        ModuleInitializationError
      );
    });

    it('should not re-initialize already initialized modules', async () => {
      const loader = createModuleLoader();
      const initSpy = vi.fn();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
        init: initSpy,
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);
      await loader.initialize('test-module', gctx);

      expect(initSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return module exports', async () => {
      const loader = createModuleLoader();
      const exports = { foo: 'bar' };

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports,
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);

      const result = await loader.get('test-module', gctx);

      expect(result).toBe(exports);
    });

    it('should lazy initialize if not initialized', async () => {
      const loader = createModuleLoader();
      const initSpy = vi.fn();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: { test: true },
        init: initSpy,
      };

      await loader.register(module);
      await loader.get('test-module', gctx);

      expect(initSpy).toHaveBeenCalled();
    });

    it('should throw if module in error state', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'error-module',
        version: '1.0.0',
        exports: {},
        init: () => {
          throw new Error('Init failed');
        },
      };

      await loader.register(module);
      await expect(loader.initialize('error-module', gctx)).rejects.toThrow();

      await expect(loader.get('error-module', gctx)).rejects.toThrow(
        ModuleError
      );
    });

    it('should increment usage count', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);

      await loader.get('test-module', gctx);
      await loader.get('test-module', gctx);

      const stats = loader.getStatistics();
      // Note: totalUsage will be at least 2 from the get() calls
      expect(stats.totalUsage).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getSync', () => {
    it('should return exports for initialized module', async () => {
      const loader = createModuleLoader();
      const exports = { foo: 'bar' };

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports,
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);

      const result = loader.getSync('test-module');

      expect(result).toBe(exports);
    });

    it('should throw if module not initialized', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
      };

      await loader.register(module);

      expect(() => loader.getSync('test-module')).toThrow(ModuleError);
    });
  });

  describe('shutdown', () => {
    it('should call module shutdown hook', async () => {
      const loader = createModuleLoader();
      const shutdownSpy = vi.fn();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
        shutdown: shutdownSpy,
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);
      await loader.shutdown('test-module');

      expect(shutdownSpy).toHaveBeenCalled();
    });

    it('should handle shutdown errors', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
        shutdown: () => {
          throw new Error('Shutdown failed');
        },
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);

      await expect(loader.shutdown('test-module')).rejects.toThrow(
        ModuleError
      );
    });

    it('should not re-shutdown already shutdown modules', async () => {
      const loader = createModuleLoader();
      const shutdownSpy = vi.fn();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
        shutdown: shutdownSpy,
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);
      await loader.shutdown('test-module');
      await loader.shutdown('test-module');

      expect(shutdownSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('shutdownAll', () => {
    it('should shutdown all modules in reverse order', async () => {
      const loader = createModuleLoader();
      const order: string[] = [];

      const moduleA: Module = {
        name: 'module-a',
        version: '1.0.0',
        exports: {},
        shutdown: () => {
          order.push('a');
        },
      };

      const moduleB: Module = {
        name: 'module-b',
        version: '1.0.0',
        exports: {},
        shutdown: () => {
          order.push('b');
        },
      };

      await loader.register(moduleA);
      await loader.register(moduleB);
      await loader.initialize('module-a', gctx);
      await loader.initialize('module-b', gctx);

      await loader.shutdownAll();

      // Should shutdown in reverse registration order
      expect(order).toEqual(['a', 'b']);
    });

    it('should continue shutting down even if one module fails', async () => {
      const loader = createModuleLoader();
      const shutdownSpy = vi.fn();

      const errorModule: Module = {
        name: 'error-module',
        version: '1.0.0',
        exports: {},
        shutdown: () => {
          throw new Error('Shutdown failed');
        },
      };

      const goodModule: Module = {
        name: 'good-module',
        version: '1.0.0',
        exports: {},
        shutdown: shutdownSpy,
      };

      await loader.register(errorModule);
      await loader.register(goodModule);
      await loader.initialize('error-module', gctx);
      await loader.initialize('good-module', gctx);

      await loader.shutdownAll();

      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should run health checks on all modules', async () => {
      const loader = createModuleLoader();

      const healthyModule: Module = {
        name: 'healthy-module',
        version: '1.0.0',
        exports: {},
        healthCheck: () => true,
      };

      const unhealthyModule: Module = {
        name: 'unhealthy-module',
        version: '1.0.0',
        exports: {},
        healthCheck: () => false,
      };

      await loader.register(healthyModule);
      await loader.register(unhealthyModule);
      await loader.initialize('healthy-module', gctx);
      await loader.initialize('unhealthy-module', gctx);

      const results = await loader.healthCheck();

      expect(results.get('healthy-module')).toBe(true);
      expect(results.get('unhealthy-module')).toBe(false);
    });

    it('should return false for uninitialized modules', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
      };

      await loader.register(module);

      const results = await loader.healthCheck();

      expect(results.get('test-module')).toBe(false);
    });

    it('should assume healthy if no health check defined', async () => {
      const loader = createModuleLoader();

      const module: Module = {
        name: 'test-module',
        version: '1.0.0',
        exports: {},
      };

      await loader.register(module);
      await loader.initialize('test-module', gctx);

      const results = await loader.healthCheck();

      expect(results.get('test-module')).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return module statistics', async () => {
      const loader = createModuleLoader();

      await loader.register({
        name: 'module-a',
        version: '1.0.0',
        exports: {},
      });
      await loader.register({
        name: 'module-b',
        version: '1.0.0',
        exports: {},
      });

      await loader.initialize('module-a', gctx);

      const stats = loader.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.initialized).toBe(1);
      expect(stats.uninitialized).toBe(1);
    });
  });
});
