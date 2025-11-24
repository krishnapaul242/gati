import type { ITracingProvider, ISpan } from '@gati-framework/contracts';

export interface DatadogAPMConfig {
  service: string;
  env?: string;
  version?: string;
  hostname?: string;
  port?: number;
}

class DatadogSpan implements ISpan {
  private span: any;

  constructor(span: any) {
    this.span = span;
  }

  get spanId(): string {
    return this.span.context().toSpanId();
  }

  get traceId(): string {
    return this.span.context().toTraceId();
  }

  setAttribute(key: string, value: any): void {
    this.span.setTag(key, value);
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    this.span.setTag(`event.${name}`, JSON.stringify(attributes || {}));
  }

  recordException(error: Error): void {
    this.span.setTag('error', true);
    this.span.setTag('error.message', error.message);
    this.span.setTag('error.stack', error.stack);
  }

  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    if (status.code === 'ERROR') {
      this.span.setTag('error', true);
      if (status.message) {
        this.span.setTag('error.message', status.message);
      }
    }
  }

  end(): void {
    this.span.finish();
  }
}

export class DatadogAPMAdapter implements ITracingProvider {
  private tracer: any;

  constructor(config: DatadogAPMConfig) {
    const ddTrace = require('dd-trace');
    this.tracer = ddTrace.init({
      service: config.service,
      env: config.env || 'production',
      version: config.version || '1.0.0',
      hostname: config.hostname,
      port: config.port,
    });
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const span = this.tracer.startSpan(name);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setTag(key, value);
      });
    }

    return new DatadogSpan(span);
  }

  async withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.tracer.startSpan(name);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setTag(key, value);
      });
    }

    const wrappedSpan = new DatadogSpan(span);

    try {
      const result = await fn(wrappedSpan);
      wrappedSpan.end();
      return result;
    } catch (error) {
      wrappedSpan.recordException(error as Error);
      wrappedSpan.setStatus({ code: 'ERROR', message: (error as Error).message });
      wrappedSpan.end();
      throw error;
    }
  }

  getTraceContext(): string | undefined {
    const span = this.tracer.scope().active();
    if (!span) return undefined;
    
    const context = span.context();
    return `${context.toTraceId()}-${context.toSpanId()}`;
  }
}
