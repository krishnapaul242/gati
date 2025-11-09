/**
 * @module runtime/module-loader
 * @description Module loader with dependency injection and lifecycle management
 */

import type { GlobalContext } from './types/context';
import type {
  Module,
  ModuleLoaderConfig,
} from './types/module';
import {
  ModuleError,
  ModuleInitializationError,
  CircularDependencyError,
} from './types/module';
import type { ModuleRegistry } from './module-registry';
import { createModuleRegistry } from './module-registry';
import { logger } from './logger';

/**
 * Module loader with dependency injection
 */
export class ModuleLoader {
  private registry: ModuleRegistry;
  private config: Required<ModuleLoaderConfig>;
  private initializingModules = new Set<string>();

  constructor(config: ModuleLoaderConfig = {}) {
    this.registry = createModuleRegistry();
    this.config = {
      autoInit: config.autoInit ?? false,
      initTimeout: config.initTimeout ?? 30000,
      allowCircularDependencies: config.allowCircularDependencies ?? false,
      cache: config.cache ?? true,
    };
  }

  /**
   * Register a module
   *
   * @param module - Module to register
   * @param gctx - Global context (required if autoInit is true)
   * @throws {ModuleError} If module already registered
   */
  async register<T>(module: Module<T>, gctx?: GlobalContext): Promise<void> {
    this.registry.register(module);

    if (this.config.autoInit && gctx) {
      await this.initialize(module.name, gctx);
    }
  }

  /**
   * Initialize a module and its dependencies
   *
   * @param name - Module name to initialize
   * @param gctx - Global context
   * @param dependencyChain - Internal tracking for circular dependency detection
   * @throws {ModuleNotFoundError} If module not found
   * @throws {CircularDependencyError} If circular dependency detected
   * @throws {ModuleInitializationError} If initialization fails
   */
  async initialize(
    name: string,
    gctx: GlobalContext,
    dependencyChain: string[] = []
  ): Promise<void> {
    const metadata = this.registry.get(name);

    // Already initialized
    if (metadata.state === 'initialized') {
      return;
    }

    // Check for circular dependencies
    if (this.initializingModules.has(name)) {
      const chain = [...dependencyChain, name];
      if (!this.config.allowCircularDependencies) {
        throw new CircularDependencyError(chain);
      }
      // Allow circular dependencies but don't re-initialize
      return;
    }

    // Mark as initializing
    this.initializingModules.add(name);
    this.registry.updateState(name, 'initializing');

    try {
      // Initialize dependencies first
      if (metadata.module.dependencies) {
        for (const dep of metadata.module.dependencies) {
          if (!this.registry.has(dep)) {
            throw new ModuleError(
              `Dependency not found: ${dep} (required by ${name})`,
              name
            );
          }

          await this.initialize(dep, gctx, [...dependencyChain, name]);
        }
      }

      // Initialize module
      if (metadata.module.init) {
        const initPromise = Promise.resolve(metadata.module.init(gctx));

        // Apply timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Module initialization timeout: ${name}`));
          }, this.config.initTimeout);
        });

        await Promise.race([initPromise, timeoutPromise]);
      }

      // Mark as initialized
      this.registry.updateState(name, 'initialized');
      this.initializingModules.delete(name);
    } catch (error) {
      this.initializingModules.delete(name);
      const moduleError =
        error instanceof ModuleError
          ? error
          : new ModuleInitializationError(name, error as Error);

      this.registry.updateState(name, 'error', moduleError);
      throw moduleError;
    }
  }

  /**
   * Get module exports
   *
   * @param name - Module name
   * @param gctx - Global context (for lazy initialization)
   * @returns Module exports
   * @throws {ModuleNotFoundError} If module not found
   * @throws {ModuleError} If module not initialized and can't auto-initialize
   */
  async get<T>(name: string, gctx?: GlobalContext): Promise<T> {
    const metadata = this.registry.get<T>(name);

    // Initialize if needed
    if (metadata.state === 'uninitialized') {
      if (!gctx) {
        throw new ModuleError(
          `Module not initialized and no global context provided: ${name}`,
          name
        );
      }
      await this.initialize(name, gctx);
    }

    // Check if in error state
    if (metadata.state === 'error') {
      throw new ModuleError(
        `Module is in error state: ${name}`,
        name,
        metadata.error
      );
    }

    // Check if shutting down
    if (metadata.state === 'shutdown') {
      throw new ModuleError(`Module has been shutdown: ${name}`, name);
    }

    // Increment usage count
    this.registry.incrementUsage(name);

    return metadata.module.exports;
  }

  /**
   * Get module exports synchronously (only works for initialized modules)
   *
   * @param name - Module name
   * @returns Module exports
   * @throws {ModuleNotFoundError} If module not found
   * @throws {ModuleError} If module not initialized
   */
  getSync<T>(name: string): T {
    const metadata = this.registry.get<T>(name);

    if (metadata.state !== 'initialized') {
      throw new ModuleError(
        `Module not initialized: ${name} (state: ${metadata.state})`,
        name
      );
    }

    this.registry.incrementUsage(name);
    return metadata.module.exports;
  }

  /**
   * Shutdown a module
   *
   * @param name - Module name
   * @throws {ModuleNotFoundError} If module not found
   */
  async shutdown(name: string): Promise<void> {
    const metadata = this.registry.get(name);

    if (metadata.state === 'shutdown') {
      return;
    }

    try {
      if (metadata.module.shutdown) {
        await Promise.resolve(metadata.module.shutdown());
      }

      this.registry.updateState(name, 'shutdown');
    } catch (error) {
      throw new ModuleError(
        `Failed to shutdown module: ${name}`,
        name,
        error as Error
      );
    }
  }

  /**
   * Shutdown all modules
   */
  async shutdownAll(): Promise<void> {
    // Shutdown in reverse order of initialization
    const initialized = this.registry
      .getModulesByState('initialized')
      .sort((a, b) => {
        const aTime = a.initializedAt?.getTime() ?? 0;
        const bTime = b.initializedAt?.getTime() ?? 0;
        return bTime - aTime; // Reverse order
      })
      .map((m) => m.module.name);

    for (const name of initialized) {
      try {
        await this.shutdown(name);
      } catch (error) {
        // Continue shutting down other modules even if one fails
        logger.error({ module: name, error }, 'Failed to shutdown module');
      }
    }
  }

  /**
   * Check if a module is registered
   *
   * @param name - Module name
   * @returns true if module is registered
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get all registered module names
   *
   * @returns Array of module names
   */
  getModuleNames(): string[] {
    return this.registry.getModuleNames();
  }

  /**
   * Get module statistics
   *
   * @returns Statistics object
   */
  getStatistics() {
    return this.registry.getStatistics();
  }

  /**
   * Run health checks on all modules
   *
   * @returns Map of module name to health status
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const moduleNames = this.registry.getModuleNames();

    for (const name of moduleNames) {
      const metadata = this.registry.tryGet(name);
      if (!metadata || metadata.state !== 'initialized') {
        results.set(name, false);
        continue;
      }

      if (metadata.module.healthCheck) {
        try {
          const healthy = await Promise.resolve(
            metadata.module.healthCheck()
          );
          results.set(name, healthy);
        } catch {
          results.set(name, false);
        }
      } else {
        // No health check defined, assume healthy if initialized
        results.set(name, true);
      }
    }

    return results;
  }
}

/**
 * Create a new module loader
 *
 * @param config - Module loader configuration
 * @returns New module loader instance
 */
export function createModuleLoader(
  config?: ModuleLoaderConfig
): ModuleLoader {
  return new ModuleLoader(config);
}
