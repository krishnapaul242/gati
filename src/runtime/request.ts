/**
 * @module runtime/request
 * @description Request object factory for Gati framework
 */

import type { Request, RequestOptions } from './types/request';

/**
 * Create a Request object from RequestOptions
 *
 * @param options - Request creation options
 * @returns Request object
 *
 * @example
 * ```typescript
 * const req = createRequest({
 *   method: 'GET',
 *   path: '/api/users/123',
 *   params: { id: '123' },
 *   raw: incomingMessage
 * });
 * ```
 */
export function createRequest(options: RequestOptions): Request {
  return {
    method: options.method,
    path: options.path,
    query: options.query ?? {},
    params: options.params ?? {},
    headers: options.headers ?? {},
    body: options.body,
    rawBody: options.rawBody,
    raw: options.raw,
  };
}
