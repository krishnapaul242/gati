import { PrometheusAdapter } from '@gati-framework/observability/adapters';
import { JaegerAdapter } from '@gati-framework/observability-adapters/oss';
import { SentryAdapter } from '@gati-framework/observability-adapters/error-tracking';
import type { Handler } from '@gati-framework/runtime';

// Hybrid setup: Mix providers based on needs
const observability = {
  metrics: new PrometheusAdapter({ serviceName: 'hybrid-app' }),
  tracing: new JaegerAdapter({ 
    serviceName: 'hybrid-app',
    agentHost: process.env.JAEGER_HOST || 'localhost',
  }),
  logging: new SentryAdapter({ 
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  }),
};

export const handler: Handler = async (req, res, gctx) => {
  const span = gctx.tracing.startSpan('hybrid-request');
  
  try {
    // Cost-effective metrics with Prometheus
    gctx.metrics.incrementCounter('requests', { method: req.method });
    
    // Powerful tracing with Jaeger
    span.setAttributes({ userId: req.headers['x-user-id'] });
    
    const result = { hybrid: true, timestamp: Date.now() };
    
    // Specialized error tracking with Sentry
    gctx.logger.info('Request processed successfully');
    
    res.json(result);
  } catch (error) {
    // Sentry captures errors with full context
    gctx.logger.error('Request failed', { error });
    res.status(500).json({ error: 'Internal error' });
  } finally {
    span.end();
  }
};
