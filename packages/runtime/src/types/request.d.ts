import type { IncomingMessage } from 'http';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export interface HttpHeaders {
    [key: string]: string | string[] | undefined;
}
export interface QueryParams {
    [key: string]: string | string[];
}
export interface PathParams {
    [key: string]: string;
}
export interface Request {
    method: HttpMethod;
    path: string;
    query: QueryParams;
    params: PathParams;
    headers: HttpHeaders;
    body: unknown;
    rawBody?: string | Buffer;
    raw: IncomingMessage;
}
export interface RequestOptions {
    method: HttpMethod;
    path: string;
    query?: QueryParams;
    params?: PathParams;
    headers?: HttpHeaders;
    body?: unknown;
    rawBody?: string | Buffer;
    raw: IncomingMessage;
}
