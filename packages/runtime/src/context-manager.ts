/**
 * @module runtime/context-manager
 * @description Context manager orchestration for Gati framework
 * Manages both global and local contexts with lifecycle hooks
 */

import type { GlobalContext, LocalContext } from './types/context.js';
import { createGlobalContext, shutdownGlobalContext } from './global-context.js';
import { createLocalContext, cleanupLocalContext } from './local-context.js';

export { createGlobalContext, createLocalContext };
export { shutdownGlobalContext, cleanupLocalContext };
export { registerModule, getModule } from './global-context.js';
export { setState, getState } from './local-context.js';

/**
 * Context manager for handling global and local contexts
 */
export class ContextManager {
  private gctx: GlobalContext | null = null;

  /**
   * Initializes the global context
   *
   * @param options - Configuration options for global context
   * @returns The created global context
   *
   * @example
   * ```typescript
   * const manager = new ContextManager();
   * const gctx = manager.initializeGlobalContext({
   *   modules: { db: databaseModule },
   * });
   * ```
   */
  initializeGlobalContext(options = {}): GlobalContext {
    if (this.gctx) {
      throw new Error('Global context is already initialized');
    }

    this.gctx = createGlobalContext(options);
    return this.gctx;
  }

  /**
   * Gets the current global context
   *
   * @returns Global context or null if not initialized
   *
   * @example
   * ```typescript
   * const gctx = manager.getGlobalContext();
   * if (gctx) {
   *   // Use global context
   * }
   * ```
   */
  getGlobalContext(): GlobalContext | null {
    return this.gctx;
  }

  /**
   * Creates a new local context for a request
   *
   * @param options - Configuration options for local context
   * @returns The created local context
   *
   * @example
   * ```typescript
   * const lctx = manager.createRequestContext();
   * ```
   */
  createRequestContext(options = {}): LocalContext {
    return createLocalContext(options);
  }

  /**
   * Cleans up a local context after request completion
   *
   * @param lctx - Local context to clean up
   * @returns Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * await manager.cleanupRequestContext(lctx);
   * ```
   */
  async cleanupRequestContext(lctx: LocalContext): Promise<void> {
    await cleanupLocalContext(lctx);
  }

  /**
   * Shuts down the context manager and global context
   *
   * @returns Promise that resolves when shutdown is complete
   *
   * @example
   * ```typescript
   * await manager.shutdown();
   * ```
   */
  async shutdown(): Promise<void> {
    if (this.gctx) {
      await shutdownGlobalContext(this.gctx);
      this.gctx = null;
    }
  }
}

/**
 * Creates a new context manager instance
 *
 * @returns ContextManager instance
 *
 * @example
 * ```typescript
 * const manager = createContextManager();
 * const gctx = manager.initializeGlobalContext();
 * const lctx = manager.createRequestContext();
 * ```
 */
export function createContextManager(): ContextManager {
  return new ContextManager();
}

