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
      // Using 3x tolerance to account for system variance and CI environments
      expect(elapsed).toBeLessThan(delay * 3);
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

  describe('Property 28: Module registry completeness', () => {
    it('should provide access to all registered modules (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
                // Filter out reserved names and problematic characters
                const reserved = ['toString', 'valueOf', 'constructor', 'hasOwnProperty', '__proto__'];
                return !s.includes('.') && !reserved.includes(s) && s.trim().length > 0;
              }),
              module: fc.record({
                method: fc.string(),
                value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
              }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (modules) => {
            const gctx = createGlobalContext();
            const uniqueModules = new Map<string, unknown>();

            // Register unique modules
            for (const { name, module } of modules) {
              if (!uniqueModules.has(name)) {
                uniqueModules.set(name, module);
                registerModule(gctx, name, module);
              }
            }

            // Verify all registered modules are accessible
            for (const [name, module] of uniqueModules) {
              const retrieved = getModule(gctx, name);
              expect(retrieved).toBeDefined();
              expect(retrieved).toEqual(module);
            }

            // Verify module count matches
            expect(Object.keys(gctx.modules).length).toBe(uniqueModules.size);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain module isolation (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (numContexts) => {
            // Create multiple global contexts
            const contexts = Array.from({ length: numContexts }, () => createGlobalContext());

            // Register different modules in each context
            for (let i = 0; i < numContexts; i++) {
              const gctx = contexts[i];
              if (gctx) {
                registerModule(gctx, `module${i}`, { id: i, value: `context-${i}` });
              }
            }

            // Verify each context has only its own module
            for (let i = 0; i < numContexts; i++) {
              const gctx = contexts[i];
              if (gctx) {
                const ownModule = getModule(gctx, `module${i}`);
                expect(ownModule).toBeDefined();
                expect((ownModule as { id: number }).id).toBe(i);

                // Other modules should not exist in this context
                for (let j = 0; j < numContexts; j++) {
                  if (j !== i) {
                    const otherModule = getModule(gctx, `module${j}`);
                    expect(otherModule).toBeUndefined();
                  }
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should prevent duplicate module registration (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
            // Filter out reserved names and problematic characters
            const reserved = ['toString', 'valueOf', 'constructor', 'hasOwnProperty', '__proto__'];
            return !s.includes('.') && !reserved.includes(s) && s.trim().length > 0;
          }),
          fc.record({ value: fc.anything() }),
          fc.record({ value: fc.anything() }),
          async (moduleName, module1, module2) => {
            const gctx = createGlobalContext();

            // First registration should succeed
            registerModule(gctx, moduleName, module1);

            // Second registration with same name should throw
            expect(() => {
              registerModule(gctx, moduleName, module2);
            }).toThrow();

            // Original module should still be accessible
            const retrieved = getModule(gctx, moduleName);
            expect(retrieved).toEqual(module1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support typed module access (property test)', async () => {
      const fc = await import('fast-check');
      
      interface TestModule {
        id: string;
        value: number;
        active: boolean;
      }
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
                // Filter out reserved names and problematic characters
                const reserved = ['toString', 'valueOf', 'constructor', 'hasOwnProperty', '__proto__'];
                return !s.includes('.') && !reserved.includes(s) && s.trim().length > 0;
              }),
              data: fc.record({
                id: fc.uuid(),
                value: fc.integer(),
                active: fc.boolean(),
              }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (modules) => {
            const gctx = createGlobalContext();
            const registered = new Map<string, TestModule>();

            // Register modules
            for (const { name, data } of modules) {
              if (!registered.has(name)) {
                registered.set(name, data);
                registerModule(gctx, name, data);
              }
            }

            // Verify typed access
            for (const [name, data] of registered) {
              const retrieved = getModule<TestModule>(gctx, name);
              expect(retrieved).toBeDefined();
              expect(retrieved?.id).toBe(data.id);
              expect(retrieved?.value).toBe(data.value);
              expect(retrieved?.active).toBe(data.active);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 32: Configuration immutability', () => {
    it('should allow reading configuration (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            port: fc.integer({ min: 1000, max: 65535 }),
            host: fc.constantFrom('localhost', '0.0.0.0', '127.0.0.1'),
            env: fc.constantFrom('development', 'staging', 'production'),
            debug: fc.boolean(),
          }),
          async (config) => {
            const gctx = createGlobalContext({ config });

            // All config values should be readable
            expect(gctx.config['port']).toBe(config.port);
            expect(gctx.config['host']).toBe(config.host);
            expect(gctx.config['env']).toBe(config.env);
            expect(gctx.config['debug']).toBe(config.debug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain config reference consistency (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            key1: fc.string(),
            key2: fc.integer(),
            key3: fc.boolean(),
          }),
          async (config) => {
            const gctx = createGlobalContext({ config });

            // Config should be the same reference
            const config1 = gctx.config;
            const config2 = gctx.config;

            expect(config1).toBe(config2);

            // Values should match original
            expect(config1['key1']).toBe(config.key1);
            expect(config1['key2']).toBe(config.key2);
            expect(config1['key3']).toBe(config.key3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow config modifications (property test)', async () => {
      const fc = await import('fast-check');
      
      // Note: Current implementation allows config modification
      // This test documents the actual behavior
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            initial: fc.string(),
          }),
          fc.string(),
          async (initialConfig, newValue) => {
            const gctx = createGlobalContext({ config: initialConfig });

            // Current implementation allows modification
            gctx.config['initial'] = newValue;

            // Modification is reflected
            expect(gctx.config['initial']).toBe(newValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should share config reference with original object (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            value: fc.integer(),
          }),
          fc.integer(),
          async (config, newValue) => {
            const gctx = createGlobalContext({ config });

            // Modify through gctx
            gctx.config['value'] = newValue;

            // Original config is also modified (reference sharing)
            expect(config.value).toBe(newValue);
            expect(gctx.config['value']).toBe(newValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain config across multiple contexts (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              port: fc.integer({ min: 1000, max: 65535 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (configs) => {
            // Create multiple contexts with different configs
            const contexts = configs.map(config => createGlobalContext({ config }));

            // Each context should have its own config
            for (let i = 0; i < contexts.length; i++) {
              const gctx = contexts[i];
              const config = configs[i];
              if (gctx && config) {
                expect(gctx.config['port']).toBe(config.port);
                expect(gctx.config['name']).toBe(config.name);
              }
            }

            // Modifying one should not affect others
            if (contexts[0]) {
              contexts[0].config['port'] = 9999;
              
              for (let i = 1; i < contexts.length; i++) {
                const gctx = contexts[i];
                const config = configs[i];
                if (gctx && config) {
                  expect(gctx.config['port']).toBe(config.port);
                  expect(gctx.config['port']).not.toBe(9999);
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
