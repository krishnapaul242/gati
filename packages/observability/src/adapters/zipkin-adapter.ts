import type { ITracingProvider, ISpan } from '@gati-framework/contracts';

export interface ZipkinConfig {
  serviceName: string;
  endpoint?: string;
  sampleRate?: number;
}

class ZipkinSpan implements ISpan {
  private tracer: any;
  private span: any;

  constructor(tracer: any, span: any) {
    this.tracer = tracer;
    this.span = span;
  }

  get spanId(): string {
    return this.span.id;
  }

  get traceId(): string {
    return this.span.traceId;
  }

  setAttribute(key: string, value: any): void {
    this.span.tag(key, String(value));
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    this.span.annotate(name, attributes ? JSON.stringify(attributes) : undefined);
  }

  recordException(error: Error): void {
    this.span.tag('error', 'true');
    this.span.tag('error.message', error.message);
    this.span.tag('error.stack', error.stack || '');
  }

  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    if (status.code === 'ERROR') {
      this.span.tag('error', 'true');
      if (status.message) {
        this.span.tag('error.message', status.message);
      }
    }
  }

  end(): void {
    this.span.finish();
  }
}

export class ZipkinAdapter implements ITracingProvider {
  private tracer: any;
  private recorder: any;

  constructor(config: ZipkinConfig) {
    const { Tracer, BatchRecorder, jsonEncoder } = require('zipkin');
    const { HttpLogger } = require('zipkin-transport-http');

    const httpLogger = new HttpLogger({
      endpoint: config.endpoint || 'http://localhost:9411/api/v2/spans',
      jsonEncoder: jsonEncoder.JSON_V2,
    });

    this.recorder = new BatchRecorder({ logger: httpLogger });
    
    const { Sampler } = require('zipkin');
    const sampler = new Sampler.CountingSampler(config.sampleRate ?? 1.0);

    this.tracer = new Tracer({
      ctxImpl: require('zipkin-context-cls'),
      recorder: this.recorder,
      sampler,
      localServiceName: config.serviceName,
    });
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const id = this.tracer.createChildId();
    this.tracer.setId(id);
    
    const span = this.tracer.local(name);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.tag(key, String(value));
      });
    }

    return new ZipkinSpan(this.tracer, span);
  }

  async withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    return this.tracer.local(name, async () => {
      const id = this.tracer.id;
      const span = { id, traceId: id.traceId, tag: (k: string, v: string) => this.tracer.recordBinary(k, v), annotate: (n: string) => this.tracer.recordAnnotation(n), finish: () => {} };
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          this.tracer.recordBinary(key, String(value));
        });
      }

      const wrappedSpan = new ZipkinSpan(this.tracer, span);

      try {
        return await fn(wrappedSpan);
      } catch (error) {
        wrappedSpan.recordException(error as Error);
        wrappedSpan.setStatus({ code: 'ERROR', message: (error as Error).message });
        throw error;
      }
    });
  }

  getTraceContext(): string | undefined {
    const id = this.tracer.id;
    return id ? `${id.traceId}-${id.spanId}` : undefined;
  }
}
