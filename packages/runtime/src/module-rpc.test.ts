/**
 * @module runtime/module-rpc.test
 * @description Tests for Module RPC adapters
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ModuleRPCClient,
  ConnectionPool,
  createModuleClient,
  createModuleRPCClient,
  getGlobalConnectionPool,
  setGlobalConnectionPool,
  closeGlobalConnectionPool,
  RPCError,
  RPCTimeoutError,
  RPCSerializationError,
} from './module-rpc.js';

describe('ConnectionPool', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    pool = new ConnectionPool({
      maxConnections: 3,
      minConnections: 1,
      idleTimeout: 1000,
      connectionTimeout: 500,
    });
  });

  afterEach(() => {
    pool.closeAll();
  });

  it('should create and acquire connections', async () => {
    const conn1 = await pool.acquire('test-module');
    expect(conn1).toBeDefined();
    expect(conn1.moduleName).toBe('test-module');
    expect(conn1.inUse).toBe(true);
  });

  it('should reuse released connections', async () => {
    const conn1 = await pool.acquire('test-module');
    const id1 = conn1.id;
    pool.release(conn1);

    const conn2 = await pool.acquire('test-module');
    expect(conn2.id).toBe(id1);
  });

  it('should create multiple connections up to max limit', async () => {
    const conn1 = await pool.acquire('test-module');
    const conn2 = await pool.acquire('test-module');
    const conn3 = await pool.acquire('test-module');

    expect(conn1.id).not.toBe(conn2.id);
    expect(conn2.id).not.toBe(conn3.id);

    const stats = pool.getStatistics();
    expect(stats.get('test-module')?.total).toBe(3);
  });

  it('should wait for connection when pool is full', async () => {
    const conn1 = await pool.acquire('test-module');
    const conn2 = await pool.acquire('test-module');
    const conn3 = await pool.acquire('test-module');

    // Start acquiring a 4th connection (should wait)
    const conn4Promise = pool.acquire('test-module');

    // Release one connection
    setTimeout(() => pool.release(conn1), 50);

    const conn4 = await conn4Promise;
    expect(conn4.id).toBe(conn1.id);
  });

  it('should timeout when no connections available', async () => {
    await pool.acquire('test-module');
    await pool.acquire('test-module');
    await pool.acquire('test-module');

    await expect(pool.acquire('test-module')).rejects.toThrow(
      'Connection timeout'
    );
  });

  it('should close idle connections', async () => {
    const conn1 = await pool.acquire('test-module');
    pool.release(conn1);

    // Wait for idle timeout
    await new Promise((resolve) => setTimeout(resolve, 1100));
    pool.closeIdleConnections();

    const stats = pool.getStatistics();
    expect(stats.get('test-module')).toBeUndefined();
  });

  it('should get pool statistics', async () => {
    const conn1 = await pool.acquire('test-module');
    const conn2 = await pool.acquire('test-module');
    pool.release(conn1);

    const stats = pool.getStatistics();
    const moduleStats = stats.get('test-module');

    expect(moduleStats?.total).toBe(2);
    expect(moduleStats?.inUse).toBe(1);
    expect(moduleStats?.idle).toBe(1);
  });

  it('should close all connections for a module', async () => {
    await pool.acquire('test-module');
    await pool.acquire('test-module');

    pool.closeModule('test-module');

    const stats = pool.getStatistics();
    expect(stats.get('test-module')).toBeUndefined();
  });
});

describe('ModuleRPCClient', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    pool = new ConnectionPool();
  });

  afterEach(() => {
    pool.closeAll();
  });

  it('should call module methods successfully', async () => {
    const mockModule = {
      add: (a: number, b: number) => Promise.resolve(a + b),
    };

    const client = new ModuleRPCClient('math', mockModule, pool);
    const result = await client.call<number>('add', [2, 3]);

    expect(result).toBe(5);
  });

  it('should handle synchronous module methods', async () => {
    const mockModule = {
      multiply: (a: number, b: number) => a * b,
    };

    const client = new ModuleRPCClient('math', mockModule, pool);
    const result = await client.call<number>('multiply', [4, 5]);

    expect(result).toBe(20);
  });

  it('should serialize and deserialize arguments and results', async () => {
    const mockModule = {
      processUser: (user: { name: string; age: number }) =>
        Promise.resolve({ ...user, processed: true }),
    };

    const client = new ModuleRPCClient('user', mockModule, pool);
    const result = await client.call<{ name: string; age: number; processed: boolean }>(
      'processUser',
      [{ name: 'Alice', age: 30 }]
    );

    expect(result).toEqual({ name: 'Alice', age: 30, processed: true });
  });

  it('should timeout on slow methods', async () => {
    const mockModule = {
      slow: () =>
        new Promise((resolve) => setTimeout(() => resolve('done'), 1000)),
    };

    const client = new ModuleRPCClient('slow', mockModule, pool, {
      timeout: 100,
      maxRetries: 0, // Don't retry to get the timeout error directly
    });

    await expect(client.call('slow')).rejects.toThrow(RPCTimeoutError);
  });

  it('should retry on failures', async () => {
    let attempts = 0;
    const mockModule = {
      flaky: () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve('success');
      },
    };

    const client = new ModuleRPCClient('flaky', mockModule, pool, {
      maxRetries: 3,
      retryDelay: 10,
    });

    const result = await client.call('flaky');
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should use exponential backoff for retries', async () => {
    const delays: number[] = [];
    let attempts = 0;

    const mockModule = {
      failing: () => {
        attempts++;
        return Promise.reject(new Error('Always fails'));
      },
    };

    const client = new ModuleRPCClient('failing', mockModule, pool, {
      maxRetries: 3,
      retryDelay: 100,
      backoffMultiplier: 2,
    });

    const startTime = Date.now();
    try {
      await client.call('failing');
    } catch {
      // Expected to fail
    }
    const totalTime = Date.now() - startTime;

    // Should have tried 4 times (initial + 3 retries)
    expect(attempts).toBe(4);

    // Total time should be at least: 100 + 200 + 400 = 700ms
    expect(totalTime).toBeGreaterThanOrEqual(600);
  });

  it('should not retry on serialization errors', async () => {
    let attempts = 0;
    const mockModule = {
      badMethod: () => {
        attempts++;
        // Return something that can't be serialized
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        return Promise.resolve(circular);
      },
    };

    const client = new ModuleRPCClient('bad', mockModule, pool, {
      maxRetries: 3,
    });

    await expect(client.call('badMethod')).rejects.toThrow(
      RPCSerializationError
    );
    expect(attempts).toBe(1); // Should not retry
  });

  it('should throw error for non-existent methods', async () => {
    const mockModule = {
      existing: () => Promise.resolve('ok'),
    };

    const client = new ModuleRPCClient('test', mockModule, pool);

    await expect(client.call('nonExistent')).rejects.toThrow(RPCError);
  });

  it('should create a typed proxy', async () => {
    const mockModule = {
      add: (a: number, b: number) => Promise.resolve(a + b),
      subtract: (a: number, b: number) => Promise.resolve(a - b),
    };

    const client = new ModuleRPCClient('math', mockModule, pool);
    const proxy = client.createProxy() as typeof mockModule;

    const sum = await proxy.add(10, 5);
    const diff = await proxy.subtract(10, 5);

    expect(sum).toBe(15);
    expect(diff).toBe(5);
  });

  it('should respect retryOnTimeout option', async () => {
    let attempts = 0;
    const mockModule = {
      slow: () => {
        attempts++;
        return new Promise((resolve) =>
          setTimeout(() => resolve('done'), 200)
        );
      },
    };

    const client = new ModuleRPCClient('slow', mockModule, pool, {
      timeout: 100,
      maxRetries: 3,
      retryOnTimeout: false,
    });

    await expect(client.call('slow')).rejects.toThrow(RPCTimeoutError);
    expect(attempts).toBe(1); // Should not retry on timeout
  });
});

describe('createModuleClient', () => {
  it('should create a typed client proxy', async () => {
    const mockModule = {
      greet: (name: string) => Promise.resolve(`Hello, ${name}!`),
      add: (a: number, b: number) => Promise.resolve(a + b),
    };

    const client = createModuleClient('test', mockModule);

    const greeting = await (client as typeof mockModule).greet('World');
    const sum = await (client as typeof mockModule).add(2, 3);

    expect(greeting).toBe('Hello, World!');
    expect(sum).toBe(5);
  });
});

describe('Global Connection Pool', () => {
  afterEach(() => {
    closeGlobalConnectionPool();
  });

  it('should create and return global pool', () => {
    const pool1 = getGlobalConnectionPool();
    const pool2 = getGlobalConnectionPool();

    expect(pool1).toBe(pool2);
  });

  it('should allow setting custom global pool', () => {
    const customPool = new ConnectionPool({ maxConnections: 20 });
    setGlobalConnectionPool(customPool);

    const pool = getGlobalConnectionPool();
    expect(pool).toBe(customPool);
  });

  it('should close global pool', async () => {
    const pool = getGlobalConnectionPool();
    await pool.acquire('test');

    closeGlobalConnectionPool();

    // Should create a new pool after closing
    const newPool = getGlobalConnectionPool();
    expect(newPool).not.toBe(pool);
  });
});

describe('Error Handling', () => {
  it('should create RPCError with proper details', () => {
    const error = new RPCError('Test error', 'test-module', 'testMethod');

    expect(error.name).toBe('RPCError');
    expect(error.message).toBe('Test error');
    expect(error.moduleName).toBe('test-module');
    expect(error.method).toBe('testMethod');
  });

  it('should create RPCTimeoutError with timeout info', () => {
    const error = new RPCTimeoutError('test-module', 'testMethod', 5000);

    expect(error.name).toBe('RPCTimeoutError');
    expect(error.message).toContain('5000ms');
    expect(error.moduleName).toBe('test-module');
    expect(error.method).toBe('testMethod');
  });

  it('should create RPCSerializationError with cause', () => {
    const cause = new Error('JSON parse error');
    const error = new RPCSerializationError('test-module', 'testMethod', cause);

    expect(error.name).toBe('RPCSerializationError');
    expect(error.cause).toBe(cause);
  });
});
