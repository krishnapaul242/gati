import { NewRelicAdapter } from '../apm/index.js';
import type { IMetricsProvider, ITracingProvider } from '@gati-framework/contracts';

export interface NewRelicPresetConfig {
  licenseKey: string;
  appName: string;
  logLevel?: string;
}

export interface NewRelicProviders {
  metrics: IMetricsProvider;
  tracing: ITracingProvider;
}

export function createNewRelicPreset(config: NewRelicPresetConfig): NewRelicProviders {
  const adapter = new NewRelicAdapter(config);
  
  return {
    metrics: adapter,
    tracing: adapter,
  };
}
