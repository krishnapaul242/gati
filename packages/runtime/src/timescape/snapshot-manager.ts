import type { Snapshot, VersionRegistryState, TimescapeArtifact } from './types.js';
import { VersionRegistry } from './registry.js';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface SnapshotConfig {
    storageDir?: string;
    lightSnapshotInterval?: number;
    heavySnapshotInterval?: number;
    retentionPeriod?: number; // milliseconds
    compressionEnabled?: boolean;
}

export interface SnapshotStats {
    totalSnapshots: number;
    lightSnapshots: number;
    heavySnapshots: number;
    oldestSnapshot?: number;
    newestSnapshot?: number;
    totalSize: number;
}

export class SnapshotManager {
    private storageDir: string;
    private registry: VersionRegistry;
    private config: Required<SnapshotConfig>;
    private snapshotCounter: number = 0;
    private artifacts: Map<string, TimescapeArtifact> = new Map();

    constructor(registry: VersionRegistry, config: SnapshotConfig = {}) {
        this.registry = registry;
        this.config = {
            storageDir: config.storageDir || '.gati/timescape/snapshots',
            lightSnapshotInterval: config.lightSnapshotInterval || 100,
            heavySnapshotInterval: config.heavySnapshotInterval || 1000,
            retentionPeriod: config.retentionPeriod || 90 * 24 * 60 * 60 * 1000, // 90 days
            compressionEnabled: config.compressionEnabled !== false,
        };
        
        if (!fs.existsSync(this.config.storageDir)) {
            fs.mkdirSync(this.config.storageDir, { recursive: true });
        }
    }

    /**
     * Register an artifact for heavy snapshots
     */
    public registerArtifact(artifact: TimescapeArtifact): void {
        this.artifacts.set(artifact.id, artifact);
    }

    /**
     * Get registered artifact
     */
    public getArtifact(id: string): TimescapeArtifact | undefined {
        return this.artifacts.get(id);
    }

    /**
     * Create a snapshot (light or heavy)
     */
    public async createSnapshot(type: 'light' | 'heavy'): Promise<Snapshot> {
        const state = this.registry.getAll();
        const timestamp = Date.now();
        const stateHash = createHash('sha256')
            .update(JSON.stringify(state))
            .digest('hex')
            .substring(0, 8);
        const id = `snap:${timestamp}-${type}-${stateHash}`;

        const snapshot: Snapshot = {
            id,
            timestamp,
            type,
            registryState: state,
        };

        if (type === 'heavy') {
            // Gather all registered artifacts
            const artifactData: Record<string, TimescapeArtifact> = {};
            for (const [id, artifact] of this.artifacts.entries()) {
                artifactData[id] = artifact;
            }
            snapshot.artifacts = artifactData;
        }

        await this.save(snapshot);
        
        return snapshot;
    }

    /**
     * Create snapshot automatically based on counter
     */
    public async createSnapshotIfNeeded(): Promise<Snapshot | null> {
        // Check before incrementing
        const nextCount = this.snapshotCounter + 1;

        if (nextCount % this.config.heavySnapshotInterval === 0) {
            this.snapshotCounter = nextCount;
            return await this.createSnapshot('heavy');
        } else if (nextCount % this.config.lightSnapshotInterval === 0) {
            this.snapshotCounter = nextCount;
            return await this.createSnapshot('light');
        }

        this.snapshotCounter = nextCount;
        return null;
    }

    /**
     * Reset snapshot counter
     */
    public resetCounter(): void {
        this.snapshotCounter = 0;
    }

    /**
     * Get current snapshot counter
     */
    public getCounter(): number {
        return this.snapshotCounter;
    }

    /**
     * Save snapshot to disk with optional compression
     */
    private async save(snapshot: Snapshot): Promise<void> {
        const data = JSON.stringify(snapshot);
        const extension = this.config.compressionEnabled ? '.json.gz' : '.json';
        // Replace colons with underscores for Windows compatibility
        const safeId = snapshot.id.replace(/:/g, '_');
        const filePath = path.join(this.config.storageDir, `${safeId}${extension}`);

        if (this.config.compressionEnabled) {
            const compressed = await gzipAsync(Buffer.from(data, 'utf-8'));
            await fs.promises.writeFile(filePath, compressed);
        } else {
            await fs.promises.writeFile(filePath, data);
        }
    }

    /**
     * Load snapshot from disk
     */
    public async load(id: string): Promise<Snapshot | null> {
        // Try compressed first, then uncompressed
        const extensions = ['.json.gz', '.json'];
        // Replace colons with underscores for Windows compatibility
        const safeId = id.replace(/:/g, '_');
        
        for (const ext of extensions) {
            const filePath = path.join(this.config.storageDir, `${safeId}${ext}`);
            
            try {
                if (!fs.existsSync(filePath)) continue;

                const buffer = await fs.promises.readFile(filePath);
                
                let content: string;
                if (ext === '.json.gz') {
                    const decompressed = await gunzipAsync(buffer);
                    content = decompressed.toString('utf-8');
                } else {
                    content = buffer.toString('utf-8');
                }

                return JSON.parse(content);
            } catch (e) {
                // Try next extension
                continue;
            }
        }

        return null;
    }

