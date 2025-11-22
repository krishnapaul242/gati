/**
 * @module timescape/integration
 * @description Integration layer for Timescape with request routing
 */

import type { Request, Response, LocalContext } from '../types/index.js';
import type { TSV } from './types.js';
import type { VersionRegistry } from './registry.js';
import type { TransformerEngine } from './transformer.js';
import type { TimescapeMetrics } from './metrics.js';
import { VersionResolver } from './resolver.js';

export interface TimescapeIntegrationConfig {
    /**
     * Enable version resolution
     */
    enabled: boolean;

    /**
     * Default to latest version if no version specified
     */
    defaultToLatest: boolean;

    /**
     * Apply transformers automatically
     */
    applyTransformers: boolean;

    /**
     * Maximum transformer chain length
     */
    maxChainLength: number;

    /**
     * Timeout for transformer execution (ms)
     */
    transformerTimeout: number;
}

export interface VersionResolutionMetadata {
    requestedVersion?: string;
    resolvedVersion: TSV;
    handlerVersion: TSV;
    source: 'query' | 'header' | 'tag' | 'timestamp' | 'latest';
    transformerChainLength: number;
    transformerExecutionTime: number;
}

/**
 * Timescape integration for request routing
 */
export class TimescapeIntegration {
    private resolver: VersionResolver;
    private config: TimescapeIntegrationConfig;

    constructor(
        private registry: VersionRegistry,
        private transformerEngine: TransformerEngine,
        private metrics?: TimescapeMetrics,
        config?: Partial<TimescapeIntegrationConfig>
    ) {
        this.resolver = new VersionResolver(registry);
        this.config = {
            enabled: true,
            defaultToLatest: true,
            applyTransformers: true,
            maxChainLength: 10,
            transformerTimeout: 5000,
            ...config,
        };
    }

    /**
     * Resolve version for incoming request
     */
    async resolveVersion(
        handlerPath: string,
        req: Request
    ): Promise<VersionResolutionMetadata | { error: string; statusCode: number }> {
        if (!this.config.enabled) {
            const latest = this.registry.getLatestVersion(handlerPath);
            if (!latest) {
                return {
                    error: `No versions found for handler: ${handlerPath}`,
                    statusCode: 404,
                };
            }

            return {
                resolvedVersion: latest,
                handlerVersion: latest,
                source: 'latest',
                transformerChainLength: 0,
                transformerExecutionTime: 0,
            };
        }

        // Resolve version from request
        const resolution = this.resolver.resolveVersion(
            handlerPath,
            req.query || {},
            req.headers || {}
        );

        if ('code' in resolution) {
            // Resolution error
            return {
                error: resolution.message,
                statusCode: resolution.code === 'VERSION_NOT_FOUND' ? 404 : 400,
            };
        }

        // Get handler's current version (latest)
        const handlerVersion = this.registry.getLatestVersion(handlerPath);
        if (!handlerVersion) {
            return {
                error: `No versions found for handler: ${handlerPath}`,
                statusCode: 404,
            };
        }

        // Record metrics
        if (this.metrics) {
            const info = this.registry.getVersionInfo(resolution.version);
            this.metrics.recordVersionRequest(
                handlerPath,
                resolution.version,
                info?.status || 'unknown'
            );
        }

        // Record request in registry
        this.registry.recordRequest(resolution.version);

        return {
            requestedVersion: req.query?.version as string || req.headers?.['x-gati-version'] as string,
            resolvedVersion: resolution.version,
            handlerVersion,
            source: resolution.source,
            transformerChainLength: 0,
            transformerExecutionTime: 0,
        };
    }

    /**
     * Transform request from client version to handler version
     */
    async transformRequest(
        req: Request,
        metadata: VersionResolutionMetadata
    ): Promise<Request> {
        if (!this.config.applyTransformers) {
            return req;
        }

        if (metadata.resolvedVersion === metadata.handlerVersion) {
            // No transformation needed
            return req;
        }

        const startTime = Date.now();

        try {
            // Get all versions for the handler path to build transformation chain
            const registryVersions = this.registry.getVersions(req.path || '').map(v => v.tsv);
            // Ensure both from and to versions are in the array
            const versions = Array.from(new Set([...registryVersions, metadata.resolvedVersion, metadata.handlerVersion]));
            
            const result = await this.transformerEngine.transformRequest(
                req.body,
                metadata.resolvedVersion,
                metadata.handlerVersion,
                versions,
                { timeout: this.config.transformerTimeout }
            );

            if (!result.success) {
                throw new Error(result.error || 'Transformation failed');
            }

            const executionTime = Date.now() - startTime;

            // Update metadata
            metadata.transformerChainLength = result.chainLength || 0;
            metadata.transformerExecutionTime = executionTime;

            // Record metrics
            if (this.metrics) {
                this.metrics.recordTransformerExecution(
                    metadata.resolvedVersion,
                    metadata.handlerVersion,
                    true
                );
                this.metrics.recordTransformerDuration(
                    metadata.resolvedVersion,
                    metadata.handlerVersion,
                    executionTime / 1000
                );
            }

            // Return request with transformed body
            return {
                ...req,
                body: result.data,
            };
        } catch (error) {
            // Record failure
            if (this.metrics) {
                this.metrics.recordTransformerExecution(
                    metadata.resolvedVersion,
                    metadata.handlerVersion,
                    false
                );
            }

            throw error;
        }
    }

    /**
     * Transform response from handler version to client version
     */
    async transformResponse(
        responseData: unknown,
        metadata: VersionResolutionMetadata,
        handlerPath?: string
    ): Promise<unknown> {
        if (!this.config.applyTransformers) {
            return responseData;
        }

        if (metadata.resolvedVersion === metadata.handlerVersion) {
            // No transformation needed
            return responseData;
        }

        const startTime = Date.now();

        try {
            // Get all versions for building transformation chain
            const registryVersions = handlerPath 
                ? this.registry.getVersions(handlerPath).map(v => v.tsv)
                : [];
            // Ensure both from and to versions are in the array
            const versions = Array.from(new Set([...registryVersions, metadata.handlerVersion, metadata.resolvedVersion]));
            
            const result = await this.transformerEngine.transformResponse(
                responseData,
                metadata.handlerVersion,
                metadata.resolvedVersion,
                versions,
                { timeout: this.config.transformerTimeout }
            );

            if (!result.success) {
                throw new Error(result.error || 'Transformation failed');
            }

            const executionTime = Date.now() - startTime;

            // Record metrics
            if (this.metrics) {
                this.metrics.recordTransformerDuration(
                    metadata.handlerVersion,
                    metadata.resolvedVersion,
                    executionTime / 1000
                );
            }

            return result.data;
        } catch (error) {
            // Record failure
            if (this.metrics) {
                this.metrics.recordTransformerExecution(
                    metadata.handlerVersion,
                    metadata.resolvedVersion,
                    false
                );
            }

            throw error;
        }
    }

    /**
     * Attach version metadata to local context
     */
    attachMetadata(lctx: LocalContext, metadata: VersionResolutionMetadata): void {
        // Store in local context state
        lctx.state['timescapeVersion'] = metadata;
    }

    /**
     * Get version metadata from local context
     */
    getMetadata(lctx: LocalContext): VersionResolutionMetadata | undefined {
        return lctx.state['timescapeVersion'] as VersionResolutionMetadata | undefined;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<TimescapeIntegrationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): TimescapeIntegrationConfig {
        return { ...this.config };
    }
}
