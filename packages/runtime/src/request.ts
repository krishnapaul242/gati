/**
 * @module runtime/request
 * @description Request object factory for Gati framework
 */

import { parse as parseUrl } from 'url';
import type { Request, RequestOptions, QueryParams, HttpHeaders } from './types/request.js';

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
  // Parse query string if not provided
  let query: QueryParams = options.query ?? {};
  let path = options.path;
  
  if (!options.query && options.raw.url) {
    const parsed = parseUrl(options.raw.url, true);
    // Extract query parameters
    const parsedQuery = parsed.query;
    query = Object.entries(parsedQuery).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as QueryParams);
    
    // Use pathname as path (without query string)
    path = parsed.pathname || path;
  }

  // Extract headers from IncomingMessage if not provided
  const headers: HttpHeaders = options.headers ?? (options.raw.headers as HttpHeaders);

  return {
    method: options.method,
    path,
    query,
    params: options.params ?? {},
    headers,
    body: options.body,
    rawBody: options.rawBody,
    raw: options.raw,
  };
}
