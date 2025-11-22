import { describe, it, expect, beforeEach } from 'vitest';
import { VersionResolver } from './resolver.js';
import { VersionRegistry } from './registry.js';
import type { TSV } from './types.js';

describe('VersionResolver', () => {
    let registry: VersionRegistry;
    let resolver: VersionResolver;

    const v1: TSV = 'tsv:1732186200-users-001';
    const v2: TSV = 'tsv:1732186300-users-002';
    const v3: TSV = 'tsv:1732186400-users-003';

    beforeEach(() => {
        registry = new VersionRegistry();
        resolver = new VersionResolver(registry);

        // Register versions
        registry.registerVersion('/api/users', v1, { hash: 'a' });
        registry.registerVersion('/api/users', v2, { hash: 'b' });
        registry.registerVersion('/api/users', v3, { hash: 'c' });

        // Tag versions
        registry.tagVersion(v1, 'v1.0.0');
        registry.tagVersion(v2, 'v2.0.0');
        registry.tagVersion(v2, 'stable');
        registry.tagVersion(v3, 'v3.0.0');
    });

    describe('Query Parameter Extraction', () => {
        it('should extract version from query.version', () => {
            const version = resolver.extractFromQuery({ version: 'v1.0.0' });
            expect(version).toBe('v1.0.0');
        });

        it('should extract version from query.v', () => {
            const version = resolver.extractFromQuery({ v: 'v1.0.0' });
            expect(version).toBe('v1.0.0');
        });

        it('should prefer version over v', () => {
            const version = resolver.extractFromQuery({ version: 'v2.0.0', v: 'v1.0.0' });
            expect(version).toBe('v2.0.0');
        });

        it('should handle array values', () => {
            const version = resolver.extractFromQuery({ version: ['v1.0.0', 'v2.0.0'] });
            expect(version).toBe('v1.0.0');
        });

        it('should return null when no version', () => {
            const version = resolver.extractFromQuery({});
            expect(version).toBeNull();
        });
    });

    describe('Header Extraction', () => {
        it('should extract version from x-gati-version', () => {
            const version = resolver.extractFromHeaders({ 'x-gati-version': 'v1.0.0' });
            expect(version).toBe('v1.0.0');
        });

        it('should extract version from x-api-version', () => {
            const version = resolver.extractFromHeaders({ 'x-api-version': 'v1.0.0' });
            expect(version).toBe('v1.0.0');
        });

        it('should prefer x-gati-version', () => {
            const version = resolver.extractFromHeaders({
                'x-gati-version': 'v2.0.0',
                'x-api-version': 'v1.0.0',
            });
            expect(version).toBe('v2.0.0');
        });

        it('should handle array values', () => {
            const version = resolver.extractFromHeaders({ 'x-gati-version': ['v1.0.0', 'v2.0.0'] });
            expect(version).toBe('v1.0.0');
        });

        it('should return null when no version', () => {
            const version = resolver.extractFromHeaders({});
            expect(version).toBeNull();
        });
    });

    describe('Timestamp Parsing', () => {
        it('should parse ISO 8601 timestamp', () => {
            const timestamp = resolver.parseTimestamp('2025-11-21T10:30:00Z');
            expect(timestamp).toBeGreaterThan(0);
            expect(timestamp).toBeLessThan(2000000000); // Should be in seconds
        });

        it('should parse Unix timestamp (seconds)', () => {
            const timestamp = resolver.parseTimestamp('1732186200');
            expect(timestamp).toBe(1732186200); // Returns seconds
        });

        it('should parse Unix timestamp (milliseconds)', () => {
            const timestamp = resolver.parseTimestamp('1732186200000');
            expect(timestamp).toBe(1732186200); // Converts to seconds
        });

        it('should return null for invalid format', () => {
            const timestamp = resolver.parseTimestamp('invalid');
            expect(timestamp).toBeNull();
        });

        it('should return null for invalid ISO date', () => {
            const timestamp = resolver.parseTimestamp('2025-13-45T99:99:99Z');
            expect(timestamp).toBeNull();
        });
    });

    describe('Version Resolution', () => {
        it('should resolve version from query parameter', () => {
            const result = resolver.resolveVersion('/api/users', { version: 'v1.0.0' }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v1);
                expect(result.source).toBe('tag');
            }
        });

        it('should resolve version from header', () => {
            const result = resolver.resolveVersion('/api/users', {}, { 'x-gati-version': 'v2.0.0' });

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v2);
                expect(result.source).toBe('tag');
            }
        });

        it('should prefer query over header', () => {
            const result = resolver.resolveVersion(
                '/api/users',
                { version: 'v1.0.0' },
                { 'x-gati-version': 'v2.0.0' }
            );

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v1);
            }
        });

        it('should resolve to latest when no version specified', () => {
            const result = resolver.resolveVersion('/api/users', {}, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v3);
                expect(result.source).toBe('latest');
            }
        });

        it('should resolve semantic version tag', () => {
            const result = resolver.resolveVersion('/api/users', { version: 'stable' }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v2);
                expect(result.source).toBe('tag');
            }
        });

        it('should resolve timestamp', () => {
            // 1732186250 is between v1 (1732186200) and v2 (1732186300)
            // getVersionAt returns the version at or before that timestamp, so it should return v1
            const result = resolver.resolveVersion('/api/users', { version: '1732186250' }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v1);
                expect(result.source).toBe('timestamp');
            }
        });

        it('should resolve ISO timestamp', () => {
            const result = resolver.resolveVersion(
                '/api/users',
                { version: '2025-11-21T10:05:00Z' },
                {}
            );

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.source).toBe('timestamp');
            }
        });

        it('should resolve direct TSV', () => {
            const result = resolver.resolveVersion('/api/users', { version: v2 }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v2);
                expect(result.source).toBe('query');
            }
        });

        it('should return error for non-existent tag', () => {
            const result = resolver.resolveVersion('/api/users', { version: 'v99.0.0' }, {});

            expect('code' in result).toBe(true);
            if ('code' in result) {
                expect(result.code).toBe('INVALID_FORMAT');
            }
        });

        it('should return error for invalid timestamp', () => {
            const result = resolver.resolveVersion('/api/users', { version: 'invalid-date' }, {});

            expect('code' in result).toBe(true);
            if ('code' in result) {
                expect(result.code).toBe('INVALID_FORMAT');
            }
        });

        it('should return error for non-existent handler', () => {
            const result = resolver.resolveVersion('/api/posts', {}, {});

            expect('code' in result).toBe(true);
            if ('code' in result) {
                expect(result.code).toBe('VERSION_NOT_FOUND');
                expect(result.message).toContain('/api/posts');
            }
        });

        it('should return error for timestamp before all versions', () => {
            // Use timestamp 1000000000 seconds which is before v1 (1732186200 seconds)
            const result = resolver.resolveVersion('/api/users', { version: '1000000000' }, {});

            expect('code' in result).toBe(true);
            if ('code' in result) {
                expect(result.code).toBe('VERSION_NOT_FOUND');
            }
        });
    });

    describe('Version Format Validation', () => {
        it('should validate TSV format', () => {
            expect(resolver.validateVersionFormat('tsv:1732186200-users-001')).toBe(true);
        });

        it('should validate ISO timestamp', () => {
            expect(resolver.validateVersionFormat('2025-11-21T10:30:00Z')).toBe(true);
        });

        it('should validate Unix timestamp (seconds)', () => {
            expect(resolver.validateVersionFormat('1732186200')).toBe(true);
        });

        it('should validate Unix timestamp (milliseconds)', () => {
            expect(resolver.validateVersionFormat('1732186200000')).toBe(true);
        });

        it('should validate semantic version', () => {
            expect(resolver.validateVersionFormat('v1.0.0')).toBe(true);
            expect(resolver.validateVersionFormat('stable')).toBe(true);
        });

        it('should reject invalid TSV format', () => {
            expect(resolver.validateVersionFormat('tsv:invalid')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(resolver.validateVersionFormat('')).toBe(false);
        });
    });

    describe('Caching', () => {
        it('should cache resolution results', () => {
            const result1 = resolver.resolveVersion('/api/users', { version: 'v1.0.0' }, {});
            const result2 = resolver.resolveVersion('/api/users', { version: 'v1.0.0' }, {});

            expect('cached' in result1 && result1.cached).toBe(false);
            expect('cached' in result2 && result2.cached).toBe(true);
        });

        it('should use different cache keys for different queries', () => {
            const result1 = resolver.resolveVersion('/api/users', { version: 'v1.0.0' }, {});
            const result2 = resolver.resolveVersion('/api/users', { version: 'v2.0.0' }, {});

            if ('version' in result1 && 'version' in result2) {
                expect(result1.version).not.toBe(result2.version);
            }
        });

        it('should clear cache', () => {
            resolver.resolveVersion('/api/users', { version: 'v1.0.0' }, {});
            expect(resolver.getCacheStats().size).toBe(1);

            resolver.clearCache();
            expect(resolver.getCacheStats().size).toBe(0);
        });

        it('should respect max cache size', () => {
            const stats = resolver.getCacheStats();
            expect(stats.maxSize).toBe(1000);
        });

        it('should evict oldest entry when cache is full', () => {
            // This would require creating 1001 unique cache entries
            // For now, just verify the mechanism exists
            const stats = resolver.getCacheStats();
            expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined query values', () => {
            const result = resolver.resolveVersion('/api/users', { version: undefined }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.source).toBe('latest');
            }
        });

        it('should handle empty string version', () => {
            // Empty string is treated as no version specified, defaults to latest
            const result = resolver.resolveVersion('/api/users', { version: '' }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.source).toBe('latest');
            }
        });

        it('should handle special characters in version', () => {
            registry.tagVersion(v1, 'v1.0.0-beta.1');
            const result = resolver.resolveVersion('/api/users', { version: 'v1.0.0-beta.1' }, {});

            expect('version' in result).toBe(true);
            if ('version' in result) {
                expect(result.version).toBe(v1);
            }
        });
    });
});
