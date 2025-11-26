import { SentryAdapter } from '../error-tracking/index.js';
import type { ILogger, ITracingProvider } from '@gati-framework/contracts';

export interface SentryPresetConfig {
  dsn: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

export interface SentryProviders {
  logging: ILogger;
  tracing: ITracingProvider;
}

export function createSentryPreset(config: SentryPresetConfig): SentryProviders {
  const adapter = new SentryAdapter(config);
  
  return {
    logging: adapter,
    tracing: adapter,
  };
}
