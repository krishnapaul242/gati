/**
 * @module runtime/types/context
 * @description Type definitions for global and local context in Gati framework
 */
/**
 * Module registry for dependency injection
 */
export interface ModuleRegistry {
    [moduleName: string]: unknown;
}
/**
 * Global context (gctx) - shared across all requests
 * Provides access to modules, database connections, and other shared resources
 */
export interface GlobalContext {
    /**
     * Module registry for dependency injection
     */
    modules: ModuleRegistry;
    /**
     * Application configuration
     */
    config: Record<string, unknown>;
    /**
     * Shared state accessible across all requests
     */
    state: Record<string, unknown>;
    /**
     * Lifecycle hooks
     */
    lifecycle: {
        /**
         * Register a cleanup function to be called on shutdown
         */
        onShutdown: (fn: () => void | Promise<void>) => void;
        /**
         * Check if the context is shutting down
         */
        isShuttingDown: () => boolean;
    };
}
/**
 * Local context (lctx) - scoped to a single request
 * Provides request-specific data and cleanup mechanisms
 */
export interface LocalContext {
    /**
     * Unique identifier for this request
     */
    requestId: string;
    /**
     * Request timestamp (milliseconds since epoch)
     */
    timestamp: number;
    /**
     * Request-scoped state
     */
    state: Record<string, unknown>;
    /**
     * Lifecycle hooks for request cleanup
     */
    lifecycle: {
        /**
         * Register a cleanup function to be called when request completes
         */
        onCleanup: (fn: () => void | Promise<void>) => void;
        /**
         * Check if the context is being cleaned up
         */
        isCleaningUp: () => boolean;
    };
}
/**
 * Options for creating a global context
 */
export interface GlobalContextOptions {
    /**
     * Initial module registry
     */
    modules?: ModuleRegistry;
    /**
     * Application configuration
     */
    config?: Record<string, unknown>;
    /**
     * Initial shared state
     */
    state?: Record<string, unknown>;
}
/**
 * Options for creating a local context
 */
export interface LocalContextOptions {
    /**
     * Custom request ID (auto-generated if not provided)
     */
    requestId?: string;
    /**
     * Initial request-scoped state
     */
    state?: Record<string, unknown>;
}
//# sourceMappingURL=context.d.ts.map