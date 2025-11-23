/**
 * @module runtime/global-context
 * @description Global context implementation for cross-request shared state
 */

import type {
  GlobalContext,
  GlobalContextOptions,
  LifecyclePriority,
  LifecycleCoordinator,
} from './types/context.js';
import type { ModuleLoader } from './module-loader.js';
import { createModuleLoader } from './module-loader.js';
import { LifecycleManager } from './lifecycle-manager.js';
import { VersionRegistry } from './timescape/registry.js';
import { SQLiteTimelineStore, JSONTimelineStore } from './timescape/timeline-store.js';
import {
  createModuleClient,
  getGlobalConnectionPool,
  type ConnectionPool,
  type RPCCallOptions,
} from './module-rpc.js';

/**
 * Extended global context options with module loader and coordinator
 */
export interface ExtendedGlobalContextOptions extends GlobalContextOptions {
  /**
   * Optional module loader instance
   * If not provided, a new one will be created
   */
  moduleLoader?: ModuleLoader;

  /**
   * Optional lifecycle coordinator for distributed systems
   */
  coordinator?: LifecycleCoordinator;

  /**
   * Optional connection pool for module RPC
   * If not provided, the global pool will be used
   */
  connectionPool?: ConnectionPool;

  /**
   * Optional RPC call options for module clients
   */
  rpcOptions?: RPCCallOptions;

  /**
   * Whether to wrap modules with RPC clients
   * Default: true
   */
  enableRPC?: boolean;
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
  const moduleLoader = options.moduleLoader || createModuleLoader();
  const lifecycleManager = new LifecycleManager(options.coordinator);
  const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
  const lifecycleSymbol = Symbol.for('gati:lifecycle');

  const gctx: GlobalContext = {
    instance: {
      id: options.instance?.id || 'unknown',
      region: options.instance?.region || 'unknown',
      zone: options.instance?.zone || 'unknown',
      startedAt: Date.now(),
    },
    modules: options.modules || {},
    services: options.services || {},
    config: options.config || {},
    state: options.state || {},
    lifecycle: {
      onStartup: ((...args: unknown[]) => {
        lifecycleManager.onStartup(args[0] as never, args[1] as never, args[2] as never);
      }) as {
        (name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority): void;
        (fn: () => void | Promise<void>, priority?: LifecyclePriority): void;
      },
      onHealthCheck: (name: string, fn: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; }>) => {
        lifecycleManager.onHealthCheck(name, fn);
      },
      onShutdown: ((...args: unknown[]) => {
        lifecycleManager.onShutdown(args[0] as never, args[1] as never, args[2] as never);
      }) as {
        (name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority): void;
        (fn: () => void | Promise<void>, priority?: LifecyclePriority): void;
      },
      onPreShutdown: ((...args: unknown[]) => {
        lifecycleManager.onPreShutdown(args[0] as never, args[1] as never);
      }) as {
        (name: string, fn: () => void | Promise<void>): void;
        (fn: () => void | Promise<void>): void;
      },
      onConfigReload: (name: string, fn: (newConfig: Record<string, unknown>) => void | Promise<void>) => {
        lifecycleManager.onConfigReload(name, fn);
      },
      onMemoryPressure: (name: string, fn: (level: 'low' | 'medium' | 'high') => void | Promise<void>) => {
        lifecycleManager.onMemoryPressure(name, fn);
      },
      onCircuitBreakerChange: (name: string, fn: (service: string, state: 'open' | 'closed' | 'half-open') => void) => {
        lifecycleManager.onCircuitBreakerChange(name, fn);
      },
      executeStartup: () => lifecycleManager.executeStartup(),
      executeHealthChecks: () => lifecycleManager.executeHealthChecks(),
      executeShutdown: () => lifecycleManager.executeShutdown(),
      isShuttingDown: () => lifecycleManager.isShuttingDown(),
      coordinator: options.coordinator,
    },
    timescape: {
      registry: new VersionRegistry(),
      timeline: (() => {
        try {
          return new SQLiteTimelineStore('.gati/timeline.db');
        } catch (e) {
          console.warn('SQLiteTimelineStore failed to initialize, falling back to JSONTimelineStore:', e);
          return new JSONTimelineStore('.gati/timeline.json');
        }
      })(),
    },
  };

  // Store module loader and lifecycle manager for later access
  (gctx as unknown as Record<symbol, unknown>)[moduleLoaderSymbol] = moduleLoader;
  (gctx as unknown as Record<symbol, unknown>)[lifecycleSymbol] = lifecycleManager;

  return gctx;
}

/**
 * Registers a module in the global context
 *
 * @param gctx - Global context instance
 * @param name - Module name
 * @param module - Module instance
 * @param options - Optional RPC options
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
  module: unknown,
  options?: {
    enableRPC?: boolean;
    rpcOptions?: RPCCallOptions;
    connectionPool?: ConnectionPool;
  }
): void {
  if (name in gctx.modules) {
    throw new Error(`Module "${name}" is already registered`);
  }

  // Wrap module with RPC client if enabled
  const enableRPC = options?.enableRPC ?? true;
  if (enableRPC && typeof module === 'object' && module !== null) {
    const pool = options?.connectionPool || getGlobalConnectionPool();
    gctx.modules[name] = createModuleClient(name, module, pool, options?.rpcOptions);
  } else {
    gctx.modules[name] = module;
  }
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
  // Execute shutdown hooks via lifecycle manager
  await gctx.lifecycle.executeShutdown();

  // Shutdown module loader
  const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
  const moduleLoader = (gctx as unknown as Record<symbol, unknown>)[
    moduleLoaderSymbol
  ] as ModuleLoader | undefined;

  if (moduleLoader) {
    await moduleLoader.shutdownAll();
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

/**
 * Wrap all modules in global context with RPC clients
 *
 * @param gctx - Global context instance
 * @param options - Optional RPC options
 *
 * @example
 * ```typescript
 * wrapModulesWithRPC(gctx, { timeout: 10000 });
 * ```
 */
export function wrapModulesWithRPC(
  gctx: GlobalContext,
  options?: {
    rpcOptions?: RPCCallOptions;
    connectionPool?: ConnectionPool;
  }
): void {
  const pool = options?.connectionPool || getGlobalConnectionPool();

  for (const [name, module] of Object.entries(gctx.modules)) {
    if (typeof module === 'object' && module !== null) {
      gctx.modules[name] = createModuleClient(name, module, pool, options?.rpcOptions);
    }
  }
}

/**
 * Get the connection pool from global context
 *
 * @param gctx - Global context instance
 * @returns ConnectionPool instance
 *
 * @example
 * ```typescript
 * const pool = getConnectionPool(gctx);
 * const stats = pool.getStatistics();
 * ```
 */
export function getConnectionPool(gctx: GlobalContext): ConnectionPool {
  const poolSymbol = Symbol.for('gati:connectionPool');
  let pool = (gctx as unknown as Record<symbol, unknown>)[
    poolSymbol
  ] as ConnectionPool | undefined;

  if (!pool) {
    pool = getGlobalConnectionPool();
    (gctx as unknown as Record<symbol, unknown>)[poolSymbol] = pool;
  }

  return pool;
}
