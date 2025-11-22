/**
 * @module timescape/lifecycle
 * @description Version lifecycle management with auto-deactivation
 */

import type { VersionRegistry } from './registry.js';
import type { TSV, VersionStatus } from './types.js';

export interface LifecycleConfig {
    /**
     * Enable auto-deactivation
     */
    enabled: boolean;

    /**
     * Interval for checking version status (ms)
     */
    checkIntervalMs: number;

    /**
     * Time since last access to consider version cold (ms)
     */
    coldThresholdMs: number;

    /**
     * Minimum request count to prevent deactivation
     */
    minRequestCount: number;

    /**
     * Versions to never deactivate (e.g., tagged versions)
     */
    protectedTags: string[];

    /**
     * Handlers to exclude from auto-deactivation
     */
    excludedHandlers: string[];

    /**
     * Callback when version is deactivated
     */
    onDeactivate?: (tsv: TSV, handlerPath: string, reason: string) => void;

    /**
     * Dry run mode (log but don't deactivate)
     */
    dryRun: boolean;
}

export interface DeactivationReason {
    tsv: TSV;
    handlerPath: string;
    reason: 'cold' | 'low_usage' | 'manual';
    lastAccessed: number;
    requestCount: number;
    deactivatedAt: number;
}

export class VersionLifecycleManager {
    private config: LifecycleConfig;
    private intervalId?: NodeJS.Timeout;
    private deactivationHistory: DeactivationReason[] = [];
    private manualOverrides: Map<TSV, 'keep' | 'deactivate'> = new Map();

    constructor(
        private registry: VersionRegistry,
        config?: Partial<LifecycleConfig>
    ) {
        this.config = {
            enabled: true,
            checkIntervalMs: 60 * 60 * 1000, // 1 hour
            coldThresholdMs: 7 * 24 * 60 * 60 * 1000, // 7 days
            minRequestCount: 10,
            protectedTags: ['stable', 'production', 'latest'],
            excludedHandlers: [],
            dryRun: false,
            ...config,
        };
    }

    /**
     * Start lifecycle monitoring
     */
    start(): void {
        if (!this.config.enabled) {
            return;
        }

        if (this.intervalId) {
            throw new Error('Lifecycle manager already started');
        }

        // Initial check
        this.checkVersions();

        // Periodic checks
        this.intervalId = setInterval(() => {
            this.checkVersions();
        }, this.config.checkIntervalMs);
    }

    /**
     * Stop lifecycle monitoring
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    /**
     * Check all versions and deactivate cold ones
     */
    private checkVersions(): void {
        const now = Date.now();
        const state = this.registry.getAll();

        for (const [handlerPath, timeline] of Object.entries(state.handlers)) {
            // Skip excluded handlers
            if (this.config.excludedHandlers.includes(handlerPath)) {
                continue;
            }

            for (const version of timeline.versions) {
                // Check manual override
                const override = this.manualOverrides.get(version.tsv);
                if (override === 'keep') {
                    continue;
                }

                if (override === 'deactivate') {
                    this.deactivateVersion(version.tsv, handlerPath, 'manual');
                    continue;
                }

                // Check if version is protected by tag
                if (this.isProtected(version.tsv)) {
                    continue;
                }

                // Check if version should be deactivated
                const timeSinceLastAccess = now - version.lastAccessed;

                if (timeSinceLastAccess > this.config.coldThresholdMs) {
                    // Cold due to inactivity
                    this.deactivateVersion(version.tsv, handlerPath, 'cold');
                } else if (version.requestCount < this.config.minRequestCount) {
                    // Low usage
                    this.deactivateVersion(version.tsv, handlerPath, 'low_usage');
                }
            }
        }
    }

    /**
     * Deactivate a version
     */
    private deactivateVersion(tsv: TSV, handlerPath: string, reason: 'cold' | 'low_usage' | 'manual'): void {
        const info = this.registry.getVersionInfo(tsv);
        if (!info) {
            return;
        }

        // Already cold
        if (info.status === 'cold') {
            return;
        }

        const deactivationReason: DeactivationReason = {
            tsv,
            handlerPath,
            reason,
            lastAccessed: info.lastAccessed,
            requestCount: info.requestCount,
            deactivatedAt: Date.now(),
        };

        if (this.config.dryRun) {
            console.log('[Lifecycle] [DRY RUN] Would deactivate version:', deactivationReason);
        } else {
            this.registry.markCold(tsv);
            this.deactivationHistory.push(deactivationReason);

            if (this.config.onDeactivate) {
                this.config.onDeactivate(tsv, handlerPath, reason);
            }

            console.log('[Lifecycle] Deactivated version:', deactivationReason);
        }
    }

