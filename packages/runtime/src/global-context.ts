/**
 * @module runtime/global-context
 * @description Global context implementation for cross-request shared state
 */

import type {
  GlobalContext,
  GlobalContextOptions,
} from './types/context.js';
import type { ModuleLoader } from './module-loader.js';
import { createModuleLoader } from './module-loader.js';

/**
 * Extended global context options with module loader
 */
export interface ExtendedGlobalContextOptions extends GlobalContextOptions {
  /**
   * Optional module loader instance
   * If not provided, a new one will be created
   */
  moduleLoader?: ModuleLoader;
}

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
  options: ExtendedGlobalContextOptions = {}
): GlobalContext {
  const shutdownFns: Array<() => void | Promise<void>> = [];
  const shutdownSymbol = Symbol.for('gati:shutdown');
  const moduleLoader = options.moduleLoader || createModuleLoader();
  const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');

  const gctx: GlobalContext = {
    startedAt: Date.now(),
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

  // Store shutdown functions and module loader for later access
  (gctx as unknown as Record<symbol, unknown>)[shutdownSymbol] = shutdownFns;
  (gctx as unknown as Record<symbol, unknown>)[moduleLoaderSymbol] =
    moduleLoader;

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

  // Shutdown module loader first
  const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
  const moduleLoader = (gctx as unknown as Record<symbol, unknown>)[
    moduleLoaderSymbol
  ] as ModuleLoader | undefined;

  if (moduleLoader) {
    await moduleLoader.shutdownAll();
  }

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

/**
 * Get the module loader from global context
 *
 * @param gctx - Global context instance
 * @returns ModuleLoader instance
 *
 * @example
 * ```typescript
 * const loader = getModuleLoader(gctx);
 * await loader.register(myModule, gctx);
 * ```
 */
export function getModuleLoader(gctx: GlobalContext): ModuleLoader {
  const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
  const moduleLoader = (gctx as unknown as Record<symbol, unknown>)[
    moduleLoaderSymbol
  ] as ModuleLoader | undefined;

  if (!moduleLoader) {
    throw new Error('Module loader not found in global context');
  }

  return moduleLoader;
}
