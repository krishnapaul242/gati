import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  // Log request
  gctx.logger.info('Demo request received', {
    requestId: lctx.requestId,
    path: req.path,
    method: req.method,
  });

  // Increment request counter
  gctx.metrics.incrementCounter('demo_requests_total', {
    endpoint: '/demo',
    method: req.method,
  });

  // Trace the operation
  await gctx.tracing.withSpan('demo-handler', async (span) => {
    span.setAttribute('request.id', lctx.requestId);
    span.setAttribute('request.path', req.path);

    const start = Date.now();

    // Simulate some work
    await simulateWork(gctx);

    const duration = Date.now() - start;

    // Record duration histogram
    gctx.metrics.recordHistogram('demo_request_duration_ms', duration, {
      endpoint: '/demo',
    });

    span.setAttribute('duration.ms', duration);
    span.setStatus('ok');

    gctx.logger.info('Demo request completed', {
      requestId: lctx.requestId,
      duration,
    });

    res.json({
      message: 'Observability demo',
      requestId: lctx.requestId,
      duration,
      observability: {
        metrics: 'Prometheus',
        tracing: 'OpenTelemetry',
        logging: 'Pino',
      },
    });
  });
};

async function simulateWork(gctx: any): Promise<void> {
  await gctx.tracing.withSpan('database-query', async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', 'SELECT');

    // Simulate DB query
    await new Promise((resolve) => setTimeout(resolve, 50));

    gctx.metrics.incrementCounter('db_queries_total', {
      operation: 'SELECT',
    });

    span.setStatus('ok');
  });

  await gctx.tracing.withSpan('cache-lookup', async (span) => {
    span.setAttribute('cache.system', 'redis');

    // Simulate cache lookup
    await new Promise((resolve) => setTimeout(resolve, 10));

    gctx.metrics.incrementCounter('cache_operations_total', {
      operation: 'GET',
      result: 'hit',
    });

    span.setStatus('ok');
  });
}
