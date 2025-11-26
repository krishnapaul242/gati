import { DatadogMetricsAdapter, DatadogAPMAdapter } from '../apm/index.js';
import type { IMetricsProvider, ITracingProvider } from '@gati-framework/contracts';

export interface DatadogPresetConfig {
  apiKey: string;
  service: string;
  env?: string;
  version?: string;
  site?: string;
  prefix?: string;
  tags?: string[];
}

export interface DatadogProviders {
  metrics: IMetricsProvider;
  tracing: ITracingProvider;
}

export function createDatadogPreset(config: DatadogPresetConfig): DatadogProviders {
  return {
    metrics: new DatadogMetricsAdapter({
      apiKey: config.apiKey,
      site: config.site,
      prefix: config.prefix,
      tags: config.tags,
    }),
    tracing: new DatadogAPMAdapter({
      service: config.service,
      env: config.env,
      version: config.version,
    }),
  };
}
