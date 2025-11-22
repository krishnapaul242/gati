import type { TSV, VersionRegistryState } from './types.js';
import type { VersionRegistry } from './registry.js';

export interface ResolutionContext {
    requestId: string;
    requestedVersion?: TSV; // Explicit version request
    actor?: string;
    timestamp?: number; // Time-travel timestamp
}

export interface VersionResolutionResult {
    version: TSV;
    source: 'query' | 'header' | 'tag' | 'timestamp' | 'latest';
    cached: boolean;
}

export interface VersionResolutionError {
    code: 'INVALID_FORMAT' | 'VERSION_NOT_FOUND' | 'TAG_NOT_FOUND' | 'INVALID_TIMESTAMP';
    message: string;
    details?: unknown;
}

/**
 * Version resolver for extracting and resolving versions from requests
 */
export class VersionResolver {
    private registry: VersionRegistry;
    private cache: Map<string, VersionResolutionResult> = new Map();
    private readonly maxCacheSize = 1000;

    constructor(registry: VersionRegistry) {
        this.registry = registry;
    }

    /**
     * Extract version from query parameters
     */
    public extractFromQuery(query: Record<string, string | string[] | undefined>): string | null {
        const version = query.version || query.v;
        
        if (!version) {
            return null;
        }

        const extracted = Array.isArray(version) ? version[0] : version;
        
        // Return null for empty strings
        return extracted && extracted.trim() !== '' ? extracted : null;
    }

    /**
     * Extract version from headers
     */
    public extractFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
        const version = headers['x-gati-version'] || headers['x-api-version'];
        
        if (!version) {
            return null;
        }

        const extracted = Array.isArray(version) ? version[0] : version;
        
        // Return null for empty strings
        return extracted && extracted.trim() !== '' ? extracted : null;
    }

    /**
     * Parse timestamp from various formats
     * Returns timestamp in SECONDS (to match TSV format)
     */
    public parseTimestamp(value: string): number | null {
        // ISO 8601 format: 2025-11-21T10:30:00Z
        if (value.includes('T')) {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000);
        }

        // Unix timestamp (seconds)
        if (/^\d{10}$/.test(value)) {
            return parseInt(value, 10);
        }

        // Unix timestamp (milliseconds) - convert to seconds
        if (/^\d{13}$/.test(value)) {
            return Math.floor(parseInt(value, 10) / 1000);
        }

        return null;
    }

    /**
     * Resolve version for a handler
     */
    public resolveVersion(
        handlerPath: string,
        query: Record<string, string | string[] | undefined>,
        headers: Record<string, string | string[] | undefined>
    ): VersionResolutionResult | VersionResolutionError {
        // Try cache first
        const cacheKey = this.makeCacheKey(handlerPath, query, headers);
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return { ...cached, cached: true };
        }

        // 1. Try query parameter
        const queryVersion = this.extractFromQuery(query);
        if (queryVersion) {
            const result = this.resolveVersionString(handlerPath, queryVersion, 'query');
            if ('code' in result) {
                return result;
            }
            this.cacheResult(cacheKey, result);
            return result;
        }

        // 2. Try header
        const headerVersion = this.extractFromHeaders(headers);
        if (headerVersion) {
            const result = this.resolveVersionString(handlerPath, headerVersion, 'header');
            if ('code' in result) {
                return result;
            }
            this.cacheResult(cacheKey, result);
            return result;
        }

        // 3. Default to latest
        const latest = this.registry.getLatestVersion(handlerPath);
        if (!latest) {
            return {
                code: 'VERSION_NOT_FOUND',
                message: `No versions found for handler: ${handlerPath}`,
            };
        }

        const result: VersionResolutionResult = {
            version: latest,
            source: 'latest',
            cached: false,
        };

        this.cacheResult(cacheKey, result);
        return result;
    }

    /**
     * Resolve version string to TSV
     */
    private resolveVersionString(
        handlerPath: string,
        versionString: string,
        source: 'query' | 'header'
    ): VersionResolutionResult | VersionResolutionError {
        // Handle empty string
        if (!versionString || versionString.trim() === '') {
            return {
                code: 'INVALID_FORMAT',
                message: 'Version string cannot be empty',
                details: { versionString },
            };
        }

        // Try as semantic version tag
        if (!versionString.includes('T') && !versionString.startsWith('tsv:')) {
            const tsv = this.registry.getVersionByTag(handlerPath, versionString);
            if (tsv) {
                return {
                    version: tsv,
                    source: 'tag',
                    cached: false,
                };
            }
        }

        // Try as timestamp
        if (versionString.includes('T') || /^\d{10,13}$/.test(versionString)) {
            const timestamp = this.parseTimestamp(versionString);
            if (!timestamp) {
                return {
                    code: 'INVALID_TIMESTAMP',
                    message: `Invalid timestamp format: ${versionString}`,
                    details: { versionString },
                };
            }

            const tsv = this.registry.getVersionAt(handlerPath, timestamp);
            if (!tsv) {
                return {
                    code: 'VERSION_NOT_FOUND',
                    message: `No version found at timestamp: ${versionString}`,
                    details: { timestamp, handlerPath },
                };
            }

            return {
                version: tsv,
                source: 'timestamp',
                cached: false,
            };
        }

        // Try as direct TSV
        if (versionString.startsWith('tsv:')) {
            const info = this.registry.getVersionInfo(versionString as TSV);
            if (!info) {
                return {
                    code: 'VERSION_NOT_FOUND',
                    message: `Version not found: ${versionString}`,
                    details: { versionString },
                };
            }

            return {
                version: versionString as TSV,
                source,
                cached: false,
            };
        }

        // Invalid format
        return {
            code: 'INVALID_FORMAT',
            message: `Invalid version format: ${versionString}`,
            details: { versionString },
        };
    }

    /**
     * Validate version format
     */
    public validateVersionFormat(version: string): boolean {
        // TSV format
        if (version.startsWith('tsv:')) {
            return /^tsv:\d+-[a-zA-Z0-9_-]+-\d+$/.test(version);
        }

        // Timestamp format
        if (version.includes('T') || /^\d{10,13}$/.test(version)) {
            return this.parseTimestamp(version) !== null;
        }

        // Semantic version or tag (any non-empty string)
        return version.length > 0;
    }

    /**
     * Clear version cache
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
        };
    }

    /**
     * Create cache key
     */
    private makeCacheKey(
        handlerPath: string,
        query: Record<string, string | string[] | undefined>,
        headers: Record<string, string | string[] | undefined>
    ): string {
        const queryVersion = this.extractFromQuery(query);
        const headerVersion = this.extractFromHeaders(headers);
        return `${handlerPath}:${queryVersion || ''}:${headerVersion || ''}`;
    }

    /**
     * Cache resolution result
     */
    private cacheResult(key: string, result: VersionResolutionResult): void {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, result);
    }
}

/**
 * Legacy resolver for backward compatibility
 */
export class ExecutionContextResolver {
    private registry: VersionRegistry;

    constructor(registry: VersionRegistry) {
        this.registry = registry;
    }

    /**
     * Resolves the complete version state for a given context.
     */
    public resolve(_context: ResolutionContext): VersionRegistryState {
        return this.registry.getAll();
    }

    /**
     * Resolves a specific artifact version for the current context.
     */
    public resolveArtifact(
        type: 'module' | 'schema' | 'route',
        id: string,
        _context: ResolutionContext
    ): TSV | undefined {
        return this.registry.get(type, id);
    }
}