    /**
     * Check if version is protected from deactivation
     */
    private isProtected(tsv: TSV): boolean {
        const tags = this.registry.getTagsForVersion(tsv);
        return tags.some(tag => this.config.protectedTags.includes(tag));
    }

    /**
     * Manually override version lifecycle
     */
    setManualOverride(tsv: TSV, action: 'keep' | 'deactivate'): void {
        this.manualOverrides.set(tsv, action);
    }

    /**
     * Remove manual override
     */
    removeManualOverride(tsv: TSV): void {
        this.manualOverrides.delete(tsv);
    }

    /**
     * Get manual overrides
     */
    getManualOverrides(): Map<TSV, 'keep' | 'deactivate'> {
        return new Map(this.manualOverrides);
    }

    /**
     * Get deactivation history
     */
    getDeactivationHistory(limit?: number): DeactivationReason[] {
        const history = [...this.deactivationHistory].reverse();
        return limit ? history.slice(0, limit) : history;
    }

    /**
     * Clear deactivation history
     */
    clearDeactivationHistory(): void {
        this.deactivationHistory = [];
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<LifecycleConfig>): void {
        const wasEnabled = this.config.enabled;
        this.config = { ...this.config, ...config };

        // Restart if enabled state changed
        if (wasEnabled !== this.config.enabled) {
            if (this.config.enabled) {
                this.start();
            } else {
                this.stop();
            }
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): LifecycleConfig {
        return { ...this.config };
    }

    /**
     * Get lifecycle statistics
     */
    getStatistics(): {
        totalDeactivations: number;
        deactivationsByCold: number;
        deactivationsByLowUsage: number;
        deactivationsByManual: number;
        activeOverrides: number;
        isRunning: boolean;
    } {
        return {
            totalDeactivations: this.deactivationHistory.length,
            deactivationsByCold: this.deactivationHistory.filter(d => d.reason === 'cold').length,
            deactivationsByLowUsage: this.deactivationHistory.filter(d => d.reason === 'low_usage').length,
            deactivationsByManual: this.deactivationHistory.filter(d => d.reason === 'manual').length,
            activeOverrides: this.manualOverrides.size,
            isRunning: this.intervalId !== undefined,
        };
    }

    /**
     * Force check now (useful for testing)
     */
    checkNow(): void {
        this.checkVersions();
    }

    /**
     * Reactivate a cold version
     */
    reactivateVersion(tsv: TSV): boolean {
        const info = this.registry.getVersionInfo(tsv);
        if (!info) {
            return false;
        }

        if (info.status !== 'cold') {
            return false;
        }

        this.registry.updateVersionStatus(tsv, 'warm');
        this.removeManualOverride(tsv);
        return true;
    }

    /**
     * Get versions eligible for deactivation
     */
    getEligibleForDeactivation(): Array<{
        tsv: TSV;
        handlerPath: string;
        reason: 'cold' | 'low_usage';
        timeSinceLastAccess: number;
        requestCount: number;
    }> {
        const now = Date.now();
        const state = this.registry.getAll();
        const eligible: Array<{
            tsv: TSV;
            handlerPath: string;
            reason: 'cold' | 'low_usage';
            timeSinceLastAccess: number;
            requestCount: number;
        }> = [];

        for (const [handlerPath, timeline] of Object.entries(state.handlers)) {
            if (this.config.excludedHandlers.includes(handlerPath)) {
                continue;
            }

            for (const version of timeline.versions) {
                if (version.status === 'cold') {
                    continue;
                }

                if (this.manualOverrides.get(version.tsv) === 'keep') {
                    continue;
                }

                if (this.isProtected(version.tsv)) {
                    continue;
                }

                const timeSinceLastAccess = now - version.lastAccessed;

                if (timeSinceLastAccess > this.config.coldThresholdMs) {
                    eligible.push({
                        tsv: version.tsv,
                        handlerPath,
                        reason: 'cold',
                        timeSinceLastAccess,
                        requestCount: version.requestCount,
                    });
                } else if (version.requestCount < this.config.minRequestCount) {
                    eligible.push({
                        tsv: version.tsv,
                        handlerPath,
                        reason: 'low_usage',
                        timeSinceLastAccess,
                        requestCount: version.requestCount,
                    });
                }
            }
        }

        return eligible;
    }
}
