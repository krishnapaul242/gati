import type { Request } from './request.js';
import type { Response } from './response.js';
import type { GlobalContext, LocalContext } from './context.js';
export type NextFunction = () => Promise<void> | void;
export type Middleware = (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next: NextFunction) => Promise<void> | void;
export type ErrorMiddleware = (error: Error, req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext) => Promise<void> | void;
export interface MiddlewareOptions {
    path?: string;
    methods?: string[];
    priority?: number;
}
export interface MiddlewareEntry {
    middleware: Middleware;
    options: MiddlewareOptions;
}
