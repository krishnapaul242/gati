import { Snapshot, VersionRegistryState } from './types.js';
import { VersionRegistry } from './registry.js';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export class SnapshotManager {
    private storageDir: string;
    private registry: VersionRegistry;

    constructor(registry: VersionRegistry, storageDir: string = '.gati/snapshots') {
        this.registry = registry;
        this.storageDir = storageDir;
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    public async createSnapshot(type: 'light' | 'heavy'): Promise<Snapshot> {
        const state = this.registry.getAll();
        const timestamp = Date.now();
        const id = `snap:${timestamp}-${type}-${createHash('sha256').update(JSON.stringify(state)).digest('hex').substring(0, 8)}`;

        const snapshot: Snapshot = {
            id,
            timestamp,
            type,
            registryState: state,
        };

        if (type === 'heavy') {
            // In a real implementation, we would gather all artifact content here.
            // For now, we'll just store a placeholder or the state itself as "heavy" implies full recovery.
            // We might need to fetch modules from disk/memory.
            snapshot.artifacts = {
                // Placeholder: In reality, we'd iterate state and fetch content
                note: 'Heavy snapshot content would go here'
            };
        }

        await this.save(snapshot);
        return snapshot;
    }

    private async save(snapshot: Snapshot): Promise<void> {
        const filePath = path.join(this.storageDir, `${snapshot.id}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(snapshot, null, 2));
    }

    public async load(id: string): Promise<Snapshot | null> {
        const filePath = path.join(this.storageDir, `${id}.json`);
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }

    public async list(): Promise<string[]> {
        try {
            const files = await fs.promises.readdir(this.storageDir);
            return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        } catch (e) {
            return [];
        }
    }
}
