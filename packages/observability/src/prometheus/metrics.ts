/**
 * @module observability/prometheus
 * @description Prometheus metrics collection and exposure
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus metrics manager
 */
export class PrometheusMetrics {
  private registry: Registry;
  private httpRequestDuration: Histogram<string>;
  private httpRequestTotal: Counter<string>;
  private activeConnections: Gauge<string>;
  private errorTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'gati_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    // HTTP request counter
    this.httpRequestTotal = new Counter({
      name: 'gati_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // Active connections gauge
    this.activeConnections = new Gauge({
      name: 'gati_active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });

    // Error counter
    this.errorTotal = new Counter({
      name: 'gati_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'route'],
      registers: [this.registry],
    });
  }

  /**
   * Record HTTP request
   */
  recordRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration
    );
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
  }

  /**
   * Increment active connections
   */
  incrementConnections(): void {
    this.activeConnections.inc();
  }

  /**
   * Decrement active connections
   */
  decrementConnections(): void {
    this.activeConnections.dec();
  }

  /**
   * Record error
   */
  recordError(type: string, route: string): void {
    this.errorTotal.inc({ type, route });
  }

  /**
   * Create custom counter
   */
  createCounter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    return new Counter({
      name: `gati_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create custom gauge
   */
  createGauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    return new Gauge({
      name: `gati_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create custom histogram
   */
  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[]
  ): Histogram<string> {
    return new Histogram({
      name: `gati_${name}`,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get registry
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

/**
 * Prometheus middleware for Express/HTTP servers
 */
export function createPrometheusMiddleware(metrics: PrometheusMetrics) {
  return (req: any, res: any, next: any) => {
    metrics.incrementConnections();
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      metrics.recordRequest(
        req.method,
        req.route?.path || req.path || 'unknown',
        res.statusCode,
        duration
      );
      metrics.decrementConnections();
    });

    next();
  };
}
