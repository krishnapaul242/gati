/**
 * @module observability/adapters/opentelemetry
 * @description OpenTelemetry adapter implementing ITracingProvider contract
 */

import type { ITracingProvider, ISpan } from '@gati-framework/contracts';
import { DistributedTracing } from '../tracing/distributed-tracing.js';
import * as api from '@opentelemetry/api';

/**
 * Span wrapper implementing ISpan contract
 */
class SpanAdapter implements ISpan {
  constructor(private span: api.Span) {}

  get spanId(): string {
    return this.span.spanContext().spanId;
  }

  get traceId(): string {
    return this.span.spanContext().traceId;
  }

  setAttribute(key: string, value: any): void {
    this.span.setAttribute(key, value);
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    this.span.addEvent(name, attributes);
  }

  recordException(error: Error): void {
    this.span.recordException(error);
  }

  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    this.span.setStatus({
      code: status.code === 'OK' ? api.SpanStatusCode.OK : api.SpanStatusCode.ERROR,
      message: status.message,
    });
  }

  end(): void {
    this.span.end();
  }
}

/**
 * OpenTelemetry adapter for distributed tracing
 */
export class OpenTelemetryAdapter implements ITracingProvider {
  private tracing: DistributedTracing;

  constructor(config: { serviceName: string; serviceVersion?: string; environment?: string; autoInstrument?: boolean; metricsPort?: number }) {
    this.tracing = new DistributedTracing(config);
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const span = this.tracing.createSpan(name, attributes);
    return new SpanAdapter(span);
  }

  async withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    return this.tracing.withSpan(name, async (otelSpan) => {
      const span = new SpanAdapter(otelSpan);
      return fn(span);
    }, attributes);
  }

  getTraceContext(): string | undefined {
    return this.tracing.getTraceContext();
  }

  /**
   * Get the underlying DistributedTracing instance
   */
  getDistributedTracing(): DistributedTracing {
    return this.tracing;
  }
}
