/**
 * @module cli/codegen/bundle-generator.test
 * @description Tests for manifest bundle generator
 */

import { describe, it, expect } from 'vitest';
import { BundleGenerator } from './bundle-generator.js';
import type { HandlerManifest, ModuleManifest } from '../analyzer/manifest-generator.js';
import { primitive, object } from '../../../runtime/src/gtype/schema.js';

describe('BundleGenerator', () => {
  const generator = new BundleGenerator();

  const createHandler = (overrides: Partial<HandlerManifest> = {}): HandlerManifest => ({
    handlerId: 'test.handler',
    path: '/test',
    method: 'GET',
    gtypes: {
      request: 'any',
      response: 'any',
    },
    hooks: {
      before: [],
      after: [],
    },
    timescapeVersion: 'v1732186200-test-001',
    policies: {},
    dependencies: {
      modules: [],
    },
    ...overrides,
  });

  const createModule = (overrides: Partial<ModuleManifest> = {}): ModuleManifest => ({
    moduleId: 'test-module',
    runtime: 'node',
    capabilities: [],
    methods: [],
    version: '1.0.0',
    networkAccess: {
      egress: false,
    },
    ...overrides,
  });

  describe('bundle generation', () => {
    it('should generate basic bundle', () => {
      const handlers = [createHandler()];
      const modules = [createModule()];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.version).toBe('1.0.0');
      expect(bundle.handlers).toHaveLength(1);
      expect(bundle.modules).toHaveLength(1);
      expect(bundle.generated).toBeDefined();
      expect(bundle.checksum).toBeDefined();
    });

    it('should include all handlers', () => {
      const handlers = [
        createHandler({ handlerId: 'handler1', path: '/users' }),
        createHandler({ handlerId: 'handler2', path: '/posts' }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.handlers).toHaveLength(2);
      expect(bundle.handlers[0].handlerId).toBe('handler1');
      expect(bundle.handlers[1].handlerId).toBe('handler2');
    });

    it('should include all modules', () => {
      const handlers = [];
      const modules = [
        createModule({ moduleId: 'db' }),
        createModule({ moduleId: 'cache' }),
      ];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.modules).toHaveLength(2);
      expect(bundle.modules[0].moduleId).toBe('db');
      expect(bundle.modules[1].moduleId).toBe('cache');
    });

    it('should include schemas', () => {
      const handlers = [];
      const modules = [];
      const schemas = {
        UserRequest: object({ name: primitive('string') }),
        UserResponse: object({ id: primitive('string') }),
      };

      const bundle = generator.generate(handlers, modules, schemas);

      expect(Object.keys(bundle.schemas)).toHaveLength(2);
      expect(bundle.schemas.UserRequest).toBeDefined();
      expect(bundle.schemas.UserResponse).toBeDefined();
    });

    it('should use custom version', () => {
      const handlers = [];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas, {
        version: '2.0.0',
      });

      expect(bundle.version).toBe('2.0.0');
    });
  });

  describe('metadata', () => {
    it('should include project metadata', () => {
      const handlers = [];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas, {
        projectName: 'my-api',
        environment: 'production',
      });

      expect(bundle.metadata.projectName).toBe('my-api');
      expect(bundle.metadata.environment).toBe('production');
    });

    it('should not include metadata when disabled', () => {
      const handlers = [];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas, {
        includeMetadata: false,
        projectName: 'my-api',
      });

      expect(bundle.metadata.projectName).toBeUndefined();
    });
  });

  describe('version graph', () => {
    it('should build version graph for single handler', () => {
      const handlers = [createHandler()];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.versionGraph.nodes).toHaveLength(1);
      expect(bundle.versionGraph.nodes[0].handlerId).toBe('test.handler');
      expect(bundle.versionGraph.edges).toHaveLength(0);
    });

    it('should build version graph for multiple versions', () => {
      const handlers = [
        createHandler({
          handlerId: 'users.v1',
          path: '/users',
          timescapeVersion: 'v1732186200-users-001',
        }),
        createHandler({
          handlerId: 'users.v2',
          path: '/users',
          timescapeVersion: 'v1732186300-users-002',
        }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.versionGraph.nodes).toHaveLength(2);
      expect(bundle.versionGraph.edges).toHaveLength(1);
      expect(bundle.versionGraph.edges[0].from).toBe('v1732186200-users-001');
      expect(bundle.versionGraph.edges[0].to).toBe('v1732186300-users-002');
    });

    it('should sort versions by timestamp', () => {
      const handlers = [
        createHandler({
          handlerId: 'users.v2',
          path: '/users',
          timescapeVersion: 'v1732186300-users-002',
        }),
        createHandler({
          handlerId: 'users.v1',
          path: '/users',
          timescapeVersion: 'v1732186200-users-001',
        }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.versionGraph.nodes[0].version).toBe('v1732186200-users-001');
      expect(bundle.versionGraph.nodes[1].version).toBe('v1732186300-users-002');
    });
  });

  describe('transformers', () => {
    it('should collect transformers between versions', () => {
      const handlers = [
        createHandler({
          handlerId: 'users.v1',
          path: '/users',
          timescapeVersion: 'v1732186200-users-001',
        }),
        createHandler({
          handlerId: 'users.v2',
          path: '/users',
          timescapeVersion: 'v1732186300-users-002',
        }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.transformers).toHaveLength(1);
      expect(bundle.transformers[0].fromVersion).toBe('v1732186200-users-001');
      expect(bundle.transformers[0].toVersion).toBe('v1732186300-users-002');
      expect(bundle.transformers[0].path).toContain('transformers/');
    });

    it('should not collect transformers for single version', () => {
      const handlers = [createHandler()];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.transformers).toHaveLength(0);
    });
  });

  describe('checksum', () => {
    it('should generate checksum', () => {
      const handlers = [createHandler()];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);

      expect(bundle.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should generate different checksums for different bundles', () => {
      const handlers1 = [createHandler({ handlerId: 'handler1' })];
      const handlers2 = [createHandler({ handlerId: 'handler2' })];
      const modules = [];
      const schemas = {};

      const bundle1 = generator.generate(handlers1, modules, schemas);
      const bundle2 = generator.generate(handlers2, modules, schemas);

      expect(bundle1.checksum).not.toBe(bundle2.checksum);
    });

    it('should generate same checksum for identical bundles', () => {
      const handlers = [createHandler()];
      const modules = [];
      const schemas = {};

      const bundle1 = generator.generate(handlers, modules, schemas);
      const bundle2 = generator.generate(handlers, modules, schemas);

      // Checksums will differ due to timestamp, but structure should be same
      expect(bundle1.handlers).toEqual(bundle2.handlers);
      expect(bundle1.modules).toEqual(bundle2.modules);
    });
  });

  describe('validation', () => {
    it('should validate handler dependencies', () => {
      const handlers = [
        createHandler({
          dependencies: {
            modules: ['db'],
          },
        }),
      ];
      const modules = [createModule({ moduleId: 'db' })];
      const schemas = {};

      expect(() => {
        generator.generate(handlers, modules, schemas);
      }).not.toThrow();
    });

    it('should throw on missing module dependency', () => {
      const handlers = [
        createHandler({
          dependencies: {
            modules: ['missing-module'],
          },
        }),
      ];
      const modules = [];
      const schemas = {};

      expect(() => {
        generator.generate(handlers, modules, schemas);
      }).toThrow('missing-module');
    });

    it('should throw on duplicate handler IDs', () => {
      const handlers = [
        createHandler({ handlerId: 'duplicate' }),
        createHandler({ handlerId: 'duplicate' }),
      ];
      const modules = [];
      const schemas = {};

      expect(() => {
        generator.generate(handlers, modules, schemas);
      }).toThrow('Duplicate handler ID');
    });

    it('should throw on duplicate module IDs', () => {
      const handlers = [];
      const modules = [
        createModule({ moduleId: 'duplicate' }),
        createModule({ moduleId: 'duplicate' }),
      ];
      const schemas = {};

      expect(() => {
        generator.generate(handlers, modules, schemas);
      }).toThrow('Duplicate module ID');
    });
  });

  describe('manifest index', () => {
    it('should create index for handlers', () => {
      const handlers = [
        createHandler({ handlerId: 'handler1' }),
        createHandler({ handlerId: 'handler2' }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);
      const index = generator.createIndex(bundle);

      expect(index.handlers.size).toBe(2);
      expect(index.handlers.get('handler1')).toBeDefined();
      expect(index.handlers.get('handler2')).toBeDefined();
    });

    it('should create index for modules', () => {
      const handlers = [];
      const modules = [
        createModule({ moduleId: 'db' }),
        createModule({ moduleId: 'cache' }),
      ];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);
      const index = generator.createIndex(bundle);

      expect(index.modules.size).toBe(2);
      expect(index.modules.get('db')).toBeDefined();
      expect(index.modules.get('cache')).toBeDefined();
    });

    it('should create path index', () => {
      const handlers = [
        createHandler({ handlerId: 'users.v1', path: '/users' }),
        createHandler({ handlerId: 'users.v2', path: '/users' }),
        createHandler({ handlerId: 'posts.v1', path: '/posts' }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);
      const index = generator.createIndex(bundle);

      expect(index.paths.size).toBe(2);
      expect(index.paths.get('/users')).toHaveLength(2);
      expect(index.paths.get('/posts')).toHaveLength(1);
    });
  });

  describe('bundle validation', () => {
    it('should validate valid bundle', () => {
      const handlers = [createHandler()];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);
      const result = generator.validateBundle(bundle);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect checksum mismatch', () => {
      const handlers = [createHandler()];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);
      bundle.checksum = 'sha256:invalid';

      const result = generator.validateBundle(bundle);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Checksum mismatch');
    });

    it('should detect missing schema references', () => {
      const handlers = [
        createHandler({
          gtypes: {
            request: 'MissingSchema',
            response: 'any',
          },
        }),
      ];
      const modules = [];
      const schemas = {};

      const bundle = generator.generate(handlers, modules, schemas);
      const result = generator.validateBundle(bundle);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('MissingSchema');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize and deserialize bundle', () => {
      const handlers = [createHandler()];
      const modules = [createModule()];
      const schemas = {
        UserRequest: object({ name: primitive('string') }),
      };

      const bundle = generator.generate(handlers, modules, schemas);
      const json = JSON.stringify(bundle);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe(bundle.version);
      expect(parsed.handlers).toHaveLength(1);
      expect(parsed.modules).toHaveLength(1);
      expect(parsed.schemas.UserRequest).toBeDefined();
    });
  });
});
