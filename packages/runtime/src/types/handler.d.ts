import type { Request } from './request.js';
import type { Response } from './response.js';
import type { GlobalContext, LocalContext } from './context.js';
export type Handler = (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext) => unknown | Promise<unknown>;
export declare class HandlerError extends Error {
    statusCode: number;
    context?: Record<string, unknown> | undefined;
    constructor(message: string, statusCode?: number, context?: Record<string, unknown> | undefined);
}
export interface HandlerExecutionOptions {
    timeout?: number;
    catchErrors?: boolean;
}
