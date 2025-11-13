import type { Middleware } from '../types/middleware.js';
export interface CorsOptions {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
export declare function createCorsMiddleware(options?: CorsOptions): Middleware;
