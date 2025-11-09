/**
 * @module runtime
 * @description Gati Runtime - Execution engine for handler-based applications
 */

// Main application class
export { GatiApp, createApp } from './app-core.js';
export type { AppConfig } from './app-core.js';

// Handler loader utilities
export { loadHandlers, discoverHandlers } from './loader.js';

// Middleware utilities
export { createCorsMiddleware } from './middleware/cors.js';
export type { CorsOptions } from './middleware/cors.js';

// Logger utilities
export { createLogger, logger } from './logger.js';
export type { LoggerOptions } from './logger.js';

// Core types re-exported from @gati-framework/core
export type {
  Handler,
  Request,
  Response,
  GlobalContext,
  LocalContext,
} from '@gati-framework/core';

// Runtime-specific types
export type { Middleware, ErrorMiddleware } from './middleware.js';
export type { RouteManager } from './route-manager.js';
export type { MiddlewareManager } from './middleware.js';