    /**
     * Restore registry state from snapshot
     */
    public async restore(snapshotId: string): Promise<boolean> {
        const snapshot = await this.load(snapshotId);
        if (!snapshot) {
            return false;
        }

        // Restore registry state - need to handle Sets properly
        const stateToRestore = {
            ...snapshot.registryState,
            activeVersions: Array.from(snapshot.registryState.activeVersions || []),
            coldVersions: Array.from(snapshot.registryState.coldVersions || []),
        };
        
        const restoredRegistry = VersionRegistry.deserialize(
            JSON.stringify(stateToRestore)
        );

        // Copy state to current registry
        Object.assign(this.registry, restoredRegistry);

        // Restore artifacts if heavy snapshot
        if (snapshot.type === 'heavy' && snapshot.artifacts) {
            this.artifacts.clear();
            for (const [id, artifact] of Object.entries(snapshot.artifacts)) {
                this.artifacts.set(id, artifact as TimescapeArtifact);
            }
        }

        return true;
    }

    /**
     * List all snapshots
     */
    public async list(): Promise<string[]> {
        try {
            const files = await fs.promises.readdir(this.config.storageDir);
            return files
                .filter(f => f.endsWith('.json') || f.endsWith('.json.gz'))
                .map(f => {
                    // Remove extension and convert underscores back to colons
                    const nameWithoutExt = f.replace(/\.(json|json\.gz)$/, '');
                    return nameWithoutExt.replace(/_/g, ':');
                });
        } catch (e) {
            return [];
        }
    }

    /**
     * Get snapshot metadata without loading full content
     */
    public async getMetadata(id: string): Promise<Pick<Snapshot, 'id' | 'timestamp' | 'type'> | null> {
        const snapshot = await this.load(id);
        if (!snapshot) return null;

        return {
            id: snapshot.id,
            timestamp: snapshot.timestamp,
            type: snapshot.type,
        };
    }

    /**
     * Get latest snapshot
     */
    public async getLatest(type?: 'light' | 'heavy'): Promise<Snapshot | null> {
        const ids = await this.list();
        if (ids.length === 0) return null;

        // Sort by timestamp (descending)
        const sorted = ids.sort((a, b) => {
            const tsA = parseInt(a.split(':')[1]?.split('-')[0] || '0');
            const tsB = parseInt(b.split(':')[1]?.split('-')[0] || '0');
            return tsB - tsA;
        });

        // Filter by type if specified
        const filtered = type 
            ? sorted.filter(id => id.includes(`-${type}-`))
            : sorted;

        if (filtered.length === 0) return null;

        return await this.load(filtered[0]);
    }

    /**
     * Prune old snapshots based on retention period
     */
    public async prune(): Promise<number> {
        const ids = await this.list();
        const cutoffTime = Date.now() - this.config.retentionPeriod;
        let prunedCount = 0;

        for (const id of ids) {
            const metadata = await this.getMetadata(id);
            if (metadata && metadata.timestamp < cutoffTime) {
                await this.delete(id);
                prunedCount++;
            }
        }

        return prunedCount;
    }

    /**
     * Delete a snapshot
     */
    public async delete(id: string): Promise<boolean> {
        const extensions = ['.json.gz', '.json'];
        const safeId = id.replace(/:/g, '_');
        let deleted = false;

        for (const ext of extensions) {
            const filePath = path.join(this.config.storageDir, `${safeId}${ext}`);
            try {
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                    deleted = true;
                }
            } catch (e) {
                // Ignore errors
            }
        }

        return deleted;
    }

    /**
     * Get snapshot statistics
     */
    public async getStats(): Promise<SnapshotStats> {
        const ids = await this.list();
        const stats: SnapshotStats = {
            totalSnapshots: ids.length,
            lightSnapshots: 0,
            heavySnapshots: 0,
            totalSize: 0,
        };

        for (const id of ids) {
            const metadata = await this.getMetadata(id);
            if (!metadata) continue;

            if (metadata.type === 'light') {
                stats.lightSnapshots++;
            } else {
                stats.heavySnapshots++;
            }

            if (!stats.oldestSnapshot || metadata.timestamp < stats.oldestSnapshot) {
                stats.oldestSnapshot = metadata.timestamp;
            }

            if (!stats.newestSnapshot || metadata.timestamp > stats.newestSnapshot) {
                stats.newestSnapshot = metadata.timestamp;
            }

            // Calculate file size
            const extensions = ['.json.gz', '.json'];
            const safeId = id.replace(/:/g, '_');
            for (const ext of extensions) {
                const filePath = path.join(this.config.storageDir, `${safeId}${ext}`);
                try {
                    if (fs.existsSync(filePath)) {
                        const stat = await fs.promises.stat(filePath);
                        stats.totalSize += stat.size;
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }

        return stats;
    }

    /**
     * Clear all snapshots
     */
    public async clear(): Promise<number> {
        const ids = await this.list();
        let cleared = 0;

        for (const id of ids) {
            if (await this.delete(id)) {
                cleared++;
            }
        }

        return cleared;
    }

    /**
     * Export snapshot to external file
     */
    public async export(snapshotId: string, targetPath: string): Promise<boolean> {
        const snapshot = await this.load(snapshotId);
        if (!snapshot) return false;

        const data = JSON.stringify(snapshot, null, 2);
        await fs.promises.writeFile(targetPath, data);
        return true;
    }

    /**
     * Import snapshot from external file
     */
    public async import(sourcePath: string): Promise<Snapshot | null> {
        try {
            const content = await fs.promises.readFile(sourcePath, 'utf-8');
            const snapshot: Snapshot = JSON.parse(content);
            
            // Validate snapshot structure
            if (!snapshot.id || !snapshot.timestamp || !snapshot.type || !snapshot.registryState) {
                return null;
            }

            await this.save(snapshot);
            return snapshot;
        } catch (e) {
            return null;
        }
    }
}
