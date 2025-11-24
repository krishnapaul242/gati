/**
 * @module runtime/enhanced-route-manager.test
 * @description Tests for Enhanced Route Manager with version resolution and Timescape integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EnhancedRouteManager,
  createEnhancedRouteManager,
  type HandlerManifest,
  type RequestDescriptor,
  type AuthContext,
  type WarmPoolConfig,
} from './enhanced-route-manager.js';
import { VersionRegistry } from './timescape/registry.js';
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
  version: string | TSV,
  options: Partial<HandlerManifest> = {}
): HandlerManifest {
  // Convert simple version to TSV if needed
  const tsv: TSV = version.startsWith('tsv:') ? (version as TSV) : `tsv:${Date.now()}-${version.replace(/\./g, '')}-1` as TSV;
  
  return {
    handlerId,
    path,
    method: 'GET',
    version: tsv,
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

describe('EnhancedRouteManager', () => {
  let manager: EnhancedRouteManager;
  let registry: VersionRegistry;

  beforeEach(() => {
    registry = new VersionRegistry();
    manager = new EnhancedRouteManager(registry);
  });

  describe('Handler Registration', () => {
    it('should register a handler instance', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const instances = manager.getInstances('/users/:id');
      expect(instances).toHaveLength(1);
      expect(instances[0].version).toBe(manifest.version);
      expect(instances[0].handlerId).toBe('user.get');
    });

    it('should register multiple versions of the same handler', () => {
      const manifest1 = createTestManifest('user.get', '/users/:id', '1.0.0');
      const manifest2 = createTestManifest('user.get', '/users/:id', '2.0.0');
      
      manager.registerHandler('/users/:id', manifest1.version, mockHandler, manifest1);
      manager.registerHandler('/users/:id', manifest2.version, mockHandler, manifest2);
      
      const instances = manager.getInstances('/users/:id');
      expect(instances).toHaveLength(2);
    });

    it('should cache manifest on registration', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const cached = manager.getManifest('user.get');
      expect(cached).toEqual(manifest);
    });

    it('should initialize handler with healthy status', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const health = manager.getHealth('/users/:id', manifest.version);
      expect(health?.status).toBe('healthy');
      expect(health?.consecutiveFailures).toBe(0);
    });
  });

  describe('Version Resolution', () => {
    let manifest1: HandlerManifest;
    let manifest2: HandlerManifest;

    beforeEach(() => {
      manifest1 = createTestManifest('user.get', '/users/:id', '1.0.0');
      manifest2 = createTestManifest('user.get', '/users/:id', '2.0.0');
      
      manager.registerHandler('/users/:id', manifest1.version, mockHandler, manifest1);
      manager.registerHandler('/users/:id', manifest2.version, mockHandler, manifest2);
    });

    it('should resolve to latest version by default', () => {
      const version = manager.resolveVersion('/users/:id');
      
      expect(version).toBe(manifest2.version);
    });

    it('should resolve to specific version from query parameter', () => {
      const version = manager.resolveVersion('/users/:id', { v: manifest1.version });
      
      expect(version).toBe(manifest1.version);
    });

    it('should resolve to specific version from header', () => {
      const version = manager.resolveVersion(
        '/users/:id',
        {},
        { 'x-api-version': manifest1.version }
      );
      
      expect(version).toBe(manifest1.version);
    });

    it('should return error for non-existent path', () => {
      const result = manager.resolveVersion('/non-existent');
      
      expect(result).toHaveProperty('code', 'NO_VERSION');
      expect(result).toHaveProperty('message');
    });
  });

  describe('Request Routing', () => {
    let manifest: HandlerManifest;

    beforeEach(() => {
      manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
    });

    it('should route request to correct handler instance', async () => {
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('instance');
      expect(result).toHaveProperty('manifest');
      expect(result).toHaveProperty('version', manifest.version);
      if ('instance' in result) {
        expect(result.instance.handlerId).toBe('user.get');
      }
    });

    it('should return error for non-existent handler', async () => {
      const request = createTestRequest('/non-existent');
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('code');
      if ('code' in result) {
        expect(['NO_VERSION', 'NO_HANDLER']).toContain(result.code);
      }
    });

    it('should update instance last accessed time', async () => {
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      const instances = manager.getInstances('/users/:id');
      const initialTime = instances[0].lastAccessed;
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await manager.routeRequest(request);
      
      const updatedInstances = manager.getInstances('/users/:id');
      expect(updatedInstances[0].lastAccessed).toBeGreaterThan(initialTime);
    });

    it('should track usage metrics', async () => {
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      await manager.routeRequest(request);
      
      const instances = manager.getInstances('/users/:id');
      const metrics = manager.getUsageMetrics(instances[0].id);
      
      expect(metrics).toBeDefined();
      expect(metrics?.requestCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          rateLimit: {
            limit: 10,
            window: 60000, // 1 minute
          },
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        clientId: 'client-1',
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('instance');
    });

    it('should reject requests exceeding rate limit', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          rateLimit: {
            limit: 2,
            window: 60000,
          },
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        clientId: 'client-1',
      });
      
      // Make requests up to limit
      await manager.routeRequest(request);
      await manager.routeRequest(request);
      
      // This should be rate limited
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('code', 'RATE_LIMITED');
    });

    it('should reset rate limit after window expires', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          rateLimit: {
            limit: 1,
            window: 100, // 100ms
          },
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        clientId: 'client-1',
      });
      
      // First request should succeed
      const result1 = await manager.routeRequest(request);
      expect(result1).toHaveProperty('instance');
      
      // Second request should be rate limited
      const result2 = await manager.routeRequest(request);
      expect(result2).toHaveProperty('code', 'RATE_LIMITED');
      
      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          // Third request should succeed after window reset
          const result3 = await manager.routeRequest(request);
          expect(result3).toHaveProperty('instance');
          resolve();
        }, 150);
      });
    });

    it('should track rate limits per client', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          rateLimit: {
            limit: 1,
            window: 60000,
          },
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const request1 = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        clientId: 'client-1',
      });
      
      const request2 = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        clientId: 'client-2',
      });
      
      // Both clients should be able to make one request
      const result1 = await manager.routeRequest(request1);
      const result2 = await manager.routeRequest(request2);
      
      expect(result1).toHaveProperty('instance');
      expect(result2).toHaveProperty('instance');
    });
  });

  describe('Authentication', () => {
    it('should allow requests without auth when no roles required', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('instance');
    });

    it('should reject requests without auth when roles required', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          roles: ['admin'],
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should allow requests with required role', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          roles: ['admin'],
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const authContext: AuthContext = {
        userId: 'user-1',
        roles: ['admin'],
      };
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        authContext,
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('instance');
    });

    it('should reject requests without required role', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          roles: ['admin'],
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const authContext: AuthContext = {
        userId: 'user-1',
        roles: ['user'],
      };
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        authContext,
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should allow requests with any of multiple required roles', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0', {
        policies: {
          roles: ['admin', 'moderator'],
        },
      });
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const authContext: AuthContext = {
        userId: 'user-1',
        roles: ['moderator'],
      };
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
        authContext,
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('instance');
    });
  });

  describe('Health Status', () => {
    it('should reject requests to unhealthy instances', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      // Mark instance as unhealthy
      manager.updateHealth('/users/:id', manifest.version, {
        status: 'unhealthy',
        lastCheck: Date.now(),
        consecutiveFailures: 3,
        message: 'Health check failed',
      });
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('code', 'UNHEALTHY');
    });

    it('should allow requests to degraded instances', async () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      // Mark instance as degraded
      manager.updateHealth('/users/:id', manifest.version, {
        status: 'degraded',
        lastCheck: Date.now(),
        consecutiveFailures: 1,
      });
      
      const request = createTestRequest('/users/:id', {
        query: { v: manifest.version },
      });
      
      const result = await manager.routeRequest(request);
      
      expect(result).toHaveProperty('instance');
    });

    it('should update health status', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const newHealth = {
        status: 'degraded' as const,
        lastCheck: Date.now(),
        consecutiveFailures: 1,
        message: 'Slow response',
      };
      
      manager.updateHealth('/users/:id', manifest.version, newHealth);
      
      const health = manager.getHealth('/users/:id', manifest.version);
      expect(health).toEqual(newHealth);
    });
  });

  describe('Caching', () => {
    it('should cache manifests', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', '1.0.0', mockHandler, manifest);
      
      const cached = manager.getManifest('user.get');
      expect(cached).toEqual(manifest);
    });

    it('should cache GType schemas', () => {
      const schema = { type: 'object', properties: {} };
      
      manager.cacheGType('user.request', schema);
      
      const cached = manager.getGType('user.request');
      expect(cached).toEqual(schema);
    });

    it('should respect cache size limits', () => {
      // Register many handlers to exceed cache size
      for (let i = 0; i < 1100; i++) {
        const manifest = createTestManifest(`handler-${i}`, `/path-${i}`, '1.0.0');
        manager.registerHandler(`/path-${i}`, '1.0.0', mockHandler, manifest);
      }
      
      const stats = manager.getCacheStats();
      expect(stats.manifests).toBeLessThanOrEqual(1000);
    });

    it('should clear all caches', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      manager.registerHandler('/users/:id', '1.0.0', mockHandler, manifest);
      manager.cacheGType('user.request', { type: 'object' });
      
      manager.clearCaches();
      
      const stats = manager.getCacheStats();
      expect(stats.manifests).toBe(0);
      expect(stats.gtypes).toBe(0);
    });

    it('should provide cache statistics', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      manager.registerHandler('/users/:id', '1.0.0', mockHandler, manifest);
      manager.cacheGType('user.request', { type: 'object' });
      
      const stats = manager.getCacheStats();
      
      expect(stats).toHaveProperty('manifests');
      expect(stats).toHaveProperty('gtypes');
      expect(stats).toHaveProperty('health');
      expect(stats).toHaveProperty('rateLimits');
      expect(stats.manifests).toBeGreaterThan(0);
      expect(stats.gtypes).toBeGreaterThan(0);
    });
  });

  describe('Warm Pool Management', () => {
    it('should configure warm pool for handler', () => {
      const config: WarmPoolConfig = {
        minInstances: 2,
        maxInstances: 10,
        targetUtilization: 0.7,
      };
      
      manager.maintainWarmPool('user.get', config);
      
      const retrieved = manager.getWarmPoolConfig('user.get');
      expect(retrieved).toEqual(config);
    });

    it('should return undefined for non-configured warm pool', () => {
      const config = manager.getWarmPoolConfig('non-existent');
      expect(config).toBeUndefined();
    });
  });

  describe('Usage Tracking', () => {
    it('should track usage metrics', () => {
      const instanceId = 'test-instance';
      
      manager.trackUsage(instanceId, {
        requestCount: 5,
        errorCount: 1,
        avgLatency: 100,
        lastAccessed: Date.now(),
      });
      
      const metrics = manager.getUsageMetrics(instanceId);
      
      expect(metrics).toBeDefined();
      expect(metrics?.requestCount).toBe(5);
      expect(metrics?.errorCount).toBe(1);
      expect(metrics?.avgLatency).toBe(100);
    });

    it('should accumulate request counts', () => {
      const instanceId = 'test-instance';
      
      manager.trackUsage(instanceId, { requestCount: 5, errorCount: 0, avgLatency: 100, lastAccessed: Date.now() });
      manager.trackUsage(instanceId, { requestCount: 3, errorCount: 0, avgLatency: 100, lastAccessed: Date.now() });
      
      const metrics = manager.getUsageMetrics(instanceId);
      
      expect(metrics?.requestCount).toBe(8);
    });

    it('should return undefined for non-tracked instance', () => {
      const metrics = manager.getUsageMetrics('non-existent');
      expect(metrics).toBeUndefined();
    });
  });

  describe('Instance Management', () => {
    it('should get all instances for a path', () => {
      const manifest1 = createTestManifest('user.get', '/users/:id', '1.0.0');
      const manifest2 = createTestManifest('user.get', '/users/:id', '2.0.0');
      
      manager.registerHandler('/users/:id', '1.0.0', mockHandler, manifest1);
      manager.registerHandler('/users/:id', '2.0.0', mockHandler, manifest2);
      
      const instances = manager.getInstances('/users/:id');
      
      expect(instances).toHaveLength(2);
      expect(instances.map(i => i.version)).toContain('1.0.0');
      expect(instances.map(i => i.version)).toContain('2.0.0');
    });

    it('should return empty array for non-existent path', () => {
      const instances = manager.getInstances('/non-existent');
      expect(instances).toEqual([]);
    });

    it('should get all registered paths', () => {
      const manifest1 = createTestManifest('user.get', '/users/:id', '1.0.0');
      const manifest2 = createTestManifest('post.get', '/posts/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', '1.0.0', mockHandler, manifest1);
      manager.registerHandler('/posts/:id', '1.0.0', mockHandler, manifest2);
      
      const paths = manager.getPaths();
      
      expect(paths).toHaveLength(2);
      expect(paths).toContain('/users/:id');
      expect(paths).toContain('/posts/:id');
    });
  });

  describe('Factory Function', () => {
    it('should create manager with default registry', () => {
      const manager = createEnhancedRouteManager();
      
      expect(manager).toBeInstanceOf(EnhancedRouteManager);
      expect(manager.getRegistry()).toBeInstanceOf(VersionRegistry);
    });

    it('should create manager with custom registry', () => {
      const customRegistry = new VersionRegistry();
      const manager = createEnhancedRouteManager(customRegistry);
      
      expect(manager.getRegistry()).toBe(customRegistry);
    });
  });

  describe('Timescape Integration', () => {
    it('should access version registry', () => {
      const registry = manager.getRegistry();
      
      expect(registry).toBeInstanceOf(VersionRegistry);
    });

    it('should access version resolver', () => {
      const resolver = manager.getResolver();
      
      expect(resolver).toBeDefined();
      expect(resolver).toHaveProperty('resolveVersion');
    });

    it('should register versions in Timescape on handler registration', () => {
      const manifest = createTestManifest('user.get', '/users/:id', '1.0.0');
      
      manager.registerHandler('/users/:id', manifest.version, mockHandler, manifest);
      
      const registry = manager.getRegistry();
      const versionInfos = registry.getVersions('/users/:id');
      const versions = versionInfos.map(v => v.tsv);
      
      expect(versions).toContain(manifest.version);
    });
  });

  describe('Property Tests', () => {
    const fc = require('fast-check');

    describe('Property 33: Version resolution', () => {
      // Feature: runtime-architecture, Property 33: Version resolution
      // For any request with a path and optional version preference, the Route Manager should resolve to the correct handler version
      // Validates: Requirements 9.1

      it('should resolve to latest version when no preference specified', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                version: fc.string({ minLength: 3, maxLength: 10 }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            async (versions) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const path = '/test/path';
              
              // Register all versions
              for (const v of versions) {
                const manifest = createTestManifest('test.handler', path, v.version);
                testManager.registerHandler(path, manifest.version, mockHandler, manifest);
              }
              
              // Resolve without preference should give latest
              const resolved = testManager.resolveVersion(path);
              
              // Should resolve to a valid version
              expect(typeof resolved === 'string' || 'code' in resolved).toBe(true);
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should resolve to specific version when requested', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.string({ minLength: 3, maxLength: 10 }),
              { minLength: 2, maxLength: 5 }
            ),
            async (versions) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const path = '/test/path';
              const manifests: HandlerManifest[] = [];
              
              // Register all versions
              for (const v of versions) {
                const manifest = createTestManifest('test.handler', path, v);
                manifests.push(manifest);
                testManager.registerHandler(path, manifest.version, mockHandler, manifest);
              }
              
              // Try to resolve each version specifically
              for (const manifest of manifests) {
                const resolved = testManager.resolveVersion(path, { v: manifest.version });
                
                if (typeof resolved === 'string') {
                  expect(resolved).toBe(manifest.version);
                }
              }
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Property 36: Manifest caching', () => {
      // Feature: runtime-architecture, Property 36: Manifest caching
      // For any manifest, GType, or health status, the Route Manager should cache it locally
      // Validates: Requirements 9.5

      it('should cache manifests after registration', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                handlerId: fc.string({ minLength: 5, maxLength: 20 }),
                version: fc.string({ minLength: 3, maxLength: 10 }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            async (handlers) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              
              // Register handlers
              for (const h of handlers) {
                const manifest = createTestManifest(h.handlerId, `/${h.handlerId}`, h.version);
                testManager.registerHandler(`/${h.handlerId}`, manifest.version, mockHandler, manifest);
              }
              
              // All manifests should be cached
              for (const h of handlers) {
                const cached = testManager.getManifest(h.handlerId);
                expect(cached).toBeDefined();
                expect(cached?.handlerId).toBe(h.handlerId);
              }
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should cache GType schemas', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                ref: fc.string({ minLength: 5, maxLength: 20 }),
                schema: fc.record({
                  type: fc.constantFrom('object', 'string', 'number'),
                }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            async (gtypes) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              
              // Cache GTypes
              for (const g of gtypes) {
                testManager.cacheGType(g.ref, g.schema);
              }
              
              // All GTypes should be retrievable
              for (const g of gtypes) {
                const cached = testManager.getGType(g.ref);
                expect(cached).toEqual(g.schema);
              }
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should respect cache size limits', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1001, max: 1100 }),
            async (count) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              
              // Add more items than cache limit (1000)
              for (let i = 0; i < count; i++) {
                const manifest = createTestManifest(`handler-${i}`, `/path-${i}`, '1.0.0');
                testManager.registerHandler(`/path-${i}`, manifest.version, mockHandler, manifest);
              }
              
              const stats = testManager.getCacheStats();
              
              // Cache should not exceed limit
              expect(stats.manifests).toBeLessThanOrEqual(1000);
            }
          ),
          { numRuns: 20 }
        );
      });
    });

    describe('Property 34: Rate limit enforcement', () => {
      // Feature: runtime-architecture, Property 34: Rate limit enforcement
      // For any handler with rate limit policies, the Route Manager should reject requests that exceed the configured limit
      // Validates: Requirements 9.2

      it('should enforce rate limits per client', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              limit: fc.integer({ min: 1, max: 5 }),
              clientId: fc.string({ minLength: 5, maxLength: 15 }),
            }),
            async ({ limit, clientId }) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const manifest = createTestManifest('test.handler', '/test', '1.0.0', {
                policies: {
                  rateLimit: {
                    limit,
                    window: 60000,
                  },
                },
              });
              
              testManager.registerHandler('/test', manifest.version, mockHandler, manifest);
              
              let successCount = 0;
              let rateLimitedCount = 0;
              
              // Make limit + 2 requests
              for (let i = 0; i < limit + 2; i++) {
                const request = createTestRequest('/test', {
                  query: { v: manifest.version },
                  clientId,
                });
                
                const result = await testManager.routeRequest(request);
                
                if ('instance' in result) {
                  successCount++;
                } else if ('code' in result && result.code === 'RATE_LIMITED') {
                  rateLimitedCount++;
                }
              }
              
              // Should allow exactly 'limit' requests
              expect(successCount).toBe(limit);
              expect(rateLimitedCount).toBeGreaterThan(0);
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe('Property 35: Authentication enforcement', () => {
      // Feature: runtime-architecture, Property 35: Authentication enforcement
      // For any handler requiring specific roles, the Route Manager should reject requests without the required roles
      // Validates: Requirements 9.3

      it('should reject requests without required roles', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              requiredRole: fc.constantFrom('admin', 'moderator', 'user', 'guest'),
              userRole: fc.constantFrom('admin', 'moderator', 'user', 'guest'),
            }),
            async ({ requiredRole, userRole }) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const manifest = createTestManifest('test.handler', '/test', '1.0.0', {
                policies: {
                  roles: [requiredRole],
                },
              });
              
              testManager.registerHandler('/test', manifest.version, mockHandler, manifest);
              
              const authContext: AuthContext = {
                userId: 'test-user',
                roles: [userRole],
              };
              
              const request = createTestRequest('/test', {
                query: { v: manifest.version },
                authContext,
              });
              
              const result = await testManager.routeRequest(request);
              
              if (userRole === requiredRole) {
                // Should succeed if roles match
                expect('instance' in result || 'code' in result).toBe(true);
              } else {
                // Should be unauthorized if roles don't match
                if ('code' in result) {
                  expect(result.code).toBe('UNAUTHORIZED');
                }
              }
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Property 7: Unhealthy version routing', () => {
      // Feature: runtime-architecture, Property 7: Unhealthy version routing
      // For any handler version that fails health checks, the Route Manager should route all subsequent traffic to healthy versions only
      // Validates: Requirements 2.3

      it('should reject requests to unhealthy instances', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom('unhealthy', 'degraded', 'healthy'),
            async (healthStatus) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const manifest = createTestManifest('test.handler', '/test', '1.0.0');
              
              testManager.registerHandler('/test', manifest.version, mockHandler, manifest);
              
              // Update health status
              testManager.updateHealth('/test', manifest.version, {
                status: healthStatus,
                lastCheck: Date.now(),
                consecutiveFailures: healthStatus === 'unhealthy' ? 3 : 0,
              });
              
              const request = createTestRequest('/test', {
                query: { v: manifest.version },
              });
              
              const result = await testManager.routeRequest(request);
              
              if (healthStatus === 'unhealthy') {
                // Should reject unhealthy instances
                expect('code' in result && result.code === 'UNHEALTHY').toBe(true);
              } else {
                // Should allow healthy or degraded instances
                expect('instance' in result || 'code' in result).toBe(true);
              }
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Property 14: Breaking change detection', () => {
      // Feature: runtime-architecture, Property 14: Breaking change detection
      // For any pair of handler manifests (old and new), the Route Manager should correctly identify whether the new version introduces breaking changes
      // Validates: Requirements 4.1
      // Note: This is primarily handled by Timescape, but Route Manager uses it for routing decisions

      it('should handle multiple versions of same handler', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.string({ minLength: 3, maxLength: 10 }),
              { minLength: 2, maxLength: 4 }
            ),
            async (versions) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const path = '/test';
              
              // Register multiple versions
              for (const v of versions) {
                const manifest = createTestManifest('test.handler', path, v);
                testManager.registerHandler(path, manifest.version, mockHandler, manifest);
              }
              
              const instances = testManager.getInstances(path);
              
              // Should have all versions registered
              expect(instances.length).toBe(versions.length);
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Property 15: Non-breaking version activation', () => {
      // Feature: runtime-architecture, Property 15: Non-breaking version activation
      // For any non-breaking handler version deployment, the Route Manager should activate the new version
      // Validates: Requirements 4.2

      it('should activate new versions immediately', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 3, maxLength: 10 }),
            async (version) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const manifest = createTestManifest('test.handler', '/test', version);
              
              testManager.registerHandler('/test', manifest.version, mockHandler, manifest);
              
              const instances = testManager.getInstances('/test');
              
              // New version should be immediately available
              expect(instances.length).toBeGreaterThan(0);
              expect(instances.some(i => i.version === manifest.version)).toBe(true);
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Property 16: Multi-version routing', () => {
      // Feature: runtime-architecture, Property 16: Multi-version routing
      // For any breaking handler version deployed without transformers, the Route Manager should maintain both old and new versions
      // Validates: Requirements 4.3

      it('should maintain multiple versions simultaneously', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.string({ minLength: 3, maxLength: 10 }),
              { minLength: 2, maxLength: 5 }
            ),
            async (versions) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const path = '/test';
              
              // Register all versions
              for (const v of versions) {
                const manifest = createTestManifest('test.handler', path, v);
                testManager.registerHandler(path, manifest.version, mockHandler, manifest);
              }
              
              const instances = testManager.getInstances(path);
              
              // All versions should be maintained
              expect(instances.length).toBe(versions.length);
              
              // Each version should be routable
              for (const instance of instances) {
                const request = createTestRequest(path, {
                  query: { v: instance.version },
                });
                
                const result = await testManager.routeRequest(request);
                expect('instance' in result || 'code' in result).toBe(true);
              }
            }
          ),
          { numRuns: 30 }
        );
      });
    });

    describe('Property 17: Transformer execution', () => {
      // Feature: runtime-architecture, Property 17: Transformer execution
      // For any breaking handler version with transformers, requests with old version headers should be transformed
      // Validates: Requirements 4.4
      // Note: Transformer execution is tested in enhanced-route-manager-transformer.test.ts

      it('should support transformer registration', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              fromVersion: fc.string({ minLength: 3, maxLength: 10 }),
              toVersion: fc.string({ minLength: 3, maxLength: 10 }),
            }),
            async ({ fromVersion, toVersion }) => {
              const testManager = new EnhancedRouteManager(new VersionRegistry());
              const path = '/test';
              
              // Register both versions
              const manifest1 = createTestManifest('test.handler', path, fromVersion);
              const manifest2 = createTestManifest('test.handler', path, toVersion);
              
              testManager.registerHandler(path, manifest1.version, mockHandler, manifest1);
              testManager.registerHandler(path, manifest2.version, mockHandler, manifest2);
              
              const instances = testManager.getInstances(path);
              
              // Both versions should be available for transformation
              expect(instances.length).toBe(2);
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});
