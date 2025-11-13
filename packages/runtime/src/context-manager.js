import { createGlobalContext, shutdownGlobalContext } from './global-context.js';
import { createLocalContext, cleanupLocalContext } from './local-context.js';
export { createGlobalContext, createLocalContext };
export { shutdownGlobalContext, cleanupLocalContext };
export { registerModule, getModule } from './global-context.js';
export { setState, getState } from './local-context.js';
export class ContextManager {
    gctx = null;
    initializeGlobalContext(options = {}) {
        if (this.gctx) {
            throw new Error('Global context is already initialized');
        }
        this.gctx = createGlobalContext(options);
        return this.gctx;
    }
    getGlobalContext() {
        return this.gctx;
    }
    createRequestContext(options = {}) {
        return createLocalContext(options);
    }
    async cleanupRequestContext(lctx) {
        await cleanupLocalContext(lctx);
    }
    async shutdown() {
        if (this.gctx) {
            await shutdownGlobalContext(this.gctx);
            this.gctx = null;
        }
    }
}
export function createContextManager() {
    return new ContextManager();
}
