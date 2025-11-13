import type { GatiApp } from './app-core.js';
export interface HotLoaderOptions {
    srcDir: string;
    enabled: boolean;
}
export declare class HotLoader {
    private app;
    private srcDir;
    private watcher?;
    private handlerCache;
    constructor(app: GatiApp, options: HotLoaderOptions);
    private startWatching;
    private loadHandler;
    private reloadHandler;
    private unloadHandler;
    private findHandler;
    private pathToRoute;
    private buildFullRoute;
    stop(): void;
}
