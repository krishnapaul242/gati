/**
 * @module examples/hello-world/modules/logger
 * @description Simple logging module demonstrating module pattern and dependency injection
 */

import type { GlobalContext } from '../../../../src/runtime/types/context';

/**
 * Logger module interface
 */
export interface Logger {
  /**
   * Log an info message
   */
  log: (message: string) => void;

  /**
   * Log an error message
   */
  error: (message: string, error?: Error) => void;

  /**
   * Log a warning message
   */
  warn: (message: string) => void;
}

/**
 * Logger module options
 */
export interface LoggerOptions {
  /**
   * Log level (0 = none, 1 = error, 2 = warn, 3 = info)
   */
  level?: number;

  /**
   * Prefix for all log messages
   */
  prefix?: string;
}

/**
 * Create a logger module instance
 * Demonstrates module initialization pattern
 *
 * @param options - Logger configuration
 * @returns Logger module instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({ prefix: '[MyApp]', level: 3 });
 * logger.log('Application started');
 * logger.error('Something went wrong', new Error('Failed'));
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { level = 3, prefix = '[Gati]' } = options;

  /* eslint-disable no-console */
  return {
    log: (message: string) => {
      if (level >= 3) {
        console.log(`${prefix} [INFO] ${message}`);
      }
    },

    error: (message: string, error?: Error) => {
      if (level >= 1) {
        console.error(`${prefix} [ERROR] ${message}`);
        if (error) {
          console.error(error);
        }
      }
    },

    warn: (message: string) => {
      if (level >= 2) {
        console.warn(`${prefix} [WARN] ${message}`);
      }
    },
  };
  /* eslint-enable no-console */
}

/**
 * Initialize logger module for Gati global context
 * Demonstrates module lifecycle pattern
 *
 * @param gctx - Global context
 * @returns Logger module instance
 */
export function initLogger(gctx: GlobalContext): Logger {
  const logger = createLogger({
    prefix: '[HelloWorld]',
    level: 3,
  });

  // Log initialization
  logger.log('Logger module initialized');

  // Register cleanup handler
  gctx.lifecycle.onShutdown(() => {
    logger.log('Logger module shutting down');
  });

  return logger;
}
