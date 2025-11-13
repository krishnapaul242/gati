import type { LocalContext, LocalContextOptions, WebSocketCoordinator } from './types/context.js';
export declare function createLocalContext(options?: LocalContextOptions, wsCoordinator?: WebSocketCoordinator): LocalContext;
export declare function cleanupLocalContext(lctx: LocalContext, wsCoordinator?: WebSocketCoordinator): Promise<void>;
export declare function setState(lctx: LocalContext, key: string, value: unknown): void;
export declare function getState<T = unknown>(lctx: LocalContext, key: string): T | undefined;
