import type { GlobalContext } from './types/context.js';
import type { Module, ModuleLoaderConfig } from './types/module.js';
export declare class ModuleLoader {
    private registry;
    private config;
    private initializingModules;
    constructor(config?: ModuleLoaderConfig);
    register<T>(module: Module<T>, gctx?: GlobalContext): Promise<void>;
    initialize(name: string, gctx: GlobalContext, dependencyChain?: string[]): Promise<void>;
    get<T>(name: string, gctx?: GlobalContext): Promise<T>;
    getSync<T>(name: string): T;
    shutdown(name: string): Promise<void>;
    shutdownAll(): Promise<void>;
    has(name: string): boolean;
    getModuleNames(): string[];
    getStatistics(): {
        total: number;
        initialized: number;
        uninitialized: number;
        initializing: number;
        error: number;
        shutdown: number;
        totalUsage: number;
    };
    healthCheck(): Promise<Map<string, boolean>>;
}
export declare function createModuleLoader(config?: ModuleLoaderConfig): ModuleLoader;
