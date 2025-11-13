import type { Route, RouteMatch, RouterConfig } from './types/route.js';
import type { Handler } from './types/handler.js';
import type { HttpMethod } from './types/request.js';
export declare class RouteManager {
    private routes;
    constructor(_config?: RouterConfig);
    register(method: HttpMethod, path: string, handler: Handler): void;
    get(path: string, handler: Handler): void;
    post(path: string, handler: Handler): void;
    put(path: string, handler: Handler): void;
    patch(path: string, handler: Handler): void;
    delete(path: string, handler: Handler): void;
    head(path: string, handler: Handler): void;
    options(path: string, handler: Handler): void;
    match(method: HttpMethod, path: string): RouteMatch | null;
    getRoutes(): Route[];
    unregister(method: HttpMethod, path: string): void;
    clear(): void;
    size(): number;
}
export declare function createRouteManager(config?: RouterConfig): RouteManager;
