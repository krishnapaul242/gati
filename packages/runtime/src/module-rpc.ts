/**
 * @module runtime/module-rpc
 * @description Module RPC adapters with automatic serialization, retry logic, and connection pooling
 */

import { logger } from './logger.js';

/**
 * RPC call options
 */
export interface RPCCallOptions {
  /**
   * Timeout in milliseconds
   * Default: 5000 (5 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts
   * Default: 3
   */
  maxRetries?: number;

  /**
   * Initial retry delay in milliseconds
   * Default: 100
   */
  retryDelay?: number;

  /**
   * Exponential backoff multiplier
   * Default: 2
   */
  backoffMultiplier?: number;

  /**
   * Maximum retry delay in milliseconds
   * Default: 5000
   */
  maxRetryDelay?: number;

  /**
   * Whether to retry on timeout
   * Default: true
   */
  retryOnTimeout?: boolean;
}

/**
 * RPC error types
 */
export class RPCError extends Error {
  constructor(
    message: string,
    public readonly moduleName: string,
    public readonly method: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'RPCError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RPCError);
    }
  }
}

export class RPCTimeoutError extends RPCError {
  constructor(moduleName: string, method: string, timeout: number) {
    super(
      `RPC call timed out after ${timeout}ms: ${moduleName}.${method}`,
      moduleName,
      method
    );
    this.name = 'RPCTimeoutError';
  }
}

export class RPCSerializationError extends RPCError {
  constructor(moduleName: string, method: string, cause: Error) {
    super(
      `Failed to serialize/deserialize RPC call: ${moduleName}.${method}`,
      moduleName,
      method,
      cause
    );
    this.name = 'RPCSerializationError';
  }
}

/**
 * Connection pool for module RPC calls
 */
export class ConnectionPool {
  private connections = new Map<string, Connection[]>();
  private config: Required<ConnectionPoolConfig>;

  constructor(config: ConnectionPoolConfig = {}) {
    this.config = {
      maxConnections: config.maxConnections ?? 10,
      minConnections: config.minConnections ?? 1,
      idleTimeout: config.idleTimeout ?? 60000,
      connectionTimeout: config.connectionTimeout ?? 5000,
    };
  }

  /**
   * Get or create a connection for a module
   */
  async acquire(moduleName: string): Promise<Connection> {
    const pool = this.connections.get(moduleName) || [];

    // Find an available connection
    const available = pool.find((conn) => !conn.inUse && !conn.closed);
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available;
    }

    // Create new connection if under max limit
    if (pool.length < this.config.maxConnections) {
      const conn = this.createConnection(moduleName);
      pool.push(conn);
      this.connections.set(moduleName, pool);
      return conn;
    }

