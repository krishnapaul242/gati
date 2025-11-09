/**
 * @module runtime/types/handler
 * @description Handler function signature for Gati framework
 */
import type { Request } from './request';
import type { Response } from './response';
import type { GlobalContext, LocalContext } from './context';
/**
 * Handler function signature
 *
 * Handlers process HTTP requests and can be synchronous or asynchronous.
 *
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param gctx - Global context (shared resources)
 * @param lctx - Local context (request-scoped data)
 * @returns void or Promise<void>
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
export type Handler = (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext) => void | Promise<void>;
/**
 * Handler error class for handler-specific errors
 */
export declare class HandlerError extends Error {
    statusCode: number;
    context?: Record<string, unknown> | undefined;
    constructor(message: string, statusCode?: number, context?: Record<string, unknown> | undefined);
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
//# sourceMappingURL=handler.d.ts.map