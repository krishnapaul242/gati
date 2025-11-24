/**
 * @module observability/tracing
 * @description Distributed tracing with OpenTelemetry
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import * as api from '@opentelemetry/api';

/**
 * Tracing configuration
 */
export interface TracingConfig {
  /** Service name */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Environment (production, staging, etc.) */
  environment?: string;
  /** Enable auto-instrumentation */
  autoInstrument?: boolean;
  /** Metrics port for Prometheus exporter */
  metricsPort?: number;
}

/**
 * Distributed tracing manager
 */
export class DistributedTracing {
  private sdk?: NodeSDK;
  private tracer: api.Tracer;

  constructor(config: TracingConfig) {
    // Create resource with service information
    const resource = resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
      'service.version': config.serviceVersion || '1.0.0',
      'deployment.environment': config.environment || 'production',
    });

    // Initialize OpenTelemetry SDK
    if (config.autoInstrument !== false) {
      this.sdk = new NodeSDK({
        resource,
      });

      this.sdk.start();
    }

    // Get tracer instance
    this.tracer = api.trace.getTracer(
      config.serviceName,
      config.serviceVersion || '1.0.0'
    );
  }

  /**
   * Create a new span
   */
  createSpan(name: string, attributes?: api.Attributes): api.Span {
    return this.tracer.startSpan(name, {
      attributes,
    });
  }

  /**
   * Create a span and execute function within its context
   */
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

  /**
   * Add event to current span
   */
  addEvent(name: string, attributes?: api.Attributes): void {
    const span = api.trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set attribute on current span
   */
  setAttribute(key: string, value: api.AttributeValue): void {
    const span = api.trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * Record exception on current span
   */
  recordException(error: Error): void {
    const span = api.trace.getActiveSpan();
    if (span) {
      span.recordException(error);
    }
  }

  /**
   * Get current trace context
   */
  getTraceContext(): string | undefined {
    const span = api.trace.getActiveSpan();
    if (!span) return undefined;

    const spanContext = span.spanContext();
    return `${spanContext.traceId}-${spanContext.spanId}`;
  }

  /**
   * Shutdown tracing
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }
}

/**
 * Create tracing middleware for HTTP requests
 */
export function createTracingMiddleware(tracing: DistributedTracing) {
  return (req: any, res: any, next: any) => {
    const span = tracing.createSpan(`HTTP ${req.method} ${req.path}`, {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route?.path || req.path,
    });

    // Add trace context to response headers
    const traceContext = tracing.getTraceContext();
    if (traceContext) {
      res.setHeader('X-Trace-Id', traceContext);
    }

    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);
      
      if (res.statusCode >= 400) {
        span.setStatus({
          code: api.SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: api.SpanStatusCode.OK });
      }

      span.end();
    });

    next();
  };
}
