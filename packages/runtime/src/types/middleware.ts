/**
 * @module runtime/types/middleware
 * @description Middleware type definitions
 */

import type { Request } from './request.js';
import type { Response } from './response.js';
import type { GlobalContext, LocalContext } from './context.js';

/**
 * Next function to call the next middleware in the chain
 */
export type NextFunction = () => Promise<void> | void;

/**
 * Middleware function signature
 *
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param gctx - Global context (shared across requests)
 * @param lctx - Local context (request-scoped)
 * @param next - Function to call next middleware
 */
export type Middleware = (
  req: Request,
  res: Response,
  gctx: GlobalContext,
  lctx: LocalContext,
  next: NextFunction
) => Promise<void> | void;

/**
 * Error handling middleware signature
 *
 * @param error - The error that occurred
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param gctx - Global context
 * @param lctx - Local context
 */
export type ErrorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  gctx: GlobalContext,
  lctx: LocalContext
) => Promise<void> | void;

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  /**
   * Path pattern to apply middleware to
   * @default '*' (all paths)
   */
  path?: string;

  /**
   * HTTP methods to apply middleware to
   * @default ['*'] (all methods)
   */
  methods?: string[];

  /**
   * Priority of middleware (higher = earlier in chain)
   * @default 0
   */
  priority?: number;
}

/**
 * Registered middleware with metadata
 */
export interface MiddlewareEntry {
  middleware: Middleware;
  options: MiddlewareOptions;
}
