import * as AWSXRay from 'aws-xray-sdk-core';
import type { ITracingProvider, ISpan } from '@gati-framework/contracts';

export interface XRayConfig {
  serviceName: string;
  daemonAddress?: string;
  plugins?: string[];
}

class XRaySpan implements ISpan {
  private segment: any;

  constructor(segment: any) {
    this.segment = segment;
  }

  get spanId(): string {
    return this.segment.id;
  }

  get traceId(): string {
    return this.segment.trace_id;
  }

  setAttribute(key: string, value: any): void {
    this.segment.addAnnotation(key, value);
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    this.segment.addMetadata(name, attributes || {});
  }

  recordException(error: Error): void {
    this.segment.addError(error);
  }

  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    if (status.code === 'ERROR') {
      this.segment.addError(new Error(status.message || 'Unknown error'));
    }
  }

  end(): void {
    this.segment.close();
  }
}

export class XRayAdapter implements ITracingProvider {
  constructor(config: XRayConfig) {
    AWSXRay.setContextMissingStrategy('LOG_ERROR');
    
    if (config.daemonAddress) {
      AWSXRay.setDaemonAddress(config.daemonAddress);
    }

    if (config.plugins) {
      config.plugins.forEach(plugin => {
        if (plugin === 'EC2Plugin') AWSXRay.config([AWSXRay.plugins.EC2Plugin]);
        if (plugin === 'ECSPlugin') AWSXRay.config([AWSXRay.plugins.ECSPlugin]);
        if (plugin === 'ElasticBeanstalkPlugin') AWSXRay.config([AWSXRay.plugins.ElasticBeanstalkPlugin]);
      });
    }
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const segment = new AWSXRay.Segment(name);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        segment.addAnnotation(key, value);
      });
    }

    return new XRaySpan(segment);
  }

  async withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const segment = new AWSXRay.Segment(name);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        segment.addAnnotation(key, value);
      });
    }

    const span = new XRaySpan(segment);

    try {
      const result = await fn(span);
      span.end();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 'ERROR', message: (error as Error).message });
      span.end();
      throw error;
    }
  }

  getTraceContext(): string | undefined {
    const segment = AWSXRay.getSegment();
    return segment ? `Root=${segment.trace_id};Parent=${segment.id};Sampled=1` : undefined;
  }
}
