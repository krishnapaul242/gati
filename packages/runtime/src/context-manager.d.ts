import type { GlobalContext, LocalContext } from './types/context.js';
import { createGlobalContext, shutdownGlobalContext } from './global-context.js';
import { createLocalContext, cleanupLocalContext } from './local-context.js';
export { createGlobalContext, createLocalContext };
export { shutdownGlobalContext, cleanupLocalContext };
export { registerModule, getModule } from './global-context.js';
export { setState, getState } from './local-context.js';
export declare class ContextManager {
    private gctx;
    initializeGlobalContext(options?: {}): GlobalContext;
    getGlobalContext(): GlobalContext | null;
    createRequestContext(options?: {}): LocalContext;
    cleanupRequestContext(lctx: LocalContext): Promise<void>;
    shutdown(): Promise<void>;
}
export declare function createContextManager(): ContextManager;
