/**
 * @module observability/adapters/winston-loki
 * @description Winston + Loki adapter implementing ILogger contract
 */

import type { ILogger } from '@gati-framework/contracts';
import { LokiLogger } from '../loki/logger.js';

/**
 * Winston + Loki adapter for structured logging
 */
export class WinstonLokiAdapter implements ILogger {
  constructor(private logger: LokiLogger) {}

  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    const error = context?.['error'] instanceof Error ? context['error'] : undefined;
    this.logger.error(message, error, context);
  }

  child(context: Record<string, any>): ILogger {
    const childLogger = this.logger.child(context);
    return new WinstonLokiAdapter(childLogger);
  }

  /**
   * Get the underlying LokiLogger instance
   */
  getLokiLogger(): LokiLogger {
    return this.logger;
  }
}
