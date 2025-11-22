/**
 * @module timescape/phase4-example
 * @description Example demonstrating Phase 4: Lifecycle Management
 * 
 * This example shows how to use:
 * - Version usage tracking
 * - Hot/warm/cold classification
 * - Prometheus metrics
 * - Auto-deactivation system
 */

import { VersionRegistry } from './registry.js';
import { VersionLifecycleManager } from './lifecycle.js';
import { TimescapeMetrics } from './metrics.js';
import type { TSV } from './types.js';

// Example: Setting up lifecycle management for a production API

export function setupLifecycleManagement() {
    // 1. Create registry with custom classification config
    const registry = new VersionRegistry(undefined, {
        hotThresholdRequests: 1000,      // 1000+ requests in 24h = hot
        warmThresholdRequests: 100,      // 100+ requests in 24h = warm
        coldThresholdMs: 14 * 24 * 60 * 60 * 1000, // 14 days = cold
        classificationWindowMs: 24 * 60 * 60 * 1000, // 24 hour window
    });

    // 2. Register some versions
    const v1: TSV = 'tsv:1732186200000-users-001';
    const v2: TSV = 'tsv:1732186300000-users-002';
    const v3: TSV = 'tsv:1732186400000-users-003';

    registry.registerVersion('/api/users', v1, {
        hash: 'abc123',
        status: 'hot',
    });

    registry.registerVersion('/api/users', v2, {
        hash: 'def456',
        status: 'warm',
    });

    registry.registerVersion('/api/users', v3, {
        hash: 'ghi789',
        status: 'hot',
    });

    // Tag stable version
    registry.tagVersion(v3, 'stable');
    registry.tagVersion(v3, 'production');

    // 3. Simulate some traffic
    console.log('\n=== Simulating Traffic ===');
    
    // v3 gets lots of traffic (hot)
    for (let i = 0; i < 1500; i++) {
        registry.recordRequest(v3);
    }
    
    // v2 gets moderate traffic (warm)
    for (let i = 0; i < 150; i++) {
        registry.recordRequest(v2);
    }
    
    // v1 gets minimal traffic (will become cold)
    for (let i = 0; i < 5; i++) {
        registry.recordRequest(v1);
    }

    // 4. Check classification
    console.log('\n=== Version Classification ===');
    const stats = registry.getUsageStats('/api/users');
    console.log('Hot versions:', stats.hot);
    console.log('Warm versions:', stats.warm);
    console.log('Cold versions:', stats.cold);
    console.log('Total requests:', stats.totalRequests);

    // 5. Setup lifecycle manager
    const lifecycle = new VersionLifecycleManager(registry, {
        enabled: true,
        checkIntervalMs: 60 * 60 * 1000, // Check every hour
        coldThresholdMs: 14 * 24 * 60 * 60 * 1000, // 14 days
        minRequestCount: 10, // Minimum 10 requests to stay active
        protectedTags: ['stable', 'production', 'latest'],
        excludedHandlers: [], // No exclusions
        dryRun: false, // Actually deactivate
        onDeactivate: (tsv, handlerPath, reason) => {
            console.log(`[Lifecycle] Deactivated ${tsv} on ${handlerPath}: ${reason}`);
        },
    });

    // 6. Manual override example
    console.log('\n=== Manual Overrides ===');
    lifecycle.setManualOverride(v2, 'keep'); // Keep v2 even if it becomes cold
    console.log('Set manual override to keep v2');

    // 7. Check eligible for deactivation
    console.log('\n=== Eligible for Deactivation ===');
    const eligible = lifecycle.getEligibleForDeactivation();
    console.log(`Found ${eligible.length} versions eligible for deactivation:`);
    eligible.forEach(e => {
        console.log(`  - ${e.tsv}: ${e.reason} (${e.requestCount} requests)`);
    });

    // 8. Start lifecycle monitoring
    lifecycle.start();
    console.log('\n=== Lifecycle Manager Started ===');

    // 9. Setup Prometheus metrics (mock)
    console.log('\n=== Metrics Setup ===');
    const mockPrometheus = {
        createCounter: () => ({ inc: () => {} }),
        createGauge: () => ({ set: () => {} }),
        createHistogram: () => ({ observe: () => {} }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metrics = new TimescapeMetrics(mockPrometheus as any);
    
    // Record some metrics
    metrics.recordVersionRequest('/api/users', v3, 'hot');
    metrics.recordVersionRequestDuration('/api/users', v3, 0.025);
    metrics.recordTransformerExecution(v1, v3, true);
    metrics.recordTransformerDuration(v1, v3, 0.005);

    // Update status metrics
    metrics.updateVersionStatusMetrics(registry);
    console.log('Metrics updated');

    // 10. Get lifecycle statistics
    console.log('\n=== Lifecycle Statistics ===');
    const lifecycleStats = lifecycle.getStatistics();
    console.log('Total deactivations:', lifecycleStats.totalDeactivations);
    console.log('Deactivations by cold:', lifecycleStats.deactivationsByCold);
    console.log('Deactivations by low usage:', lifecycleStats.deactivationsByLowUsage);
    console.log('Active overrides:', lifecycleStats.activeOverrides);
    console.log('Is running:', lifecycleStats.isRunning);

    // 11. Cleanup
    return {
        registry,
        lifecycle,
        metrics,
        cleanup: () => {
            lifecycle.stop();
            console.log('\n=== Lifecycle Manager Stopped ===');
        },
    };
}

// Example: Reactivating a cold version
export function reactivateExample(registry: VersionRegistry, lifecycle: VersionLifecycleManager) {
    console.log('\n=== Reactivation Example ===');
    
    const coldVersion: TSV = 'tsv:1732186200000-users-001';
    
    console.log(`Attempting to reactivate ${coldVersion}...`);
    const success = lifecycle.reactivateVersion(coldVersion);
    
    if (success) {
        console.log('✓ Version reactivated successfully');
        const info = registry.getVersionInfo(coldVersion);
        console.log(`  New status: ${info?.status}`);
    } else {
        console.log('✗ Version could not be reactivated (not cold or not found)');
    }
}

// Example: Dry run mode
export function dryRunExample() {
    console.log('\n=== Dry Run Example ===');
    
    const registry = new VersionRegistry();
    const oldTimestamp = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days ago
    
    const v1: TSV = 'tsv:1732186200000-users-001';
    registry.registerVersion('/api/users', v1, {
        hash: 'abc123',
        status: 'hot',
        requestCount: 5,
        lastAccessed: oldTimestamp,
    });

    const lifecycle = new VersionLifecycleManager(registry, {
        coldThresholdMs: 14 * 24 * 60 * 60 * 1000,
        minRequestCount: 10,
        dryRun: true, // Won't actually deactivate
    });

    console.log('Running check in dry run mode...');
    lifecycle.checkNow();
    
    const info = registry.getVersionInfo(v1);
    console.log(`Version status after dry run: ${info?.status}`);
    console.log('(Should still be hot because dry run mode is enabled)');
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('='.repeat(60));
    console.log('Phase 4: Lifecycle Management Examples');
    

    const { cleanup } = setupLifecycleManagement();
    
    // Wait a bit then run other examples
    setTimeout(() => {
        dryRunExample();
        cleanup();
    }, 1000);
}
