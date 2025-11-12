/**
 * @module runtime/local-context
 * @description Local context manager for request-scoped data in Gati framework
 */

import type { LocalContext, LocalContextOptions } from './types/context.js';
import { RequestPhase } from './types/context.js';
import { RequestLifecycleManager } from './lifecycle-manager.js';

/**
 * Generates a unique request ID
 *
 * @returns Unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generates a unique client ID
 *
 * @returns Unique client ID
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}



/**
 * Generates a unique trace ID for distributed tracing
 *
 * @returns Unique trace ID
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
}

/**
 * Creates a local context instance for a single request
 *
 * @param options - Configuration options for the local context
 * @returns LocalContext instance
 *
 * @example
 * ```typescript
 * const lctx = createLocalContext({
 *   requestId: 'custom-id',
 *   state: { userId: '123' },
 * });
 * ```
 */
export function createLocalContext(
  options: LocalContextOptions = {}
): LocalContext {
  const requestLifecycle = new RequestLifecycleManager();
  const lifecycleSymbol = Symbol.for('gati:requestLifecycle');

  const lctx: LocalContext = {
    requestId: options.requestId || generateRequestId(),
    traceId: options.traceId || generateTraceId(),
    parentSpanId: options.parentSpanId,
    clientId: options.clientId || generateClientId(),
    refs: options.refs || {},
    client: options.client || {
      ip: 'unknown',
      userAgent: 'unknown',
      region: 'unknown',
    },
    meta: {
      timestamp: Date.now(),
      instanceId: 'unknown',
      region: 'unknown',
      method: 'GET',
      path: '/',
      phase: RequestPhase.RECEIVED,
      startTime: Date.now(),
      ...options.meta,
    },
    state: options.state || {},
    lifecycle: {
      onCleanup: (name: string, fn: () => void | Promise<void>) => {
        requestLifecycle.onCleanup(name, fn);
      },
      onTimeout: (fn: () => void | Promise<void>) => {
        requestLifecycle.onTimeout(fn);
      },
      onError: (fn: (error: Error) => void | Promise<void>) => {
        requestLifecycle.onError(fn);
      },
      onPhaseChange: (fn: (phase: RequestPhase, previousPhase: RequestPhase) => void) => {
        requestLifecycle.onPhaseChange(fn);
      },
      setPhase: (phase: RequestPhase) => {
        requestLifecycle.setPhase(phase);
        lctx.meta.phase = phase;
      },
      executeCleanup: () => requestLifecycle.executeCleanup(),
      isCleaningUp: () => requestLifecycle.isCleaningUp(),
      isTimedOut: () => requestLifecycle.isTimedOut(),
    },
  };

  // Store request lifecycle manager for later access
  (lctx as unknown as Record<symbol, unknown>)[lifecycleSymbol] = requestLifecycle;

  return lctx;
}

/**
 * Cleans up the local context, calling all registered cleanup hooks
 *
 * @param lctx - Local context instance
 * @returns Promise that resolves when all cleanup hooks complete
 *
 * @example
 * ```typescript
 * await cleanupLocalContext(lctx);
 * ```
 */
export async function cleanupLocalContext(
  lctx: LocalContext
): Promise<void> {
  // Execute cleanup through lifecycle manager
  await lctx.lifecycle.executeCleanup();

  // Clear state to prevent memory leaks
  lctx.state = {};
}

/**
 * Sets a value in the local context state
 *
 * @param lctx - Local context instance
 * @param key - State key
 * @param value - State value
 *
 * @example
 * ```typescript
 * setState(lctx, 'userId', '123');
 * ```
 */
export function setState(
  lctx: LocalContext,
  key: string,
  value: unknown
): void {
  lctx.state[key] = value;
}

/**
 * Gets a value from the local context state
 *
 * @param lctx - Local context instance
 * @param key - State key
 * @returns State value or undefined if not found
 *
 * @example
 * ```typescript
 * const userId = getState<string>(lctx, 'userId');
 * ```
 */
export function getState<T = unknown>(
  lctx: LocalContext,
  key: string
): T | undefined {
  return lctx.state[key] as T | undefined;
}
