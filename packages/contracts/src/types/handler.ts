/**
 * @module contracts/types/handler
 * @description Handler function signature contract
 */

import type { GatiRequestEnvelope, GatiResponseEnvelope } from './envelope.js';
import type { LocalContext } from './local-context.js';
import type { GlobalContext } from './global-context.js';

/**
 * HandlerFunction - Standard signature for all Gati handlers
 * 
 * Handlers receive a request envelope, local context (request-scoped),
 * and global context (application-wide), then return a response envelope.
 * 
 * @param env - Request envelope with all request data
 * @param lctx - Local context for request-scoped state and hooks
 * @param gctx - Global context for application-wide resources
 * @returns Promise resolving to response envelope
 * 
 * @example
 * ```typescript
 * const handler: HandlerFunction = async (env, lctx, gctx) => {
 *   const userId = env.params?.id;
 *   const user = await gctx.modules['db'].call('findUser', { id: userId });
 *   
 *   return {
 *     requestId: env.id,
 *     status: 200,
 *     producedAt: Date.now(),
 *     body: { user }
 *   };
 * };
 * ```
 */
export type HandlerFunction = (
  env: GatiRequestEnvelope,
  lctx: LocalContext,
  gctx: GlobalContext
) => Promise<GatiResponseEnvelope>;
