/**
 * @module cli/commands/timescape.test
 * @description Tests for Timescape CLI commands
 * 
 * Note: These are integration tests that require a real registry file.
 * Run after creating some versions in your application.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'fs';
import { resolve } from 'path';
import { VersionRegistry } from '../../../runtime/src/timescape/registry';
import type { TSV } from '../../../runtime/src/timescape/types';

describe('Timescape CLI Commands', () => {
    const testDir = resolve(__dirname, '.test-timescape');
    const registryPath = resolve(testDir, 'registry.json');
    let registry: VersionRegistry;

    beforeEach(() => {
        // Create test directory
        if (!existsSync(testDir)) {
            mkdirSync(testDir, { recursive: true });
        }

        // Create a test registry
        registry = new VersionRegistry();

        // Register some test versions
        const v1: TSV = 'tsv:1732104000-users-001';
        const v2: TSV = 'tsv:1732197600-users-002';
        const v3: TSV = 'tsv:1732284000-users-003';

        registry.registerVersion('/api/users', v1, { hash: 'abc123' });
        registry.registerVersion('/api/users', v2, { hash: 'def456' });
        registry.registerVersion('/api/users', v3, { hash: 'ghi789' });

        // Add some tags
        registry.tagVersion(v1, 'v1.0.0', 'test');
        registry.tagVersion(v2, 'v1.1.0', 'test');
        registry.tagVersion(v2, 'stable', 'test');
        registry.tagVersion(v3, 'v2.0.0', 'test');
        registry.tagVersion(v3, 'latest', 'test');

        // Simulate some usage
        registry.recordRequest('/api/users', v1);
        registry.recordRequest('/api/users', v1);
        registry.recordRequest('/api/users', v2);
        registry.recordRequest('/api/users', v2);
        registry.recordRequest('/api/users', v2);
        registry.recordRequest('/api/users', v3);

        // Save registry
        registry.serialize(registryPath);
    });

    afterEach(() => {
        // Clean up
        if (existsSync(registryPath)) {
            unlinkSync(registryPath);
        }
        if (existsSync(testDir)) {
            rmdirSync(testDir);
        }
    });

    describe('Registry Loading', () => {
        it('should load registry from file', () => {
            const loaded = new VersionRegistry();
            loaded.deserialize(registryPath);

            const handlers = loaded.getAllHandlers();
            expect(handlers).toContain('/api/users');

            const versions = loaded.getVersions('/api/users');
            expect(versions).toHaveLength(3);
        });

        it('should preserve tags after serialization', () => {
            const loaded = new VersionRegistry();
            loaded.deserialize(registryPath);

            const tags = loaded.getAllTags();
            expect(tags).toHaveLength(5);
            expect(tags.map(t => t.label)).toContain('v1.0.0');
            expect(tags.map(t => t.label)).toContain('stable');
            expect(tags.map(t => t.label)).toContain('latest');
        });

        it('should preserve request counts after serialization', () => {
            const loaded = new VersionRegistry();
            loaded.deserialize(registryPath);

            const v1Info = loaded.getVersionInfo('/api/users', 'tsv:1732104000-users-001' as TSV);
            const v2Info = loaded.getVersionInfo('/api/users', 'tsv:1732197600-users-002' as TSV);
            const v3Info = loaded.getVersionInfo('/api/users', 'tsv:1732284000-users-003' as TSV);

            expect(v1Info?.requestCount).toBe(2);
            expect(v2Info?.requestCount).toBe(3);
            expect(v3Info?.requestCount).toBe(1);
        });
    });

    describe('Version Listing', () => {
        it('should list all versions for a handler', () => {
            const versions = registry.getVersions('/api/users');
            expect(versions).toHaveLength(3);
            expect(versions[0].tsv).toBe('tsv:1732104000-users-001');
            expect(versions[1].tsv).toBe('tsv:1732197600-users-002');
            expect(versions[2].tsv).toBe('tsv:1732284000-users-003');
        });

        it('should show tags for each version', () => {
            const v1 = registry.getVersionInfo('/api/users', 'tsv:1732104000-users-001' as TSV);
            const v2 = registry.getVersionInfo('/api/users', 'tsv:1732197600-users-002' as TSV);
            const v3 = registry.getVersionInfo('/api/users', 'tsv:1732284000-users-003' as TSV);

            expect(v1?.tags).toEqual(['v1.0.0']);
            expect(v2?.tags).toEqual(['v1.1.0', 'stable']);
            expect(v3?.tags).toEqual(['v2.0.0', 'latest']);
        });

        it('should show usage statistics', () => {
            const stats = registry.getUsageStatistics();
            expect(stats.totalVersions).toBe(3);
            expect(stats.totalRequests).toBe(6);
        });
    });

    describe('Version Status', () => {
        it('should get version info by TSV', () => {
            const info = registry.getVersionInfo('/api/users', 'tsv:1732104000-users-001' as TSV);
            expect(info).toBeDefined();
            expect(info?.tsv).toBe('tsv:1732104000-users-001');
            expect(info?.hash).toBe('abc123');
            expect(info?.requestCount).toBe(2);
        });

        it('should get version info by tag', () => {
            const tsv = registry.getVersionByTag('/api/users', 'stable');
            expect(tsv).toBe('tsv:1732197600-users-002');

            const info = registry.getVersionInfo('/api/users', tsv!);
            expect(info?.requestCount).toBe(3);
        });

        it('should get version info by timestamp', () => {
            const tsv = registry.getVersionAt('/api/users', 1732150000000); // Between v1 and v2
            expect(tsv).toBe('tsv:1732104000-users-001'); // Should return v1

            const info = registry.getVersionInfo('/api/users', tsv!);
            expect(info?.tsv).toBe('tsv:1732104000-users-001');
        });
    });

    describe('Version Deactivation', () => {
        it('should deactivate a version', () => {
            registry.deactivateVersion('/api/users', 'tsv:1732104000-users-001' as TSV);

            const info = registry.getVersionInfo('/api/users', 'tsv:1732104000-users-001' as TSV);
            expect(info?.status).toBe('deactivated');
        });

        it('should not affect other versions when deactivating', () => {
            registry.deactivateVersion('/api/users', 'tsv:1732104000-users-001' as TSV);

            const v2Info = registry.getVersionInfo('/api/users', 'tsv:1732197600-users-002' as TSV);
            const v3Info = registry.getVersionInfo('/api/users', 'tsv:1732284000-users-003' as TSV);

            expect(v2Info?.status).not.toBe('deactivated');
            expect(v3Info?.status).not.toBe('deactivated');
        });
    });

    describe('Tag Management', () => {
        it('should create a new tag', () => {
            registry.tagVersion('tsv:1732104000-users-001' as TSV, 'production', 'test');

            const tags = registry.getTagsForVersion('tsv:1732104000-users-001' as TSV);
            expect(tags).toContain('production');
        });

        it('should list all tags', () => {
            const tags = registry.getAllTags();
            expect(tags).toHaveLength(5);
            expect(tags.map(t => t.label)).toContain('v1.0.0');
            expect(tags.map(t => t.label)).toContain('v1.1.0');
            expect(tags.map(t => t.label)).toContain('stable');
            expect(tags.map(t => t.label)).toContain('v2.0.0');
            expect(tags.map(t => t.label)).toContain('latest');
        });

        it('should list tags for a specific version', () => {
            const tags = registry.getTagsForVersion('tsv:1732197600-users-002' as TSV);
            expect(tags).toEqual(['v1.1.0', 'stable']);
        });

        it('should remove a tag', () => {
            const removed = registry.untagVersion('stable');
            expect(removed).toBe(true);

            const tags = registry.getTagsForVersion('tsv:1732197600-users-002' as TSV);
            expect(tags).not.toContain('stable');
            expect(tags).toContain('v1.1.0'); // Other tags should remain
        });

        it('should return false when removing non-existent tag', () => {
            const removed = registry.untagVersion('non-existent');
            expect(removed).toBe(false);
        });

        it('should resolve tag to TSV', () => {
            const tsv = registry.getVersionByTag('/api/users', 'stable');
            expect(tsv).toBe('tsv:1732197600-users-002');
        });

        it('should return undefined for non-existent tag', () => {
            const tsv = registry.getVersionByTag('/api/users', 'non-existent');
            expect(tsv).toBeUndefined();
        });
    });

    describe('Multiple Tags Per Version', () => {
        it('should allow multiple tags for same version', () => {
            const tags = registry.getTagsForVersion('tsv:1732197600-users-002' as TSV);
            expect(tags).toHaveLength(2);
            expect(tags).toContain('v1.1.0');
            expect(tags).toContain('stable');
        });

        it('should resolve all tags to same TSV', () => {
            const tsv1 = registry.getVersionByTag('/api/users', 'v1.1.0');
            const tsv2 = registry.getVersionByTag('/api/users', 'stable');
            expect(tsv1).toBe(tsv2);
            expect(tsv1).toBe('tsv:1732197600-users-002');
        });
    });
});
