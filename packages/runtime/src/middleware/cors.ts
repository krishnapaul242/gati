/**
 * @module runtime/middleware/cors
 * @description CORS (Cross-Origin Resource Sharing) middleware for Gati framework
 */

import type { Middleware } from '../types/middleware';

/**
 * CORS middleware configuration options
 */
export interface CorsOptions {
  /**
   * Allowed origin(s)
   * @default '*'
   */
  origin?: string | string[] | ((origin: string) => boolean);

  /**
   * Allowed HTTP methods
   * @default ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
   */
  methods?: string[];

  /**
   * Allowed headers
   * @default ['Content-Type', 'Authorization']
   */
  allowedHeaders?: string[];

  /**
   * Exposed headers
   */
  exposedHeaders?: string[];

  /**
   * Allow credentials (cookies, authorization headers)
   * @default false
   */
  credentials?: boolean;

  /**
   * Preflight cache duration in seconds
   * @default 86400 (24 hours)
   */
  maxAge?: number;
}

/**
 * Create a CORS middleware
 *
 * @param options - CORS configuration options
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Allow all origins
 * app.use(createCorsMiddleware());
 *
 * // Specific origin
 * app.use(createCorsMiddleware({ origin: 'https://myapp.com' }));
 *
 * // Multiple origins
 * app.use(createCorsMiddleware({ 
 *   origin: ['https://app1.com', 'https://app2.com'],
 *   credentials: true 
 * }));
 *
 * // Dynamic origin validation
 * app.use(createCorsMiddleware({
 *   origin: (origin) => origin.endsWith('.myapp.com'),
 *   credentials: true
 * }));
 * ```
 */
export function createCorsMiddleware(options: CorsOptions = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders,
    credentials = false,
    maxAge = 86400,
  } = options;

  return async (req, res, _gctx, _lctx, next) => {
    const requestOrigin = req.headers['origin'] as string | undefined;

    // Determine allowed origin
    let allowedOrigin = '*';
    
    if (typeof origin === 'string') {
      allowedOrigin = origin;
    } else if (Array.isArray(origin)) {
      // Check if request origin is in allowed list
      if (requestOrigin && origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      } else if (origin.length > 0) {
        allowedOrigin = origin[0] ?? '*';
      }
    } else if (typeof origin === 'function' && requestOrigin) {
      // Dynamic validation
      if (origin(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', allowedOrigin);

    if (credentials) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', methods.join(', '));
      res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (exposedHeaders && exposedHeaders.length > 0) {
        res.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
      }
      
      res.header('Access-Control-Max-Age', maxAge.toString());
      
      // End preflight request
      return res.status(204).end();
    }

    // Set exposed headers for actual requests
    if (exposedHeaders && exposedHeaders.length > 0) {
      res.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    await next();
  };
}
