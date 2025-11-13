import type { Middleware, ErrorMiddleware, MiddlewareEntry, MiddlewareOptions } from './types/middleware.js';
import type { Request, Response, GlobalContext, LocalContext } from './types/index.js';
export type { Middleware, ErrorMiddleware } from './types/middleware.js';
export declare class MiddlewareManager {
    private middlewares;
    private errorMiddlewares;
    use(middleware: Middleware, options?: MiddlewareOptions): void;
    useError(middleware: ErrorMiddleware): void;
    execute(req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, handler: () => Promise<void> | void): Promise<void>;
    private handleError;
    private getApplicableMiddlewares;
    private matchPath;
    private patternToRegex;
    private sortMiddlewares;
    getMiddlewares(): MiddlewareEntry[];
    clear(): void;
    size(): number;
}
export declare function createMiddlewareManager(): MiddlewareManager;
