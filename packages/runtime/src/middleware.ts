/**
 * @module runtime/middleware
 * @description Middleware pipeline management for Gati framework
 */

import type {
  Middleware,
  ErrorMiddleware,
  MiddlewareEntry,
  MiddlewareOptions,
  NextFunction,
} from './types/middleware.js';
import type { Request, Response, GlobalContext, LocalContext } from './types/index.js';
import { logger } from './logger.js';

// Re-export middleware types for external use
export type { Middleware, ErrorMiddleware } from './types/middleware.js';

/**
 * Middleware manager for organizing and executing middleware chain
 */
export class MiddlewareManager {
  private middlewares: MiddlewareEntry[] = [];
  private errorMiddlewares: ErrorMiddleware[] = [];

  /**
   * Register a middleware function
   *
   * @param middleware - Middleware function to register
   * @param options - Middleware configuration options
   */
  use(middleware: Middleware, options: MiddlewareOptions = {}): void {
    const entry: MiddlewareEntry = {
      middleware,
      options: {
        path: options.path || '*',
        methods: options.methods || ['*'],
        priority: options.priority || 0,
      },
    };

    this.middlewares.push(entry);
    this.sortMiddlewares();
  }

  /**
   * Register an error handling middleware
   *
   * @param middleware - Error middleware function
   */
  useError(middleware: ErrorMiddleware): void {
    this.errorMiddlewares.push(middleware);
  }

  /**
   * Execute middleware chain for a request
   *
   * @param req - HTTP request
   * @param res - HTTP response
   * @param gctx - Global context
   * @param lctx - Local context
   * @param handler - Final handler to execute after middleware
   */
  async execute(
    req: Request,
    res: Response,
    gctx: GlobalContext,
    lctx: LocalContext,
    handler: () => Promise<void> | void
  ): Promise<void> {
    const applicableMiddlewares = this.getApplicableMiddlewares(req);
    let currentIndex = 0;

    const next: NextFunction = async () => {
      if (currentIndex >= applicableMiddlewares.length) {
        // All middleware executed, run the handler
        await handler();
        return;
      }

      const entry = applicableMiddlewares[currentIndex++];
      if (entry) {
        await entry.middleware(req, res, gctx, lctx, next);
      }
    };

    try {
      await next();
    } catch (error) {
      await this.handleError(error as Error, req, res, gctx, lctx);
    }
  }

  /**
   * Handle errors through error middleware chain
   */
  private async handleError(
    error: Error,
    req: Request,
    res: Response,
    gctx: GlobalContext,
    lctx: LocalContext
  ): Promise<void> {
    for (const errorMiddleware of this.errorMiddlewares) {
      try {
        await errorMiddleware(error, req, res, gctx, lctx);
        
        // If response was sent, stop processing
        if (res.headersSent) {
          return;
        }
      } catch (middlewareError) {
        logger.error({ middlewareError }, 'Error in error middleware');
      }
    }

    // If no error middleware handled it, send generic error
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  /**
   * Get middlewares applicable to the current request
   */
  private getApplicableMiddlewares(req: Request): MiddlewareEntry[] {
    return this.middlewares.filter((entry) => {
      const { path, methods } = entry.options;

      // Check path pattern
      if (path && path !== '*' && !this.matchPath(req.path || '/', path)) {
        return false;
      }

      // Check HTTP method
      if (!methods?.includes('*') && !methods?.includes(req.method)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Match request path against middleware path pattern
   * Supports:
   * - Exact match: '/api/users'
   * - Wildcard: '/api/*' matches '/api/anything'
   * - Parameters: '/api/:version/users' matches '/api/v1/users'
   */
  private matchPath(requestPath: string, pattern: string): boolean {
    // Wildcard match - matches everything
    if (pattern === '*') {
      return true;
    }

    // Exact match
    if (pattern === requestPath) {
      return true;
    }

    // Prefix wildcard: /api/* matches /api/anything
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      return requestPath.startsWith(base);
    }

    // Convert pattern to regex for parameter matching
    const regex = this.patternToRegex(pattern);
    return regex.test(requestPath);
  }

  /**
   * Convert path pattern to regex
   * Supports :param syntax and wildcards
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      // Escape special regex chars except * and :
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      // Convert * to match anything
      .replace(/\*/g, '.*')
      // Convert :param to named capture group
      .replace(/:(\w+)/g, '([^/]+)');
    
    return new RegExp(`^${escaped}$`);
  }

  /**
   * Sort middlewares by priority (highest first)
   */
  private sortMiddlewares(): void {
    this.middlewares.sort((a, b) => {
      const priorityA = a.options.priority || 0;
      const priorityB = b.options.priority || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * Get all registered middlewares
   */
  getMiddlewares(): MiddlewareEntry[] {
    return [...this.middlewares];
  }

  /**
   * Clear all middlewares
   */
  clear(): void {
    this.middlewares = [];
    this.errorMiddlewares = [];
  }

  /**
   * Get number of registered middlewares
   */
  size(): number {
    return this.middlewares.length;
  }
}

/**
 * Create a new middleware manager instance
 */
export function createMiddlewareManager(): MiddlewareManager {
  return new MiddlewareManager();
}
