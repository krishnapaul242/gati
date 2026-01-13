/**
 * @module runtime/middleware/property-based
 * @description Property-based middleware for simplified handler configuration
 */

import type { Handler } from '../types/handler.js';
import type { Middleware } from '../types/middleware.js';

/**
 * Property-based middleware configuration
 */
export interface PropertyMiddleware {
  /** Require authentication */
  auth?: boolean;
  /** Cache duration in seconds */
  cache?: number;
  /** Rate limit (requests per minute) */
  rateLimit?: number;
  /** CORS enabled */
  cors?: boolean;
}

/**
 * Handler with property-based middleware
 */
export type PropertyHandler = Handler & PropertyMiddleware;

/**
 * Extract property middleware from handler
 */
export function extractPropertyMiddleware(handler: unknown): PropertyMiddleware {
  if (typeof handler !== 'function') return {};
  
  const h = handler as PropertyHandler;
  return {
    auth: h.auth,
    cache: h.cache,
    rateLimit: h.rateLimit,
    cors: h.cors,
  };
}

/**
 * Convert property middleware to actual middleware functions
 */
export function propertyToMiddleware(props: PropertyMiddleware): Middleware[] {
  const middleware: Middleware[] = [];

  if (props.auth) {
    middleware.push(authMiddleware);
  }

  if (props.cache) {
    middleware.push(cacheMiddleware(props.cache));
  }

  if (props.rateLimit) {
    middleware.push(rateLimitMiddleware(props.rateLimit));
  }

  if (props.cors) {
    middleware.push(corsMiddleware);
  }

  return middleware;
}

/**
 * Auth middleware
 */
const authMiddleware: Middleware = async (req, res, gctx, lctx, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Extend lctx with user info (simplified)
  (lctx as any).user = { id: 'user-1', email: 'user@example.com' };
  
  await next();
};

/**
 * Cache middleware factory
 */
function cacheMiddleware(seconds: number): Middleware {
  return async (req, res, gctx, lctx, next) => {
    res.setHeader('Cache-Control', `public, max-age=${seconds}`);
    await next();
  };
}

/**
 * Rate limit middleware factory
 */
function rateLimitMiddleware(requestsPerMinute: number): Middleware {
  const requests = new Map<string, number[]>();
  
  return async (req, res, gctx, lctx, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    
    const timestamps = requests.get(ip) || [];
    const recentRequests = timestamps.filter(t => now - t < windowMs);
    
    if (recentRequests.length >= requestsPerMinute) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    await next();
  };
}

/**
 * CORS middleware
 */
const corsMiddleware: Middleware = async (req, res, gctx, lctx, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }
  
  await next();
};
