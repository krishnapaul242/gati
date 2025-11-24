import { CloudWatchClient, PutMetricDataCommand, MetricDatum, StandardUnit } from '@aws-sdk/client-cloudwatch';
import type { IMetricsProvider } from '@gati-framework/contracts';

export interface CloudWatchMetricsConfig {
  region: string;
  namespace: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class CloudWatchMetricsAdapter implements IMetricsProvider {
  private client: CloudWatchClient;
  private namespace: string;
  private buffer: MetricDatum[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(config: CloudWatchMetricsConfig) {
    this.client = new CloudWatchClient({
      region: config.region,
      credentials: config.credentials,
    });
    this.namespace = config.namespace;
    
    this.flushInterval = setInterval(() => this.flush(), 60000);
  }

  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    this.buffer.push({
      MetricName: name,
      Value: value,
      Unit: StandardUnit.Count,
      Timestamp: new Date(),
      Dimensions: labels ? Object.entries(labels).map(([k, v]) => ({ Name: k, Value: v })) : undefined,
    });
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.buffer.push({
      MetricName: name,
      Value: value,
      Unit: StandardUnit.None,
      Timestamp: new Date(),
      Dimensions: labels ? Object.entries(labels).map(([k, v]) => ({ Name: k, Value: v })) : undefined,
    });
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.buffer.push({
      MetricName: name,
      Value: value,
      Unit: StandardUnit.Milliseconds,
      Timestamp: new Date(),
      Dimensions: labels ? Object.entries(labels).map(([k, v]) => ({ Name: k, Value: v })) : undefined,
    });
  }

  async getMetrics(): Promise<string> {
    return JSON.stringify({ namespace: this.namespace, buffered: this.buffer.length });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, 1000);
    try {
      await this.client.send(new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: batch,
      }));
    } catch (error) {
      console.error('Failed to send metrics to CloudWatch:', error);
      this.buffer.unshift(...batch);
    }
  }

  async shutdown(): Promise<void> {
    clearInterval(this.flushInterval);
    await this.flush();
  }
}
