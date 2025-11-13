/**
 * @module playground/logger
 * @description Logger utility for Playground module
 */

export interface LoggerOptions {
  name?: string;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

/**
 * Create a simple console logger
 */
export function createLogger(options: LoggerOptions = {}) {
  const name = options.name || 'gati-playground';

  return {
    info: (...args: any[]) => console.log(`[${name}] INFO:`, ...args),
    warn: (...args: any[]) => console.warn(`[${name}] WARN:`, ...args),
    error: (...args: any[]) => console.error(`[${name}] ERROR:`, ...args),
    debug: (...args: any[]) => console.log(`[${name}] DEBUG:`, ...args),
  };
}
