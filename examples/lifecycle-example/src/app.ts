/**
 * @module examples/lifecycle-example
 * @description Example showing comprehensive lifecycle management in distributed Gati applications
 */

import { createApp } from '@gati-framework/runtime';
import { LifecyclePriority, RequestPhase } from '@gati-framework/runtime';

// Create Gati app with distributed configuration
const app = createApp({
  port: 3000,
  instance: {
    id: `instance-${Date.now()}`,
    region: 'us-east-1',
    zone: 'us-east-1a',
  },
  tracing: {
    enabled: true,
    serviceName: 'gati-lifecycle-example',
  },
});

const gctx = app.getGlobalContext();

// Register startup hooks with priorities
gctx.lifecycle.onStartup('database', async () => {
  console.log('🗄️  Connecting to database...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ Database connected');
}, LifecyclePriority.CRITICAL);

gctx.lifecycle.onStartup('cache', async () => {
  console.log('🚀 Connecting to Redis cache...');
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('✅ Cache connected');
}, LifecyclePriority.HIGH);

// Register health checks
gctx.lifecycle.onHealthCheck('database', async () => {
  const isHealthy = Math.random() > 0.1;
  return {
    status: isHealthy ? 'pass' : 'fail',
    message: isHealthy ? 'Database responsive' : 'Database connection timeout',
  };
});

// Register shutdown hooks
gctx.lifecycle.onShutdown('close-connections', async () => {
  console.log('🔌 Closing database connections...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('✅ Database connections closed');
}, LifecyclePriority.HIGH);

// Health check endpoint
app.get('/health', async (_req, res, gctx) => {
  const healthStatus = await gctx.lifecycle.executeHealthChecks();
  res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
});

// Example handler with request lifecycle
app.get('/api/example', async (req, res, _gctx, lctx) => {
  lctx.lifecycle.onCleanup('request-cleanup', async () => {
    console.log(`🧹 Cleaning up request ${lctx.requestId}`);
  });

  lctx.lifecycle.onPhaseChange((phase, previousPhase) => {
    console.log(`📋 Request ${lctx.requestId}: ${previousPhase} → ${phase}`);
  });

  lctx.lifecycle.setPhase(RequestPhase.PROCESSING);
  await new Promise(resolve => setTimeout(resolve, 500));
  lctx.lifecycle.setPhase(RequestPhase.COMPLETED);

  res.json({
    message: 'Request processed successfully',
    requestId: lctx.requestId,
    traceId: lctx.traceId,
    duration: Date.now() - lctx.meta.startTime,
  });
});

// Start application
async function start() {
  try {
    await gctx.lifecycle.executeStartup();
    await app.listen();
    console.log('🚀 Lifecycle example started');
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    await gctx.lifecycle.executeShutdown();
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown failed:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();