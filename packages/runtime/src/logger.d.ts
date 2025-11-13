import pino from 'pino';
export interface LoggerOptions {
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    pretty?: boolean;
    name?: string;
}
export declare function createLogger(options?: LoggerOptions): pino.Logger<never, boolean>;
export declare const logger: pino.Logger<never, boolean>;
