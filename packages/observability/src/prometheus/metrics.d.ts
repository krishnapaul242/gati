/**
 * @module observability/prometheus
 * @description Prometheus metrics collection and exposure
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
/**
 * Prometheus metrics manager
 */
export declare class PrometheusMetrics {
    private registry;
    private httpRequestDuration;
    private httpRequestTotal;
    private activeConnections;
    private errorTotal;
    constructor();
    /**
     * Record HTTP request
     */
    recordRequest(method: string, route: string, statusCode: number, duration: number): void;
    /**
     * Increment active connections
     */
    incrementConnections(): void;
    /**
     * Decrement active connections
     */
    decrementConnections(): void;
    /**
     * Record error
     */
    recordError(type: string, route: string): void;
    /**
     * Create custom counter
     */
    createCounter(name: string, help: string, labelNames?: string[]): Counter<string>;
    /**
     * Create custom gauge
     */
    createGauge(name: string, help: string, labelNames?: string[]): Gauge<string>;
    /**
     * Create custom histogram
     */
    createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string>;
    /**
     * Get metrics in Prometheus format
     */
    getMetrics(): Promise<string>;
    /**
     * Get registry
     */
    getRegistry(): Registry;
}
/**
 * Prometheus middleware for Express/HTTP servers
 */
export declare function createPrometheusMiddleware(metrics: PrometheusMetrics): (req: any, res: any, next: any) => void;
//# sourceMappingURL=metrics.d.ts.map