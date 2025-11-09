/**
 * @module runtime/route-manager
 * @description Route registration and management for Gati framework
 */

import type { Route, RouteMatch, RouterConfig } from './types/route';
import type { Handler } from './types/handler';
import type { HttpMethod } from './types/request';
import { parseRoute, normalizePath, extractParams } from './route-parser';

/**
 * Route manager for registering and matching routes
 */
export class RouteManager {
  private routes: Route[] = [];
  private config: RouterConfig;

  constructor(config: RouterConfig = {}) {
    this.config = {
      strict: false,
      caseSensitive: false,
      ...config,
    };
  }

  /**
   * Register a new route
   *
   * @param method - HTTP method
   * @param path - Route path pattern
   * @param handler - Handler function
   *
   * @example
   * ```typescript
   * routeManager.register('GET', '/users/:id', getUserHandler);
   * ```
   */
  register(method: HttpMethod, path: string, handler: Handler): void {
    const pattern = parseRoute(path);

    const route: Route = {
      method,
      path: pattern.path,
      handler,
      pattern,
    };

    this.routes.push(route);
  }

  /**
   * Register a GET route
   */
  get(path: string, handler: Handler): void {
    this.register('GET', path, handler);
  }

  /**
   * Register a POST route
   */
  post(path: string, handler: Handler): void {
    this.register('POST', path, handler);
  }

  /**
   * Register a PUT route
   */
  put(path: string, handler: Handler): void {
    this.register('PUT', path, handler);
  }

  /**
   * Register a PATCH route
   */
  patch(path: string, handler: Handler): void {
    this.register('PATCH', path, handler);
  }

  /**
   * Register a DELETE route
   */
  delete(path: string, handler: Handler): void {
    this.register('DELETE', path, handler);
  }

  /**
   * Register a HEAD route
   */
  head(path: string, handler: Handler): void {
    this.register('HEAD', path, handler);
  }

  /**
   * Register an OPTIONS route
   */
  options(path: string, handler: Handler): void {
    this.register('OPTIONS', path, handler);
  }

  /**
   * Find a matching route for the given method and path
   *
   * @param method - HTTP method
   * @param path - Request path
   * @returns RouteMatch if found, null otherwise
   *
   * @example
   * ```typescript
   * const match = routeManager.match('GET', '/users/123');
   * if (match) {
   *   console.log(match.params.id); // '123'
   * }
   * ```
   */
  match(method: HttpMethod, path: string): RouteMatch | null {
    const normalizedPath = normalizePath(path);

    for (const route of this.routes) {
      // Check if method matches
      if (route.method !== method) {
        continue;
      }

      // Check if path matches
      if (!route.pattern) {
        continue;
      }

      const params = extractParams(normalizedPath, route.pattern);
      
      if (params !== null) {
        return {
          route,
          params,
        };
      }
    }

    return null;
  }

  /**
   * Get all registered routes
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * Clear all registered routes
   */
  clear(): void {
    this.routes = [];
  }

  /**
   * Get the number of registered routes
   */
  size(): number {
    return this.routes.length;
  }
}

/**
 * Create a new route manager instance
 *
 * @param config - Router configuration
 * @returns New RouteManager instance
 *
 * @example
 * ```typescript
 * const router = createRouteManager({
 *   strict: true,
 *   caseSensitive: false
 * });
 *
 * router.get('/users/:id', getUserHandler);
 * ```
 */
export function createRouteManager(config?: RouterConfig): RouteManager {
  return new RouteManager(config);
}
