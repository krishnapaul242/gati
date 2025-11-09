/**
 * @module runtime/loader
 * @description Automatic handler discovery and registration
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import type { GatiApp } from './app-core.js';
import type { Handler } from '@gati-framework/core';

/**
 * Handler file metadata
 */
export interface HandlerFile {
  /** File path */
  path: string;
  /** Handler function */
  handler: Handler;
  /** HTTP method (extracted from filename or metadata) */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Route path (extracted from filename or metadata) */
  route?: string;
}

/**
 * Discover all handler files in a directory
 * 
 * @param dir - Directory to search (e.g., './src/handlers')
 * @returns Array of handler file paths
 * 
 * @example
 * ```typescript
 * const handlers = await discoverHandlers('./src/handlers');
 * // Returns: ['./src/handlers/hello.ts', './src/handlers/users/create.ts']
 * ```
 */
export async function discoverHandlers(dir: string): Promise<string[]> {
  const handlers: string[] = [];
  
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        const nestedHandlers = await discoverHandlers(fullPath);
        handlers.push(...nestedHandlers);
      } else if (stat.isFile() && ['.ts', '.js', '.mts', '.mjs'].includes(extname(file))) {
        // Only include TypeScript/JavaScript files
        handlers.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
    console.warn(`Could not discover handlers in ${dir}:`, error instanceof Error ? error.message : 'Unknown error');
  }
  
  return handlers;
}

/**
 * Load and register handlers from a directory
 * 
 * @param app - GatiApp instance
 * @param handlersDir - Directory containing handlers (e.g., './src/handlers')
 * @param options - Loading options
 * 
 * @example
 * ```typescript
 * const app = createApp();
 * await loadHandlers(app, './src/handlers');
 * // All handlers automatically registered
 * ```
 */
export async function loadHandlers(
  app: GatiApp,
  handlersDir: string,
  options: {
    /** Base path for routes (default: '') */
    basePath?: string;
    /** Enable verbose logging (default: false) */
    verbose?: boolean;
  } = {}
): Promise<void> {
  const { basePath = '', verbose = false } = options;
  
  // Discover all handler files
  const handlerPaths = await discoverHandlers(handlersDir);
  
  if (verbose) {
    console.log(`Found ${handlerPaths.length} handler files`);
  }
  
  // Load and register each handler
  for (const handlerPath of handlerPaths) {
    try {
      // Dynamic import the handler
      const module = await import(handlerPath);
      
      // Extract handler function (expect named export 'handler' or default export)
      const handler: Handler = module.handler || module.default;
      
      if (!handler || typeof handler !== 'function') {
        console.warn(`Skipping ${handlerPath}: No valid handler function found`);
        continue;
      }
      
      // Extract route metadata (from JSDoc comment or filename)
      const metadata = extractMetadata(handlerPath, module);
      
      // Register the handler
      const method = metadata.method || 'GET';
      const route = basePath + (metadata.route || inferRouteFromPath(handlerPath, handlersDir));
      
      switch (method.toUpperCase()) {
        case 'GET':
          app.get(route, handler);
          break;
        case 'POST':
          app.post(route, handler);
          break;
        case 'PUT':
          app.put(route, handler);
          break;
        case 'PATCH':
          app.patch(route, handler);
          break;
        case 'DELETE':
          app.delete(route, handler);
          break;
        default:
          console.warn(`Unknown HTTP method ${method} for ${handlerPath}`);
      }
      
      if (verbose) {
        console.log(`Registered ${method} ${route} from ${handlerPath}`);
      }
    } catch (error) {
      console.error(`Failed to load handler ${handlerPath}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Extract metadata from handler module
 */
function extractMetadata(
  filePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: any
): { method?: string; route?: string } {
  // Check for explicit metadata export
  if (module.metadata) {
    return module.metadata;
  }
  
  // Check for JSDoc-style comments (would need to parse file content)
  // For now, rely on filename conventions
  
  return {};
}

/**
 * Infer route from file path
 * 
 * @example
 * ```
 * './src/handlers/hello.ts' → '/hello'
 * './src/handlers/users/create.ts' → '/users/create'
 * './src/handlers/api/v1/posts.ts' → '/api/v1/posts'
 * ```
 */
function inferRouteFromPath(filePath: string, baseDir: string): string {
  // Remove base directory and extension
  let route = filePath
    .replace(baseDir, '')
    .replace(/\\/g, '/') // Normalize path separators
    .replace(/\.(ts|js|mts|mjs)$/, '');
  
  // Remove leading slash if present
  if (route.startsWith('/')) {
    route = route.slice(1);
  }
  
  // Convert to route format
  return '/' + route;
}
