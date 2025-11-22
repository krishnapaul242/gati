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
  Request,
  Response,
} from '@gati-framework/core';

// Runtime-specific types (extended from core)
export type {
  Handler,
} from './types/handler.js';
export type {
  GlobalContext,
  LocalContext,
} from './types/context.js';

// Runtime-specific exports
export { HandlerError } from './types/handler.js';
export type { HandlerExecutionOptions } from './types/handler.js';

// Hot loading system
export { HotLoader } from './hot-loader.js';
export type { HotLoaderOptions } from './hot-loader.js';

// Runtime-specific types
export type { Middleware, ErrorMiddleware } from './middleware.js';
export type { RouteManager } from './route-manager.js';
export type { MiddlewareManager } from './middleware.js';

// Lifecycle management
export { LifecycleManager, RequestLifecycleManager } from './lifecycle-manager.js';
export { LifecyclePriority, RequestPhase } from './types/context.js';
export type { LifecycleHook, HealthStatus, LifecycleCoordinator } from './types/context.js';

// Coordinators
export { ConsulCoordinator } from './coordinators/consul-coordinator.js';
export type { ConsulConfig } from './coordinators/consul-coordinator.js';
export { DefaultWebSocketCoordinator } from './websocket-coordinator.js';
export type { WebSocketCoordinator, WebSocketEvent } from './websocket-coordinator.js';
export type { WebSocketCoordinator as WSCoordinator, WebSocketEvent as WSEvent } from './types/context.js';

// Type schema system
export { generateTypes } from './types/schema.js';
export type { TypeSchema, StateSchema, ModuleSchema } from './types/schema.js';

// GType validation system
export {
  // Schema builders
  primitive,
  literal,
  object,
  array,
  tuple,
  union,
  intersection,
  enumType,
  GTypes,
  // Validator
  validate,
  // Error utilities
  createValidationError,
  formatValidationErrors,
  formatPath,
  formatValue,
  validResult,
  invalidResult,
  mergeResults,
  ValidationException,
} from './gtype/index.js';

export type {
  // Schema types
  GType,
  GTypeKind,
  GTypePrimitive,
  GTypeLiteral,
  GTypeObject,
  GTypeArray,
  GTypeTuple,
  GTypeUnion,
  GTypeIntersection,
  GTypeEnum,
  GTypeBase,
  GTypeSchema,
  GTypeRef,
  PrimitiveKind,
  Validator,
  ValidatorType,
  // Error types
  ValidationError,
  ValidationResult,
  PathSegment,
} from './gtype/index.js';
