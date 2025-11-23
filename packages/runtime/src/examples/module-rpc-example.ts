/**
 * @module runtime/examples/module-rpc-example
 * @description Example demonstrating Module RPC adapters usage
 */

import {
  createGlobalContext,
  registerModule,
  getModule,
  type GlobalContext,
} from '../global-context.js';
import type { RPCCallOptions } from '../module-rpc.js';

// Example: Database module
interface DatabaseModule {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  insert(table: string, data: Record<string, unknown>): Promise<number>;
  update(table: string, id: number, data: Record<string, unknown>): Promise<boolean>;
  delete(table: string, id: number): Promise<boolean>;
}

// Mock database implementation
const databaseModule: DatabaseModule = {
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    console.log(`Executing query: ${sql}`, params);
    // Simulate database query
    await new Promise((resolve) => setTimeout(resolve, 10));
    return [] as T[];
  },

  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    console.log(`Inserting into ${table}:`, data);
    // Simulate database insert
    await new Promise((resolve) => setTimeout(resolve, 10));
    return Math.floor(Math.random() * 1000);
  },

  async update(table: string, id: number, data: Record<string, unknown>): Promise<boolean> {
    console.log(`Updating ${table} id ${id}:`, data);
    // Simulate database update
    await new Promise((resolve) => setTimeout(resolve, 10));
    return true;
  },

  async delete(table: string, id: number): Promise<boolean> {
    console.log(`Deleting from ${table} id ${id}`);
    // Simulate database delete
    await new Promise((resolve) => setTimeout(resolve, 10));
    return true;
  },
};

// Example: Cache module
interface CacheModule {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

// Mock cache implementation
const cacheModule: CacheModule = {
  async get<T>(key: string): Promise<T | null> {
    console.log(`Cache get: ${key}`);
    // Simulate cache lookup
    await new Promise((resolve) => setTimeout(resolve, 5));
    return null;
  },

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    console.log(`Cache set: ${key}`, { value, ttl });
    // Simulate cache set
    await new Promise((resolve) => setTimeout(resolve, 5));
  },

  async delete(key: string): Promise<boolean> {
    console.log(`Cache delete: ${key}`);
    // Simulate cache delete
    await new Promise((resolve) => setTimeout(resolve, 5));
    return true;
  },
};

/**
 * Example 1: Basic module registration with RPC
 */
async function example1() {
  console.log('\n=== Example 1: Basic Module Registration ===\n');

  // Create global context
  const gctx = createGlobalContext();

  // Register modules with automatic RPC wrapping
  registerModule(gctx, 'db', databaseModule);
  registerModule(gctx, 'cache', cacheModule);

  // Access modules through typed clients
  const db = getModule<DatabaseModule>(gctx, 'db');
  const cache = getModule<CacheModule>(gctx, 'cache');

  if (db && cache) {
    // Use the modules - RPC client handles serialization, retry, and timeout
    const userId = await db.insert('users', { name: 'Alice', email: 'alice@example.com' });
    console.log(`Created user with ID: ${userId}`);

    await cache.set(`user:${userId}`, { name: 'Alice', email: 'alice@example.com' }, 3600);
    console.log('Cached user data');

    const cachedUser = await cache.get(`user:${userId}`);
    console.log('Retrieved from cache:', cachedUser);
  }
}

/**
 * Example 2: Custom RPC options
 */
async function example2() {
  console.log('\n=== Example 2: Custom RPC Options ===\n');

  const gctx = createGlobalContext();

  // Register module with custom RPC options
  const rpcOptions: RPCCallOptions = {
    timeout: 10000, // 10 second timeout
    maxRetries: 5, // Retry up to 5 times
    retryDelay: 200, // Start with 200ms delay
    backoffMultiplier: 2, // Double delay each retry
    maxRetryDelay: 10000, // Max 10 second delay
  };

  registerModule(gctx, 'db', databaseModule, { rpcOptions });

  const db = getModule<DatabaseModule>(gctx, 'db');
  if (db) {
    // This call will use the custom RPC options
    const users = await db.query('SELECT * FROM users WHERE active = ?', [true]);
    console.log(`Found ${users.length} active users`);
  }
}

/**
 * Example 3: Error handling and retries
 */
async function example3() {
  console.log('\n=== Example 3: Error Handling and Retries ===\n');

  // Create a flaky module that fails sometimes
  let attempts = 0;
  const flakyModule = {
    async getData(): Promise<string> {
      attempts++;
      console.log(`Attempt ${attempts}`);

      if (attempts < 3) {
        throw new Error('Temporary failure');
      }

      return 'Success!';
    },
  };

  const gctx = createGlobalContext();
  registerModule(gctx, 'flaky', flakyModule, {
    rpcOptions: {
      maxRetries: 3,
      retryDelay: 100,
    },
  });

  const flaky = getModule<typeof flakyModule>(gctx, 'flaky');
  if (flaky) {
    try {
      const result = await flaky.getData();
      console.log(`Result: ${result}`);
      console.log(`Total attempts: ${attempts}`);
    } catch (error) {
      console.error('Failed after retries:', error);
    }
  }
}

/**
 * Example 4: Module without RPC (direct access)
 */
async function example4() {
  console.log('\n=== Example 4: Module Without RPC ===\n');

  const gctx = createGlobalContext();

  // Register module without RPC wrapping
  registerModule(gctx, 'db', databaseModule, { enableRPC: false });

  const db = getModule<DatabaseModule>(gctx, 'db');
  if (db) {
    // Direct access without RPC overhead
    const userId = await db.insert('users', { name: 'Bob', email: 'bob@example.com' });
    console.log(`Created user with ID: ${userId} (direct access)`);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await example1();
    await example2();
    await example3();
    await example4();

    console.log('\n=== All examples completed successfully ===\n');
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export { example1, example2, example3, example4, runExamples };
