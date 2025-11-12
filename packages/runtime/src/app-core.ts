/**
 * @module runtime/app-core
 * @description Main application orchestrator for Gati framework
 */

import { createServer } from 'http';
import type { Server, IncomingMessage, ServerResponse } from 'http';
import { createRequest } from './request.js';
import { createResponse } from './response.js';
import { createGlobalContext, createLocalContext } from './context-manager.js';
import { createRouteManager } from './route-manager.js';
import type { RouteManager } from './route-manager.js';
import { createMiddlewareManager } from './middleware.js';
import type { MiddlewareManager } from './middleware.js';
import { executeHandler } from './handler-engine.js';
import type { Handler, GlobalContext, Middleware, ErrorMiddleware } from './types/index.js';
import { createLogger } from './logger.js';
import type { LoggerOptions } from './logger.js';

/**
 * Generate instance ID for distributed deployment
 */
function generateInstanceId(): string {
  return process.env['INSTANCE_ID'] || 
         process.env['HOSTNAME'] || 
         `instance_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate trace ID for distributed tracing
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
}



/**
 * Application configuration options for scalable deployment
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

  /**
   * Clustering configuration
   */
  cluster?: {
    enabled: boolean;
    workers?: number;
  };

  /**
   * Performance optimization settings
   */
  performance?: {
    keepAliveTimeout: number;
    maxConnections: number;
    compression: boolean;
    bodyLimit: string;
  };

  /**
   * Distributed tracing configuration
   */
  tracing?: {
    enabled: boolean;
    serviceName: string;
    endpoint?: string;
  };

  /**
   * External service configurations
   */
  services?: {
    redis?: {
      url: string;
      poolSize: number;
    };
    database?: {
      url: string;
      poolMin: number;
      poolMax: number;
    };
  };

  /**
   * Instance metadata for distributed deployment
   */
  instance?: {
    id: string;
    region: string;
    zone: string;
  };
}

/**
 * Main Gati application class
 */
export class GatiApp {
  private server: Server | null = null;
  private router: RouteManager;
  private middleware: MiddlewareManager;
  private gctx: GlobalContext;
  private config: Required<Omit<AppConfig, 'logger' | 'cluster' | 'performance' | 'tracing' | 'services' | 'instance'>> & { 
    logger?: LoggerOptions;
    cluster?: AppConfig['cluster'];
    performance?: AppConfig['performance'];
    tracing?: AppConfig['tracing'];
    services?: AppConfig['services'];
    instance?: AppConfig['instance'];
  };
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
      cluster: config.cluster,
      performance: config.performance,
      tracing: config.tracing,
      services: config.services,
      instance: config.instance,
    };

    this.logger = createLogger({
      name: 'gati-app',
      ...this.config.logger,
    });

    // Create global context with instance metadata
    this.gctx = createGlobalContext({
      instance: {
        id: this.config.instance?.id || generateInstanceId(),
        region: this.config.instance?.region || process.env['AWS_REGION'] || 'local',
        zone: this.config.instance?.zone || process.env['AWS_AVAILABILITY_ZONE'] || 'local-a',
      },
      config: this.config,
      services: {}, // Will be populated by modules
    });
    
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

    let lctx: any = null;
    
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

      // Extract distributed tracing headers
      const traceId = (incomingMessage.headers['x-trace-id'] as string) || generateTraceId();
      const parentSpanId = incomingMessage.headers['x-parent-span-id'] as string;
      
      // Generate client ID and metadata
      const clientIp = incomingMessage.socket.remoteAddress || 'unknown';
      const userAgent = incomingMessage.headers['user-agent'] || 'unknown';
      const clientIdentifier = `${clientIp}:${userAgent}`;
      
      // Create a consistent client ID using a simple hash
      let hash = 0;
      for (let i = 0; i < clientIdentifier.length; i++) {
        const char = clientIdentifier.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const clientId = `client_${Math.abs(hash).toString(36)}`;
      
      // Extract external references from headers/cookies
      const sessionId = incomingMessage.headers['x-session-id'] as string || 
                       this.extractSessionFromCookie(incomingMessage.headers.cookie);
      const userId = incomingMessage.headers['x-user-id'] as string;
      const tenantId = incomingMessage.headers['x-tenant-id'] as string;

      // Create lightweight local context for this request
      lctx = createLocalContext({ 
        traceId,
        parentSpanId,
        clientId,
        refs: {
          sessionId,
          userId,
          tenantId,
        },
        client: {
          ip: clientIp,
          userAgent,
          region: this.gctx.instance.region,
        },
        meta: {
          timestamp: Date.now(),
          instanceId: this.gctx.instance.id,
          region: this.gctx.instance.region,
          method: req.method,
          path: req.path || '/',
        },
      });

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
      // Execute request cleanup hooks
      if (lctx) {
        try {
          await lctx.lifecycle.executeCleanup();
        } catch (cleanupError) {
          console.error('Request cleanup failed:', cleanupError);
        }
      }
      
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

  /**
   * Get global context (for module initialization)
   */
  getGlobalContext(): GlobalContext {
    return this.gctx;
  }

  /**
   * Extract session ID from cookie header
   */
  private extractSessionFromCookie(cookieHeader?: string): string | undefined {
    if (!cookieHeader) return undefined;
    
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionId' || name === 'session_id') {
        return value;
      }
    }
    return undefined;
  }
}

/**
 * Create a new Gati application
 */
export function createApp(config?: AppConfig): GatiApp {
  return new GatiApp(config);
}
