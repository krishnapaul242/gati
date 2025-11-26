import { JaegerAdapter, ZipkinAdapter } from '../oss/index.js';
import type { ITracingProvider } from '@gati-framework/contracts';

export interface SelfHostedPresetConfig {
  serviceName: string;
  tracingProvider: 'jaeger' | 'zipkin';
  jaegerConfig?: {
    agentHost?: string;
    agentPort?: number;
    samplerType?: 'const' | 'probabilistic' | 'ratelimiting';
    samplerParam?: number;
  };
  zipkinConfig?: {
    endpoint?: string;
    sampleRate?: number;
  };
}

export interface SelfHostedProviders {
  tracing: ITracingProvider;
}

export function createSelfHostedPreset(config: SelfHostedPresetConfig): SelfHostedProviders {
  let tracing: ITracingProvider;

  if (config.tracingProvider === 'jaeger') {
    tracing = new JaegerAdapter({
      serviceName: config.serviceName,
      ...config.jaegerConfig,
    });
  } else {
    tracing = new ZipkinAdapter({
      serviceName: config.serviceName,
      ...config.zipkinConfig,
    });
  }

  return { tracing };
}
