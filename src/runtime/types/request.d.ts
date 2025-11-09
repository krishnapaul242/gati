/**
 * @module runtime/types/request
 * @description HTTP request abstraction for Gati framework
 */
import type { IncomingMessage } from 'http';
/**
 * HTTP request methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
/**
 * HTTP headers as key-value pairs
 */
export interface HttpHeaders {
    [key: string]: string | string[] | undefined;
}
/**
 * URL query parameters
 */
export interface QueryParams {
    [key: string]: string | string[] | undefined;
}
/**
 * Route path parameters (e.g., /users/:id -> { id: '123' })
 */
export interface PathParams {
    [key: string]: string;
}
/**
 * Request object - abstraction over Node.js IncomingMessage
 * Provides HTTP request data to handlers
 */
export interface Request {
    /**
     * HTTP method (GET, POST, etc.)
     */
    method: HttpMethod;
    /**
     * Request URL path (e.g., /api/users/123)
     */
    path: string;
    /**
     * URL query parameters
     */
    query: QueryParams;
    /**
     * Route path parameters
     */
    params: PathParams;
    /**
     * HTTP headers
     */
    headers: HttpHeaders;
    /**
     * Request body (parsed)
     */
    body: unknown;
    /**
     * Raw request body (unparsed)
     */
    rawBody?: string | Buffer;
    /**
     * Original Node.js IncomingMessage
     */
    raw: IncomingMessage;
}
/**
 * Options for creating a Request object
 */
export interface RequestOptions {
    /**
     * HTTP method
     */
    method: HttpMethod;
    /**
     * Request URL path
     */
    path: string;
    /**
     * Query parameters
     */
    query?: QueryParams;
    /**
     * Path parameters
     */
    params?: PathParams;
    /**
     * HTTP headers
     */
    headers?: HttpHeaders;
    /**
     * Parsed request body
     */
    body?: unknown;
    /**
     * Raw request body
     */
    rawBody?: string | Buffer;
    /**
     * Original Node.js IncomingMessage
     */
    raw: IncomingMessage;
}
//# sourceMappingURL=request.d.ts.map