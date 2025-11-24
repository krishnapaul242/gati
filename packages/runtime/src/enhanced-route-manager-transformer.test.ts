/**
 * @module runtime/enhanced-route-manager-transformer.test
 * @description Tests for transformer execution in Enhanced Route Manager
 * 
 * This tests Task 13 from the runtime architecture spec:
 * - Transformer registry integration
 * - Request transformation for old-version requests
 * - Response transformation for version compatibility
 * - Transformer chaining for multi-step transformations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EnhancedRouteManager,
  type HandlerManifest,
  type RequestDescriptor,
} from './enhanced-route-manager.js';
import { VersionRegistry } from './timescape/registry.js';
import { TransformerEngine, createTransformerPair } from './timescape/transformer.js';
import type { Handler } from './types/handler.js';
import type { TSV } from './timescape/types.js';

// Mock handler for testing
const mockHandler: Handler = async () => {
  // Mock implementation
};

// Helper to create a test manifest
function createTestManifest(
  handlerId: string,
  path: string,
  version: TSV,
  options: Partial<HandlerManifest> = {}
): HandlerManifest {
  return {
    handlerId,
    path,
    method: 'GET',
    version,
    gtypes: {},
    hash: `hash-${handlerId}-${version}`,
    ...options,
  };
}

// Helper to create a test request descriptor
function createTestRequest(
  path: string,
  options: Partial<RequestDescriptor> = {}
): RequestDescriptor {
  return {
    requestId: `req-${Date.now()}`,
    path,
    method: 'GET',
    headers: {},
    query: {},
    clientId: 'test-client',
    ...options,
  };
}

describe('EnhancedRouteManager - Transformer Execution', () => {
  let manager: EnhancedRouteManager;
  let registry: VersionRegistry;
  let transformerEngine: TransformerEngine;

  beforeEach(() => {
    registry = new VersionRegistry();
    transformerEngine = new TransformerEngine();
    manager = new EnhancedRouteManager(registry, transformerEngine);
  });

  describe('Transformer Registration', () => {
    it('should register a transformer pair', () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data) => ({ ...data, version: 'v2' }),
        },
        {
          transformRequest: (data) => ({ ...data, version: 'v1' }),
        }
      );

      manager.registerTransformer(transformer);

      expect(manager.hasTransformer(v1, v2)).toBe(true);
    });

    it('should retrieve registered transformer', () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data) => ({ ...data, version: 'v2' }),
        },
        {
          transformRequest: (data) => ({ ...data, version: 'v1' }),
        }
      );

      manager.registerTransformer(transformer);

      const retrieved = manager.getTransformer(v1, v2);
      expect(retrieved).toBeDefined();
      expect(retrieved?.fromVersion).toBe(v1);
      expect(retrieved?.toVersion).toBe(v2);
    });

    it('should check if transformer exists', () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';
      const v3: TSV = 'tsv:3000-ghi-1';

      const transformer = createTransformerPair(
        v1,
        v2,
        { transformRequest: (data) => data },
        { transformRequest: (data) => data }
      );

      manager.registerTransformer(transformer);

      expect(manager.hasTransformer(v1, v2)).toBe(true);
      expect(manager.hasTransformer(v2, v3)).toBe(false);
    });

    it('should get all registered transformers', () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';
      const v3: TSV = 'tsv:3000-ghi-1';

      const transformer1 = createTransformerPair(
        v1,
        v2,
        { transformRequest: (data) => data },
        { transformRequest: (data) => data }
      );

      const transformer2 = createTransformerPair(
        v2,
        v3,
        { transformRequest: (data) => data },
        { transformRequest: (data) => data }
      );

      manager.registerTransformer(transformer1);
      manager.registerTransformer(transformer2);

      const transformers = manager.getAllTransformers();
      expect(transformers).toHaveLength(2);
    });

    it('should get transformer count', () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      expect(manager.getTransformerCount()).toBe(0);

      const transformer = createTransformerPair(
        v1,
        v2,
        { transformRequest: (data) => data },
        { transformRequest: (data) => data }
      );

      manager.registerTransformer(transformer);

      expect(manager.getTransformerCount()).toBe(1);
    });
  });

  describe('Request Transformation', () => {
    it('should transform request from old version to new version', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      // Register handlers
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);

      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);

      // Register transformer
      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data: any) => ({
            ...data,
            email: data.emailAddress, // Rename field
          }),
        },
        {
          transformRequest: (data: any) => ({
            ...data,
            emailAddress: data.email,
          }),
        }
      );

      manager.registerTransformer(transformer);

      // Transform request
      const oldData = { name: 'John', emailAddress: 'john@example.com' };
      const result = await manager.transformRequest(oldData, v1, v2, '/users');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: 'John',
        emailAddress: 'john@example.com',
        email: 'john@example.com',
      });
      expect(result.transformedVersions).toContain(v2);
    });

    it('should handle transformation errors gracefully', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      // Register handlers
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);

      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);

      // Register transformer that throws error
      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: () => {
            throw new Error('Transformation failed');
          },
        },
        {
          transformRequest: (data) => data,
        }
      );

      manager.registerTransformer(transformer);

      // Transform request
      const result = await manager.transformRequest({ name: 'John' }, v1, v2, '/users');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Transformation failed');
    });

    it('should return error for non-existent path', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      const result = await manager.transformRequest({ name: 'John' }, v1, v2, '/non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('No versions found');
    });
  });

  describe('Response Transformation', () => {
    it('should transform response from new version to old version', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      // Register handlers
      const manifest1 = createTestManifest('user.get', '/users/:id', v1);
      const manifest2 = createTestManifest('user.get', '/users/:id', v2);

      manager.registerHandler('/users/:id', v1, mockHandler, manifest1);
      manager.registerHandler('/users/:id', v2, mockHandler, manifest2);

      // Register transformer
      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformResponse: (data: any) => ({
            ...data,
            email: data.emailAddress,
          }),
        },
        {
          transformResponse: (data: any) => ({
            ...data,
            emailAddress: data.email,
          }),
        }
      );

      manager.registerTransformer(transformer);

      // Transform response (from v2 to v1)
      const newData = { id: '123', name: 'John', email: 'john@example.com' };
      const result = await manager.transformResponse(newData, v2, v1, '/users/:id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        emailAddress: 'john@example.com',
      });
    });
  });

  describe('Transformer Chaining', () => {
    it('should chain multiple transformers for multi-step transformation', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';
      const v3: TSV = 'tsv:3000-ghi-1';

      // Register handlers
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);
      const manifest3 = createTestManifest('user.create', '/users', v3);

      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);
      manager.registerHandler('/users', v3, mockHandler, manifest3);

      // Register transformers
      const transformer1 = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v1->v2',
          }),
        },
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v2->v1',
          }),
        }
      );

      const transformer2 = createTransformerPair(
        v2,
        v3,
        {
          transformRequest: (data: any) => ({
            ...data,
            step: data.step + ',v2->v3',
          }),
        },
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v3->v2',
          }),
        }
      );

      manager.registerTransformer(transformer1);
      manager.registerTransformer(transformer2);

      // Transform from v1 to v3 (should chain through v2)
      const result = await manager.transformRequest({ name: 'John' }, v1, v3, '/users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('step', 'v1->v2,v2->v3');
      expect(result.chainLength).toBe(2);
      expect(result.transformedVersions).toEqual([v2, v3]);
    });

    it('should handle backward chaining (newer to older version)', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';
      const v3: TSV = 'tsv:3000-ghi-1';

      // Register handlers
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);
      const manifest3 = createTestManifest('user.create', '/users', v3);

      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);
      manager.registerHandler('/users', v3, mockHandler, manifest3);

      // Register transformers
      const transformer1 = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v1->v2',
          }),
        },
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v2->v1',
          }),
        }
      );

      const transformer2 = createTransformerPair(
        v2,
        v3,
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v2->v3',
          }),
        },
        {
          transformRequest: (data: any) => ({
            ...data,
            step: 'v3->v2',
          }),
        }
      );

      manager.registerTransformer(transformer1);
      manager.registerTransformer(transformer2);

      // Transform from v3 to v1 (backward chain)
      const result = await manager.transformRequest({ name: 'John' }, v3, v1, '/users');

      expect(result.success).toBe(true);
      expect(result.chainLength).toBe(2);
    });
  });

  describe('Request Routing with Transformation', () => {
    it('should automatically transform request when version header differs from resolved version', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      // Register both handlers (v1 and v2)
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);
      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);

      // Register transformer
      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data: any) => ({
            ...data,
            transformed: true,
          }),
        },
        {
          transformRequest: (data) => data,
        }
      );

      manager.registerTransformer(transformer);

      // Make request with v1 header but query for v2 (should route to v2 with transformation)
      const request = createTestRequest('/users', {
        query: { v: v2 }, // Request v2
        headers: {
          'x-gati-version': v1, // But client is using v1 format
        },
        body: { name: 'John' },
      });

      const result = await manager.routeRequest(request);

      expect(result).toHaveProperty('instance');
      if ('instance' in result) {
        expect(result.version).toBe(v2);
        expect(result.transformedRequest).toBeDefined();
        expect(result.transformedRequest?.success).toBe(true);
        expect(result.requiresResponseTransform).toBe(true);
        expect(result.originalVersion).toBe(v1);
      }
    });

    it('should not transform when requested version matches resolved version', async () => {
      const v2: TSV = 'tsv:2000-def-1';

      // Register handler
      const manifest2 = createTestManifest('user.create', '/users', v2);
      manager.registerHandler('/users', v2, mockHandler, manifest2);

      // Make request with v2 header
      const request = createTestRequest('/users', {
        headers: {
          'x-gati-version': v2,
        },
        body: { name: 'John' },
      });

      const result = await manager.routeRequest(request);

      expect(result).toHaveProperty('instance');
      if ('instance' in result) {
        expect(result.version).toBe(v2);
        expect(result.transformedRequest).toBeUndefined();
        expect(result.requiresResponseTransform).toBe(false);
      }
    });

    it('should return error when transformation fails during routing', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      // Register both handlers
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);
      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);

      // Register transformer that fails
      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: () => {
            throw new Error('Transform failed');
          },
        },
        {
          transformRequest: (data) => data,
        }
      );

      manager.registerTransformer(transformer);

      // Make request with v1 header but query for v2
      const request = createTestRequest('/users', {
        query: { v: v2 },
        headers: {
          'x-gati-version': v1,
        },
        body: { name: 'John' },
      });

      const result = await manager.routeRequest(request);

      expect(result).toHaveProperty('code', 'NO_VERSION');
      if ('message' in result) {
        expect(result.message).toContain('Failed to transform');
      }
    });
  });

  describe('Timescape Integration', () => {
    it('should access transformer engine', () => {
      const engine = manager.getTransformerEngine();

      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(TransformerEngine);
    });

    it('should use versions from Timescape registry for transformation', async () => {
      const v1: TSV = 'tsv:1000-abc-1';
      const v2: TSV = 'tsv:2000-def-1';

      // Register handlers (this registers versions in Timescape)
      const manifest1 = createTestManifest('user.create', '/users', v1);
      const manifest2 = createTestManifest('user.create', '/users', v2);

      manager.registerHandler('/users', v1, mockHandler, manifest1);
      manager.registerHandler('/users', v2, mockHandler, manifest2);

      // Register transformer
      const transformer = createTransformerPair(
        v1,
        v2,
        {
          transformRequest: (data: any) => ({ ...data, transformed: true }),
        },
        {
          transformRequest: (data) => data,
        }
      );

      manager.registerTransformer(transformer);

      // Verify versions are in registry
      const versionInfos = registry.getVersions('/users');
      const versions = versionInfos.map(v => v.tsv);
      expect(versions).toContain(v1);
      expect(versions).toContain(v2);

      // Transform should work using these versions
      const result = await manager.transformRequest({ name: 'John' }, v1, v2, '/users');

      expect(result.success).toBe(true);
    });
  });
});
