/**
 * @module runtime/e2e-integration
 * @description End-to-end integration connecting all runtime components
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { createIngress } from './ingress.js';
import { createQueueFabric } from './queue-fabric.js';
import { RouteManager } from './route-manager.js';
import { HookOrchestrator } from './hook-orchestrator.js';
import { executeHandler } from './handler-engine.js';
import { createGlobalContext } from './global-context.js';
import { createLocalContext } from './local-context.js';
import { createRequest } from './request.js';
import { createResponse } from './response.js';
import { logger } from './logger.js';
import type { Handler } from './types/handler.js';
import type { RequestDescriptor, IngressConfig } from './types/ingress.js';
import type { QueueFabricConfig } from './types/queue-fabric.js';
import type { GlobalContext } from './types/context.js';

/**
 * E2E Integration configuration
 */
export interface E2EIntegrationConfig {
  ingress?: IngressConfig;
  queueFabric?: QueueFabricConfig;
  globalContext?: Parameters<typeof createGlobalContext>[0];
}

/**
 * E2E Integration instance
 */
export interface E2EIntegration {
  handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
  registerHandler(method: string, path: string, handler: Handler): void;
  shutdown(): Promise<void>;
  getGlobalContext(): GlobalContext;
}

/**
 * Create an end-to-end integration instance
 */
export function createE2EIntegration(config: E2EIntegrationConfig = {}): E2EIntegration {
  // Create queue fabric
  const queueFabric = createQueueFabric(config.queueFabric);

  // Create ingress
  const ingress = createIngress(
    {
      authMethod: 'none',
      requireAuth: false,
      routingTopic: 'routing',
      ...config.ingress,
    },
    queueFabric
  );

  // Create route manager
  const routeManager = new RouteManager();

  // Create global context
  const gctx = createGlobalContext(config.globalContext);

  // Subscribe to routing topic
  queueFabric.subscribe<RequestDescriptor>('routing', async (descriptor, metadata) => {
    logger.info({ requestId: descriptor.requestId, path: descriptor.path }, 'Processing request');

    try {
      // Match route
      const match = routeManager.match(descriptor.method as any, descriptor.path);
      if (!match) {
        logger.warn({ path: descriptor.path, method: descriptor.method }, 'No route matched');
        return;
      }

      // Create local context
      const lctx = createLocalContext({
        requestId: descriptor.requestId,
        meta: {
          timestamp: descriptor.timestamp,
          method: descriptor.method,
          path: descriptor.path,
        },
      });

      // Create request and response objects
      const req = createRequest({
        method: descriptor.method,
        url: descriptor.path,
        headers: descriptor.headers,
        body: descriptor.body,
        params: match.params,
      });

      const res = createResponse();

      // Create hook orchestrator for LCC
      const hookOrchestrator = new HookOrchestrator();

      // Execute before hooks
      await hookOrchestrator.executeBefore(req, res, gctx, lctx);

      // Execute handler
      await executeHandler(match.route.handler, req, res, gctx, lctx);

      // Execute after hooks
      await hookOrchestrator.executeAfter(req, res, gctx, lctx);

      // Deliver result back through queue fabric
      if (descriptor.requestId) {
        await queueFabric.deliverResult(descriptor.requestId, {
          status: res.getStatus(),
          headers: res.getHeaders(),
          body: res.getBody(),
        });
      }

      logger.info({ requestId: descriptor.requestId, status: res.getStatus() }, 'Request completed');
    } catch (error) {
      logger.error({ error, requestId: descriptor.requestId }, 'Request processing failed');
      
      // Deliver error result
      if (descriptor.requestId) {
        await queueFabric.deliverResult(descriptor.requestId, {
          status: 500,
          headers: {},
          body: { error: 'Internal server error' },
        });
      }
    }
  });

  return {
    async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
      try {
        // Generate request ID for result tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Register result handler
        queueFabric.registerResultHandler(requestId, (result) => {
          res.statusCode = result.status;
          for (const [key, value] of Object.entries(result.headers)) {
            res.setHeader(key, value as string);
          }
          res.end(JSON.stringify(result.body));
        });

        // Pass to ingress
        await ingress.handleRequest(req);
      } catch (error) {
        logger.error({ error }, 'Request handling failed');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    },

    registerHandler(method: string, path: string, handler: Handler): void {
      routeManager.register(method as any, path, handler);
    },

    async shutdown(): Promise<void> {
      await queueFabric.shutdown();
      await gctx.lifecycle.executeShutdown();
    },

    getGlobalContext(): GlobalContext {
      return gctx;
    },
  };
}
