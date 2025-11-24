/**
 * @module contracts/observability/logging
 * @description Logging provider contract for structured logging
 */

/**
 * Logger interface for structured logging
 */
export interface ILogger {
  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void;
  
  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void;
  
  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void;
  
  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void;
  
  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): ILogger;
}

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  /** Provider type */
  provider: 'pino' | 'winston' | 'loki' | 'cloudwatch' | 'mock';
  
  /** Log level */
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  
  /** Pretty print for development */
  pretty?: boolean;
  
  /** Log destination (file path, URL, etc.) */
  destination?: string;
}
