import { describe, it, expect, beforeEach } from 'vitest';
import { TransformerEngine, createTransformerPair } from './transformer.js';
import type { TSV, TransformerPair } from './types.js';

describe('TransformerEngine', () => {
    let engine: TransformerEngine;

    beforeEach(() => {
        engine = new TransformerEngine();
    });

    describe('Transformer Registration', () => {
        it('should register a transformer pair', () => {
            const transformer = createTransformerPair(
                'tsv:1000-v1-001' as TSV,
                'tsv:2000-v2-001' as TSV,
                {
                    transformRequest: (data) => data,
                },
                {
                    transformRequest: (data) => data,
                }
            );

            engine.register(transformer);

            expect(engine.getTransformerCount()).toBe(1);
        });

        it('should enforce immutability flag', () => {
            const transformer = {
                fromVersion: 'tsv:1000-v1-001' as TSV,
                toVersion: 'tsv:2000-v2-001' as TSV,
                immutable: false as const,
                createdAt: Date.now(),
                createdBy: 'test',
                forward: {},
                backward: {},
            };

            expect(() => engine.register(transformer as TransformerPair)).toThrow(
                'must be marked as immutable'
            );
        });

        it('should prevent overriding existing transformer', () => {
            const transformer1 = createTransformerPair(
                'tsv:1000-v1-001' as TSV,
                'tsv:2000-v2-001' as TSV,
                {},
                {}
            );

            const transformer2 = createTransformerPair(
                'tsv:1000-v1-001' as TSV,
                'tsv:2000-v2-001' as TSV,
                {},
                {}
            );

            engine.register(transformer1);

            expect(() => engine.register(transformer2)).toThrow('already exists and is immutable');
        });

        it('should allow bidirectional lookup', () => {
            const transformer = createTransformerPair(
                'tsv:1000-v1-001' as TSV,
                'tsv:2000-v2-001' as TSV,
                {},
                {}
            );

            engine.register(transformer);

            expect(engine.hasTransformer('tsv:1000-v1-001' as TSV, 'tsv:2000-v2-001' as TSV)).toBe(
                true
            );
            expect(engine.hasTransformer('tsv:2000-v2-001' as TSV, 'tsv:1000-v1-001' as TSV)).toBe(
                true
            );
        });
    });

    describe('Chain Building', () => {
        const v1: TSV = 'tsv:1000-v1-001';
        const v2: TSV = 'tsv:2000-v2-001';
        const v3: TSV = 'tsv:3000-v3-001';
        const v4: TSV = 'tsv:4000-v4-001';

        it('should build forward chain', () => {
            const chain = engine.buildChain(v1, v3, [v1, v2, v3, v4]);

            expect(chain).toEqual([v1, v2, v3]);
        });

        it('should build backward chain', () => {
            const chain = engine.buildChain(v3, v1, [v1, v2, v3, v4]);

            expect(chain).toEqual([v3, v2, v1]);
        });

        it('should return empty chain for same version', () => {
            const chain = engine.buildChain(v2, v2, [v1, v2, v3]);

            expect(chain).toEqual([]);
        });

        it('should return null for missing version', () => {
            const chain = engine.buildChain(v1, 'tsv:9999-v9-001' as TSV, [v1, v2, v3]);

            expect(chain).toBeNull();
        });

        it('should enforce max chain length', () => {
            const shortEngine = new TransformerEngine(2);
            const versions = [v1, v2, v3, v4];

            expect(() => shortEngine.buildChain(v1, v4, versions)).toThrow(
                'Transformation chain too long'
            );
        });

        it('should handle unsorted version arrays', () => {
            const chain = engine.buildChain(v1, v3, [v3, v1, v4, v2]);

            expect(chain).toEqual([v1, v2, v3]);
        });
    });

    describe('Request Transformation', () => {
        const v1: TSV = 'tsv:1000-v1-001';
        const v2: TSV = 'tsv:2000-v2-001';
        const v3: TSV = 'tsv:3000-v3-001';

        beforeEach(() => {
            // Register transformers
            engine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformRequest: (data: unknown) => ({
                            ...(data as object),
                            v2: true,
                        }),
                    },
                    {
                        transformRequest: (data: unknown) => {
                            const { v2, ...rest } = data as { v2?: boolean };
                            return rest;
                        },
                    }
                )
            );

            engine.register(
                createTransformerPair(
                    v2,
                    v3,
                    {
                        transformRequest: (data: unknown) => ({
                            ...(data as object),
                            v3: true,
                        }),
                    },
                    {
                        transformRequest: (data: unknown) => {
                            const { v3, ...rest } = data as { v3?: boolean };
                            return rest;
                        },
                    }
                )
            );
        });

        it('should transform request forward through chain', async () => {
            const input = { name: 'test' };
            const result = await engine.transformRequest(input, v1, v3, [v1, v2, v3]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ name: 'test', v2: true, v3: true });
            expect(result.transformedVersions).toEqual([v2, v3]);
        });

        it('should transform request backward through chain', async () => {
            const input = { name: 'test', v2: true, v3: true };
            const result = await engine.transformRequest(input, v3, v1, [v1, v2, v3]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ name: 'test' });
            expect(result.transformedVersions).toEqual([v2, v1]);
        });

        it('should return original data when no transformation needed', async () => {
            const input = { name: 'test' };
            const result = await engine.transformRequest(input, v2, v2, [v1, v2, v3]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
            expect(result.transformedVersions).toEqual([]);
        });

        it('should handle missing transformer', async () => {
            const v4: TSV = 'tsv:4000-v4-001';
            const input = { name: 'test' };
            const result = await engine.transformRequest(input, v3, v4, [v1, v2, v3, v4]);

            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('No transformer found');
        });

        it('should handle transformation errors', async () => {
            const errorEngine = new TransformerEngine();
            errorEngine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformRequest: () => {
                            throw new Error('Transform failed');
                        },
                    },
                    {}
                )
            );

            const result = await errorEngine.transformRequest({ name: 'test' }, v1, v2, [v1, v2]);

            expect(result.success).toBe(false);
            expect(result.error?.message).toBe('Transform failed');
        });

        it('should fallback on error when option enabled', async () => {
            const errorEngine = new TransformerEngine();
            errorEngine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformRequest: () => {
                            throw new Error('Transform failed');
                        },
                    },
                    {}
                )
            );

            const input = { name: 'test' };
            const result = await errorEngine.transformRequest(input, v1, v2, [v1, v2], {
                fallbackOnError: true,
            });

            expect(result.success).toBe(false);
            expect(result.data).toEqual(input); // Original data returned
            expect(result.error).toBeDefined();
        });

        it('should handle async transformers', async () => {
            const asyncEngine = new TransformerEngine();
            asyncEngine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformRequest: async (data: unknown) => {
                            await new Promise((resolve) => setTimeout(resolve, 10));
                            return { ...(data as object), async: true };
                        },
                    },
                    {}
                )
            );

            const result = await asyncEngine.transformRequest({ name: 'test' }, v1, v2, [v1, v2]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ name: 'test', async: true });
        });

        it('should timeout long transformations', async () => {
            const slowEngine = new TransformerEngine();
            slowEngine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformRequest: async (data: unknown) => {
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            return data;
                        },
                    },
                    {}
                )
            );

            const result = await slowEngine.transformRequest({ name: 'test' }, v1, v2, [v1, v2], {
                timeout: 50,
            });

            expect(result.success).toBe(false);
            expect(result.error?.message).toBe('Transformation timeout');
        });
    });

    describe('Response Transformation', () => {
        const v1: TSV = 'tsv:1000-v1-001';
        const v2: TSV = 'tsv:2000-v2-001';

        it('should transform response data', async () => {
            engine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformResponse: (data: unknown) => ({
                            ...(data as object),
                            transformed: true,
                        }),
                    },
                    {}
                )
            );

            const result = await engine.transformResponse({ id: 1 }, v1, v2, [v1, v2]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ id: 1, transformed: true });
        });

        it('should handle missing response transformer', async () => {
            engine.register(
                createTransformerPair(
                    v1,
                    v2,
                    {
                        transformRequest: (data) => data,
                    },
                    {}
                )
            );

            const input = { id: 1 };
            const result = await engine.transformResponse(input, v1, v2, [v1, v2]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(input); // No transformation applied
        });
    });

    describe('Transformer Queries', () => {
        const v1: TSV = 'tsv:1000-v1-001';
        const v2: TSV = 'tsv:2000-v2-001';
        const v3: TSV = 'tsv:3000-v3-001';

        beforeEach(() => {
            engine.register(createTransformerPair(v1, v2, {}, {}));
            engine.register(createTransformerPair(v2, v3, {}, {}));
        });

        it('should get transformer by versions', () => {
            const transformer = engine.getTransformer(v1, v2);

            expect(transformer).toBeDefined();
            expect(transformer?.fromVersion).toBe(v1);
            expect(transformer?.toVersion).toBe(v2);
        });

        it('should check transformer existence', () => {
            expect(engine.hasTransformer(v1, v2)).toBe(true);
            expect(engine.hasTransformer(v1, v3)).toBe(false);
        });

        it('should get all transformers', () => {
            const all = engine.getAllTransformers();

            expect(all).toHaveLength(2);
        });

        it('should get transformer count', () => {
            expect(engine.getTransformerCount()).toBe(2);
        });

        it('should clear all transformers', () => {
            engine.clear();

            expect(engine.getTransformerCount()).toBe(0);
        });
    });

    describe('createTransformerPair', () => {
        it('should create transformer with all required fields', () => {
            const transformer = createTransformerPair(
                'tsv:1000-v1-001' as TSV,
                'tsv:2000-v2-001' as TSV,
                { transformRequest: (data) => data },
                { transformRequest: (data) => data },
                'developer'
            );

            expect(transformer.immutable).toBe(true);
            expect(transformer.createdBy).toBe('developer');
            expect(transformer.createdAt).toBeGreaterThan(0);
            expect(transformer.forward.transformRequest).toBeDefined();
            expect(transformer.backward.transformRequest).toBeDefined();
        });

        it('should default createdBy to system', () => {
            const transformer = createTransformerPair(
                'tsv:1000-v1-001' as TSV,
                'tsv:2000-v2-001' as TSV,
                {},
                {}
            );

            expect(transformer.createdBy).toBe('system');
        });
    });
});
