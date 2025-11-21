import { describe, it, expect, beforeEach } from 'vitest';
import { VersionRegistry } from './registry.js';
import type { TSV, VersionInfo } from './types.js';

describe('VersionRegistry', () => {
    let registry: VersionRegistry;

    beforeEach(() => {
        registry = new VersionRegistry();
    });

    describe('Version Registration', () => {
        it('should register a new version', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.registerVersion('/api/users', tsv, {
                hash: 'abc123',
                status: 'hot',
            });

            const versions = registry.getVersions('/api/users');
            expect(versions).toHaveLength(1);
            expect(versions[0].tsv).toBe(tsv);
            expect(versions[0].status).toBe('hot');
        });

        it('should maintain chronological order when registering versions', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            const tsv3: TSV = 'tsv:1732186250-users-003';

            registry.registerVersion('/api/users', tsv1, { hash: 'a' });
            registry.registerVersion('/api/users', tsv2, { hash: 'b' });
            registry.registerVersion('/api/users', tsv3, { hash: 'c' }); // Out of order

            const versions = registry.getVersions('/api/users');
            expect(versions).toHaveLength(3);
            expect(versions[0].tsv).toBe(tsv1);
            expect(versions[1].tsv).toBe(tsv3); // Should be inserted in correct position
            expect(versions[2].tsv).toBe(tsv2);
        });

        it('should add version to active set', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.registerVersion('/api/users', tsv, { hash: 'abc' });

            const activeVersions = registry.getActiveVersions();
            expect(activeVersions).toContain(tsv);
        });
    });

    describe('Version Lookup by Timestamp', () => {
        beforeEach(() => {
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, { hash: 'a' });
            registry.registerVersion('/api/users', 'tsv:1732186300-users-002' as TSV, { hash: 'b' });
            registry.registerVersion('/api/users', 'tsv:1732186400-users-003' as TSV, { hash: 'c' });
        });

        it('should find exact version at timestamp', () => {
            const tsv = registry.getVersionAt('/api/users', 1732186300);
            expect(tsv).toBe('tsv:1732186300-users-002');
        });

        it('should find version before timestamp', () => {
            const tsv = registry.getVersionAt('/api/users', 1732186350);
            expect(tsv).toBe('tsv:1732186300-users-002');
        });

        it('should find first version for early timestamp', () => {
            const tsv = registry.getVersionAt('/api/users', 1732186250);
            expect(tsv).toBe('tsv:1732186200-users-001');
        });

        it('should return undefined for timestamp before all versions', () => {
            const tsv = registry.getVersionAt('/api/users', 1732186100);
            expect(tsv).toBeUndefined();
        });

        it('should return latest version for future timestamp', () => {
            const tsv = registry.getVersionAt('/api/users', 1732186500);
            expect(tsv).toBe('tsv:1732186400-users-003');
        });

        it('should return undefined for non-existent handler', () => {
            const tsv = registry.getVersionAt('/api/posts', 1732186300);
            expect(tsv).toBeUndefined();
        });

        it('should cache version lookups', () => {
            // First lookup
            const tsv1 = registry.getVersionAt('/api/users', 1732186300);
            
            // Second lookup should use cache
            const tsv2 = registry.getVersionAt('/api/users', 1732186300);
            
            expect(tsv1).toBe(tsv2);
        });
    });

    describe('Latest Version', () => {
        it('should return latest version', () => {
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, { hash: 'a' });
            registry.registerVersion('/api/users', 'tsv:1732186300-users-002' as TSV, { hash: 'b' });

            const latest = registry.getLatestVersion('/api/users');
            expect(latest).toBe('tsv:1732186300-users-002');
        });

        it('should return undefined for non-existent handler', () => {
            const latest = registry.getLatestVersion('/api/posts');
            expect(latest).toBeUndefined();
        });
    });

    describe('Semantic Version Tagging', () => {
        beforeEach(() => {
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, { hash: 'a' });
            registry.registerVersion('/api/users', 'tsv:1732186300-users-002' as TSV, { hash: 'b' });
        });

        it('should tag a version', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0', 'developer');

            const tags = registry.getAllTags();
            expect(tags).toHaveLength(1);
            expect(tags[0].label).toBe('v1.0.0');
            expect(tags[0].tsv).toBe(tsv);
            expect(tags[0].createdBy).toBe('developer');
        });

        it('should add tag to version info', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0');

            const info = registry.getVersionInfo(tsv);
            expect(info?.tags).toContain('v1.0.0');
        });

        it('should support multiple tags for same version', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0');
            registry.tagVersion(tsv, 'stable');
            registry.tagVersion(tsv, 'production');

            const info = registry.getVersionInfo(tsv);
            expect(info?.tags).toHaveLength(3);
            expect(info?.tags).toContain('v1.0.0');
            expect(info?.tags).toContain('stable');
            expect(info?.tags).toContain('production');
        });

        it('should resolve version by tag', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0');

            const resolved = registry.getVersionByTag('/api/users', 'v1.0.0');
            expect(resolved).toBe(tsv);
        });

        it('should return undefined for non-existent tag', () => {
            const resolved = registry.getVersionByTag('/api/users', 'v2.0.0');
            expect(resolved).toBeUndefined();
        });

        it('should return undefined for tag on wrong handler', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0');

            const resolved = registry.getVersionByTag('/api/posts', 'v1.0.0');
            expect(resolved).toBeUndefined();
        });

        it('should remove tag', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0');
            const removed = registry.untagVersion('v1.0.0');

            expect(removed).toBe(true);
            expect(registry.getAllTags()).toHaveLength(0);
            
            const info = registry.getVersionInfo(tsv);
            expect(info?.tags).not.toContain('v1.0.0');
        });

        it('should return false when removing non-existent tag', () => {
            const removed = registry.untagVersion('v1.0.0');
            expect(removed).toBe(false);
        });

        it('should get tags for specific version', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.tagVersion(tsv, 'v1.0.0');
            registry.tagVersion(tsv, 'stable');

            const tags = registry.getTagsForVersion(tsv);
            expect(tags).toHaveLength(2);
            expect(tags).toContain('v1.0.0');
            expect(tags).toContain('stable');
        });
    });

    describe('Version Status Management', () => {
        let tsv: TSV;

        beforeEach(() => {
            tsv = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a', status: 'hot' });
        });

        it('should mark version as cold', () => {
            registry.markCold(tsv);

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('cold');
            expect(registry.getActiveVersions()).not.toContain(tsv);
        });

        it('should update version status', () => {
            registry.updateVersionStatus(tsv, 'warm');

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('warm');
        });

        it('should move cold version to active when status changes', () => {
            registry.markCold(tsv);
            registry.updateVersionStatus(tsv, 'hot');

            expect(registry.getActiveVersions()).toContain(tsv);
        });
    });

    describe('Request Tracking', () => {
        let tsv: TSV;

        beforeEach(() => {
            tsv = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { 
                hash: 'a', 
                status: 'hot',
                requestCount: 0,
            });
        });

        it('should increment request count', () => {
            registry.recordRequest(tsv);
            registry.recordRequest(tsv);

            const info = registry.getVersionInfo(tsv);
            expect(info?.requestCount).toBe(2);
        });

        it('should update last accessed timestamp', () => {
            const before = Date.now();
            registry.recordRequest(tsv);
            const after = Date.now();

            const info = registry.getVersionInfo(tsv);
            expect(info?.lastAccessed).toBeGreaterThanOrEqual(before);
            expect(info?.lastAccessed).toBeLessThanOrEqual(after);
        });

        it('should warm up cold version on request', () => {
            registry.markCold(tsv);
            registry.recordRequest(tsv);

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('warm');
            expect(registry.getActiveVersions()).toContain(tsv);
        });
    });

    describe('Serialization', () => {
        beforeEach(() => {
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, { hash: 'a' });
            registry.registerVersion('/api/users', 'tsv:1732186300-users-002' as TSV, { hash: 'b' });
            registry.tagVersion('tsv:1732186200-users-001' as TSV, 'v1.0.0');
            registry.markCold('tsv:1732186300-users-002' as TSV);
        });

        it('should serialize registry state', () => {
            const serialized = registry.serialize();
            expect(serialized).toBeTruthy();
            
            const parsed = JSON.parse(serialized);
            expect(parsed.handlers).toBeDefined();
            expect(parsed.tags).toBeDefined();
            expect(parsed.activeVersions).toBeInstanceOf(Array);
            expect(parsed.coldVersions).toBeInstanceOf(Array);
        });

        it('should deserialize registry state', () => {
            const serialized = registry.serialize();
            const restored = VersionRegistry.deserialize(serialized);

            const versions = restored.getVersions('/api/users');
            expect(versions).toHaveLength(2);

            const tags = restored.getAllTags();
            expect(tags).toHaveLength(1);
            expect(tags[0].label).toBe('v1.0.0');

            const activeVersions = restored.getActiveVersions();
            expect(activeVersions).toHaveLength(1);
        });

        it('should preserve version order after deserialization', () => {
            const serialized = registry.serialize();
            const restored = VersionRegistry.deserialize(serialized);

            const latest = restored.getLatestVersion('/api/users');
            expect(latest).toBe('tsv:1732186300-users-002');
        });
    });

    describe('DB Schema Versioning', () => {
        it('should store DB schema version in metadata', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            
            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                dbSchemaVersion: 'schema_v10',
            });

            const info = registry.getVersionInfo(tsv);
            expect(info?.dbSchemaVersion).toBe('schema_v10');
        });

        it('should allow multiple versions to share same schema', () => {
            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';
            
            registry.registerVersion('/api/users', tsv1, {
                hash: 'a',
                dbSchemaVersion: 'schema_v10',
            });
            
            registry.registerVersion('/api/users', tsv2, {
                hash: 'b',
                dbSchemaVersion: 'schema_v10', // Same schema
            });

            const info1 = registry.getVersionInfo(tsv1);
            const info2 = registry.getVersionInfo(tsv2);
            
            expect(info1?.dbSchemaVersion).toBe(info2?.dbSchemaVersion);
        });
    });

    describe('Cache Management', () => {
        it('should clear cache when registering new version', () => {
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, { hash: 'a' });
            
            // Populate cache
            registry.getVersionAt('/api/users', 1732186200);
            
            // Register new version (should clear cache)
            registry.registerVersion('/api/users', 'tsv:1732186300-users-002' as TSV, { hash: 'b' });
            
            // Should still work correctly
            const tsv = registry.getVersionAt('/api/users', 1732186250);
            expect(tsv).toBe('tsv:1732186200-users-001');
        });

        it('should clear cache when tagging version', () => {
            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, { hash: 'a' });
            
            // Populate cache
            registry.getVersionAt('/api/users', 1732186200);
            
            // Tag version (should clear cache)
            registry.tagVersion(tsv, 'v1.0.0');
            
            // Should still work correctly
            const resolved = registry.getVersionByTag('/api/users', 'v1.0.0');
            expect(resolved).toBe(tsv);
        });
    });
});
