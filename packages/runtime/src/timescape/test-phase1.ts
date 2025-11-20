import { VersionRegistry } from './registry.js';
import { JSONTimelineStore } from './timeline-store.js';
import type { TSV, ChangeLogItem } from './types.js';

async function runTest() {
    console.log('Starting Phase 1 Verification...');

    // 1. Test Registry
    console.log('Testing VersionRegistry...');
    const registry = new VersionRegistry();
    const moduleVersion: TSV = `tsv:${Date.now()}-node1-1`;

    registry.register({
        id: 'user-module',
        type: 'module',
        version: moduleVersion,
        hash: 'abc123hash'
    });

    const retrieved = registry.get('module', 'user-module');
    if (retrieved === moduleVersion) {
        console.log('✅ Registry: Register and Get successful');
    } else {
        console.error('❌ Registry: Failed to retrieve version');
    }

    // 2. Test TimelineStore
    console.log('Testing TimelineStore (JSON In-Memory)...');
    try {
        // Use in-memory JSON store for test
        const store = new JSONTimelineStore();

        const event: ChangeLogItem = {
            id: `tsv:${Date.now()}-node1-2` as TSV,
            timestamp: Date.now(),
            type: 'module',
            actor: 'test-runner',
            payload: { action: 'update' },
            parents: [moduleVersion]
        };

        await store.append(event);
        console.log('✅ TimelineStore: Append successful');

        const results = await store.query({ type: 'module' });
        if (results.length === 1 && results[0].id === event.id) {
            console.log('✅ TimelineStore: Query successful');
        } else {
            console.error('❌ TimelineStore: Query failed', results);
        }

        await store.close();
    } catch (error) {
        console.error('❌ TimelineStore Error:', error);
    }

    console.log('Phase 1 Verification Complete.');
}

runTest();
