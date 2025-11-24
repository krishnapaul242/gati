import type { IMetricsProvider, ITracingProvider, ISpan } from '@gati-framework/contracts';

export interface NewRelicConfig {
  licenseKey: string;
  appName: string;
  logLevel?: string;
}

class NewRelicSpan implements ISpan {
  private segment: any;

  constructor(segment: any) {
    this.segment = segment;
  }

  get spanId(): string {
    return this.segment.id || 'unknown';
  }

  get traceId(): string {
    return this.segment.transaction?.id || 'unknown';
  }

  setAttribute(key: string, value: any): void {
    this.segment.addAttribute(key, value);
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    const newrelic = require('newrelic');
    newrelic.recordCustomEvent(name, attributes || {});
  }

  recordException(error: Error): void {
    const newrelic = require('newrelic');
    newrelic.noticeError(error);
  }

  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    if (status.code === 'ERROR') {
      this.segment.addAttribute('error', true);
      if (status.message) {
        this.segment.addAttribute('error.message', status.message);
      }
    }
  }

  end(): void {
    this.segment.end();
  }
}

export class NewRelicAdapter implements IMetricsProvider, ITracingProvider {
  private newrelic: any;

  constructor(config: NewRelicConfig) {
    process.env.NEW_RELIC_LICENSE_KEY = config.licenseKey;
    process.env.NEW_RELIC_APP_NAME = config.appName;
    process.env.NEW_RELIC_LOG_LEVEL = config.logLevel || 'info';
    
    this.newrelic = require('newrelic');
  }

  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    this.newrelic.recordMetric(name, value);
    if (labels) {
      this.newrelic.recordCustomEvent('Counter', { metric: name, value, ...labels });
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.newrelic.recordMetric(name, value);
    if (labels) {
      this.newrelic.recordCustomEvent('Gauge', { metric: name, value, ...labels });
    }
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.newrelic.recordMetric(name, value);
    if (labels) {
      this.newrelic.recordCustomEvent('Histogram', { metric: name, value, ...labels });
    }
  }

  async getMetrics(): Promise<string> {
    return JSON.stringify({ provider: 'newrelic' });
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const segment = this.newrelic.startSegment(name, true, () => {});
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        segment.addAttribute(key, value);
      });
    }

    return new NewRelicSpan(segment);
  }

  async withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    return this.newrelic.startSegment(name, true, async () => {
      const segment = this.newrelic.shim.getSegment();
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          segment.addAttribute(key, value);
        });
      }

      const span = new NewRelicSpan(segment);

      try {
        return await fn(span);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 'ERROR', message: (error as Error).message });
        throw error;
      }
    });
  }

  getTraceContext(): string | undefined {
    const transaction = this.newrelic.getTransaction();
    return transaction?.id;
  }
}
