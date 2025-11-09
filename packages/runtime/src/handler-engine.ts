/**
 * @module runtime/handler-engine
 * @description Core handler execution engine for Gati framework
 */

import type {
  Handler,
  HandlerExecutionOptions,
  Request,
  Response,
  GlobalContext,
  LocalContext,
} from './types';
import { HandlerError } from './types';
import { logger } from './logger';

/**
 * Default handler execution timeout (30 seconds)
 */
const DEFAULT_TIMEOUT = 30_000;

/**
 * Execute a handler function with the provided context
 *
 * @param handler - The handler function to execute
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param gctx - Global context (shared resources)
 * @param lctx - Local context (request-scoped data)
 * @param options - Execution options
 * @returns Promise that resolves when handler completes
 *
 * @throws {HandlerError} If handler validation fails
 * @throws {Error} If handler execution times out
 * @throws {Error} If handler throws an error (when catchErrors is false)
 *
 * @example
 * ```typescript
 * const handler: Handler = (req, res) => res.json({ ok: true });
 * await executeHandler(handler, req, res, gctx, lctx);
 * ```
 */
export async function executeHandler(
  handler: Handler,
  req: Request,
  res: Response,
  gctx: GlobalContext,
  lctx: LocalContext,
  options?: HandlerExecutionOptions
): Promise<void> {
  // Validate handler
  if (!isValidHandler(handler)) {
    throw new HandlerError('Invalid handler: must be a function', 500);
  }

  // Extract options
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const catchErrors = options?.catchErrors ?? true;

  try {
    // Execute handler with timeout
    await executeWithTimeout(
      () => handler(req, res, gctx, lctx),
      timeout,
      `Handler execution timed out after ${timeout}ms`
    );
  } catch (error) {
    if (!catchErrors) {
      throw error;
    }

    // Handle errors gracefully
    handleExecutionError(error, res);
  }
}

/**
 * Validate that a handler is a function
 *
 * @param handler - The value to validate
 * @returns true if handler is a valid function
 */
function isValidHandler(handler: unknown): handler is Handler {
  return typeof handler === 'function';
}

/**
 * Execute a function with a timeout
 *
 * @param fn - Function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Error message if timeout occurs
 * @returns Promise that resolves with function result or rejects on timeout
 */
async function executeWithTimeout<T>(
  fn: () => T | Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return Promise.race([
    Promise.resolve(fn()),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Handle handler execution errors
 *
 * @param error - The error that occurred
 * @param res - Response object to send error response
 */
function handleExecutionError(error: unknown, res: Response): void {
  // Don't send error response if response already sent
  if (res.isSent()) {
    // Log error internally
    logger.error({ error }, 'Handler error after response sent');
    return;
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Handle HandlerError
  if (error instanceof HandlerError) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(isDevelopment && error.context ? { context: error.context } : {}),
    });
    return;
  }

  // Handle generic errors
  if (error instanceof Error) {
    res.status(500).json({
      error: 'Internal server error',
      ...(isDevelopment && { 
        message: error.message,
        stack: error.stack,
      }),
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    error: 'Internal server error',
  });
}
