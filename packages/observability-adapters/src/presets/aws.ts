import { CloudWatchMetricsAdapter, CloudWatchLogsAdapter, XRayAdapter } from '../aws/index.js';
import type { IMetricsProvider, ILogger, ITracingProvider } from '@gati-framework/contracts';

export interface AWSPresetConfig {
  region: string;
  namespace: string;
  logGroupName: string;
  logStreamName: string;
  serviceName: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface ObservabilityProviders {
  metrics: IMetricsProvider;
  logging: ILogger;
  tracing: ITracingProvider;
}

export function createAWSPreset(config: AWSPresetConfig): ObservabilityProviders {
  return {
    metrics: new CloudWatchMetricsAdapter({
      region: config.region,
      namespace: config.namespace,
      credentials: config.credentials,
    }),
    logging: new CloudWatchLogsAdapter({
      region: config.region,
      logGroupName: config.logGroupName,
      logStreamName: config.logStreamName,
      credentials: config.credentials,
    }),
    tracing: new XRayAdapter({
      serviceName: config.serviceName,
    }),
  };
}
