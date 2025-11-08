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
} from './context';

export type {
  HttpMethod,
  HttpHeaders as RequestHeaders,
  QueryParams,
  PathParams,
  Request,
  RequestOptions,
} from './request';

export type {
  HttpStatusCode,
  HttpHeaders as ResponseHeaders,
  Response,
  ResponseOptions,
} from './response';

export type { Handler, HandlerExecutionOptions } from './handler';
export { HandlerError } from './handler';
