import type { GatiApp } from './app-core.js';
import type { Handler } from './types/handler.js';
export interface HandlerFile {
    path: string;
    handler: Handler;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    route?: string;
}
export declare function discoverHandlers(dir: string): Promise<string[]>;
export declare function loadHandlers(app: GatiApp, handlersDir: string, options?: {
    basePath?: string;
    verbose?: boolean;
}): Promise<void>;
