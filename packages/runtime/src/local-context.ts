/**
 * @module runtime/local-context
 * @description Local context manager for request-scoped data in Gati framework
 */

import type { LocalContext, LocalContextOptions } from './types/context.js';

/**
 * Generates a unique request ID
 *
 * @returns Unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
  const cleanupFns: Array<() => void | Promise<void>> = [];
  const cleanupSymbol = Symbol.for('gati:cleanup');

  const lctx: LocalContext = {
    requestId: options.requestId || generateRequestId(),
    timestamp: Date.now(),
    state: options.state || {},
    lifecycle: {
      onCleanup: (fn) => {
        cleanupFns.push(fn);
      },
      isCleaningUp: () => false, // Will be updated by cleanupLocalContext
    },
  };

  // Store cleanup functions for later access
  (lctx as unknown as Record<symbol, unknown>)[cleanupSymbol] = cleanupFns;

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
  // Mark as cleaning up
  const isCleaningUp = true;
  (lctx.lifecycle as { isCleaningUp: () => boolean }).isCleaningUp =
    () => isCleaningUp;

  // Get cleanup functions from symbol
  const cleanupSymbol = Symbol.for('gati:cleanup');
  const fns = (lctx as unknown as Record<symbol, unknown>)[cleanupSymbol] as
    | Array<() => void | Promise<void>>
    | undefined;

  if (fns && fns.length > 0) {
    // Execute all cleanup hooks in parallel
    await Promise.all(fns.map((fn) => Promise.resolve(fn())));
  }

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
