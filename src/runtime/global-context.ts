/**
 * @module runtime/global-context
 * @description Global context manager for shared resources in Gati framework
 */

import type {
  GlobalContext,
  GlobalContextOptions,
} from './types/context';

/**
 * Creates a global context instance
 *
 * @param options - Configuration options for the global context
 * @returns GlobalContext instance
 *
 * @example
 * ```typescript
 * const gctx = createGlobalContext({
 *   modules: { db: databaseModule },
 *   config: { port: 3000 },
 * });
 * ```
 */
export function createGlobalContext(
  options: GlobalContextOptions = {}
): GlobalContext {
  const shutdownFns: Array<() => void | Promise<void>> = [];
  const shutdownSymbol = Symbol.for('gati:shutdown');

  const gctx: GlobalContext = {
    modules: options.modules || {},
    config: options.config || {},
    state: options.state || {},
    lifecycle: {
      onShutdown: (fn) => {
        shutdownFns.push(fn);
      },
      isShuttingDown: () => false, // Will be updated by shutdownGlobalContext
    },
  };

  // Store shutdown functions for later access
  (gctx as unknown as Record<symbol, unknown>)[shutdownSymbol] = shutdownFns;

  return gctx;
}

/**
 * Registers a module in the global context
 *
 * @param gctx - Global context instance
 * @param name - Module name
 * @param module - Module instance
 * @throws {Error} If module with the same name already exists
 *
 * @example
 * ```typescript
 * registerModule(gctx, 'db', databaseModule);
 * ```
 */
export function registerModule(
  gctx: GlobalContext,
  name: string,
  module: unknown
): void {
  if (name in gctx.modules) {
    throw new Error(`Module "${name}" is already registered`);
  }

  gctx.modules[name] = module;
}

/**
 * Retrieves a module from the global context
 *
 * @param gctx - Global context instance
 * @param name - Module name
 * @returns Module instance or undefined if not found
 *
 * @example
 * ```typescript
 * const db = getModule<DatabaseModule>(gctx, 'db');
 * ```
 */
export function getModule<T = unknown>(
  gctx: GlobalContext,
  name: string
): T | undefined {
  return gctx.modules[name] as T | undefined;
}

/**
 * Shuts down the global context, calling all registered shutdown hooks
 *
 * @param gctx - Global context instance
 * @returns Promise that resolves when all shutdown hooks complete
 *
 * @example
 * ```typescript
 * await shutdownGlobalContext(gctx);
 * ```
 */
export async function shutdownGlobalContext(
  gctx: GlobalContext
): Promise<void> {
  // Mark as shutting down
  const isShuttingDown = true;
  (gctx.lifecycle as { isShuttingDown: () => boolean }).isShuttingDown =
    () => isShuttingDown;

  // Get shutdown functions from symbol
  const shutdownSymbol = Symbol.for('gati:shutdown');
  const fns = (gctx as unknown as Record<symbol, unknown>)[shutdownSymbol] as
    | Array<() => void | Promise<void>>
    | undefined;

  if (fns && fns.length > 0) {
    // Execute all shutdown hooks in parallel
    await Promise.all(fns.map((fn) => Promise.resolve(fn())));
  }
}
