/**
 * @module runtime/types/handler
 * @description Handler function signature for Gati framework
 */

import type { Request } from './request.js';
import type { Response } from './response.js';
import type { GlobalContext, LocalContext } from './context.js';

/**
 * Typed Request with INPUT, PARAMS, and QUERY generics
 */
export interface TypedRequest<
  INPUT = unknown,
  PARAMS extends Record<string, string> = Record<string, string>,
  QUERY extends Record<string, string | string[]> = Record<string, string | string[]>
> extends Omit<Request, 'body' | 'params' | 'query'> {
  body: INPUT;
  params: PARAMS;
  query: QUERY;
}

/**
 * Typed Response with OUTPUT generic
 */
export interface TypedResponse<OUTPUT = unknown> extends Omit<Response, 'json'> {
  json: (data: OUTPUT) => void;
}

/**
 * Handler function signature with type generics
 *
 * @template INPUT - Request body type (default: unknown)
 * @template OUTPUT - Response body type (default: unknown)
 * @template PARAMS - URL parameters type (default: Record<string, string>)
 * @template QUERY - Query parameters type (default: Record<string, string | string[]>)
 * @template CTX - Combined context type (default: GlobalContext & LocalContext)
 *
 * @param req - HTTP request object with typed body, params, and query
 * @param res - HTTP response object with typed json method
 * @param gctx - Global context (shared resources)
 * @param lctx - Local context (request-scoped data)
 * @returns any value (typically void, but can return data for testing)
 *
 * @example Basic usage (no types)
 * ```typescript
 * export const handler: Handler = async (req, res, gctx, lctx) => {
 *   const { title } = req.body; // unknown
 *   res.json({ todo: { id: '1', title } });
 * };
 * ```
 *
 * @example With INPUT/OUTPUT types
 * ```typescript
 * type INPUT = { title: string };
 * type OUTPUT = { todo: { id: string; title: string } };
 *
 * export const handler: Handler<INPUT, OUTPUT> = async (req, res, gctx, lctx) => {
 *   const { title } = req.body; // ✅ string
 *   res.json({ todo: { id: '1', title } }); // ✅ Typed
 * };
 * ```
 *
 * @example With PARAMS and QUERY
 * ```typescript
 * type PARAMS = { id: string };
 * type QUERY = { includeCompleted?: string };
 *
 * export const handler: Handler<void, Todo, PARAMS, QUERY> = async (req, res) => {
 *   const { id } = req.params; // ✅ string
 *   const { includeCompleted } = req.query; // ✅ string | undefined
 * };
 * ```
 */
export type Handler<
  INPUT = unknown,
  OUTPUT = unknown,
  PARAMS extends Record<string, string> = Record<string, string>,
  QUERY extends Record<string, string | string[]> = Record<string, string | string[]>,
  CTX extends GlobalContext & LocalContext = GlobalContext & LocalContext
> = (
  req: TypedRequest<INPUT, PARAMS, QUERY>,
  res: TypedResponse<OUTPUT>,
  gctx: CTX extends GlobalContext & LocalContext ? GlobalContext : never,
  lctx: CTX extends GlobalContext & LocalContext ? LocalContext : never
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

/**
 * Type utility to infer INPUT type from Handler
 */
export type InferInput<T> = T extends Handler<infer I, any, any, any, any> ? I : never;

/**
 * Type utility to infer OUTPUT type from Handler
 */
export type InferOutput<T> = T extends Handler<any, infer O, any, any, any> ? O : never;

/**
 * Type utility to infer PARAMS type from Handler
 */
export type InferParams<T> = T extends Handler<any, any, infer P, any, any> ? P : never;

/**
 * Type utility to infer QUERY type from Handler
 */
export type InferQuery<T> = T extends Handler<any, any, any, infer Q, any> ? Q : never;
