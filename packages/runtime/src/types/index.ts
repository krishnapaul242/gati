/**
 * @module runtime/types
 * @description Core type definitions for Gati framework
 */

export type {
  ModuleRegistry,
  GlobalContext,
  LocalContext,
  GlobalContextOptions,
  LocalContextOptions,
} from './context.js';

export type {
  HttpMethod,
  HttpHeaders as RequestHeaders,
  QueryParams,
  PathParams,
  Request,
  RequestOptions,
} from './request.js';

export type {
  HttpStatusCode,
  HttpHeaders as ResponseHeaders,
  Response,
  ResponseOptions,
} from './response.js';

export type { Handler, HandlerExecutionOptions } from './handler.js';
export { HandlerError } from './handler.js';

export type {
  Route,
  RoutePattern,
  RouteMatch,
  RouteOptions,
  RouterConfig,
} from './route.js';

export type {
  Middleware,
  ErrorMiddleware,
  NextFunction,
  MiddlewareOptions,
  MiddlewareEntry,
} from './middleware.js';

export type {
  Module,
  ModuleState,
  ModuleMetadata,
  ModuleLoaderConfig,
} from './module.js';

export {
  ModuleError,
  CircularDependencyError,
  ModuleNotFoundError,
  ModuleInitializationError,
} from './module.js';

export type {
  AuthMethod,
  AuthResult,
  NormalizedHeaders,
  RequestDescriptor,
  RequestIdMetadata,
  IngressConfig,
  QueueFabric,
  IngressComponent,
} from './ingress.js';

export type {
  ManifestStore,
  HandlerManifest,
  GType,
  GTypeKind,
  GTypeProperty,
  PrimitiveType,
  Validator,
  ValidatorType,
  Transformer,
  VersionGraph,
  VersionNode,
  TimescapeMetadata,
} from './manifest-store.js';

export type {
  Secret,
  SecretProvider,
  SecretsManagerConfig,
  SecretAccessRequest,
  SecretAccessResult,
  SecretsManager,
  SecretAuditEntry,
} from './secrets-manager.js';

export { SecretsManagerError } from './secrets-manager.js';
