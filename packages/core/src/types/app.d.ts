/**
 * @module core/types/app
 * @description Application configuration and types for Gati framework
 */
/**
 * Application configuration options
 */
export interface AppConfig {
    /**
     * Port to listen on
     * @default 3000
     */
    port?: number;
    /**
     * Host to bind to
     * @default 'localhost'
     */
    host?: string;
    /**
     * Server timeout in milliseconds
     * @default 30000
     */
    timeout?: number;
    /**
     * Enable request logging
     * @default true
     */
    logging?: boolean;
}
/**
 * Main Gati application interface
 */
export interface GatiApp {
    /**
     * Start the HTTP server
     */
    listen(): Promise<void>;
    /**
     * Stop the HTTP server gracefully
     */
    close(): Promise<void>;
}
//# sourceMappingURL=app.d.ts.map