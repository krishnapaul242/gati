import { DiffEngine } from './diff-engine.js';
import { SnapshotManager } from './snapshot-manager.js';
import { VersionRegistry } from './registry.js';
import fs from 'fs';
import path from 'path';

async function runTest() {
    console.log('Starting Phase 2 Verification...');

    // 1. Test DiffEngine
    console.log('Testing DiffEngine...');
    const diffEngine = new DiffEngine();
    const obj1 = { name: 'Gati', version: 1, config: { port: 3000 } };
    const obj2 = { name: 'Gati', version: 2, config: { port: 4000 }, newField: true };

    const diffs = diffEngine.diff(obj1, obj2);
    console.log('Diffs:', JSON.stringify(diffs, null, 2));

    const hasVersionChange = diffs.some(d => d.path === '/version' && d.op === 'replace');
    const hasPortChange = diffs.some(d => d.path === '/config/port' && d.op === 'replace');
    const hasNewField = diffs.some(d => d.path === '/newField' && d.op === 'add');

    if (hasVersionChange && hasPortChange && hasNewField) {
        console.log('✅ DiffEngine: Correctly identified changes');
    } else {
        console.error('❌ DiffEngine: Failed to identify changes');
    }

    // 2. Test SnapshotManager
    console.log('Testing SnapshotManager...');
    const registry = new VersionRegistry();
    registry.register({
        id: 'test-module',
        type: 'module',
        version: 'tsv:123-test-1',
        hash: 'hash1'
    });

    const tempDir = path.join(process.cwd(), '.gati/test-snapshots');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    const snapshotManager = new SnapshotManager(registry, tempDir);
    const snapshot = await snapshotManager.createSnapshot('light');
    console.log(`Created snapshot: ${snapshot.id}`);

    const loaded = await snapshotManager.load(snapshot.id);
    if (loaded && loaded.id === snapshot.id && loaded.registryState.modules['test-module'] === 'tsv:123-test-1') {
        console.log('✅ SnapshotManager: Create and Load successful');
    } else {
        console.error('❌ SnapshotManager: Failed to load snapshot correctly', loaded);
    }

    // Cleanup
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('Phase 2 Verification Complete.');
}

runTest();
