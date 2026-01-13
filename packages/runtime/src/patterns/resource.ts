/**
 * @module runtime/patterns/resource
 * @description Resource pattern for convention-based CRUD operations
 */

import type { Handler } from '../types/handler.js';

/**
 * Resource definition with CRUD operations
 */
export interface Resource<T = any> {
  /** List all items */
  list?: Handler;
  /** Get single item by ID */
  get?: Handler;
  /** Create new item */
  create?: Handler;
  /** Update existing item */
  update?: Handler;
  /** Delete item */
  delete?: Handler;
}

/**
 * Resource configuration
 */
export interface ResourceConfig {
  /** Resource name (e.g., 'users', 'posts') */
  name: string;
  /** Base path (default: /api/{name}) */
  basePath?: string;
}

/**
 * Generated routes from resource
 */
export interface ResourceRoutes {
  /** GET /api/{name} */
  list?: { path: string; method: 'GET'; handler: Handler };
  /** GET /api/{name}/:id */
  get?: { path: string; method: 'GET'; handler: Handler };
  /** POST /api/{name} */
  create?: { path: string; method: 'POST'; handler: Handler };
  /** PUT /api/{name}/:id */
  update?: { path: string; method: 'PUT'; handler: Handler };
  /** DELETE /api/{name}/:id */
  delete?: { path: string; method: 'DELETE'; handler: Handler };
}

/**
 * Check if export is a resource definition
 */
export function isResource(value: unknown): value is Resource {
  if (typeof value !== 'object' || value === null) return false;
  
  const resource = value as Resource;
  const hasMethod = ['list', 'get', 'create', 'update', 'delete'].some(
    key => typeof resource[key as keyof Resource] === 'function'
  );
  
  return hasMethod;
}

/**
 * Generate routes from resource definition
 */
export function generateResourceRoutes(
  resource: Resource,
  config: ResourceConfig
): ResourceRoutes {
  const basePath = config.basePath || `/api/${config.name}`;
  const routes: ResourceRoutes = {};
  
  if (resource.list) {
    routes.list = {
      path: basePath,
      method: 'GET',
      handler: resource.list,
    };
  }
  
  if (resource.get) {
    routes.get = {
      path: `${basePath}/[id]`,
      method: 'GET',
      handler: resource.get,
    };
  }
  
  if (resource.create) {
    routes.create = {
      path: basePath,
      method: 'POST',
      handler: resource.create,
    };
  }
  
  if (resource.update) {
    routes.update = {
      path: `${basePath}/[id]`,
      method: 'PUT',
      handler: resource.update,
    };
  }
  
  if (resource.delete) {
    routes.delete = {
      path: `${basePath}/[id]`,
      method: 'DELETE',
      handler: resource.delete,
    };
  }
  
  return routes;
}

/**
 * Extract resource name from file path
 */
export function extractResourceName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(ts|js)$/, '');
}