    // Wait for a connection to become available
    return this.waitForConnection(moduleName);
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: Connection): void {
    connection.inUse = false;
    connection.lastUsed = Date.now();
  }

  /**
   * Create a new connection
   */
  private createConnection(moduleName: string): Connection {
    const conn: Connection = {
      id: `${moduleName}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      moduleName,
      inUse: true,
      closed: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    return conn;
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(moduleName: string): Promise<Connection> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.config.connectionTimeout) {
      const pool = this.connections.get(moduleName) || [];
      const available = pool.find((conn) => !conn.inUse && !conn.closed);

      if (available) {
        available.inUse = true;
        available.lastUsed = Date.now();
        return available;
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error(
      `Connection timeout: no available connections for ${moduleName}`
    );
  }

  /**
   * Close idle connections
   */
  closeIdleConnections(): void {
    const now = Date.now();

    for (const [moduleName, pool] of this.connections.entries()) {
      const activeConnections = pool.filter((conn) => {
        if (conn.closed) return false;
        if (conn.inUse) return true;

        const idle = now - conn.lastUsed;
        if (idle > this.config.idleTimeout) {
          conn.closed = true;
          return false;
        }

        return true;
      });

      if (activeConnections.length === 0) {
        this.connections.delete(moduleName);
      } else {
        this.connections.set(moduleName, activeConnections);
      }
    }
  }

  /**
   * Close all connections for a module
   */
  closeModule(moduleName: string): void {
    const pool = this.connections.get(moduleName);
    if (pool) {
      pool.forEach((conn) => {
        conn.closed = true;
      });
      this.connections.delete(moduleName);
    }
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const pool of this.connections.values()) {
      pool.forEach((conn) => {
        conn.closed = true;
      });
    }
    this.connections.clear();
  }

  /**
   * Get pool statistics
   */
  getStatistics() {
    const stats = new Map<string, PoolStats>();

    for (const [moduleName, pool] of this.connections.entries()) {
      stats.set(moduleName, {
        total: pool.length,
        inUse: pool.filter((c) => c.inUse).length,
        idle: pool.filter((c) => !c.inUse && !c.closed).length,
        closed: pool.filter((c) => c.closed).length,
      });
    }

    return stats;
  }
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  /**
   * Maximum number of connections per module
   * Default: 10
   */
  maxConnections?: number;

  /**
   * Minimum number of connections to maintain
   * Default: 1
   */
  minConnections?: number;

  /**
   * Idle timeout in milliseconds
   * Default: 60000 (1 minute)
   */
  idleTimeout?: number;

  /**
   * Connection timeout in milliseconds
   * Default: 5000 (5 seconds)
   */
  connectionTimeout?: number;
}

/**
 * Connection interface
 */
export interface Connection {
  id: string;
  moduleName: string;
  inUse: boolean;
  closed: boolean;
  createdAt: number;
  lastUsed: number;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  total: number;
  inUse: number;
  idle: number;
  closed: number;
}

/**
 * Module RPC client with automatic serialization, retry logic, and connection pooling
 */
export class ModuleRPCClient<T = unknown> {
  private pool: ConnectionPool;
  private defaultOptions: Required<RPCCallOptions>;

  constructor(
    private moduleName: string,
    private moduleExports: T,
    pool?: ConnectionPool,
    options?: RPCCallOptions
  ) {
    this.pool = pool || new ConnectionPool();
    this.defaultOptions = {
      timeout: options?.timeout ?? 5000,
      maxRetries: options?.maxRetries ?? 3,
      retryDelay: options?.retryDelay ?? 100,
      backoffMultiplier: options?.backoffMultiplier ?? 2,
      maxRetryDelay: options?.maxRetryDelay ?? 5000,
      retryOnTimeout: options?.retryOnTimeout ?? true,
    };
  }

  /**
   * Call a module method with automatic serialization, retry, and timeout
   */
  async call<TResult = unknown>(
    method: string,
    args: unknown[] = [],
    options?: RPCCallOptions
  ): Promise<TResult> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await this.executeCall<TResult>(method, args, opts);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof RPCSerializationError) {
          throw error;
        }

        // Don't retry on timeout if retryOnTimeout is false
        if (
          error instanceof RPCTimeoutError &&
          !opts.retryOnTimeout
        ) {
          throw error;
        }

        // If this is the last attempt, throw the original error
        if (attempt >= opts.maxRetries) {
          throw lastError;
        }

        // Calculate retry delay with exponential backoff
        const delay = Math.min(
          opts.retryDelay * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxRetryDelay
        );

        logger.warn(
          {
            module: this.moduleName,
            method,
            attempt: attempt + 1,
            maxRetries: opts.maxRetries,
            delay,
            error: error instanceof Error ? error.message : String(error),
          },
          'RPC call failed, retrying'
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new RPCError(
      `RPC call failed after ${opts.maxRetries + 1} attempts`,
      this.moduleName,
      method,
      lastError
    );
  }

  /**
   * Execute a single RPC call
   */
  private async executeCall<TResult>(
    method: string,
    args: unknown[],
    options: Required<RPCCallOptions>
  ): Promise<TResult> {
    // Acquire connection from pool
    const connection = await this.pool.acquire(this.moduleName);

    try {
      // Serialize arguments
      let serializedArgs: unknown[];
      try {
        serializedArgs = this.serialize(args);
      } catch (error) {
        throw new RPCSerializationError(
          this.moduleName,
          method,
          error as Error
        );
      }

      // Get the method from module exports
      const moduleMethod = (this.moduleExports as Record<string, unknown>)[
        method
      ];

      if (typeof moduleMethod !== 'function') {
        throw new RPCError(
          `Method not found: ${method}`,
          this.moduleName,
          method
        );
      }

      // Execute with timeout
      const result = await this.withTimeout(
        (moduleMethod as (...args: unknown[]) => Promise<unknown>).apply(
          this.moduleExports,
          serializedArgs
        ),
        options.timeout,
        method
      );

      // Deserialize result
      try {
        return this.deserialize(result) as TResult;
      } catch (error) {
        throw new RPCSerializationError(
          this.moduleName,
          method,
          error as Error
        );
      }
    } finally {
      // Release connection back to pool
      this.pool.release(connection);
    }
  }

  /**
   * Execute a promise with timeout
   */
  private async withTimeout<TResult>(
    promise: Promise<TResult>,
    timeout: number,
    method: string
  ): Promise<TResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new RPCTimeoutError(this.moduleName, method, timeout));
      }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Serialize arguments for RPC call
   */
  private serialize(args: unknown[]): unknown[] {
    // For now, we use JSON serialization
    // In the future, this could support other serialization formats
    return JSON.parse(JSON.stringify(args));
  }

  /**
   * Deserialize result from RPC call
   */
  private deserialize(result: unknown): unknown {
    // For now, we use JSON serialization
    // In the future, this could support other serialization formats
    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Create a typed proxy for the module
   */
  createProxy(): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    return new Proxy({} as any, {
      get: (_, prop: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (...args: any[]) => this.call(prop, args);
      },
    }) as T;
  }
}

/**
 * Create a module RPC client
 */
export function createModuleRPCClient<T = unknown>(
  moduleName: string,
  moduleExports: T,
  pool?: ConnectionPool,
  options?: RPCCallOptions
): ModuleRPCClient<T> {
  return new ModuleRPCClient(moduleName, moduleExports, pool, options);
}

/**
 * Create a typed module client proxy
 */
export function createModuleClient<T extends object = object>(
  moduleName: string,
  moduleExports: T,
  pool?: ConnectionPool,
  options?: RPCCallOptions
): T {
  const client = createModuleRPCClient(moduleName, moduleExports, pool, options);
  return client.createProxy();
}

/**
 * Global connection pool instance
 */
let globalPool: ConnectionPool | undefined;

/**
 * Get or create the global connection pool
 */
export function getGlobalConnectionPool(): ConnectionPool {
  if (!globalPool) {
    globalPool = new ConnectionPool();
  }
  return globalPool;
}

/**
 * Set the global connection pool
 */
export function setGlobalConnectionPool(pool: ConnectionPool): void {
  globalPool = pool;
}

/**
 * Close the global connection pool
 */
export function closeGlobalConnectionPool(): void {
  if (globalPool) {
    globalPool.closeAll();
    globalPool = undefined;
  }
}
