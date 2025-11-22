import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimescapeIntegration } from './integration.js';
import { VersionRegistry } from './registry.js';
import { TransformerEngine } from './transformer.js';
import { TimescapeMetrics } from './metrics.js';
import type { Request, LocalContext } from '../types/index.js';
import type { TSV } from './types.js';

describe('TimescapeIntegration', () => {
    let registry: VersionRegistry;
    let transformerEngine: TransformerEngine;
    let metrics: TimescapeMetrics;
    let integration: TimescapeIntegration;

    beforeEach(() => {
        registry = new VersionRegistry();
        transformerEngine = new TransformerEngine();
        metrics = new TimescapeMetrics();
        integration = new TimescapeIntegration(registry, transformerEngine, metrics);
    });

    describe('Version Resolution', () => {
        it('should resolve version from query parameter', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });
            registry.tagVersion(tsv, 'v1.0.0');

            const req: Partial<Request> = {
                query: { version: 'v1.0.0' },
                headers: {},
            };

            const result = await integration.resolveVersion('/api/users', req as Request);

            expect('error' in result).toBe(false);
            if (!('error' in result)) {
                expect(result.resolvedVersion).toBe(tsv);
                expect(result.source).toBe('tag');
            }
        });

        it('should resolve version from header', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });
            registry.tagVersion(tsv, 'v1.0.0');

            const req: Partial<Request> = {
                query: {},
                headers: { 'x-gati-version': 'v1.0.0' },
            };

            const result = await integration.resolveVersion('/api/users', req as Request);

            expect('error' in result).toBe(false);
            if (!('error' in result)) {
                expect(result.resolvedVersion).toBe(tsv);
                expect(result.source).toBe('tag');
            }
        });

        it('should default to latest version', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });

            const req: Partial<Request> = {
                query: {},
                headers: {},
            };

            const result = await integration.resolveVersion('/api/users', req as Request);

            expect('error' in result).toBe(false);
            if (!('error' in result)) {
                expect(result.resolvedVersion).toBe(tsv);
                expect(result.source).toBe('latest');
            }
        });

        it('should return error for invalid version', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });

            const req: Partial<Request> = {
                query: { version: 'invalid' },
                headers: {},
            };

            const result = await integration.resolveVersion('/api/users', req as Request);

            expect('error' in result).toBe(true);
            if ('error' in result) {
                expect(result.statusCode).toBe(400);
            }
        });

        it('should return error for non-existent handler', async () => {
            const req: Partial<Request> = {
                query: {},
                headers: {},
            };

            const result = await integration.resolveVersion('/api/nonexistent', req as Request);

            expect('error' in result).toBe(true);
            if ('error' in result) {
                expect(result.statusCode).toBe(404);
            }
        });

        it('should record request in registry', async () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });

            const req: Partial<Request> = {
                query: {},
                headers: {},
            };

            await integration.resolveVersion('/api/users', req as Request);

            const info = registry.getVersionInfo(tsv);
            expect(info?.requestCount).toBe(1);
        });
    });

    describe('Request Transformation', () => {
        it('should transform request when versions differ', async () => {
            const v1: TSV = 'tsv:1000-users-001';
            const v2: TSV = 'tsv:2000-users-002';

            registry.registerVersion('/api/users', v1, { hash: 'a' });
            registry.registerVersion('/api/users', v2, { hash: 'b' });

            transformerEngine.register({
                fromVersion: v1,
                toVersion: v2,
                forward: {
                    request: async (data) => ({ ...data, newField: 'added' }),
                    response: async (data) => data,
                },
                backward: {
                    request: async (data) => data,
                    response: async (data) => data,
                },
            });

            const req: Partial<Request> = {
                body: { id: 1, name: 'Test' },
            };

            const metadata = {
                resolvedVersion: v1,
                handlerVersion: v2,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            const transformed = await integration.transformRequest(req as Request, metadata);

            expect(transformed.body).toEqual({
                id: 1,
                name: 'Test',
                newField: 'added',
            });
            expect(metadata.transformerChainLength).toBe(1);
        });

        it('should not transform when versions match', async () => {
            const tsv: TSV = 'tsv:1000-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });

            const req: Partial<Request> = {
                body: { id: 1, name: 'Test' },
            };

            const metadata = {
                resolvedVersion: tsv,
                handlerVersion: tsv,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            const transformed = await integration.transformRequest(req as Request, metadata);

            expect(transformed.body).toEqual({ id: 1, name: 'Test' });
            expect(metadata.transformerChainLength).toBe(0);
        });

        it('should throw error on transformation failure', async () => {
            const v1: TSV = 'tsv:1000-users-001';
            const v2: TSV = 'tsv:2000-users-002';

            registry.registerVersion('/api/users', v1, { hash: 'a' });
            registry.registerVersion('/api/users', v2, { hash: 'b' });

            transformerEngine.register({
                fromVersion: v1,
                toVersion: v2,
                forward: {
                    request: async () => {
                        throw new Error('Transform failed');
                    },
                    response: async (data) => data,
                },
                backward: {
                    request: async (data) => data,
                    response: async (data) => data,
                },
            });

            const req: Partial<Request> = {
                body: { id: 1 },
            };

            const metadata = {
                resolvedVersion: v1,
                handlerVersion: v2,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            await expect(
                integration.transformRequest(req as Request, metadata)
            ).rejects.toThrow('Transform failed');
        });
    });

    describe('Response Transformation', () => {
        it('should transform response when versions differ', async () => {
            const v1: TSV = 'tsv:1000-users-001';
            const v2: TSV = 'tsv:2000-users-002';

            registry.registerVersion('/api/users', v1, { hash: 'a' });
            registry.registerVersion('/api/users', v2, { hash: 'b' });

            transformerEngine.register({
                fromVersion: v1,
                toVersion: v2,
                forward: {
                    request: async (data) => data,
                    response: async (data) => data,
                },
                backward: {
                    request: async (data) => data,
                    response: async (data) => {
                        const { newField, ...rest } = data as any;
                        return rest;
                    },
                },
            });

            const metadata = {
                resolvedVersion: v1,
                handlerVersion: v2,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            const responseData = { id: 1, name: 'Test', newField: 'value' };
            const transformed = await integration.transformResponse(responseData, metadata);

            expect(transformed).toEqual({ id: 1, name: 'Test' });
        });

        it('should not transform when versions match', async () => {
            const tsv: TSV = 'tsv:1000-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });

            const metadata = {
                resolvedVersion: tsv,
                handlerVersion: tsv,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            const responseData = { id: 1, name: 'Test' };
            const transformed = await integration.transformResponse(responseData, metadata);

            expect(transformed).toEqual({ id: 1, name: 'Test' });
        });
    });

    describe('Metadata Management', () => {
        it('should attach metadata to local context', () => {
            const lctx = {
                state: {},
            } as LocalContext;

            const metadata = {
                resolvedVersion: 'tsv:1000-users-001' as TSV,
                handlerVersion: 'tsv:2000-users-002' as TSV,
                source: 'query' as const,
                transformerChainLength: 1,
                transformerExecutionTime: 10,
            };

            integration.attachMetadata(lctx, metadata);

            expect(lctx.state['timescapeVersion']).toEqual(metadata);
        });

        it('should retrieve metadata from local context', () => {
            const metadata = {
                resolvedVersion: 'tsv:1000-users-001' as TSV,
                handlerVersion: 'tsv:2000-users-002' as TSV,
                source: 'query' as const,
                transformerChainLength: 1,
                transformerExecutionTime: 10,
            };

            const lctx = {
                state: {
                    timescapeVersion: metadata,
                },
            } as LocalContext;

            const retrieved = integration.getMetadata(lctx);

            expect(retrieved).toEqual(metadata);
        });
    });

    describe('Configuration', () => {
        it('should use default configuration', () => {
            const config = integration.getConfig();

            expect(config.enabled).toBe(true);
            expect(config.defaultToLatest).toBe(true);
            expect(config.applyTransformers).toBe(true);
            expect(config.maxChainLength).toBe(10);
            expect(config.transformerTimeout).toBe(5000);
        });

        it('should update configuration', () => {
            integration.updateConfig({
                enabled: false,
                maxChainLength: 5,
            });

            const config = integration.getConfig();

            expect(config.enabled).toBe(false);
            expect(config.maxChainLength).toBe(5);
            expect(config.applyTransformers).toBe(true); // Unchanged
        });

        it('should skip transformation when disabled', async () => {
            integration.updateConfig({ applyTransformers: false });

            const v1: TSV = 'tsv:1000-users-001';
            const v2: TSV = 'tsv:2000-users-002';

            const req: Partial<Request> = {
                body: { id: 1 },
            };

            const metadata = {
                resolvedVersion: v1,
                handlerVersion: v2,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            const transformed = await integration.transformRequest(req as Request, metadata);

            expect(transformed.body).toEqual({ id: 1 });
            expect(metadata.transformerChainLength).toBe(0);
        });
    });

    describe('Metrics Integration', () => {
        it('should record version request metrics', async () => {
            const recordSpy = vi.spyOn(metrics, 'recordVersionRequest');

            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });

            const req: Partial<Request> = {
                query: {},
                headers: {},
            };

            await integration.resolveVersion('/api/users', req as Request);

            expect(recordSpy).toHaveBeenCalledWith('/api/users', tsv, expect.any(String));
        });

        it('should record transformer execution metrics', async () => {
            const executionSpy = vi.spyOn(metrics, 'recordTransformerExecution');
            const durationSpy = vi.spyOn(metrics, 'recordTransformerDuration');

            const v1: TSV = 'tsv:1000-users-001';
            const v2: TSV = 'tsv:2000-users-002';

            registry.registerVersion('/api/users', v1, { hash: 'a' });
            registry.registerVersion('/api/users', v2, { hash: 'b' });

            transformerEngine.register({
                fromVersion: v1,
                toVersion: v2,
                forward: {
                    request: async (data) => data,
                    response: async (data) => data,
                },
                backward: {
                    request: async (data) => data,
                    response: async (data) => data,
                },
            });

            const req: Partial<Request> = {
                body: { id: 1 },
            };

            const metadata = {
                resolvedVersion: v1,
                handlerVersion: v2,
                source: 'query' as const,
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };

            await integration.transformRequest(req as Request, metadata);

            expect(executionSpy).toHaveBeenCalledWith(v1, v2, true);
            expect(durationSpy).toHaveBeenCalledWith(v1, v2, expect.any(Number));
        });
    });
});
