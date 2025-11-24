/**
 * @module runtime/observability-factory
 * @description Factory for creating observability providers
 */

import type { IMetricsProvider } from '@gati-framework/contracts';
import type { MetricsClient } from './metrics-client.js';

export interface ObservabilityConfig {
  metrics?: {
    provider?: IMetricsProvider;
  };
}

/**
 * Adapter that wraps IMetricsProvider to implement MetricsClient interface
 */
export class MetricsClientAdapter implements MetricsClient {
  constructor(private provider: IMetricsProvider) {}

  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void {
    this.provider.incrementCounter(name, labels, value);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.provider.setGauge(name, value, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.provider.recordHistogram(name, value, labels);
  }

  createSpan(): any {
    return { end: () => {}, setStatus: () => {}, recordException: () => {}, spanContext: () => ({}) };
  }

  async withSpan<T>(name: string, fn: (span: any) => Promise<T>): Promise<T> {
    return fn(this.createSpan());
  }

  logWithContext(): void {}
  recordAudit(): void {}
}

/**
 * Create metrics client from configuration
 */
export function createMetricsClient(config?: ObservabilityConfig): MetricsClient | undefined {
  if (config?.metrics?.provider) {
    return new MetricsClientAdapter(config.metrics.provider);
  }
  return undefined;
}
