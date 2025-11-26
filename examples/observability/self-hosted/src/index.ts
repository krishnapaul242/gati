import { createSelfHostedPreset } from '@gati-framework/observability-adapters/presets';
import type { Handler } from '@gati-framework/runtime';

// Initialize self-hosted observability stack
const observability = createSelfHostedPreset({
  prometheusPort: 9090,
  jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  lokiEndpoint: process.env.LOKI_ENDPOINT || 'http://localhost:3100',
});

export const handler: Handler = async (req, res, gctx) => {
  const span = gctx.tracing.startSpan('handle-request');
  
  try {
    gctx.metrics.incrementCounter('requests_total', { endpoint: req.path });
    
    const startTime = Date.now();
    const result = { message: 'Hello from self-hosted stack' };
    const duration = Date.now() - startTime;
    
    gctx.metrics.recordHistogram('request_duration_ms', duration);
    gctx.logger.info('Request completed', { duration, path: req.path });
    
    res.json(result);
  } catch (error) {
    gctx.logger.error('Request failed', { error });
    res.status(500).json({ error: 'Internal error' });
  } finally {
    span.end();
  }
};
