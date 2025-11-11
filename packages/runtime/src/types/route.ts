/**
 * @module runtime/types/route
 * @description Route and router type definitions
 */

import type { Handler } from './handler.js';
import type { HttpMethod } from './request.js';

/**
 * Route definition
 */
export interface Route {
  /**
   * HTTP method (GET, POST, etc.)
   */
  method: HttpMethod;

  /**
   * Route path pattern (e.g., /users/:id)
   */
  path: string;

  /**
   * Handler function for this route
   */
  handler: Handler;

  /**
   * Compiled route pattern (internal use)
   */
  pattern?: RoutePattern;
}

/**
 * Compiled route pattern for matching
 */
export interface RoutePattern {
  /**
   * Regular expression for matching paths
   */
  regex: RegExp;

  /**
   * Names of path parameters in order
   */
  paramNames: string[];

  /**
   * Original path pattern
   */
  path: string;
}

/**
 * Result of route matching
 */
export interface RouteMatch {
  /**
   * The matched route
   */
  route: Route;

  /**
   * Extracted path parameters
   */
  params: Record<string, string>;
}

/**
 * Route registration options
 */
export interface RouteOptions {
  /**
   * Route path pattern
   */
  path: string;

  /**
   * Handler function
   */
  handler: Handler;

  /**
   * HTTP method (optional, defaults to GET)
   */
  method?: HttpMethod;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /**
   * Enable strict routing (trailing slashes matter)
   * Default: false
   */
  strict?: boolean;

  /**
   * Enable case-sensitive routing
   * Default: false
   */
  caseSensitive?: boolean;

  /**
   * Custom 404 handler
   */
  notFoundHandler?: Handler;
}
