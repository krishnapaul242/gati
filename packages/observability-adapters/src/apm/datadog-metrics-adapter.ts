import type { IMetricsProvider } from '@gati-framework/contracts';

export interface DatadogMetricsConfig {
  apiKey: string;
  site?: string;
  prefix?: string;
  tags?: string[];
}

export class DatadogMetricsAdapter implements IMetricsProvider {
  private client: any;
  private prefix: string;
  private tags: string[];

  constructor(config: DatadogMetricsConfig) {
    const ddTrace = require('dd-trace');
    this.client = ddTrace.init({
      env: process.env.DD_ENV || 'production',
      service: process.env.DD_SERVICE || 'gati-app',
      version: process.env.DD_VERSION || '1.0.0',
    });
    this.prefix = config.prefix || '';
    this.tags = config.tags || [];
  }

  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    const metricName = this.prefix + name;
    const tags = this.buildTags(labels);
    this.client.dogstatsd.increment(metricName, value, tags);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = this.prefix + name;
    const tags = this.buildTags(labels);
    this.client.dogstatsd.gauge(metricName, value, tags);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = this.prefix + name;
    const tags = this.buildTags(labels);
    this.client.dogstatsd.histogram(metricName, value, tags);
  }

  async getMetrics(): Promise<string> {
    return JSON.stringify({ provider: 'datadog', prefix: this.prefix });
  }

  private buildTags(labels?: Record<string, string>): string[] {
    const labelTags = labels ? Object.entries(labels).map(([k, v]) => `${k}:${v}`) : [];
    return [...this.tags, ...labelTags];
  }
}
