/**
 * @module observability/prometheus
 * @description Prometheus metrics collection and exposure
 */
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
/**
 * Prometheus metrics manager
 */
export class PrometheusMetrics {
    registry;
    httpRequestDuration;
    httpRequestTotal;
    activeConnections;
    errorTotal;
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
    recordRequest(method, route, statusCode, duration) {
        this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
        this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    }
    /**
     * Increment active connections
     */
    incrementConnections() {
        this.activeConnections.inc();
    }
    /**
     * Decrement active connections
     */
    decrementConnections() {
        this.activeConnections.dec();
    }
    /**
     * Record error
     */
    recordError(type, route) {
        this.errorTotal.inc({ type, route });
    }
    /**
     * Create custom counter
     */
    createCounter(name, help, labelNames = []) {
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
    createGauge(name, help, labelNames = []) {
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
    createHistogram(name, help, labelNames = [], buckets) {
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
    async getMetrics() {
        return this.registry.metrics();
    }
    /**
     * Get registry
     */
    getRegistry() {
        return this.registry;
    }
}
/**
 * Prometheus middleware for Express/HTTP servers
 */
export function createPrometheusMiddleware(metrics) {
    return (req, res, next) => {
        metrics.incrementConnections();
        const start = Date.now();
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            metrics.recordRequest(req.method, req.route?.path || req.path || 'unknown', res.statusCode, duration);
            metrics.decrementConnections();
        });
        next();
    };
}
//# sourceMappingURL=metrics.js.map