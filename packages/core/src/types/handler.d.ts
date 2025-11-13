export interface Request {
    path: string;
    method: string;
    query: Record<string, string | string[]>;
    params: Record<string, string>;
    body?: unknown;
}
export interface Response {
    status(code: number): this;
    json(data: unknown): void;
    send(data: unknown): void;
}
export interface GlobalContext {
    startedAt: number;
}
export interface LocalContext {
    requestId: string;
    traceId: string;
    parentSpanId?: string;
    clientId: string;
    refs: {
        sessionId?: string;
        userId?: string;
        tenantId?: string;
    };
    client: {
        ip: string;
        userAgent: string;
        region: string;
    };
    meta: {
        timestamp: number;
        instanceId: string;
        region: string;
        method: string;
        path: string;
    };
}
export type Handler = (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext) => unknown | Promise<unknown>;
