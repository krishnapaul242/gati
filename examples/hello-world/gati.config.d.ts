/**
 * @module examples/hello-world/gati.config
 * @description Gati configuration for Hello World example
 */
import type { GlobalContext } from '../../src/runtime/types/context';
/**
 * Gati application configuration
 */
declare const _default: {
    /**
     * Server configuration
     */
    server: {
        port: number;
        host: string;
    };
    /**
     * Route definitions
     * Maps HTTP method and path to handler functions
     */
    routes: {
        method: string;
        path: string;
        handler: import("../../src/runtime/types/handler").Handler;
    }[];
    /**
     * Module initialization
     * Modules are loaded into global context before server starts
     */
    modules: (gctx: GlobalContext) => void;
    /**
     * Application-level configuration
     */
    config: {
        name: string;
        version: string;
        env: string;
    };
};
export default _default;
//# sourceMappingURL=gati.config.d.ts.map