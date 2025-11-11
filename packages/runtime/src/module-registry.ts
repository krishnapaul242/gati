/**
 * @module runtime/module-registry
 * @description Module registry for tracking and managing loaded modules
 */

import type {
  Module,
  ModuleMetadata,
  ModuleState,
} from './types/module.js';
import {
  ModuleError,
  ModuleNotFoundError,
} from './types/module.js';

/**
 * Module registry for tracking loaded modules
 */
export class ModuleRegistry {
  private modules = new Map<string, ModuleMetadata>();

  /**
   * Register a new module
   *
   * @param module - Module to register
   * @throws {ModuleError} If module with same name already exists
   */
  register<T>(module: Module<T>): void {
    if (this.modules.has(module.name)) {
      throw new ModuleError(
        `Module already registered: ${module.name}`,
        module.name
      );
    }

    const metadata: ModuleMetadata<T> = {
      module,
      state: 'uninitialized',
      registeredAt: new Date(),
      usageCount: 0,
    };

    this.modules.set(module.name, metadata);
  }

  /**
   * Unregister a module
   *
   * @param name - Module name to unregister
   * @returns true if module was unregistered, false if not found
   */
  unregister(name: string): boolean {
    return this.modules.delete(name);
  }

  /**
   * Check if a module is registered
   *
   * @param name - Module name to check
   * @returns true if module is registered
   */
  has(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Get module metadata
   *
   * @param name - Module name
   * @returns Module metadata
   * @throws {ModuleNotFoundError} If module not found
   */
  get<T = unknown>(name: string): ModuleMetadata<T> {
    const metadata = this.modules.get(name);
    if (!metadata) {
      throw new ModuleNotFoundError(name);
    }
    return metadata as ModuleMetadata<T>;
  }

  /**
   * Get module if it exists, or undefined
   *
   * @param name - Module name
   * @returns Module metadata or undefined
   */
  tryGet<T = unknown>(name: string): ModuleMetadata<T> | undefined {
    return this.modules.get(name) as ModuleMetadata<T> | undefined;
  }

  /**
   * Update module state
   *
   * @param name - Module name
   * @param state - New state
   * @param error - Optional error if state is 'error'
   * @throws {ModuleNotFoundError} If module not found
   */
  updateState(name: string, state: ModuleState, error?: Error): void {
    const metadata = this.get(name);
    metadata.state = state;

    if (state === 'initialized') {
      metadata.initializedAt = new Date();
    }

    if (error) {
      metadata.error = error;
    }
  }

  /**
   * Increment usage count for a module
   *
   * @param name - Module name
   * @throws {ModuleNotFoundError} If module not found
   */
  incrementUsage(name: string): void {
    const metadata = this.get(name);
    metadata.usageCount++;
  }

  /**
   * Get all registered module names
   *
   * @returns Array of module names
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get all modules with a specific state
   *
   * @param state - Module state to filter by
   * @returns Array of module metadata
   */
  getModulesByState(state: ModuleState): ModuleMetadata[] {
    return Array.from(this.modules.values()).filter(
      (metadata) => metadata.state === state
    );
  }

  /**
   * Get all module metadata
   *
   * @returns Array of all module metadata
   */
  getAll(): ModuleMetadata[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get total number of registered modules
   *
   * @returns Number of modules
   */
  size(): number {
    return this.modules.size;
  }

  /**
   * Clear all modules
   */
  clear(): void {
    this.modules.clear();
  }

  /**
   * Get module statistics
   *
   * @returns Statistics object
   */
  getStatistics() {
    const all = this.getAll();

    return {
      total: all.length,
      initialized: all.filter((m) => m.state === 'initialized').length,
      uninitialized: all.filter((m) => m.state === 'uninitialized').length,
      initializing: all.filter((m) => m.state === 'initializing').length,
      error: all.filter((m) => m.state === 'error').length,
      shutdown: all.filter((m) => m.state === 'shutdown').length,
      totalUsage: all.reduce((sum, m) => sum + m.usageCount, 0),
    };
  }
}

/**
 * Create a new module registry
 *
 * @returns New module registry instance
 */
export function createModuleRegistry(): ModuleRegistry {
  return new ModuleRegistry();
}
