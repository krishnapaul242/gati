import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnapshotManager } from './snapshot-manager.js';
import { VersionRegistry } from './registry.js';
import type { TSV, TimescapeArtifact } from './types.js';
import fs from 'fs';
import path from 'path';

describe('SnapshotManager', () => {
    let manager: SnapshotManager;
    let registry: VersionRegistry;
    const testDir = '.gati/test-snapshots';

    beforeEach(() => {
        registry = new VersionRegistry();
        manager = new SnapshotManager(registry, {
            storageDir: testDir,
            lightSnapshotInterval: 10,
            heavySnapshotInterval: 50,
            retentionPeriod: 1000, // 1 second for testing
            compressionEnabled: true,
        });

        // Setup test data
        registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, {
            hash: 'abc123',
            status: 'hot',
        });
        registry.tagVersion('tsv:1732186200-users-001' as TSV, 'v1.0.0');
    });

    afterEach(async () => {
        // Cleanup test directory
        if (fs.existsSync(testDir)) {
            const files = await fs.promises.readdir(testDir);
            for (const file of files) {
                await fs.promises.unlink(path.join(testDir, file));
            }
            await fs.promises.rmdir(testDir);
        }
    });

    describe('Snapshot Creation', () => {
        it('should create a light snapshot', async () => {
            const snapshot = await manager.createSnapshot('light');

            expect(snapshot.id).toMatch(/^snap:\d+-light-/);
            expect(snapshot.type).toBe('light');
            expect(snapshot.timestamp).toBeGreaterThan(0);
            expect(snapshot.registryState).toBeDefined();
            expect(snapshot.artifacts).toBeUndefined();
        });

        it('should create a heavy snapshot', async () => {
            const artifact: TimescapeArtifact = {
                id: 'artifact-1',
                type: 'route',
                version: 'tsv:1732186200-users-001' as TSV,
                hash: 'abc123',
            };
            manager.registerArtifact(artifact);

            const snapshot = await manager.createSnapshot('heavy');

            expect(snapshot.id).toMatch(/^snap:\d+-heavy-/);
            expect(snapshot.type).toBe('heavy');
            expect(snapshot.artifacts).toBeDefined();
            expect(snapshot.artifacts?.['artifact-1']).toEqual(artifact);
        });

        it('should save snapshot to disk', async () => {
            const snapshot = await manager.createSnapshot('light');
            
            // Small delay to ensure file is written
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const files = await fs.promises.readdir(testDir);

            expect(files.length).toBeGreaterThan(0);
            expect(files.some(f => f.includes(snapshot.id.split(':')[1]))).toBe(true);
        });

        it('should compress snapshots when enabled', async () => {
            const snapshot = await manager.createSnapshot('light');
            
            // Small delay to ensure file is written
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const files = await fs.promises.readdir(testDir);
            const snapshotFile = files.find(f => f.includes(snapshot.id.split(':')[1]));

            expect(snapshotFile).toBeDefined();
            expect(snapshotFile).toMatch(/\.json\.gz$/);
        });
    });

    describe('Automatic Snapshot Creation', () => {
        it('should create light snapshot at interval', async () => {
            let snapshot = null;

            // Trigger 9 times (no snapshot)
            for (let i = 0; i < 9; i++) {
                snapshot = await manager.createSnapshotIfNeeded();
                expect(snapshot).toBeNull();
            }

            // 10th time should create light snapshot
            snapshot = await manager.createSnapshotIfNeeded();
            expect(snapshot).not.toBeNull();
            expect(snapshot?.type).toBe('light');
        });

        it('should create heavy snapshot at interval', async () => {
            let snapshot = null;

            // Trigger 49 times
            for (let i = 0; i < 49; i++) {
                await manager.createSnapshotIfNeeded();
            }

            // 50th time should create heavy snapshot
            snapshot = await manager.createSnapshotIfNeeded();
            expect(snapshot).not.toBeNull();
            expect(snapshot?.type).toBe('heavy');
        });

        it('should track counter correctly', async () => {
            expect(manager.getCounter()).toBe(0);

            await manager.createSnapshotIfNeeded();
            expect(manager.getCounter()).toBe(1);

            await manager.createSnapshotIfNeeded();
            expect(manager.getCounter()).toBe(2);
        });

        it('should reset counter', () => {
            manager.createSnapshotIfNeeded();
            manager.createSnapshotIfNeeded();
            expect(manager.getCounter()).toBe(2);

            manager.resetCounter();
            expect(manager.getCounter()).toBe(0);
        });
    });

    describe('Snapshot Loading', () => {
        it('should load snapshot by id', async () => {
            const created = await manager.createSnapshot('light');
            const loaded = await manager.load(created.id);

            expect(loaded).not.toBeNull();
            expect(loaded?.id).toBe(created.id);
            expect(loaded?.type).toBe('light');
            expect(loaded?.timestamp).toBe(created.timestamp);
        });

        it('should return null for non-existent snapshot', async () => {
            const loaded = await manager.load('snap:999999-light-nonexistent');
            expect(loaded).toBeNull();
        });

        it('should load compressed snapshots', async () => {
            const created = await manager.createSnapshot('light');
            const loaded = await manager.load(created.id);

            expect(loaded).not.toBeNull();
            expect(loaded?.registryState).toBeDefined();
        });
    });

    describe('Snapshot Restoration', () => {
        it('should restore registry state from snapshot', async () => {
            // Create snapshot with current state
            const snapshot = await manager.createSnapshot('light');

            // Modify registry
            registry.registerVersion('/api/posts', 'tsv:1732186300-posts-001' as TSV, {
                hash: 'def456',
            });

            // Restore from snapshot
            const restored = await manager.restore(snapshot.id);
            expect(restored).toBe(true);

            // Verify state is restored (posts should not exist)
            const versions = registry.getVersions('/api/posts');
            expect(versions).toHaveLength(0);
        });

        it('should restore artifacts in heavy snapshot', async () => {
            const artifact: TimescapeArtifact = {
                id: 'artifact-1',
                type: 'route',
                version: 'tsv:1732186200-users-001' as TSV,
                hash: 'abc123',
            };
            manager.registerArtifact(artifact);

            const snapshot = await manager.createSnapshot('heavy');

            // Clear artifacts
            const newManager = new SnapshotManager(registry, { storageDir: testDir });
            
            // Restore
            await newManager.restore(snapshot.id);

            // Verify artifact is restored
            const restoredArtifact = newManager.getArtifact('artifact-1');
            expect(restoredArtifact).toEqual(artifact);
        });

        it('should return false for non-existent snapshot', async () => {
            const restored = await manager.restore('snap:999999-light-nonexistent');
            expect(restored).toBe(false);
        });
    });

    describe('Snapshot Listing', () => {
        it('should list all snapshots', async () => {
            await manager.createSnapshot('light');
            await manager.createSnapshot('heavy');
            
            // Small delay to ensure files are written
            await new Promise(resolve => setTimeout(resolve, 50));

            const list = await manager.list();
            expect(list).toHaveLength(2);
        });

        it('should return empty array when no snapshots', async () => {
            const list = await manager.list();
            expect(list).toHaveLength(0);
        });

        it('should get latest snapshot', async () => {
            await manager.createSnapshot('light');
            await new Promise(resolve => setTimeout(resolve, 50));
            const latest = await manager.createSnapshot('heavy');
            await new Promise(resolve => setTimeout(resolve, 50));

            const loaded = await manager.getLatest();
            expect(loaded?.id).toBe(latest.id);
        });

        it('should get latest snapshot by type', async () => {
            await manager.createSnapshot('light');
            await new Promise(resolve => setTimeout(resolve, 50));
            const latestHeavy = await manager.createSnapshot('heavy');
            await new Promise(resolve => setTimeout(resolve, 50));

            const loaded = await manager.getLatest('heavy');
            expect(loaded?.id).toBe(latestHeavy.id);
        });

        it('should get snapshot metadata', async () => {
            const snapshot = await manager.createSnapshot('light');
            const metadata = await manager.getMetadata(snapshot.id);

            expect(metadata).not.toBeNull();
            expect(metadata?.id).toBe(snapshot.id);
            expect(metadata?.type).toBe('light');
            expect(metadata?.timestamp).toBe(snapshot.timestamp);
        });
    });

    describe('Snapshot Pruning', () => {
        it('should prune old snapshots', async () => {
            // Create old snapshot
            await manager.createSnapshot('light');
            await new Promise(resolve => setTimeout(resolve, 50));

            // Wait for retention period to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Create new snapshot
            await manager.createSnapshot('light');
            await new Promise(resolve => setTimeout(resolve, 50));

            const pruned = await manager.prune();
            expect(pruned).toBe(1);

            const remaining = await manager.list();
            expect(remaining).toHaveLength(1);
        });

        it('should not prune recent snapshots', async () => {
            await manager.createSnapshot('light');
            await manager.createSnapshot('heavy');
            await new Promise(resolve => setTimeout(resolve, 50));

            const pruned = await manager.prune();
            expect(pruned).toBe(0);

            const remaining = await manager.list();
            expect(remaining).toHaveLength(2);
        });
    });

    describe('Snapshot Deletion', () => {
        it('should delete snapshot', async () => {
            const snapshot = await manager.createSnapshot('light');
            
            const deleted = await manager.delete(snapshot.id);
            expect(deleted).toBe(true);

            const loaded = await manager.load(snapshot.id);
            expect(loaded).toBeNull();
        });

        it('should return false when deleting non-existent snapshot', async () => {
            const deleted = await manager.delete('snap:999999-light-nonexistent');
            expect(deleted).toBe(false);
        });

        it('should clear all snapshots', async () => {
            await manager.createSnapshot('light');
            await manager.createSnapshot('heavy');
            await manager.createSnapshot('light');
            await new Promise(resolve => setTimeout(resolve, 50));

            const cleared = await manager.clear();
            expect(cleared).toBe(3);

            const remaining = await manager.list();
            expect(remaining).toHaveLength(0);
        });
    });

    describe('Snapshot Statistics', () => {
        it('should calculate snapshot statistics', async () => {
            await manager.createSnapshot('light');
            await manager.createSnapshot('light');
            await manager.createSnapshot('heavy');
            await new Promise(resolve => setTimeout(resolve, 50));

            const stats = await manager.getStats();

            expect(stats.totalSnapshots).toBe(3);
            expect(stats.lightSnapshots).toBe(2);
            expect(stats.heavySnapshots).toBe(1);
            expect(stats.oldestSnapshot).toBeGreaterThan(0);
            expect(stats.newestSnapshot).toBeGreaterThan(0);
            expect(stats.totalSize).toBeGreaterThan(0);
        });

        it('should return zero stats when no snapshots', async () => {
            const stats = await manager.getStats();

            expect(stats.totalSnapshots).toBe(0);
            expect(stats.lightSnapshots).toBe(0);
            expect(stats.heavySnapshots).toBe(0);
            expect(stats.totalSize).toBe(0);
        });
    });

    describe('Import/Export', () => {
        it('should export snapshot to file', async () => {
            const snapshot = await manager.createSnapshot('light');
            const exportPath = path.join(testDir, 'export.json');

            const exported = await manager.export(snapshot.id, exportPath);
            expect(exported).toBe(true);
            expect(fs.existsSync(exportPath)).toBe(true);

            // Cleanup
            await fs.promises.unlink(exportPath);
        });

        it('should import snapshot from file', async () => {
            const snapshot = await manager.createSnapshot('light');
            const exportPath = path.join(testDir, 'export.json');

            await manager.export(snapshot.id, exportPath);
            await manager.delete(snapshot.id);

            const imported = await manager.import(exportPath);
            expect(imported).not.toBeNull();
            expect(imported?.id).toBe(snapshot.id);

            const loaded = await manager.load(snapshot.id);
            expect(loaded).not.toBeNull();

            // Cleanup
            await fs.promises.unlink(exportPath);
        });

        it('should return null when importing invalid file', async () => {
            const invalidPath = path.join(testDir, 'invalid.json');
            await fs.promises.writeFile(invalidPath, 'invalid json');

            const imported = await manager.import(invalidPath);
            expect(imported).toBeNull();

            // Cleanup
            await fs.promises.unlink(invalidPath);
        });
    });

    describe('Artifact Management', () => {
        it('should register artifact', () => {
            const artifact: TimescapeArtifact = {
                id: 'test-artifact',
                type: 'module',
                version: 'tsv:1732186200-test-001' as TSV,
                hash: 'xyz789',
            };

            manager.registerArtifact(artifact);
            const retrieved = manager.getArtifact('test-artifact');

            expect(retrieved).toEqual(artifact);
        });

        it('should return undefined for non-existent artifact', () => {
            const artifact = manager.getArtifact('non-existent');
            expect(artifact).toBeUndefined();
        });
    });
});
