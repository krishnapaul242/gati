import type { Handler } from './handler.js';
import type { HttpMethod } from './request.js';
export interface Route {
    method: HttpMethod;
    path: string;
    handler: Handler;
    pattern?: RoutePattern;
}
export interface RoutePattern {
    regex: RegExp;
    paramNames: string[];
    path: string;
}
export interface RouteMatch {
    route: Route;
    params: Record<string, string>;
}
export interface RouteOptions {
    path: string;
    handler: Handler;
    method?: HttpMethod;
}
export interface RouterConfig {
    strict?: boolean;
    caseSensitive?: boolean;
    notFoundHandler?: Handler;
}
