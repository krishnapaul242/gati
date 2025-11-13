import type { GlobalContext, GlobalContextOptions } from './types/context.js';
import type { ModuleLoader } from './module-loader.js';
export interface ExtendedGlobalContextOptions extends GlobalContextOptions {
    moduleLoader?: ModuleLoader;
    coordinator?: import('./types/context.js').LifecycleCoordinator;
}
export declare function createGlobalContext(options?: ExtendedGlobalContextOptions): GlobalContext;
export declare function registerModule(gctx: GlobalContext, name: string, module: unknown): void;
export declare function getModule<T = unknown>(gctx: GlobalContext, name: string): T | undefined;
export declare function shutdownGlobalContext(gctx: GlobalContext): Promise<void>;
export declare function getModuleLoader(gctx: GlobalContext): ModuleLoader;
