/**
 * @module runtime/patterns/builder
 * @description Builder pattern for fluent handler configuration
 */

import type { Handler } from '../types/handler.js';
import type { PropertyMiddleware } from '../middleware/property-based.js';
import type { GType } from '../gtype/schema.js';
import { parseObjectSchema } from '../validation/string-schema.js';

/**
 * Handler builder for fluent API
 */
export class HandlerBuilder<INPUT = unknown, OUTPUT = unknown, PARAMS = any, QUERY = any> {
  private _handler?: Handler<INPUT, OUTPUT, PARAMS, QUERY>;
  private _middleware: PropertyMiddleware = {};
  private _inputSchema?: GType;
  private _outputSchema?: GType;

  /**
   * Enable authentication
   */
  auth(enabled = true): this {
    this._middleware.auth = enabled;
    return this;
  }

  /**
   * Set cache duration
   */
  cache(seconds: number): this {
    this._middleware.cache = seconds;
    return this;
  }

  /**
   * Set rate limit
   */
  rateLimit(requestsPerMinute: number): this {
    this._middleware.rateLimit = requestsPerMinute;
    return this;
  }

  /**
   * Enable CORS
   */
  cors(enabled = true): this {
    this._middleware.cors = enabled;
    return this;
  }

  /**
   * Validate input with string schema
   */
  validate(schema: Record<string, string>): this {
    this._inputSchema = parseObjectSchema(schema);
    return this;
  }

  /**
   * Set handler function
   */
  handle(handler: Handler<INPUT, OUTPUT, PARAMS, QUERY>): Handler<INPUT, OUTPUT, PARAMS, QUERY> {
    this._handler = handler;
    
    // Attach middleware properties to handler
    Object.assign(handler, this._middleware);
    
    // Attach schemas if needed
    if (this._inputSchema) {
      (handler as any).inputSchema = this._inputSchema;
    }
    if (this._outputSchema) {
      (handler as any).outputSchema = this._outputSchema;
    }
    
    return handler;
  }
}

/**
 * Create a new handler builder
 */
export function handler<INPUT = unknown, OUTPUT = unknown, PARAMS = any, QUERY = any>(): HandlerBuilder<INPUT, OUTPUT, PARAMS, QUERY> {
  return new HandlerBuilder<INPUT, OUTPUT, PARAMS, QUERY>();
}
