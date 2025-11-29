/**
 * @module runtime/examples/e2e-integration-example
 * @description Example demonstrating end-to-end integration with observability
 */

import { createE2EIntegration } from '../e2e-integration.js';
import type { Handler } from '../types/handler.js';
import { createServer } from 'http';

/**
 * Example: Complete E2E integration with observability
 */
async function main() {
  // Create integration
  const integration = createE2EIntegration({
    ingress: {
      authMethod: 'none',
      requireAuth: false,
      routingTopic: 'routing',
    },
    queueFabric: {
      maxQueueDepth: 1000,
      defaultDeliverySemantics: 'at-least-once',
    },
  });

  // Get global context for module registration
  const gctx = integration.getGlobalContext();

  // Register a database module
  gctx.modules['db'] = {
    async findUser(id: string) {
      return { id, name: 'John Doe', email: 'john@example.com' };
    },
    async createUser(data: any) {
      return { id: '123', ...data };
    },
  };

  // Register handlers
  const getUserHandler: Handler = async (req, res, gctx) => {
    const userId = req.params.id;
    
    // Track metrics
    gctx.metrics.incrementCounter('user_requests_total', { operation: 'get' });
    
    // Access module
    const user = await (gctx.modules['db'] as any).findUser(userId);
    
    res.json({ user });
  };

  const createUserHandler: Handler = async (req, res, gctx, lctx) => {
    // Track metrics
    gctx.metrics.incrementCounter('user_requests_total', { operation: 'create' });
    
    // Store in local context
    lctx.state['operation'] = 'create_user';
    
    // Access module
    const user = await (gctx.modules['db'] as any).createUser(req.body);
    
    res.status(201).json({ user });
  };

  const healthHandler: Handler = (req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  };

  // Register routes
  integration.registerHandler('GET', '/users/:id', getUserHandler);
  integration.registerHandler('POST', '/users', createUserHandler);
  integration.registerHandler('GET', '/health', healthHandler);

  // Create HTTP server
  const server = createServer((req, res) => {
    integration.handleRequest(req, res);
  });

  // Start server
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log('');
    console.log('Try these requests:');
    console.log(`  curl http://localhost:${PORT}/health`);
    console.log(`  curl http://localhost:${PORT}/users/123`);
    console.log(`  curl -X POST http://localhost:${PORT}/users -H "Content-Type: application/json" -d '{"name":"Jane","email":"jane@example.com"}'`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    server.close();
    await integration.shutdown();
    process.exit(0);
  });
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
