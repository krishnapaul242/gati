/**
 * @module timescape/metrics
 * @description Prometheus metrics for Timescape versioning system
 */

import type { Counter, Gauge, Histogram } from 'prom-client';
import type { PrometheusMetrics } from '../../../observability/src/prometheus/metrics.js';
import type { VersionRegistry } from './registry.js';
import type { TSV, VersionStatus } from './types.js';

export class TimescapeMetrics {
    private versionRequestsTotal: Counter<string>;
    private versionRequestDuration: Histogram<string>;
    private versionStatusGauge: Gauge<string>;
    private transformerExecutionTotal: Counter<string>;
    private transformerExecutionDuration: Histogram<string>;
    private activeVersionsGauge: Gauge<string>;
    private coldVersionsGauge: Gauge<string>;

    constructor(private prometheusMetrics: PrometheusMetrics) {
        // Version request counter
        this.versionRequestsTotal = prometheusMetrics.createCounter(
            'timescape_version_requests_total',
            'Total number of requests per version',
            ['handler_path', 'version', 'status']
        );

        // Version request duration
        this.versionRequestDuration = prometheusMetrics.createHistogram(
            'timescape_version_request_duration_seconds',
            'Duration of version request processing',
            ['handler_path', 'version'],
            [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
        );

        // Version status gauge (hot/warm/cold count)
        this.versionStatusGauge = prometheusMetrics.createGauge(
            'timescape_version_status',
            'Number of versions by status',
            ['handler_path', 'status']
        );

        // Transformer execution counter
        this.transformerExecutionTotal = prometheusMetrics.createCounter(
            'timescape_transformer_executions_total',
            'Total number of transformer executions',
            ['from_version', 'to_version', 'success']
        );

        // Transformer execution duration
        this.transformerExecutionDuration = prometheusMetrics.createHistogram(
            'timescape_transformer_duration_seconds',
            'Duration of transformer execution',
            ['from_version', 'to_version'],
            [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1]
        );

        // Active versions gauge
        this.activeVersionsGauge = prometheusMetrics.createGauge(
            'timescape_active_versions',
            'Number of active versions',
            ['handler_path']
        );

        // Cold versions gauge
        this.coldVersionsGauge = prometheusMetrics.createGauge(
            'timescape_cold_versions',
            'Number of cold versions',
            ['handler_path']
        );
    }

    /**
     * Record a version request
     */
    recordVersionRequest(handlerPath: string, version: TSV, status: VersionStatus): void {
        this.versionRequestsTotal.inc({
            handler_path: handlerPath,
            version,
            status,
        });
    }

    /**
     * Record version request duration
     */
    recordVersionRequestDuration(handlerPath: string, version: TSV, durationSeconds: number): void {
        this.versionRequestDuration.observe(
            {
                handler_path: handlerPath,
                version,
            },
            durationSeconds
        );
    }

    /**
     * Record transformer execution
     */
    recordTransformerExecution(fromVersion: TSV, toVersion: TSV, success: boolean): void {
        this.transformerExecutionTotal.inc({
            from_version: fromVersion,
            to_version: toVersion,
            success: success.toString(),
        });
    }

    /**
     * Record transformer execution duration
     */
    recordTransformerDuration(fromVersion: TSV, toVersion: TSV, durationSeconds: number): void {
        this.transformerExecutionDuration.observe(
            {
                from_version: fromVersion,
                to_version: toVersion,
            },
            durationSeconds
        );
    }

    /**
     * Update version status metrics from registry
     */
    updateVersionStatusMetrics(registry: VersionRegistry): void {
        // Get all handler paths
        const state = registry.getAll();
        const handlerPaths = Object.keys(state.handlers);

        // Update metrics for each handler
        for (const handlerPath of handlerPaths) {
            const stats = registry.getUsageStats(handlerPath);

            this.versionStatusGauge.set(
                { handler_path: handlerPath, status: 'hot' },
                stats.hot
            );

            this.versionStatusGauge.set(
                { handler_path: handlerPath, status: 'warm' },
                stats.warm
            );

            this.versionStatusGauge.set(
                { handler_path: handlerPath, status: 'cold' },
                stats.cold
            );

            this.activeVersionsGauge.set(
                { handler_path: handlerPath },
                stats.hot + stats.warm
            );

            this.coldVersionsGauge.set(
                { handler_path: handlerPath },
                stats.cold
            );
        }

        // Update global metrics (all handlers)
        const globalStats = registry.getUsageStats();
        this.versionStatusGauge.set(
            { handler_path: '_global', status: 'hot' },
            globalStats.hot
        );

        this.versionStatusGauge.set(
            { handler_path: '_global', status: 'warm' },
            globalStats.warm
        );

        this.versionStatusGauge.set(
            { handler_path: '_global', status: 'cold' },
            globalStats.cold
        );

        this.activeVersionsGauge.set(
            { handler_path: '_global' },
            globalStats.hot + globalStats.warm
        );

        this.coldVersionsGauge.set(
            { handler_path: '_global' },
            globalStats.cold
        );
    }

    /**
     * Start periodic metrics update
     */
    startPeriodicUpdate(registry: VersionRegistry, intervalMs: number = 60000): NodeJS.Timeout {
        const update = () => {
            this.updateVersionStatusMetrics(registry);
        };

        // Initial update
        update();

        // Periodic updates
        return setInterval(update, intervalMs);
    }

    /**
     * Stop periodic metrics update
     */
    stopPeriodicUpdate(intervalId: NodeJS.Timeout): void {
        clearInterval(intervalId);
    }
}
