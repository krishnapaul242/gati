/**
 * @module runtime/types/response
 * @description HTTP response abstraction for Gati framework
 */

import type { ServerResponse } from 'http';

/**
 * HTTP status codes (common ones)
 */
export type HttpStatusCode = number;

/**
 * HTTP headers as key-value pairs
 */
export interface HttpHeaders {
  [key: string]: string | string[] | number;
}

/**
 * Response object - abstraction over Node.js ServerResponse
 * Provides HTTP response capabilities to handlers
 */
export interface Response {
  /**
   * Set HTTP status code
   *
   * @param code - HTTP status code (e.g., 200, 404, 500)
   * @returns Response object for chaining
   *
   * @example
   * ```typescript
   * res.status(200).json({ ok: true });
   * ```
   */
  status: (code: HttpStatusCode) => Response;

  /**
   * Set a single HTTP header
   *
   * @param name - Header name
   * @param value - Header value
   * @returns Response object for chaining
   *
   * @example
   * ```typescript
   * res.header('Content-Type', 'application/json');
   * ```
   */
  header: (name: string, value: string | string[] | number) => Response;

  /**
   * Set multiple HTTP headers
   *
   * @param headers - Object with header key-value pairs
   * @returns Response object for chaining
   *
   * @example
   * ```typescript
   * res.headers({
   *   'Content-Type': 'application/json',
   *   'Cache-Control': 'no-cache'
   * });
   * ```
   */
  headers: (headers: HttpHeaders) => Response;

  /**
   * Send JSON response
   *
   * @param data - Data to serialize as JSON
   * @returns void
   *
   * @example
   * ```typescript
   * res.json({ user: { id: '123', name: 'Alice' } });
   * ```
   */
  json: (data: unknown) => void;

  /**
   * Send plain text response
   *
   * @param data - Text to send
   * @returns void
   *
   * @example
   * ```typescript
   * res.text('Hello, World!');
   * ```
   */
  text: (data: string) => void;

  /**
   * Send raw response body
   *
   * @param data - Data to send (string or Buffer)
   * @returns void
   *
   * @example
   * ```typescript
   * res.send(Buffer.from('binary data'));
   * ```
   */
  send: (data: string | Buffer) => void;

  /**
   * End the response without sending data
   *
   * @returns void
   *
   * @example
   * ```typescript
   * res.status(204).end();
   * ```
   */
  end: () => void;

  /**
   * Original Node.js ServerResponse
   */
  raw: ServerResponse;

  /**
   * Check if response has been sent
   */
  isSent: () => boolean;

  /**
   * Check if headers have been sent to the client
   */
  headersSent: boolean;
}

/**
 * Options for creating a Response object
 */
export interface ResponseOptions {
  /**
   * Original Node.js ServerResponse
   */
  raw: ServerResponse;
}
