import type { ServerResponse } from 'http';
export type HttpStatusCode = number;
export interface HttpHeaders {
    [key: string]: string | string[] | number;
}
export interface Response {
    status: (code: HttpStatusCode) => Response;
    header: (name: string, value: string | string[] | number) => Response;
    headers: (headers: HttpHeaders) => Response;
    json: (data: unknown) => void;
    text: (data: string) => void;
    send: (data: string | Buffer) => void;
    end: () => void;
    raw: ServerResponse;
    isSent: () => boolean;
    headersSent: boolean;
}
export interface ResponseOptions {
    raw: ServerResponse;
}
