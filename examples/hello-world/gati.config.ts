/**
 * @module examples/hello-world/gati.config
 * @description Gati configuration for Hello World example
 */

import type { GlobalContext } from '@gati-framework/runtime';
import { LifecyclePriority } from '@gati-framework/runtime';
import { helloHandler, helloNameHandler } from './src/handlers/hello.js';
import { getUserHandler, listUsersHandler } from './src/handlers/user.js';
import { initLogger } from './src/modules/logger.js';

/**
 * Gati application configuration
 */
export default {
  /**
   * Server configuration
   */
  server: {
    port: 3000,
    host: 'localhost',
  },

  /**
   * Route definitions
   * Maps HTTP method and path to handler functions
   */
  routes: [
    // Health check route
    {
      method: 'GET',
      path: '/health',
      handler: async (_req: any, res: any, gctx: any) => {
        const healthStatus = await gctx.lifecycle.executeHealthChecks();
        res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
      },
    },

    // Hello World routes
    {
      method: 'GET',
      path: '/hello',
      handler: helloHandler,
    },
    {
      method: 'GET',
      path: '/hello/name/:name',
      handler: helloNameHandler,
    },

    // User routes
    {
      method: 'GET',
      path: '/user/:id',
      handler: getUserHandler,
    },
    {
      method: 'GET',
      path: '/users',
      handler: listUsersHandler,
    },
  ],

  /**
   * Module initialization with lifecycle hooks
   * Modules are loaded into global context with proper startup/shutdown
   */
  modules: (gctx: GlobalContext) => {
    // Register startup hooks
    gctx.lifecycle.onStartup('logger', async () => {
      console.log('🔧 Initializing logger module...');
      gctx.modules['logger'] = initLogger(gctx);
      console.log('✅ Logger module initialized');
    }, LifecyclePriority.HIGH);

    // Register health checks
    gctx.lifecycle.onHealthCheck('app', async () => {
      return {
        status: 'pass',
        message: 'Application is healthy',
      };
    });

    gctx.lifecycle.onHealthCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      return {
        status: heapUsedMB < 100 ? 'pass' : 'warn',
        message: `Heap usage: ${heapUsedMB}MB`,
      };
    });

    // Register shutdown hooks
    gctx.lifecycle.onShutdown('logger', async () => {
      console.log('🔧 Shutting down logger module...');
      // Cleanup logger resources
      console.log('✅ Logger module shut down');
    }, LifecyclePriority.NORMAL);
  },

  /**
   * Application-level configuration
   */
  config: {
    name: 'hello-world',
    version: '1.0.0',
    env: process.env['NODE_ENV'] || 'development',
  },
};
