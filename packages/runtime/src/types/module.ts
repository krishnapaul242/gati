/**
 * @module runtime/types/module
 * @description Module type definitions for Gati framework
 */

import type { GlobalContext } from './context';

/**
 * Module lifecycle state
 */
export type ModuleState = 'uninitialized' | 'initializing' | 'initialized' | 'error' | 'shutdown';

/**
 * Module interface for reusable business logic
 */
export interface Module<T = unknown> {
  /**
   * Unique module name (used for registration and dependency resolution)
   */
  name: string;

  /**
   * Module version (semver format)
   */
  version: string;

  /**
   * Optional module description
   */
  description?: string;

  /**
   * Module dependencies (names of other modules this module requires)
   */
  dependencies?: string[];

  /**
   * Module exports (the actual functionality provided by this module)
   * This can be any type: object with methods, class instance, function, etc.
   */
  exports: T;

  /**
   * Optional initialization function called when module is loaded
   * Use this for setup tasks like connecting to databases, loading config, etc.
   *
   * @param gctx - Global context
   * @returns Promise that resolves when initialization is complete
   */
  init?(gctx: GlobalContext): Promise<void> | void;

  /**
   * Optional shutdown function called when module is unloaded
   * Use this for cleanup tasks like closing connections, releasing resources, etc.
   *
   * @returns Promise that resolves when shutdown is complete
   */
  shutdown?(): Promise<void> | void;

  /**
   * Optional health check function
   * Use this to report module health status (e.g., database connection status)
   *
   * @returns Promise that resolves to true if healthy, false otherwise
   */
  healthCheck?(): Promise<boolean> | boolean;
}

/**
 * Module metadata stored in registry
 */
export interface ModuleMetadata<T = unknown> {
  /**
   * The module instance
   */
  module: Module<T>;

  /**
   * Current lifecycle state
   */
  state: ModuleState;

  /**
   * Timestamp when module was registered
   */
  registeredAt: Date;

  /**
   * Timestamp when module was initialized (if initialized)
   */
  initializedAt?: Date;

  /**
   * Error if module failed to initialize
   */
  error?: Error;

  /**
   * Number of times this module has been requested
   */
  usageCount: number;
}

/**
 * Module loader configuration
 */
export interface ModuleLoaderConfig {
  /**
   * Whether to automatically initialize modules when they are registered
   * Default: false (lazy loading)
   */
  autoInit?: boolean;

  /**
   * Maximum time (ms) to wait for module initialization
   * Default: 30000 (30 seconds)
   */
  initTimeout?: number;

  /**
   * Whether to allow circular dependencies
   * Default: false
   */
  allowCircularDependencies?: boolean;

  /**
   * Whether to cache module instances
   * Default: true
   */
  cache?: boolean;
}

/**
 * Module loading error
 */
export class ModuleError extends Error {
  public readonly moduleName: string;
  public override readonly cause?: Error;

  constructor(
    message: string,
    moduleName: string,
    cause?: Error
  ) {
    super(message);
    this.name = 'ModuleError';
    this.moduleName = moduleName;
    this.cause = cause;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ModuleError);
    }
  }
}

/**
 * Circular dependency error
 */
export class CircularDependencyError extends ModuleError {
  public readonly dependencyChain: string[];

  constructor(dependencyChain: string[]) {
    super(
      `Circular dependency detected: ${dependencyChain.join(' -> ')}`,
      dependencyChain[0] || 'unknown'
    );
    this.name = 'CircularDependencyError';
    this.dependencyChain = dependencyChain;
  }
}

/**
 * Module not found error
 */
export class ModuleNotFoundError extends ModuleError {
  constructor(moduleName: string) {
    super(`Module not found: ${moduleName}`, moduleName);
    this.name = 'ModuleNotFoundError';
  }
}

/**
 * Module initialization error
 */
export class ModuleInitializationError extends ModuleError {
  constructor(moduleName: string, cause: Error) {
    super(`Failed to initialize module: ${moduleName}`, moduleName, cause);
    this.name = 'ModuleInitializationError';
  }
}
