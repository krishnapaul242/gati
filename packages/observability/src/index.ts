/**
 * @module observability
 * @description Complete observability stack for Gati applications
 */

export * from './prometheus/metrics.js';
export * from './loki/logger.js';
export * from './tracing/distributed-tracing.js';

import { PrometheusMetrics, createPrometheusMiddleware } from './prometheus/metrics.js';
import { LokiLogger, createLokiMiddleware, type LokiConfig } from './loki/logger.js';
import { DistributedTracing, createTracingMiddleware, type TracingConfig } from './tracing/distributed-tracing.js';

/**
 * Observability stack configuration
 */
export interface ObservabilityConfig {
  /** Service name */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Environment */
  environment?: string;
  /** Enable Prometheus metrics */
  prometheus?: boolean;
  /** Loki configuration */
  loki?: LokiConfig;
  /** Tracing configuration */
  tracing?: TracingConfig;
}

/**
 * Complete observability stack
 */
export class ObservabilityStack {
  public readonly metrics?: PrometheusMetrics;
  public readonly logger?: LokiLogger;
  public readonly tracing?: DistributedTracing;

  constructor(config: ObservabilityConfig) {
    // Initialize Prometheus metrics
    if (config.prometheus !== false) {
      this.metrics = new PrometheusMetrics();
    }

    // Initialize Loki logger
    if (config.loki) {
      this.logger = new LokiLogger({
        ...config.loki,
        labels: {
          service: config.serviceName,
          version: config.serviceVersion || '1.0.0',
          environment: config.environment || 'production',
          ...config.loki.labels,
        },
      });
    }

    // Initialize distributed tracing
    if (config.tracing) {
      this.tracing = new DistributedTracing({
        serviceName: config.serviceName,
        serviceVersion: config.serviceVersion,
        environment: config.environment,
        ...config.tracing,
      });
    }
  }

  /**
   * Get combined middleware for Express/HTTP servers
   */
  getMiddleware(): any[] {
    const middleware: any[] = [];

    if (this.metrics) {
      middleware.push(createPrometheusMiddleware(this.metrics));
    }

    if (this.logger) {
      middleware.push(createLokiMiddleware(this.logger));
    }

    if (this.tracing) {
      middleware.push(createTracingMiddleware(this.tracing));
    }

    return middleware;
  }

  /**
   * Expose metrics endpoint
   */
  async getMetricsHandler(): Promise<(req: any, res: any) => Promise<void>> {
    if (!this.metrics) {
      throw new Error('Prometheus metrics not enabled');
    }

    return async (req: any, res: any) => {
      res.setHeader('Content-Type', 'text/plain');
      res.send(await this.metrics!.getMetrics());
    };
  }

  /**
   * Shutdown observability stack
   */
  async shutdown(): Promise<void> {
    if (this.logger) {
      await this.logger.flush();
    }

    if (this.tracing) {
      await this.tracing.shutdown();
    }
  }
}
