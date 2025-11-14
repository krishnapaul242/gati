/**
 * @module observability/loki
 * @description Loki log aggregation integration
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';

/**
 * Loki configuration
 */
export interface LokiConfig {
  /** Loki server URL */
  host: string;
  /** Basic auth credentials */
  basicAuth?: string;
  /** Labels to attach to all logs */
  labels?: Record<string, string>;
  /** Batch size for logs */
  batching?: boolean;
  /** Batch interval in milliseconds */
  interval?: number;
}

/**
 * Loki logger manager
 */
export class LokiLogger {
  private logger: winston.Logger;
  private lokiTransport: LokiTransport;

  constructor(config: LokiConfig) {
    this.lokiTransport = new LokiTransport({
      host: config.host,
      basicAuth: config.basicAuth,
      labels: {
        app: 'gati',
        ...config.labels,
      },
      batching: config.batching !== false,
      interval: config.interval || 5000,
      json: true,
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        this.lokiTransport,
        // Also log to console for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, meta?: Record<string, any>): void {
    this.logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Create child logger with additional labels
   */
  child(labels: Record<string, string>): LokiLogger {
    const childLogger = new LokiLogger({
      host: this.lokiTransport.options.host,
      basicAuth: this.lokiTransport.options.basicAuth,
      labels: {
        ...this.lokiTransport.options.labels,
        ...labels,
      },
      batching: this.lokiTransport.options.batching,
      interval: this.lokiTransport.options.interval,
    });

    return childLogger;
  }

  /**
   * Flush pending logs
   */
  async flush(): Promise<void> {
    await new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

/**
 * Create Loki middleware for request logging
 */
export function createLokiMiddleware(logger: LokiLogger) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      
      logger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
    });

    next();
  };
}
