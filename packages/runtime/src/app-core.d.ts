import type { RouteManager } from './route-manager.js';
import type { Handler, GlobalContext, Middleware, ErrorMiddleware } from './types/index.js';
import type { LoggerOptions } from './logger.js';
export interface AppConfig {
    port?: number;
    host?: string;
    timeout?: number;
    logging?: boolean;
    logger?: LoggerOptions;
    cluster?: {
        enabled: boolean;
        workers?: number;
    };
    performance?: {
        keepAliveTimeout: number;
        maxConnections: number;
        compression: boolean;
        bodyLimit: string;
    };
    tracing?: {
        enabled: boolean;
        serviceName: string;
        endpoint?: string;
    };
    services?: {
        redis?: {
            url: string;
            poolSize: number;
        };
        database?: {
            url: string;
            poolMin: number;
            poolMax: number;
        };
    };
    instance?: {
        id: string;
        region: string;
        zone: string;
    };
}
export declare class GatiApp {
    private server;
    private router;
    private middleware;
    private gctx;
    private config;
    private isShuttingDown;
    private activeRequests;
    private logger;
    constructor(config?: AppConfig);
    use(middleware: Middleware): void;
    useError(middleware: ErrorMiddleware): void;
    get(path: string, handler: Handler): void;
    post(path: string, handler: Handler): void;
    put(path: string, handler: Handler): void;
    patch(path: string, handler: Handler): void;
    delete(path: string, handler: Handler): void;
    registerRoute(method: string, path: string, handler: Handler): void;
    unregisterRoute(method: string, path: string): void;
    listen(): Promise<void>;
    close(): Promise<void>;
    private parseRequestBody;
    private handleRequest;
    private createLoggingMiddleware;
    private createDefaultErrorHandler;
    getConfig(): Readonly<AppConfig>;
    isRunning(): boolean;
    getGlobalContext(): GlobalContext;
    getRouteManager(): RouteManager;
    private extractSessionFromCookie;
}
export declare function createApp(config?: AppConfig): GatiApp;
