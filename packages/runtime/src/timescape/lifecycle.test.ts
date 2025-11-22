import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { VersionLifecycleManager } from './lifecycle.js';
import { VersionRegistry } from './registry.js';
import type { TSV } from './types.js';

describe('VersionLifecycleManager', () => {
    let registry: VersionRegistry;
    let lifecycle: VersionLifecycleManager;

    beforeEach(() => {
        registry = new VersionRegistry();
        vi.useFakeTimers();
    });

    afterEach(() => {
        lifecycle?.stop();
        vi.useRealTimers();
    });

    describe('Initialization', () => {
        it('should create lifecycle manager with default config', () => {
            lifecycle = new VersionLifecycleManager(registry);
            const config = lifecycle.getConfig();

            expect(config.enabled).toBe(true);
            expect(config.checkIntervalMs).toBe(60 * 60 * 1000);
            expect(config.coldThresholdMs).toBe(7 * 24 * 60 * 60 * 1000);
            expect(config.minRequestCount).toBe(10);
            expect(config.protectedTags).toContain('stable');
            expect(config.dryRun).toBe(false);
        });

        it('should create lifecycle manager with custom config', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                enabled: false,
                checkIntervalMs: 30000,
                coldThresholdMs: 1000,
                minRequestCount: 5,
                protectedTags: ['production'],
                dryRun: true,
            });

            const config = lifecycle.getConfig();
            expect(config.enabled).toBe(false);
            expect(config.checkIntervalMs).toBe(30000);
            expect(config.coldThresholdMs).toBe(1000);
            expect(config.minRequestCount).toBe(5);
            expect(config.protectedTags).toEqual(['production']);
            expect(config.dryRun).toBe(true);
        });
    });

    describe('Start/Stop', () => {
        it('should start lifecycle monitoring', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                checkIntervalMs: 1000,
            });

            lifecycle.start();
            const stats = lifecycle.getStatistics();
            expect(stats.isRunning).toBe(true);
        });

        it('should stop lifecycle monitoring', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                checkIntervalMs: 1000,
            });

            lifecycle.start();
            lifecycle.stop();

            const stats = lifecycle.getStatistics();
            expect(stats.isRunning).toBe(false);
        });

        it('should throw error if started twice', () => {
            lifecycle = new VersionLifecycleManager(registry);
            lifecycle.start();

            expect(() => lifecycle.start()).toThrow('Lifecycle manager already started');
        });

        it('should not start if disabled', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                enabled: false,
            });

            lifecycle.start();
            const stats = lifecycle.getStatistics();
            expect(stats.isRunning).toBe(false);
        });
    });

    describe('Auto-Deactivation', () => {
        it('should deactivate cold version', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('cold');
        });

        it('should deactivate version with low usage', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs: 7 * 24 * 60 * 60 * 1000,
                minRequestCount: 10,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 5, // Below threshold
                lastAccessed: Date.now(),
            });

            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('cold');
        });

        it('should not deactivate active version', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs: 7 * 24 * 60 * 60 * 1000,
                minRequestCount: 10,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: Date.now(),
            });

            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('hot');
        });

        it('should not deactivate protected version', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
                protectedTags: ['stable'],
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            registry.tagVersion(tsv, 'stable');

            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('hot'); // Should remain hot
        });

        it('should not deactivate excluded handler', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
                excludedHandlers: ['/api/users'],
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('hot'); // Should remain hot
        });

        it('should run periodic checks', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
                checkIntervalMs: 1000,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.start();

            // Advance time to trigger check
            vi.advanceTimersByTime(1000);

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('cold');
        });
    });

    describe('Manual Overrides', () => {
        it('should keep version with manual override', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.setManualOverride(tsv, 'keep');
            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('hot'); // Should remain hot
        });

        it('should deactivate version with manual override', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs: 7 * 24 * 60 * 60 * 1000,
                minRequestCount: 0,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: Date.now(),
            });

            lifecycle.setManualOverride(tsv, 'deactivate');
            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('cold');
        });

        it('should remove manual override', () => {
            lifecycle = new VersionLifecycleManager(registry);

            const tsv: TSV = 'tsv:1732186200-users-001';
            lifecycle.setManualOverride(tsv, 'keep');
            lifecycle.removeManualOverride(tsv);

            const overrides = lifecycle.getManualOverrides();
            expect(overrides.has(tsv)).toBe(false);
        });

        it('should get all manual overrides', () => {
            lifecycle = new VersionLifecycleManager(registry);

            const tsv1: TSV = 'tsv:1732186200-users-001';
            const tsv2: TSV = 'tsv:1732186300-users-002';

            lifecycle.setManualOverride(tsv1, 'keep');
            lifecycle.setManualOverride(tsv2, 'deactivate');

            const overrides = lifecycle.getManualOverrides();
            expect(overrides.size).toBe(2);
            expect(overrides.get(tsv1)).toBe('keep');
            expect(overrides.get(tsv2)).toBe('deactivate');
        });
    });

    describe('Deactivation History', () => {
        it('should track deactivation history', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.checkNow();

            const history = lifecycle.getDeactivationHistory();
            expect(history).toHaveLength(1);
            expect(history[0].tsv).toBe(tsv);
            expect(history[0].reason).toBe('cold');
            expect(history[0].handlerPath).toBe('/api/users');
        });

        it('should limit deactivation history', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
            });

            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            for (let i = 0; i < 5; i++) {
                const tsv: TSV = `tsv:${1732186200 + i}-users-00${i}` as TSV;
                registry.registerVersion('/api/users', tsv, {
                    hash: `hash${i}`,
                    status: 'hot',
                    requestCount: 100,
                    lastAccessed: oldTimestamp,
                });
            }

            lifecycle.checkNow();

            const history = lifecycle.getDeactivationHistory(3);
            expect(history).toHaveLength(3);
        });

        it('should clear deactivation history', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.checkNow();
            lifecycle.clearDeactivationHistory();

            const history = lifecycle.getDeactivationHistory();
            expect(history).toHaveLength(0);
        });
    });

    describe('Dry Run Mode', () => {
        it('should not deactivate in dry run mode', () => {
            const coldThresholdMs = 1000;
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
                dryRun: true,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.checkNow();

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('hot'); // Should remain hot

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[DRY RUN]'),
                expect.anything()
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Callbacks', () => {
        it('should call onDeactivate callback', () => {
            const coldThresholdMs = 1000;
            const onDeactivate = vi.fn();

            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
                onDeactivate,
            });

            const tsv: TSV = 'tsv:1732186200-users-001';
            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            lifecycle.checkNow();

            expect(onDeactivate).toHaveBeenCalledWith(tsv, '/api/users', 'cold');
        });
    });

    describe('Configuration Updates', () => {
        it('should update configuration', () => {
            lifecycle = new VersionLifecycleManager(registry);

            lifecycle.updateConfig({
                coldThresholdMs: 5000,
                minRequestCount: 20,
            });

            const config = lifecycle.getConfig();
            expect(config.coldThresholdMs).toBe(5000);
            expect(config.minRequestCount).toBe(20);
        });

        it('should restart when enabled state changes', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                enabled: false,
            });

            lifecycle.updateConfig({ enabled: true });

            const stats = lifecycle.getStatistics();
            expect(stats.isRunning).toBe(true);
        });

        it('should stop when disabled', () => {
            lifecycle = new VersionLifecycleManager(registry, {
                enabled: true,
            });

            lifecycle.start();
            lifecycle.updateConfig({ enabled: false });

            const stats = lifecycle.getStatistics();
            expect(stats.isRunning).toBe(false);
        });
    });

    describe('Statistics', () => {
        it('should get lifecycle statistics', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 5,
            });

            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            // Cold version
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            // Low usage version
            registry.registerVersion('/api/posts', 'tsv:1732186300-posts-001' as TSV, {
                hash: 'b',
                status: 'hot',
                requestCount: 2,
                lastAccessed: Date.now(),
            });

            lifecycle.checkNow();

            const stats = lifecycle.getStatistics();
            expect(stats.totalDeactivations).toBe(2);
            expect(stats.deactivationsByCold).toBe(1);
            expect(stats.deactivationsByLowUsage).toBe(1);
            expect(stats.deactivationsByManual).toBe(0);
        });

        it('should track manual deactivations', () => {
            lifecycle = new VersionLifecycleManager(registry);

            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: Date.now(),
            });

            lifecycle.setManualOverride(tsv, 'deactivate');
            lifecycle.checkNow();

            const stats = lifecycle.getStatistics();
            expect(stats.deactivationsByManual).toBe(1);
        });
    });

    describe('Reactivation', () => {
        it('should reactivate cold version', () => {
            lifecycle = new VersionLifecycleManager(registry);

            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'cold',
            });

            const result = lifecycle.reactivateVersion(tsv);
            expect(result).toBe(true);

            const info = registry.getVersionInfo(tsv);
            expect(info?.status).toBe('warm');
        });

        it('should not reactivate non-cold version', () => {
            lifecycle = new VersionLifecycleManager(registry);

            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
            });

            const result = lifecycle.reactivateVersion(tsv);
            expect(result).toBe(false);
        });

        it('should remove manual override on reactivation', () => {
            lifecycle = new VersionLifecycleManager(registry);

            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'cold',
            });

            lifecycle.setManualOverride(tsv, 'keep');
            lifecycle.reactivateVersion(tsv);

            const overrides = lifecycle.getManualOverrides();
            expect(overrides.has(tsv)).toBe(false);
        });
    });

    describe('Eligible for Deactivation', () => {
        it('should get versions eligible for deactivation', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 10,
            });

            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            // Cold version
            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            // Low usage version
            registry.registerVersion('/api/posts', 'tsv:1732186300-posts-001' as TSV, {
                hash: 'b',
                status: 'hot',
                requestCount: 5,
                lastAccessed: Date.now(),
            });

            // Active version
            registry.registerVersion('/api/comments', 'tsv:1732186400-comments-001' as TSV, {
                hash: 'c',
                status: 'hot',
                requestCount: 100,
                lastAccessed: Date.now(),
            });

            const eligible = lifecycle.getEligibleForDeactivation();
            expect(eligible).toHaveLength(2);
            expect(eligible[0].reason).toBe('cold');
            expect(eligible[1].reason).toBe('low_usage');
        });

        it('should not include protected versions', () => {
            const coldThresholdMs = 1000;
            lifecycle = new VersionLifecycleManager(registry, {
                coldThresholdMs,
                minRequestCount: 0,
                protectedTags: ['stable'],
            });

            const oldTimestamp = Date.now() - coldThresholdMs - 1000;

            const tsv: TSV = 'tsv:1732186200-users-001';
            registry.registerVersion('/api/users', tsv, {
                hash: 'a',
                status: 'hot',
                requestCount: 100,
                lastAccessed: oldTimestamp,
            });

            registry.tagVersion(tsv, 'stable');

            const eligible = lifecycle.getEligibleForDeactivation();
            expect(eligible).toHaveLength(0);
        });

        it('should not include already cold versions', () => {
            lifecycle = new VersionLifecycleManager(registry);

            registry.registerVersion('/api/users', 'tsv:1732186200-users-001' as TSV, {
                hash: 'a',
                status: 'cold',
            });

            const eligible = lifecycle.getEligibleForDeactivation();
            expect(eligible).toHaveLength(0);
        });
    });
});
