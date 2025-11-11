/**
 * @module runtime/route-parser
 * @description Route pattern parsing and compilation for Gati framework
 */

import type { RoutePattern } from './types/route.js';

/**
 * Parse a route path pattern and compile it into a RoutePattern
 *
 * @param path - Route path pattern (e.g., /users/:id/posts/:postId)
 * @returns Compiled route pattern
 *
 * @example
 * ```typescript
 * const pattern = parseRoute('/users/:id');
 * // pattern.regex matches paths like /users/123
 * // pattern.paramNames = ['id']
 * ```
 */
export function parseRoute(path: string): RoutePattern {
  // Normalize path
  const normalizedPath = normalizePath(path);

  // Extract parameter names
  const paramNames: string[] = [];
  
  // Convert path pattern to regex
  // Replace :param with named capture groups
  const regexPattern = normalizedPath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName: string) => {
    paramNames.push(paramName);
    return '([^/]+)'; // Match any character except /
  });

  // Create regex with exact match
  const regex = new RegExp(`^${regexPattern}$`);

  return {
    regex,
    paramNames,
    path: normalizedPath,
  };
}

/**
 * Normalize a route path
 * - Ensures path starts with /
 * - Removes trailing slash (unless it's the root path)
 * - Removes duplicate slashes
 *
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  // Ensure path starts with /
  let normalized = path.startsWith('/') ? path : `/${path}`;

  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, '/');

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Extract path parameters from a matched path
 *
 * @param path - Actual request path
 * @param pattern - Compiled route pattern
 * @returns Extracted parameters or null if no match
 *
 * @example
 * ```typescript
 * const pattern = parseRoute('/users/:id');
 * const params = extractParams('/users/123', pattern);
 * // params = { id: '123' }
 * ```
 */
export function extractParams(
  path: string,
  pattern: RoutePattern
): Record<string, string> | null {
  const normalizedPath = normalizePath(path);
  const match = pattern.regex.exec(normalizedPath);

  if (!match) {
    return null;
  }

  // Extract parameters from regex capture groups
  const params: Record<string, string> = {};
  
  pattern.paramNames.forEach((name, index) => {
    // Capture groups start at index 1 (0 is the full match)
    const value = match[index + 1];
    if (value !== undefined) {
      params[name] = decodeURIComponent(value);
    }
  });

  return params;
}

/**
 * Check if a path matches a route pattern
 *
 * @param path - Request path to test
 * @param pattern - Route pattern to match against
 * @returns true if path matches pattern
 *
 * @example
 * ```typescript
 * const pattern = parseRoute('/users/:id');
 * matchPath('/users/123', pattern); // true
 * matchPath('/posts/123', pattern); // false
 * ```
 */
export function matchPath(path: string, pattern: RoutePattern): boolean {
  const normalizedPath = normalizePath(path);
  return pattern.regex.test(normalizedPath);
}
