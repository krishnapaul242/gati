import type { GatiConfig } from '@gati-framework/core';
import { PrometheusAdapter, OpenTelemetryAdapter, PinoAdapter } from '@gati-framework/observability';

const config: GatiConfig = {
  app: {
    name: 'observability-demo',
    version: '1.0.0',
    port: 3000,
  },
  observability: {
    metricsProvider: new PrometheusAdapter(),
    tracingProvider: new OpenTelemetryAdapter({ 
      serviceName: 'observability-demo',
      endpoint: 'http://localhost:14268/api/traces'
    }),
    logger: new PinoAdapter({ 
      level: 'info',
      prettyPrint: true
    }),
  },
};

export default config;
