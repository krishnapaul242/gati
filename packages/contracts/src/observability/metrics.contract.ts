/**
 * @module contracts/observability/metrics
 * @description Metrics provider contract for pluggable metrics implementations
 */

/**
 * Metrics Provider Contract
 * Defines the interface for metrics collection and export
 */
export interface IMetricsProvider {
  /**
   * Increment a counter metric
   * @param name - Metric name
   * @param labels - Optional labels for the metric
   * @param value - Value to increment by (default: 1)
   */
  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;

  /**
   * Set a gauge metric value
   * @param name - Metric name
   * @param value - Current value
   * @param labels - Optional labels for the metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a histogram observation
   * @param name - Metric name
   * @param value - Observed value
   * @param labels - Optional labels for the metric
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Get metrics in export format (Prometheus, JSON, etc.)
   * @returns Formatted metrics string
   */
  getMetrics(): Promise<string>;
}

/**
 * Metrics Configuration
 */
export interface MetricsConfig {
  /** Provider type */
  provider: 'prometheus' | 'datadog' | 'cloudwatch' | 'mock';
  
  /** Service name for metrics */
  serviceName: string;
  
  /** Service version */
  serviceVersion?: string;
  
  /** Export interval in milliseconds */
  exportInterval?: number;
  
  /** Custom labels to add to all metrics */
  customLabels?: Record<string, string>;
}
