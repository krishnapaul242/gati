import type { Handler, HandlerExecutionOptions, Request, Response, GlobalContext, LocalContext } from './types/index.js';
export declare function executeHandler(handler: Handler, req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, options?: HandlerExecutionOptions): Promise<void>;
