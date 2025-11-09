/**
 * @module runtime/app-core
 * @description Main application orchestrator for Gati framework
 */

import { createServer } from 'http';
import type { Server, IncomingMessage, ServerResponse } from 'http';
import { createRequest } from './request';
import { createResponse } from './response';
import { createGlobalContext, createLocalContext } from './context-manager';
import { createRouteManager } from './route-manager';
import type { RouteManager } from './route-manager';
import { createMiddlewareManager } from './middleware';
import type { MiddlewareManager } from './middleware';
import { executeHandler } from './handler-engine';
import type { Handler, GlobalContext, Middleware, ErrorMiddleware } from './types';

/**
 * Application configuration options
 */
export interface AppConfig {
  /**
   * Port to listen on
   * @default 3000
   */
  port?: number;

  /**
   * Host to bind to
   * @default 'localhost'
   */
  host?: string;

  /**
   * Server timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Enable request logging
   * @default true
   */
  logging?: boolean;
}

/**
 * Main Gati application class
 */
export class GatiApp {
  private server: Server | null = null;
  private router: RouteManager;
  private middleware: MiddlewareManager;
  private gctx: GlobalContext;
  private config: Required<AppConfig>;
  private isShuttingDown = false;

  constructor(config: AppConfig = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || 'localhost',
      timeout: config.timeout || 30000,
      logging: config.logging !== false,
    };

    this.gctx = createGlobalContext();
    this.router = createRouteManager();
    this.middleware = createMiddlewareManager();

    // Add default logging middleware if enabled
    if (this.config.logging) {
      this.use(this.createLoggingMiddleware());
    }

    // Add default error handling
    this.useError(this.createDefaultErrorHandler());
  }

  /**
   * Register a middleware function
   */
  use(middleware: Middleware): void {
    this.middleware.use(middleware);
  }

  /**
   * Register an error handling middleware
   */
  useError(middleware: ErrorMiddleware): void {
    this.middleware.useError(middleware);
  }

  /**
   * Register a GET route
   */
  get(path: string, handler: Handler): void {
    this.router.get(path, handler);
  }

  /**
   * Register a POST route
   */
  post(path: string, handler: Handler): void {
    this.router.post(path, handler);
  }

  /**
   * Register a PUT route
   */
  put(path: string, handler: Handler): void {
    this.router.put(path, handler);
  }

  /**
   * Register a PATCH route
   */
  patch(path: string, handler: Handler): void {
    this.router.patch(path, handler);
  }

  /**
   * Register a DELETE route
   */
  delete(path: string, handler: Handler): void {
    this.router.delete(path, handler);
  }

  /**
   * Start the HTTP server
   */
  async listen(): Promise<void> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = createServer((req, res) => {
          void this.handleRequest(req, res);
        });
        this.server.timeout = this.config.timeout;

        this.server.listen(this.config.port, this.config.host, () => {
          if (this.config.logging) {
            // eslint-disable-next-line no-console
            console.log(`Gati server listening on http://${this.config.host}:${this.config.port}`);
          }
          resolve();
        });

        this.server.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the HTTP server gracefully
   */
  async close(): Promise<void> {
    if (!this.server) {
      return;
    }

    this.isShuttingDown = true;

    return new Promise((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
        } else {
          this.server = null;
          this.isShuttingDown = false;
          if (this.config.logging) {
            // eslint-disable-next-line no-console
            console.log('Gati server shut down successfully');
          }
          resolve();
        }
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(
    incomingMessage: IncomingMessage,
    serverResponse: ServerResponse
  ): Promise<void> {
    // Check if shutting down
    if (this.isShuttingDown) {
      serverResponse.statusCode = 503;
      serverResponse.end('Service Unavailable');
      return;
    }

    // Create request and response objects
    const req = createRequest({
      raw: incomingMessage,
      method: (incomingMessage.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
      path: incomingMessage.url || '/',
    });
    const res = createResponse({ raw: serverResponse });

    // Create local context for this request
    const lctx = createLocalContext();

    try {
      // Execute middleware chain and route handler
      await this.middleware.execute(req, res, this.gctx, lctx, async () => {
        // Find matching route
        const match = this.router.match(req.method, req.path || '/');

        if (!match) {
          // No route found
          res.status(404).json({
            error: 'Not Found',
            message: `Cannot ${req.method} ${req.path}`,
          });
          return;
        }

        // Attach path params to request
        req.params = match.params;

        // Execute the handler
        await executeHandler(match.route.handler, req, res, this.gctx, lctx);
      });
    } catch (error) {
      // This should be caught by middleware error handling
      // But if it reaches here, send a generic error
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Create default logging middleware
   */
  private createLoggingMiddleware(): Middleware {
    return async (req, _res, _gctx, lctx, next) => {
      const start = Date.now();
      const requestId = lctx.requestId || 'unknown';

      // eslint-disable-next-line no-console
      console.log(`[${requestId}] ${req.method} ${req.path}`);

      await next();

      const duration = Date.now() - start;
      // eslint-disable-next-line no-console
      console.log(`[${requestId}] Completed in ${duration}ms`);
    };
  }

  /**
   * Create default error handler
   */
  private createDefaultErrorHandler(): ErrorMiddleware {
    return (error, _req, res, _gctx, lctx) => {
      const requestId = lctx.requestId || 'unknown';

      // eslint-disable-next-line no-console
      console.error(`[${requestId}] Error:`, error);

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: this.config.logging ? error.message : 'An error occurred',
          ...(this.config.logging && { requestId }),
        });
      }
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<Required<AppConfig>> {
    return { ...this.config };
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null && !this.isShuttingDown;
  }
}

/**
 * Create a new Gati application
 */
export function createApp(config?: AppConfig): GatiApp {
  return new GatiApp(config);
}
