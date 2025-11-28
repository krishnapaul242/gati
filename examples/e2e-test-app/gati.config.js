/**
 * @module examples/hello-world/gati.config
 * @description Gati configuration for Hello World example
 */
import { helloHandler, helloNameHandler } from './src/handlers/hello';
import { getUserHandler, listUsersHandler } from './src/handlers/user';
import { initLogger } from './src/modules/logger';
/**
 * Gati application configuration
 */
export default {
    /**
     * Server configuration
     */
    server: {
        port: 3000,
        host: 'localhost',
    },
    /**
     * Route definitions
     * Maps HTTP method and path to handler functions
     */
    routes: [
        // Hello World routes
        {
            method: 'GET',
            path: '/hello',
            handler: helloHandler,
        },
        {
            method: 'GET',
            path: '/hello/name/:name',
            handler: helloNameHandler,
        },
        // User routes
        {
            method: 'GET',
            path: '/user/:id',
            handler: getUserHandler,
        },
        {
            method: 'GET',
            path: '/users',
            handler: listUsersHandler,
        },
    ],
    /**
     * Module initialization
     * Modules are loaded into global context before server starts
     */
    modules: (gctx) => {
        // Initialize logger module
        gctx.modules['logger'] = initLogger(gctx);
        // You can initialize more modules here
        // Example:
        // gctx.modules['db'] = initDatabase(gctx);
        // gctx.modules['cache'] = initCache(gctx);
    },
    /**
     * Application-level configuration
     */
    config: {
        name: 'hello-world',
        version: '1.0.0',
        env: process.env['NODE_ENV'] || 'development',
    },
};
//# sourceMappingURL=gati.config.js.map