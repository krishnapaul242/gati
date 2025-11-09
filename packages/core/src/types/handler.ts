/**
 * Core handler type for Gati apps
 */
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
  timestamp: number;
}

export type Handler = (
  req: Request,
  res: Response,
  gctx: GlobalContext,
  lctx: LocalContext
) => unknown | Promise<unknown>;