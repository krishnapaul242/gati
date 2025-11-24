/**
 * @module runtime/manifest-store.test
 * @description Tests for Manifest Store implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { createManifestStore } from './manifest-store.js';
import type {
  ManifestStore,
  HandlerManifest,
  GType,
  Transformer,
  VersionGraph,
  TimescapeMetadata,
  GTypeKind,
  PrimitiveType,
} from './types/manifest-store.js';

describe('Manifest Store', () => {
  let store: ManifestStore;

  beforeEach(async () => {
    store = createManifestStore();
    await store.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve handler manifests', async () => {
      const manifest: HandlerManifest = {
        handlerId: 'user.create',
        version: '1.0.0',
        path: '/users',
        method: 'POST',
        gtypes: {
          request: 'CreateUserRequest',
          response: 'UserResponse',
        },
        hooks: {
          before: ['auth', 'validate'],
          after: ['log'],
        },
        timescapeVersion: 'v1',
        policies: {
          roles: ['admin'],
          rateLimit: {
            limit: 100,
            window: 60000,
          },
        },
        dependencies: {
          modules: ['user-service'],
        },
        hash: 'abc123',
        createdAt: Date.now(),
      };

      await store.storeManifest(manifest);
      const retrieved = await store.getManifest('user.create', '1.0.0');

      expect(retrieved).toEqual(manifest);
    });

    it('should retrieve latest version when no version specified', async () => {
      const manifest1: HandlerManifest = {
        handlerId: 'user.create',
        version: '1.0.0',
        path: '/users',
        method: 'POST',
        gtypes: { request: 'Req1', response: 'Res1' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
        hash: 'hash1',
        createdAt: 1000,
      };

      const manifest2: HandlerManifest = {
        ...manifest1,
        version: '2.0.0',
        hash: 'hash2',
        createdAt: 2000,
      };

      await store.storeManifest(manifest1);
      await store.storeManifest(manifest2);

      const latest = await store.getManifest('user.create');
      expect(latest?.version).toBe('2.0.0');
    });

    it('should get all manifest versions', async () => {
      const manifest1: HandlerManifest = {
        handlerId: 'user.create',
        version: '1.0.0',
        path: '/users',
        method: 'POST',
        gtypes: { request: 'Req1', response: 'Res1' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
        hash: 'hash1',
        createdAt: 1000,
      };

      const manifest2: HandlerManifest = {
        ...manifest1,
        version: '2.0.0',
        hash: 'hash2',
        createdAt: 2000,
      };

      await store.storeManifest(manifest1);
      await store.storeManifest(manifest2);

      const versions = await store.getAllManifestVersions('user.create');
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe('1.0.0');
      expect(versions[1].version).toBe('2.0.0');
    });

    it('should store and retrieve GType schemas', async () => {
      const gtype: GType = {
        ref: 'CreateUserRequest',
        kind: 'object',
        properties: {
          name: {
            type: {
              ref: 'string',
              kind: 'primitive',
              primitiveType: 'string',
            },
            optional: false,
          },
          email: {
            type: {
              ref: 'string',
              kind: 'primitive',
              primitiveType: 'string',
            },
            optional: false,
          },
        },
        required: ['name', 'email'],
      };

      await store.storeGType(gtype);
      const retrieved = await store.getGType('CreateUserRequest');

      expect(retrieved).toEqual(gtype);
    });

    it('should store and retrieve transformers', async () => {
      const transformer: Transformer = {
        id: 'user.create:v1->v2',
        handlerId: 'user.create',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        direction: 'forward',
        transformations: [
          {
            path: 'user.email',
            type: 'rename',
            details: { newName: 'emailAddress' },
          },
        ],
        hash: 'trans123',
        createdAt: Date.now(),
      };

      await store.storeTransformer(transformer);
      const retrieved = await store.getTransformer('user.create:v1->v2');

      expect(retrieved).toEqual(transformer);
    });

    it('should get transformers for version pairs', async () => {
      const transformer: Transformer = {
        id: 'user.create:v1->v2',
        handlerId: 'user.create',
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        direction: 'forward',
        transformations: [],
        hash: 'trans123',
        createdAt: Date.now(),
      };

      await store.storeTransformer(transformer);
      const transformers = await store.getTransformersForVersions(
        'user.create',
        '1.0.0',
        '2.0.0'
      );

      expect(transformers).toHaveLength(1);
      expect(transformers[0]).toEqual(transformer);
    });

    it('should store and retrieve version graphs', async () => {
      const graph: VersionGraph = {
        handlerId: 'user.create',
        versions: [
          {
            version: '1.0.0',
            manifestHash: 'hash1',
            deployedAt: 1000,
            active: false,
            breaking: false,
          },
          {
            version: '2.0.0',
            manifestHash: 'hash2',
            deployedAt: 2000,
            active: true,
            parent: '1.0.0',
            breaking: true,
          },
        ],
        currentVersion: '2.0.0',
        latestVersion: '2.0.0',
      };

      await store.storeVersionGraph(graph);
      const retrieved = await store.getVersionGraph('user.create');

      expect(retrieved).toEqual(graph);
    });

    it('should store and retrieve Timescape metadata', async () => {
      const metadata: TimescapeMetadata = {
        handlerId: 'user.create',
        version: '1.0.0',
        fingerprint: 'fp123',
        compatibility: {
          compatible: ['0.9.0'],
          incompatible: ['2.0.0'],
          transformable: ['2.0.0'],
        },
        deployment: {
          strategy: 'blue-green',
          status: 'active',
        },
      };

      await store.storeTimescapeMetadata(metadata);
      const retrieved = await store.getTimescapeMetadata('user.create', '1.0.0');

      expect(retrieved).toEqual(metadata);
    });

    it('should return undefined for non-existent data', async () => {
      expect(await store.getManifest('nonexistent')).toBeUndefined();
      expect(await store.getGType('nonexistent')).toBeUndefined();
      expect(await store.getTransformer('nonexistent')).toBeUndefined();
      expect(await store.getVersionGraph('nonexistent')).toBeUndefined();
      expect(await store.getTimescapeMetadata('nonexistent', '1.0.0')).toBeUndefined();
    });

    it('should clear all data', async () => {
      const manifest: HandlerManifest = {
        handlerId: 'test',
        version: '1.0.0',
        path: '/test',
        method: 'GET',
        gtypes: { request: 'Req', response: 'Res' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
        hash: 'hash',
        createdAt: Date.now(),
      };

      await store.storeManifest(manifest);
      expect(await store.getManifest('test')).toBeDefined();

      await store.clear();
      expect(await store.getManifest('test')).toBeUndefined();
    });

    it('should track statistics', async () => {
      const manifest: HandlerManifest = {
        handlerId: 'test',
        version: '1.0.0',
        path: '/test',
        method: 'GET',
        gtypes: { request: 'Req', response: 'Res' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
        hash: 'hash',
        createdAt: Date.now(),
      };

      const gtype: GType = {
        ref: 'TestType',
        kind: 'primitive',
        primitiveType: 'string',
      };

      await store.storeManifest(manifest);
      await store.storeGType(gtype);

      const stats = store.getStats();
      expect(stats.manifestCount).toBe(1);
      expect(stats.gtypeCount).toBe(1);
    });
  });

  describe('Property Tests', () => {
    // Fast-check arbitraries for generating test data

    const primitiveTypeArb = fc.constantFrom<PrimitiveType>(
      'string',
      'number',
      'boolean',
      'null'
    );

    const gtypeKindArb = fc.constantFrom<GTypeKind>(
      'object',
      'array',
      'primitive',
      'union',
      'intersection'
    );

    const validatorArb = fc.record({
      type: fc.constantFrom('min', 'max', 'pattern', 'enum', 'custom'),
      value: fc.anything(),
      message: fc.option(fc.string(), { nil: undefined }),
    });

    // Recursive GType generator with depth limit
    const gtypeArb: fc.Arbitrary<GType> = fc.letrec((tie) => ({
      gtype: fc.oneof(
        { maxDepth: 3 },
        // Primitive type
        fc.record({
          ref: fc.string({ minLength: 1, maxLength: 20 }),
          kind: fc.constant<GTypeKind>('primitive'),
          primitiveType: primitiveTypeArb,
          validators: fc.option(fc.array(validatorArb, { maxLength: 2 }), {
            nil: undefined,
          }),
          description: fc.option(fc.string(), { nil: undefined }),
        }),
        // Object type
        fc.record({
          ref: fc.string({ minLength: 1, maxLength: 20 }),
          kind: fc.constant<GTypeKind>('object'),
          properties: fc.option(
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.record({
                type: tie('gtype') as fc.Arbitrary<GType>,
                optional: fc.boolean(),
                description: fc.option(fc.string(), { nil: undefined }),
              }),
              { maxKeys: 3 }
            ),
            { nil: undefined }
          ),
          required: fc.option(fc.array(fc.string(), { maxLength: 3 }), {
            nil: undefined,
          }),
          validators: fc.option(fc.array(validatorArb, { maxLength: 2 }), {
            nil: undefined,
          }),
          description: fc.option(fc.string(), { nil: undefined }),
        }),
        // Array type
        fc.record({
          ref: fc.string({ minLength: 1, maxLength: 20 }),
          kind: fc.constant<GTypeKind>('array'),
          items: fc.option(tie('gtype') as fc.Arbitrary<GType>, { nil: undefined }),
          validators: fc.option(fc.array(validatorArb, { maxLength: 2 }), {
            nil: undefined,
          }),
          description: fc.option(fc.string(), { nil: undefined }),
        })
      ),
    })).gtype as fc.Arbitrary<GType>;

    const handlerManifestArb = fc.record({
      handlerId: fc.string({ minLength: 3, maxLength: 30 }),
      version: fc.string({ minLength: 5, maxLength: 10 }),
      path: fc.string({ minLength: 1, maxLength: 50 }),
      method: fc.oneof(
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
        fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), {
          minLength: 1,
          maxLength: 3,
        })
      ),
      gtypes: fc.record({
        request: fc.string({ minLength: 1, maxLength: 30 }),
        response: fc.string({ minLength: 1, maxLength: 30 }),
        params: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
          nil: undefined,
        }),
        headers: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
          nil: undefined,
        }),
      }),
      hooks: fc.record({
        before: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        after: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        catch: fc.option(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
          { nil: undefined }
        ),
      }),
      timescapeVersion: fc.string({ minLength: 1, maxLength: 10 }),
      policies: fc.record({
        roles: fc.option(
          fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 3 }),
          { nil: undefined }
        ),
        rateLimit: fc.option(
          fc.record({
            limit: fc.integer({ min: 1, max: 10000 }),
            window: fc.integer({ min: 1000, max: 3600000 }),
          }),
          { nil: undefined }
        ),
      }),
      dependencies: fc.record({
        modules: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        plugins: fc.option(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
          { nil: undefined }
        ),
      }),
      hash: fc.string({ minLength: 8, maxLength: 64 }),
      createdAt: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    });

    const transformerArb = fc.record({
      id: fc.string({ minLength: 5, maxLength: 50 }),
      handlerId: fc.string({ minLength: 3, maxLength: 30 }),
      fromVersion: fc.string({ minLength: 5, maxLength: 10 }),
      toVersion: fc.string({ minLength: 5, maxLength: 10 }),
      direction: fc.constantFrom<'forward' | 'backward'>('forward', 'backward'),
      transformations: fc.array(
        fc.record({
          path: fc.string({ minLength: 1, maxLength: 30 }),
          type: fc.constantFrom('rename', 'remove', 'add', 'transform'),
          details: fc.anything(),
        }),
        { maxLength: 5 }
      ),
      hash: fc.string({ minLength: 8, maxLength: 64 }),
      createdAt: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    });

    const versionNodeArb = fc.record({
      version: fc.string({ minLength: 5, maxLength: 10 }),
      manifestHash: fc.string({ minLength: 8, maxLength: 64 }),
      deployedAt: fc.integer({ min: 1000000000000, max: 2000000000000 }),
      active: fc.boolean(),
      parent: fc.option(fc.string({ minLength: 5, maxLength: 10 }), { nil: undefined }),
      breaking: fc.boolean(),
      transformers: fc.option(
        fc.array(
          fc.record({
            to: fc.string({ minLength: 5, maxLength: 10 }),
            transformerId: fc.string({ minLength: 5, maxLength: 30 }),
          }),
          { maxLength: 3 }
        ),
        { nil: undefined }
      ),
    });

    const versionGraphArb = fc.record({
      handlerId: fc.string({ minLength: 3, maxLength: 30 }),
      versions: fc.array(versionNodeArb, { minLength: 1, maxLength: 5 }),
      currentVersion: fc.string({ minLength: 5, maxLength: 10 }),
      latestVersion: fc.string({ minLength: 5, maxLength: 10 }),
    });

    const timescapeMetadataArb = fc.record({
      handlerId: fc.string({ minLength: 3, maxLength: 30 }),
      version: fc.string({ minLength: 5, maxLength: 10 }),
      fingerprint: fc.string({ minLength: 8, maxLength: 64 }),
      compatibility: fc.record({
        compatible: fc.array(fc.string({ minLength: 5, maxLength: 10 }), {
          maxLength: 5,
        }),
        incompatible: fc.array(fc.string({ minLength: 5, maxLength: 10 }), {
          maxLength: 5,
        }),
        transformable: fc.array(fc.string({ minLength: 5, maxLength: 10 }), {
          maxLength: 5,
        }),
      }),
      deployment: fc.record({
        strategy: fc.constantFrom<'blue-green' | 'canary' | 'rolling'>(
          'blue-green',
          'canary',
          'rolling'
        ),
        rolloutPercentage: fc.option(fc.integer({ min: 0, max: 100 }), {
          nil: undefined,
        }),
        status: fc.constantFrom<'pending' | 'active' | 'draining' | 'decommissioned'>(
          'pending',
          'active',
          'draining',
          'decommissioned'
        ),
      }),
      metrics: fc.option(
        fc.record({
          requestCount: fc.integer({ min: 0, max: 1000000 }),
          errorRate: fc.double({ min: 0, max: 1 }),
          avgLatency: fc.double({ min: 0, max: 10000 }),
          lastUpdated: fc.integer({ min: 1000000000000, max: 2000000000000 }),
        }),
        { nil: undefined }
      ),
    });

    describe('Property 39: Manifest store persistence', () => {
      // Feature: runtime-architecture, Property 39: Manifest store persistence
      // For any manifest, GType, version graph, transformer stub, or Timescape metadata,
      // the Manifest Store should persist it and make it retrievable
      // Validates: Requirements 11.5

      it('should persist and retrieve any handler manifest', async () => {
        await fc.assert(
          fc.asyncProperty(handlerManifestArb, async (manifest) => {
            await store.storeManifest(manifest);
            const retrieved = await store.getManifest(
              manifest.handlerId,
              manifest.version
            );

            expect(retrieved).toEqual(manifest);
          }),
          { numRuns: 100 }
        );
      });

      it('should persist and retrieve any GType schema', async () => {
        await fc.assert(
          fc.asyncProperty(gtypeArb, async (gtype) => {
            await store.storeGType(gtype);
            const retrieved = await store.getGType(gtype.ref);

            expect(retrieved).toEqual(gtype);
          }),
          { numRuns: 100 }
        );
      });

      it('should persist and retrieve any transformer', async () => {
        await fc.assert(
          fc.asyncProperty(transformerArb, async (transformer) => {
            await store.storeTransformer(transformer);
            const retrieved = await store.getTransformer(transformer.id);

            expect(retrieved).toEqual(transformer);
          }),
          { numRuns: 100 }
        );
      });

      it('should persist and retrieve any version graph', async () => {
        await fc.assert(
          fc.asyncProperty(versionGraphArb, async (graph) => {
            await store.storeVersionGraph(graph);
            const retrieved = await store.getVersionGraph(graph.handlerId);

            expect(retrieved).toEqual(graph);
          }),
          { numRuns: 100 }
        );
      });

      it('should persist and retrieve any Timescape metadata', async () => {
        await fc.assert(
          fc.asyncProperty(timescapeMetadataArb, async (metadata) => {
            await store.storeTimescapeMetadata(metadata);
            const retrieved = await store.getTimescapeMetadata(
              metadata.handlerId,
              metadata.version
            );

            expect(retrieved).toEqual(metadata);
          }),
          { numRuns: 100 }
        );
      });

      it('should handle multiple manifests for same handler', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(handlerManifestArb, { minLength: 2, maxLength: 5 }),
            async (manifests) => {
              // Clear store before each property test run
              await store.clear();
              
              // Use same handlerId but different versions
              const handlerId = 'test.handler';
              const uniqueManifests = manifests.map((m, i) => ({
                ...m,
                handlerId,
                version: `${i}.0.0`,
              }));

              // Store all manifests
              for (const manifest of uniqueManifests) {
                await store.storeManifest(manifest);
              }

              // Retrieve all versions
              const allVersions = await store.getAllManifestVersions(handlerId);
              expect(allVersions).toHaveLength(uniqueManifests.length);

              // Verify each can be retrieved individually
              for (const manifest of uniqueManifests) {
                const retrieved = await store.getManifest(handlerId, manifest.version);
                expect(retrieved).toEqual(manifest);
              }
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should handle concurrent writes and reads', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(handlerManifestArb, { minLength: 5, maxLength: 10 }),
            async (manifests) => {
              // Store all manifests concurrently
              await Promise.all(manifests.map((m) => store.storeManifest(m)));

              // Retrieve all manifests concurrently
              const retrieved = await Promise.all(
                manifests.map((m) => store.getManifest(m.handlerId, m.version))
              );

              // Verify all were stored correctly
              for (let i = 0; i < manifests.length; i++) {
                expect(retrieved[i]).toEqual(manifests[i]);
              }
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should maintain data integrity across all operations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              manifests: fc.array(handlerManifestArb, { minLength: 1, maxLength: 3 }),
              gtypes: fc.array(gtypeArb, { minLength: 1, maxLength: 3 }),
              transformers: fc.array(transformerArb, { minLength: 1, maxLength: 3 }),
              graphs: fc.array(versionGraphArb, { minLength: 1, maxLength: 3 }),
              metadata: fc.array(timescapeMetadataArb, { minLength: 1, maxLength: 3 }),
            }),
            async ({ manifests, gtypes, transformers, graphs, metadata }) => {
              // Clear store before each property test run
              await store.clear();
              
              // Store all data types
              await Promise.all([
                ...manifests.map((m) => store.storeManifest(m)),
                ...gtypes.map((g) => store.storeGType(g)),
                ...transformers.map((t) => store.storeTransformer(t)),
                ...graphs.map((g) => store.storeVersionGraph(g)),
                ...metadata.map((m) => store.storeTimescapeMetadata(m)),
              ]);

              // Verify all data can be retrieved
              const retrievedManifests = await Promise.all(
                manifests.map((m) => store.getManifest(m.handlerId, m.version))
              );
              const retrievedGTypes = await Promise.all(
                gtypes.map((g) => store.getGType(g.ref))
              );
              const retrievedTransformers = await Promise.all(
                transformers.map((t) => store.getTransformer(t.id))
              );
              const retrievedGraphs = await Promise.all(
                graphs.map((g) => store.getVersionGraph(g.handlerId))
              );
              const retrievedMetadata = await Promise.all(
                metadata.map((m) =>
                  store.getTimescapeMetadata(m.handlerId, m.version)
                )
              );

              // Verify integrity
              expect(retrievedManifests).toEqual(manifests);
              expect(retrievedGTypes).toEqual(gtypes);
              expect(retrievedTransformers).toEqual(transformers);
              expect(retrievedGraphs).toEqual(graphs);
              expect(retrievedMetadata).toEqual(metadata);

              // Verify stats
              const stats = store.getStats();
              expect(stats.manifestCount).toBe(manifests.length);
              expect(stats.gtypeCount).toBe(gtypes.length);
              expect(stats.transformerCount).toBe(transformers.length);
              expect(stats.versionGraphCount).toBe(graphs.length);
              expect(stats.timescapeMetadataCount).toBe(metadata.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle updates to existing data', async () => {
        await fc.assert(
          fc.asyncProperty(
            handlerManifestArb,
            handlerManifestArb,
            async (manifest1, manifest2) => {
              // Store initial manifest
              await store.storeManifest(manifest1);

              // Update with same ID and version but different data
              const updated = {
                ...manifest2,
                handlerId: manifest1.handlerId,
                version: manifest1.version,
              };
              await store.storeManifest(updated);

              // Retrieve should return updated version
              const retrieved = await store.getManifest(
                manifest1.handlerId,
                manifest1.version
              );
              expect(retrieved).toEqual(updated);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should retrieve transformers by version pair', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(transformerArb, { minLength: 3, maxLength: 10 }),
            async (transformers) => {
              // Store all transformers
              await Promise.all(transformers.map((t) => store.storeTransformer(t)));

              // For each transformer, verify it can be found by version pair
              for (const transformer of transformers) {
                const found = await store.getTransformersForVersions(
                  transformer.handlerId,
                  transformer.fromVersion,
                  transformer.toVersion
                );

                // Should find at least this transformer
                expect(found.some((t) => t.id === transformer.id)).toBe(true);
              }
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should handle empty results gracefully', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 30 }),
            async (randomId) => {
              // Query for non-existent data
              expect(await store.getManifest(randomId)).toBeUndefined();
              expect(await store.getGType(randomId)).toBeUndefined();
              expect(await store.getTransformer(randomId)).toBeUndefined();
              expect(await store.getVersionGraph(randomId)).toBeUndefined();
              expect(
                await store.getTimescapeMetadata(randomId, '1.0.0')
              ).toBeUndefined();

              // Empty arrays for queries
              expect(await store.getAllManifestVersions(randomId)).toEqual([]);
              expect(
                await store.getTransformersForVersions(randomId, '1.0.0', '2.0.0')
              ).toEqual([]);
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });
});

