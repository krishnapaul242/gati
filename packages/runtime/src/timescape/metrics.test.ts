import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimescapeMetrics } from './metrics.js';
import { VersionRegistry } from './registry.js';
import type { PrometheusMetrics } from '../../../observability/src/prometheus/metrics.js';
import type { TSV } from './types.js';

describe('TimescapeMetrics', () => {
    let metrics: TimescapeMetrics;
    let registry: VersionRegistry;
    let mockPrometheusMetrics: PrometheusMetrics;
    let mockCounter: any;
    let mockGauge: any;
    let mockHistogram: any;

    beforeEach(() => {
        // Create mock metrics
        mockCounter = {
            inc: vi.fn(),
        };

        mockGauge = {
            set: vi.fn(),
        };

        mockHistogram = {
            observe: vi.fn(),
        };

        mockPrometheusMetrics = {
            createCounter: vi.fn().mockReturnValue(mockCounter),
            createGauge: vi.fn().mockReturnValue(mockGauge),
            createHistogram: vi.fn().mockReturnValue(mockHistogram),
        } as any;

        metrics = new TimescapeMetrics(mockPrometheusMetrics);
        registry = new VersionRegistry();
    });

    describe('recordVersionRequest', () => {
        it('should record version request with correct labels', () => {
            const handlerPath = '/api/users';
            const version: TSV = 'tsv:1700000000000-abc123-1';

            metrics.recordVersionRequest(handlerPath, version, 'hot');

            expect(mockCounter.inc).toHaveBeenCalledWith({
                handler_path: handlerPath,
                version,
                status: 'hot',
            });
        });

        it('should record multiple requests', () => {
            metrics.recordVersionRequest('/api/users', 'tsv:1700000000000-abc123-1', 'hot');
            metrics.recordVersionRequest('/api/posts', 'tsv:1700000000000-def456-1', 'warm');

            expect(mockCounter.inc).toHaveBeenCalledTimes(2);
        });
    });

    describe('recordVersionRequestDuration', () => {
        it('should record request duration', () => {
            const handlerPath = '/api/users';
            const version: TSV = 'tsv:1700000000000-abc123-1';
            const duration = 0.025;

            metrics.recordVersionRequestDuration(handlerPath, version, duration);

            expect(mockHistogram.observe).toHaveBeenCalledWith(
                {
                    handler_path: handlerPath,
                    version,
                },
                duration
            );
        });
    });

    describe('recordTransformerExecution', () => {
        it('should record successful transformer execution', () => {
            const fromVersion: TSV = 'tsv:1700000000000-abc123-1';
            const toVersion: TSV = 'tsv:1700000001000-def456-2';

            metrics.recordTransformerExecution(fromVersion, toVersion, true);

            expect(mockCounter.inc).toHaveBeenCalledWith({
                from_version: fromVersion,
                to_version: toVersion,
                success: 'true',
            });
        });

        it('should record failed transformer execution', () => {
            const fromVersion: TSV = 'tsv:1700000000000-abc123-1';
            const toVersion: TSV = 'tsv:1700000001000-def456-2';

            metrics.recordTransformerExecution(fromVersion, toVersion, false);

            expect(mockCounter.inc).toHaveBeenCalledWith({
                from_version: fromVersion,
                to_version: toVersion,
                success: 'false',
            });
        });
    });

    describe('recordTransformerDuration', () => {
        it('should record transformer duration', () => {
            const fromVersion: TSV = 'tsv:1700000000000-abc123-1';
            const toVersion: TSV = 'tsv:1700000001000-def456-2';
            const duration = 0.005;

            metrics.recordTransformerDuration(fromVersion, toVersion, duration);

            expect(mockHistogram.observe).toHaveBeenCalledWith(
                {
                    from_version: fromVersion,
                    to_version: toVersion,
                },
                duration
            );
        });
    });

    describe('updateVersionStatusMetrics', () => {
        it('should update metrics for single handler', () => {
            const handlerPath = '/api/users';
            const v1: TSV = 'tsv:1700000000000-abc123-1';
            const v2: TSV = 'tsv:1700000001000-def456-2';

            registry.registerVersion(handlerPath, v1, { hash: 'hash1', status: 'hot' });
            registry.registerVersion(handlerPath, v2, { hash: 'hash2', status: 'warm' });

            metrics.updateVersionStatusMetrics(registry);

            // Check handler-specific metrics
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: handlerPath, status: 'hot' },
                1
            );
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: handlerPath, status: 'warm' },
                1
            );
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: handlerPath, status: 'cold' },
                0
            );

            // Check global metrics
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: '_global', status: 'hot' },
                1
            );
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: '_global', status: 'warm' },
                1
            );
        });

        it('should update metrics for multiple handlers', () => {
            registry.registerVersion('/api/users', 'tsv:1700000000000-abc123-1', { 
                hash: 'hash1', 
                status: 'hot' 
            });
            registry.registerVersion('/api/posts', 'tsv:1700000001000-def456-2', { 
                hash: 'hash2', 
                status: 'warm' 
            });
            registry.registerVersion('/api/posts', 'tsv:1700000002000-ghi789-3', { 
                hash: 'hash3', 
                status: 'cold' 
            });

            metrics.updateVersionStatusMetrics(registry);

            // Global should have 1 hot, 1 warm, 1 cold
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: '_global', status: 'hot' },
                1
            );
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: '_global', status: 'warm' },
                1
            );
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: '_global', status: 'cold' },
                1
            );
        });

        it('should update active and cold version gauges', () => {
            const handlerPath = '/api/users';
            registry.registerVersion(handlerPath, 'tsv:1700000000000-abc123-1', { 
                hash: 'hash1', 
                status: 'hot' 
            });
            registry.registerVersion(handlerPath, 'tsv:1700000001000-def456-2', { 
                hash: 'hash2', 
                status: 'warm' 
            });
            registry.registerVersion(handlerPath, 'tsv:1700000002000-ghi789-3', { 
                hash: 'hash3', 
                status: 'cold' 
            });

            metrics.updateVersionStatusMetrics(registry);

            // Active = hot + warm = 2
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: handlerPath },
                2
            );

            // Cold = 1
            expect(mockGauge.set).toHaveBeenCalledWith(
                { handler_path: handlerPath },
                1
            );
        });
    });

    describe('periodic updates', () => {
        it('should start periodic updates', () => {
            vi.useFakeTimers();

            const intervalId = metrics.startPeriodicUpdate(registry, 1000);

            // Initial update
            expect(mockGauge.set).toHaveBeenCalled();

            // Clear previous calls
            mockGauge.set.mockClear();

            // Advance time
            vi.advanceTimersByTime(1000);

            // Should have updated again
            expect(mockGauge.set).toHaveBeenCalled();

            metrics.stopPeriodicUpdate(intervalId);
            vi.useRealTimers();
        });

        it('should stop periodic updates', () => {
            vi.useFakeTimers();

            const intervalId = metrics.startPeriodicUpdate(registry, 1000);
            metrics.stopPeriodicUpdate(intervalId);

            mockGauge.set.mockClear();

            // Advance time
            vi.advanceTimersByTime(2000);

            // Should not have updated
            expect(mockGauge.set).not.toHaveBeenCalled();

            vi.useRealTimers();
        });
    });
});
