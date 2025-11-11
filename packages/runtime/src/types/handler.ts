/**
 * @module runtime/types/handler
 * @description Handler function signature for Gati framework
 */

import type { Request } from './request.js';
import type { Response } from './response.js';
import type { GlobalContext, LocalContext } from './context.js';

/**
 * Handler function signature
 *
 * Handlers process HTTP requests and can be synchronous or asynchronous.
 * Compatible with @gati-framework/core Handler type.
 *
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param gctx - Global context (shared resources)
 * @param lctx - Local context (request-scoped data)
 * @returns any value (typically void, but can return data for testing)
 *
 * @example
 * ```typescript
 * const getUserHandler: Handler = async (req, res, gctx, lctx) => {
 *   const userId = req.params.id;
 *   const user = await gctx.modules['db'].users.findById(userId);
 *
 *   if (!user) {
 *     return res.status(404).json({ error: 'User not found' });
 *   }
 *
 *   res.json({ user });
 * };
 * ```
 */
export type Handler = (
  req: Request,
  res: Response,
  gctx: GlobalContext,
  lctx: LocalContext
) => unknown | Promise<unknown>;

/**
 * Handler error class for handler-specific errors
 */
export class HandlerError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HandlerError';
    Error.captureStackTrace(this, HandlerError);
  }
}

/**
 * Handler execution options
 */
export interface HandlerExecutionOptions {
  /**
   * Timeout for handler execution (milliseconds)
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Whether to catch handler errors automatically
   * Default: true
   */
  catchErrors?: boolean;
}
