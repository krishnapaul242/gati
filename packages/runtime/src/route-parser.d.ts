import type { RoutePattern } from './types/route.js';
export declare function parseRoute(path: string): RoutePattern;
export declare function normalizePath(path: string): string;
export declare function extractParams(path: string, pattern: RoutePattern): Record<string, string> | null;
export declare function matchPath(path: string, pattern: RoutePattern): boolean;
