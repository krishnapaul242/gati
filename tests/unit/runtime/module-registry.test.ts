/**
 * @module tests/unit/runtime/module-registry.test
 * @description Unit tests for module registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createModuleRegistry } from '@gati-framework/runtime/module-registry';
import { ModuleError, ModuleNotFoundError } from '@gati-framework/runtime/types/module';
import type { Module } from '@gati-framework/runtime/types/module';

describe('ModuleRegistry', () => {
  function createMockModule(name: string): Module {
    return {
      name,
      version: '1.0.0',
      exports: { test: true },
    };
  }

  let registry: ReturnType<typeof createModuleRegistry>;

  beforeEach(() => {
    registry = createModuleRegistry();
  });

  describe('register', () => {
    it('should register a new module', () => {
      const module = createMockModule('test-module');

      registry.register(module);

      expect(registry.has('test-module')).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it('should throw error if module already registered', () => {
      const module = createMockModule('test-module');

      registry.register(module);

      expect(() => registry.register(module)).toThrow(ModuleError);
      expect(() => registry.register(module)).toThrow(
        'Module already registered: test-module'
      );
    });

    it('should set initial state to uninitialized', () => {
      const module = createMockModule('test-module');

      registry.register(module);

      const metadata = registry.get('test-module');
      expect(metadata.state).toBe('uninitialized');
      expect(metadata.usageCount).toBe(0);
    });
  });

  describe('unregister', () => {
    it('should unregister an existing module', () => {
      const module = createMockModule('test-module');
      registry.register(module);

      const result = registry.unregister('test-module');

      expect(result).toBe(true);
      expect(registry.has('test-module')).toBe(false);
    });

    it('should return false if module not found', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should retrieve module metadata', () => {
      const module = createMockModule('test-module');
      registry.register(module);

      const metadata = registry.get('test-module');

      expect(metadata.module).toBe(module);
      expect(metadata.state).toBe('uninitialized');
    });

    it('should throw ModuleNotFoundError if module not found', () => {
      expect(() => registry.get('non-existent')).toThrow(ModuleNotFoundError);
    });
  });

  describe('tryGet', () => {
    it('should return module metadata if exists', () => {
      const module = createMockModule('test-module');
      registry.register(module);

      const metadata = registry.tryGet('test-module');

      expect(metadata).toBeDefined();
      expect(metadata?.module.name).toBe('test-module');
    });

    it('should return undefined if module not found', () => {
      const metadata = registry.tryGet('non-existent');

      expect(metadata).toBeUndefined();
    });
  });

  describe('updateState', () => {
    it('should update module state', () => {
      const module = createMockModule('test-module');
      registry.register(module);

      registry.updateState('test-module', 'initialized');

      const metadata = registry.get('test-module');
      expect(metadata.state).toBe('initialized');
    });

    it('should set initializedAt when state is initialized', () => {
      const module = createMockModule('test-module');
      registry.register(module);

      registry.updateState('test-module', 'initialized');

      const metadata = registry.get('test-module');
      expect(metadata.initializedAt).toBeInstanceOf(Date);
    });

    it('should store error when state is error', () => {
      const module = createMockModule('test-module');
      registry.register(module);
      const error = new Error('Test error');

      registry.updateState('test-module', 'error', error);

      const metadata = registry.get('test-module');
      expect(metadata.state).toBe('error');
      expect(metadata.error).toBe(error);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count', () => {
      const module = createMockModule('test-module');
      registry.register(module);

      registry.incrementUsage('test-module');
      registry.incrementUsage('test-module');

      const metadata = registry.get('test-module');
      expect(metadata.usageCount).toBe(2);
    });
  });

  describe('getModuleNames', () => {
    it('should return all registered module names', () => {
      registry.register(createMockModule('module-a'));
      registry.register(createMockModule('module-b'));
      registry.register(createMockModule('module-c'));

      const names = registry.getModuleNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('module-a');
      expect(names).toContain('module-b');
      expect(names).toContain('module-c');
    });
  });

  describe('getModulesByState', () => {
    it('should return modules filtered by state', () => {
      registry.register(createMockModule('module-a'));
      registry.register(createMockModule('module-b'));
      registry.register(createMockModule('module-c'));

      registry.updateState('module-a', 'initialized');
      registry.updateState('module-b', 'initialized');
      registry.updateState('module-c', 'error', new Error());

      const initialized = registry.getModulesByState('initialized');
      expect(initialized).toHaveLength(2);

      const errors = registry.getModulesByState('error');
      expect(errors).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('should return module statistics', () => {
      registry.register(createMockModule('module-a'));
      registry.register(createMockModule('module-b'));
      registry.register(createMockModule('module-c'));

      registry.updateState('module-a', 'initialized');
      registry.updateState('module-b', 'initializing');
      registry.incrementUsage('module-a');
      registry.incrementUsage('module-a');

      const stats = registry.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.initialized).toBe(1);
      expect(stats.initializing).toBe(1);
      expect(stats.uninitialized).toBe(1);
      expect(stats.totalUsage).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all modules', () => {
      registry.register(createMockModule('module-a'));
      registry.register(createMockModule('module-b'));

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.getModuleNames()).toEqual([]);
    });
  });
});
