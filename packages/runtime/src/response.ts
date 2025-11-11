/**
 * @module runtime/response
 * @description Response object factory for Gati framework
 */

import type { Response, ResponseOptions, HttpHeaders } from './types/response.js';

/**
 * Create a Response object from ResponseOptions
 *
 * @param options - Response creation options
 * @returns Response object
 *
 * @example
 * ```typescript
 * const res = createResponse({ raw: serverResponse });
 * res.status(200).json({ ok: true });
 * ```
 */
export function createResponse(options: ResponseOptions): Response {
  const { raw } = options;
  let sent = false;

  const response: Response = {
    status(code: number): Response {
      raw.statusCode = code;
      return response;
    },

    header(name: string, value: string | string[] | number): Response {
      raw.setHeader(name, value);
      return response;
    },

    headers(headers: HttpHeaders): Response {
      for (const [name, value] of Object.entries(headers)) {
        raw.setHeader(name, value);
      }
      return response;
    },

    json(data: unknown): void {
      if (sent) {
        throw new Error('Response already sent');
      }

      const body = JSON.stringify(data);
      raw.setHeader('Content-Type', 'application/json');
      raw.setHeader('Content-Length', Buffer.byteLength(body));
      raw.end(body);
      sent = true;
    },

    text(data: string): void {
      if (sent) {
        throw new Error('Response already sent');
      }

      raw.setHeader('Content-Type', 'text/plain');
      raw.setHeader('Content-Length', Buffer.byteLength(data));
      raw.end(data);
      sent = true;
    },

    send(data: string | Buffer): void {
      if (sent) {
        throw new Error('Response already sent');
      }

      if (Buffer.isBuffer(data)) {
        raw.setHeader('Content-Length', data.length);
      } else {
        raw.setHeader('Content-Length', Buffer.byteLength(data));
      }

      raw.end(data);
      sent = true;
    },

    end(): void {
      if (sent) {
        throw new Error('Response already sent');
      }

      raw.end();
      sent = true;
    },

    isSent(): boolean {
      return sent;
    },

    get headersSent(): boolean {
      return raw.headersSent;
    },

    raw,
  };

  return response;
}
