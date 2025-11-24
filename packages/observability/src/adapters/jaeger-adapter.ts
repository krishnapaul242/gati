import type { ITracingProvider, ISpan } from '@gati-framework/contracts';

export interface JaegerConfig {
  serviceName: string;
  agentHost?: string;
  agentPort?: number;
  samplerType?: 'const' | 'probabilistic' | 'ratelimiting';
  samplerParam?: number;
}

class JaegerSpan implements ISpan {
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
    this.span.log({ event: name, ...attributes });
  }

  recordException(error: Error): void {
    this.span.setTag('error', true);
    this.span.log({ event: 'error', 'error.object': error, message: error.message, stack: error.stack });
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

export class JaegerAdapter implements ITracingProvider {
  private tracer: any;

  constructor(config: JaegerConfig) {
    const initJaegerTracer = require('jaeger-client').initTracer;
    
    const jaegerConfig = {
      serviceName: config.serviceName,
      sampler: {
        type: config.samplerType || 'const',
        param: config.samplerParam ?? 1,
      },
      reporter: {
        agentHost: config.agentHost || 'localhost',
        agentPort: config.agentPort || 6832,
      },
    };

    this.tracer = initJaegerTracer(jaegerConfig, {});
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const span = this.tracer.startSpan(name);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setTag(key, value);
      });
    }

    return new JaegerSpan(span);
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

    const wrappedSpan = new JaegerSpan(span);

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
    return `${context.toTraceId()}:${context.toSpanId()}`;
  }
}
