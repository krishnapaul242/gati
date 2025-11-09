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
import { createLogger } from './logger';
import type { LoggerOptions } from './logger';

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

  /**
   * Logger configuration
   */
  logger?: LoggerOptions;
}

/**
 * Main Gati application class
 */
export class GatiApp {
  private server: Server | null = null;
  private router: RouteManager;
  private middleware: MiddlewareManager;
  private gctx: GlobalContext;
  private config: Required<Omit<AppConfig, 'logger'>> & { logger?: LoggerOptions };
  private isShuttingDown = false;
  private activeRequests = 0;
  private logger: ReturnType<typeof createLogger>;

  constructor(config: AppConfig = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || 'localhost',
      timeout: config.timeout || 30000,
      logging: config.logging !== false,
      logger: config.logger,
    };

    this.logger = createLogger({
      name: 'gati-app',
      ...this.config.logger,
    });

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
            this.logger.info(
              { port: this.config.port, host: this.config.host },
              'Gati server listening'
            );
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
   * Waits for active requests to complete before shutting down
   */
  async close(): Promise<void> {
    if (!this.server) {
      return;
    }

    this.isShuttingDown = true;

    // Wait for active requests to complete (with timeout)
    const maxWaitMs = 10000; // 10 seconds
    const checkIntervalMs = 100; // Check every 100ms
    const startTime = Date.now();

    while (this.activeRequests > 0 && Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }

    if (this.activeRequests > 0 && this.config.logging) {
      this.logger.warn(
        { activeRequests: this.activeRequests },
        'Server shutting down with active requests still pending'
      );
    }

    return new Promise((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
        } else {
          this.server = null;
          this.isShuttingDown = false;
          if (this.config.logging) {
            this.logger.info('Gati server shut down successfully');
          }
          resolve();
        }
      });
    });
  }

  /**
   * Parse request body based on Content-Type
   */
  private async parseRequestBody(
    req: IncomingMessage
  ): Promise<{ body: unknown; rawBody: string | Buffer }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        try {
          const rawBody = Buffer.concat(chunks);
          
          // No body content
          if (rawBody.length === 0) {
            resolve({ body: undefined, rawBody: '' });
            return;
          }

          const contentType = req.headers['content-type'] || '';
          
          // Parse JSON
          if (contentType.includes('application/json')) {
            const bodyString = rawBody.toString('utf-8');
            try {
              const parsed = JSON.parse(bodyString) as unknown;
              resolve({ body: parsed, rawBody: bodyString });
            } catch (error) {
              // Invalid JSON, return as text
              resolve({ body: undefined, rawBody: bodyString });
            }
            return;
          }

          // Parse URL-encoded form data
          if (contentType.includes('application/x-www-form-urlencoded')) {
            const bodyString = rawBody.toString('utf-8');
            const params = new URLSearchParams(bodyString);
            const parsed: Record<string, string> = {};
            params.forEach((value, key) => {
              parsed[key] = value;
            });
            resolve({ body: parsed, rawBody: bodyString });
            return;
          }

          // Default: return as text or buffer
          if (contentType.includes('text/')) {
            const bodyString = rawBody.toString('utf-8');
            resolve({ body: bodyString, rawBody: bodyString });
          } else {
            resolve({ body: rawBody, rawBody });
          }
        } catch (error) {
          reject(error);
        }
      });

      req.on('error', (error) => {
        reject(error);
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

    // Track active requests
    this.activeRequests++;

    // Set request timeout
    const requestTimeout = setTimeout(() => {
      if (!serverResponse.headersSent) {
        serverResponse.statusCode = 408;
        serverResponse.setHeader('Content-Type', 'application/json');
        serverResponse.end(JSON.stringify({ 
          error: 'Request Timeout',
          message: 'Request exceeded configured timeout',
        }));
      }
    }, this.config.timeout);

    try {
      // Parse request body
      const { body, rawBody } = await this.parseRequestBody(incomingMessage);

      // Create request and response objects
      const req = createRequest({
        raw: incomingMessage,
        method: (incomingMessage.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
        path: incomingMessage.url || '/',
        body,
        rawBody,
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
    } finally {
      // Clear request timeout
      clearTimeout(requestTimeout);
      
      // Decrement active request counter
      this.activeRequests--;
    }
  }

  /**
   * Create default logging middleware
   */
  private createLoggingMiddleware(): Middleware {
    return async (req, _res, _gctx, lctx, next) => {
      const start = Date.now();
      const requestId = lctx.requestId || 'unknown';

      this.logger.info(
        { requestId, method: req.method, path: req.path },
        'Incoming request'
      );

      await next();

      const duration = Date.now() - start;
      this.logger.info(
        { requestId, method: req.method, path: req.path, duration },
        'Request completed'
      );
    };
  }

  /**
   * Create default error handler
   */
  private createDefaultErrorHandler(): ErrorMiddleware {
    return (error, _req, res, _gctx, lctx) => {
      const requestId = lctx.requestId || 'unknown';

      this.logger.error(
        { requestId, error: error.message, stack: error.stack },
        'Request error'
      );

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
  getConfig(): Readonly<AppConfig> {
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
