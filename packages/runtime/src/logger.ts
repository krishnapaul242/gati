/**
 * @module runtime/logger
 * @description Structured logging utility using pino
 */

import pino from 'pino';

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /**
   * Logging level
   * @default 'info' in production, 'debug' in development
   */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  /**
   * Enable pretty printing (development mode)
   * @default true if NODE_ENV !== 'production'
   */
  pretty?: boolean;

  /**
   * Logger name/context
   */
  name?: string;
}

/**
 * Create a logger instance
 *
 * @param options - Logger configuration
 * @returns Pino logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({ name: 'gati-app' });
 * logger.info({ requestId: '123' }, 'Request started');
 * logger.error({ error }, 'Request failed');
 * ```
 */
export function createLogger(options: LoggerOptions = {}) {
  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  const level = options.level || (isDevelopment ? 'debug' : 'info');
  const pretty = options.pretty ?? isDevelopment;

  const config: pino.LoggerOptions = {
    level,
    ...(options.name && { name: options.name }),
  };

  // Pretty printing for development
  if (pretty) {
    return pino({
      ...config,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  // JSON logging for production
  return pino(config);
}

/**
 * Default logger instance
 */
export const logger = createLogger({ name: 'gati-runtime' });
