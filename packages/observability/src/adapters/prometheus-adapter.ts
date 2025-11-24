/**
 * @module observability/adapters/prometheus
 * @description Prometheus adapter implementing IMetricsProvider contract
 */

import type { IMetricsProvider } from '@gati-framework/contracts';
import { PrometheusMetrics } from '../prometheus/metrics.js';

/**
 * Prometheus adapter for metrics collection
 */
export class PrometheusAdapter implements IMetricsProvider {
  private metrics: PrometheusMetrics;

  constructor() {
    this.metrics = new PrometheusMetrics();
  }

  incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
    const counter = this.metrics.createCounter(name, `Counter for ${name}`, Object.keys(labels || {}));
    counter.inc(labels || {}, value);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const gauge = this.metrics.createGauge(name, `Gauge for ${name}`, Object.keys(labels || {}));
    gauge.set(labels || {}, value);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const histogram = this.metrics.createHistogram(name, `Histogram for ${name}`, Object.keys(labels || {}));
    histogram.observe(labels || {}, value);
  }

  async getMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }

  /**
   * Get the underlying Prometheus metrics instance
   */
  getPrometheusMetrics(): PrometheusMetrics {
    return this.metrics;
  }
}
