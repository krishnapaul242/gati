import { createAWSPreset } from '@gati-framework/observability-adapters/presets';
import type { Handler } from '@gati-framework/runtime';

// Initialize AWS observability stack
const observability = createAWSPreset({
  region: process.env.AWS_REGION || 'us-east-1',
  namespace: 'gati-production',
  logGroup: '/aws/gati/production',
  xrayDaemonAddress: process.env.XRAY_DAEMON_ADDRESS,
});

export const handler: Handler = async (req, res, gctx) => {
  const span = gctx.tracing.startSpan('process-request');
  
  try {
    gctx.metrics.incrementCounter('api_requests_total', {
      method: req.method,
      path: req.path,
    });

    const result = await processRequest(req);

    gctx.metrics.incrementCounter('api_requests_success');
    gctx.logger.info('Request processed', { userId: result.userId });

    res.json(result);
  } catch (error) {
    gctx.metrics.incrementCounter('api_requests_error');
    gctx.logger.error('Request failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
};

async function processRequest(req: any) {
  return { userId: '123', status: 'success' };
}
