/**
 * @module runtime/metrics-client
 * @description Metrics and observability client for Gati runtime
 */

import * as api from '@opentelemetry/api';
import { logger } from './logger.js';

/**
 * Simple metrics interface for basic metric types
 */
interface SimpleMetrics {
  createCounter(name: string, help: string, labelNames?: string[]): any;
  createGauge(name: string, help: string, labelNames?: string[]): any;
  createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): any;
}

/**
 * Metrics client interface for runtime components
 */
export interface MetricsClient {
  /** Increment a counter metric */
  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;
  
  /** Set a gauge metric value */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  
  /** Record a histogram observation */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  
  /** Create a new span for tracing */
  createSpan(name: string, attributes?: api.Attributes): api.Span;
  
  /** Execute function within a span context */
  withSpan<T>(name: string, fn: (span: api.Span) => Promise<T>, attributes?: api.Attributes): Promise<T>;
  
  /** Log structured message with request context */
  logWithContext(level: 'info' | 'warn' | 'error', message: string, context: Record<string, any>): void;
  
  /** Record audit event */
  recordAudit(event: string, context: AuditContext): void;
}

/**
 * Audit context for security logging
 */
export interface AuditContext {
  requestId: string;
  handlerId?: string;
  version?: string;
  userId?: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure' | 'denied';
  metadata?: Record<string, any>;
}

/**
 * Runtime metrics client implementation
 */
export class RuntimeMetricsClient implements MetricsClient {
  private tracer: api.Tracer;
  private metrics?: SimpleMetrics;
  private counters = new Map<string, any>();
  private gauges = new Map<string, any>();
  private histograms = new Map<string, any>();

  constructor(
    private serviceName: string = 'gati-runtime',
    private serviceVersion: string = '1.0.0'
  ) {
    this.tracer = api.trace.getTracer(serviceName, serviceVersion);
    
    // Initialize simple metrics implementation
    this.metrics = {
      createCounter: (name: string, help: string, labelNames: string[] = []) => ({
        inc: (labels: Record<string, string> = {}, value: number = 1) => {
          logger.debug('Counter incremented', { name, labels, value });
        }
      }),
      createGauge: (name: string, help: string, labelNames: string[] = []) => ({
        set: (labels: Record<string, string> = {}, value: number) => {
          logger.debug('Gauge set', { name, labels, value });
        }
      }),
      createHistogram: (name: string, help: string, labelNames: string[] = [], buckets?: number[]) => ({
        observe: (labels: Record<string, string> = {}, value: number) => {
          logger.debug('Histogram observed', { name, labels, value });
        }
      })
    };
  }

  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = `${name}_${JSON.stringify(labels)}`;
    
    if (!this.counters.has(key) && this.metrics) {
      const labelNames = Object.keys(labels);
      this.counters.set(key, this.metrics.createCounter(name, `Counter for ${name}`, labelNames));
    }
    
    const counter = this.counters.get(key);
    if (counter) {
      counter.inc(labels, value);
    }
    
    logger.debug('Counter incremented', { name, labels, value });
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}_${JSON.stringify(labels)}`;
    
    if (!this.gauges.has(key) && this.metrics) {
      const labelNames = Object.keys(labels);
      this.gauges.set(key, this.metrics.createGauge(name, `Gauge for ${name}`, labelNames));
    }
    
    const gauge = this.gauges.get(key);
    if (gauge) {
      gauge.set(labels, value);
    }
    
    logger.debug('Gauge set', { name, labels, value });
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}_${JSON.stringify(labels)}`;
    
    if (!this.histograms.has(key) && this.metrics) {
      const labelNames = Object.keys(labels);
      this.histograms.set(key, this.metrics.createHistogram(name, `Histogram for ${name}`, labelNames));
    }
    
    const histogram = this.histograms.get(key);
    if (histogram) {
      histogram.observe(labels, value);
    }
    
    logger.debug('Histogram recorded', { name, labels, value });
  }

  createSpan(name: string, attributes?: api.Attributes): api.Span {
    return this.tracer.startSpan(name, { attributes });
  }

  async withSpan<T>(
    name: string,
    fn: (span: api.Span) => Promise<T>,
    attributes?: api.Attributes
  ): Promise<T> {
    const span = this.createSpan(name, attributes);
    
    try {
      const result = await api.context.with(
        api.trace.setSpan(api.context.active(), span),
        async () => await fn(span)
      );
      
      span.setStatus({ code: api.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: api.SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  logWithContext(level: 'info' | 'warn' | 'error', message: string, context: Record<string, any>): void {
    const span = api.trace.getActiveSpan();
    const traceContext = span ? {
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
    } : {};
    
    logger[level](message, { ...context, ...traceContext });
  }

  recordAudit(event: string, context: AuditContext): void {
    const auditLog = {
      timestamp: new Date().toISOString(),
      event,
      requestId: context.requestId,
      handlerId: context.handlerId,
      version: context.version,
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      result: context.result,
      metadata: context.metadata,
    };
    
    logger.info('Audit event', auditLog);
    
    // Increment audit counter
    this.incrementCounter('audit_events_total', {
      event,
      action: context.action,
      result: context.result,
    });
  }
}

/**
 * Default metrics client instance
 */
export const metricsClient = new RuntimeMetricsClient();