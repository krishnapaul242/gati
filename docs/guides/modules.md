# Module Creation Guide

Modules are the building blocks of reusable business logic in Gati. They provide shared functionality through dependency injection and support full lifecycle management. This guide covers everything you need to create robust, testable modules.

## Table of Contents

- [Module Overview](#module-overview)
- [Module Structure](#module-structure)
- [Module Lifecycle](#module-lifecycle)
- [Creating Modules](#creating-modules)
- [Dependency Injection](#dependency-injection)
- [Module Registration](#module-registration)
- [Testing Modules](#testing-modules)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)
- [Common Pitfalls](#common-pitfalls)

## Module Overview

A module in Gati is a reusable component that:
- Provides shared functionality across handlers
- Initializes once at application startup
- Supports lifecycle hooks (init, shutdown, health checks)
- Integrates via dependency injection through global context
- Can depend on other modules

### Why Use Modules?

**✅ Benefits:**
- **Reusability**: Write once, use everywhere
- **Testability**: Easy to mock and test
- **Lifecycle Management**: Automatic initialization and cleanup
- **Dependency Injection**: Loose coupling, better architecture
- **Resource Management**: Share expensive resources (DB connections, caches)

**Common Use Cases:**
- Database connections
- Cache clients (Redis, Memcached)
- Logging systems
- Authentication services
- External API clients
- Email services
- File storage

## Module Structure

### Module Interface

```typescript
interface Module<T = unknown> {
  name: string;              // Unique module identifier
  version: string;           // Semantic version
  description?: string;      // Optional description
  dependencies?: string[];   // Required module names
  exports: T;                // Module functionality
  init?(gctx: GlobalContext): Promise<void> | void;     // Initialization
  shutdown?(): Promise<void> | void;                     // Cleanup
  healthCheck?(): Promise<boolean> | boolean;            // Health status
}
```

### Basic Module Example

```typescript
export interface Logger {
  log: (message: string) => void;
  error: (message: string, error?: Error) => void;
  warn: (message: string) => void;
}

export const loggerModule: Module<Logger> = {
  name: 'logger',
  version: '1.0.0',
  description: 'Simple logging module',
  
  exports: {
    log: (message: string) => console.log(`[INFO] ${message}`),
    error: (message: string, error?: Error) => {
      console.error(`[ERROR] ${message}`);
      if (error) console.error(error);
    },
    warn: (message: string) => console.warn(`[WARN] ${message}`),
  },
};
```

## Module Lifecycle

Modules go through several lifecycle stages:

### 1. Registration

Module is registered with the module loader:

```typescript
const loader = createModuleLoader();
await loader.register(myModule, gctx);
```

### 2. Initialization

The `init` function is called (if provided):

```typescript
const dbModule: Module<Database> = {
  name: 'database',
  version: '1.0.0',
  
  exports: {} as Database, // Will be populated in init
  
  async init(gctx: GlobalContext) {
    // Create database connection
    const connection = await createConnection({
      host: gctx.config.dbHost,
      port: gctx.config.dbPort,
    });
    
    // Assign to exports
    Object.assign(this.exports, {
      query: (sql) => connection.query(sql),
      close: () => connection.close(),
    });
    
    console.log('Database module initialized');
  },
};
```

### 3. Active/Running

Module is available via global context:

```typescript
const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules['database'];
  const users = await db.query('SELECT * FROM users');
  res.json({ users });
};
```

### 4. Shutdown

The `shutdown` function is called on app shutdown:

```typescript
const dbModule: Module<Database> = {
  // ... other properties
  
  async shutdown() {
    await this.exports.close();
    console.log('Database module shut down');
  },
};
```

### Lifecycle State Diagram

```
uninitialized → initializing → initialized → shutdown
                     ↓
                   error
```

## Creating Modules

### Pattern 1: Simple Function Module

Best for stateless utilities:

```typescript
import type { Module } from 'gati';
import type { GlobalContext } from 'gati';

export interface MathUtils {
  add: (a: number, b: number) => number;
  multiply: (a: number, b: number) => number;
}

export function createMathModule(): Module<MathUtils> {
  return {
    name: 'math',
    version: '1.0.0',
    description: 'Math utility functions',
    
    exports: {
      add: (a, b) => a + b,
      multiply: (a, b) => a * b,
    },
  };
}
```

### Pattern 2: Factory Function Module

Best for modules with configuration:

```typescript
export interface Logger {
  log: (message: string) => void;
  error: (message: string, error?: Error) => void;
}

export interface LoggerConfig {
  level: 'info' | 'warn' | 'error';
  prefix?: string;
}

export function createLoggerModule(config: LoggerConfig): Module<Logger> {
  const { level, prefix = '[App]' } = config;
  
  return {
    name: 'logger',
    version: '1.0.0',
    
    exports: {
      log: (message) => {
        if (level === 'info') {
          console.log(`${prefix} [INFO] ${message}`);
        }
      },
      
      error: (message, error) => {
        console.error(`${prefix} [ERROR] ${message}`);
        if (error) console.error(error);
      },
    },
  };
}
```

### Pattern 3: Class-Based Module

Best for complex stateful modules:

```typescript
export class DatabaseModule implements Module<DatabaseClient> {
  name = 'database';
  version = '1.0.0';
  description = 'PostgreSQL database module';
  
  private connection: Connection | null = null;
  
  exports = {
    query: async (sql: string) => {
      if (!this.connection) {
        throw new Error('Database not connected');
      }
      return this.connection.query(sql);
    },
    
    transaction: async (fn: (tx: Transaction) => Promise<void>) => {
      if (!this.connection) {
        throw new Error('Database not connected');
      }
      return this.connection.transaction(fn);
    },
  };
  
  async init(gctx: GlobalContext): Promise<void> {
    const config = gctx.config as { dbUrl: string };
    this.connection = await createConnection(config.dbUrl);
    console.log('Database connected');
  }
  
  async shutdown(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      console.log('Database disconnected');
    }
  }
  
  async healthCheck(): Promise<boolean> {
    if (!this.connection) return false;
    
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
```

### Pattern 4: Async Initialization Module

Best for modules requiring async setup:

```typescript
export interface CacheClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
}

export function createCacheModule(): Module<CacheClient> {
  let client: RedisClient | null = null;
  
  return {
    name: 'cache',
    version: '1.0.0',
    description: 'Redis cache module',
    
    exports: {
      get: async (key) => {
        if (!client) throw new Error('Cache not initialized');
        return client.get(key);
      },
      
      set: async (key, value, ttl) => {
        if (!client) throw new Error('Cache not initialized');
        return client.set(key, value, ttl);
      },
      
      del: async (key) => {
        if (!client) throw new Error('Cache not initialized');
        return client.del(key);
      },
    },
    
    async init(gctx: GlobalContext) {
      const config = gctx.config as { redisUrl: string };
      client = await createRedisClient(config.redisUrl);
      
      // Test connection
      await client.ping();
      console.log('Redis cache connected');
    },
    
    async shutdown() {
      if (client) {
        await client.quit();
        client = null;
        console.log('Redis cache disconnected');
      }
    },
    
    async healthCheck() {
      if (!client) return false;
      try {
        await client.ping();
        return true;
      } catch {
        return false;
      }
    },
  };
}
```

## Dependency Injection

### Accessing Modules in Handlers

Modules are injected via global context:

```typescript
const handler: Handler = async (req, res, gctx) => {
  // Access modules
  const db = gctx.modules['database'] as Database;
  const cache = gctx.modules['cache'] as CacheClient;
  const logger = gctx.modules['logger'] as Logger;
  
  // Use modules
  logger.log('Fetching user');
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  
  res.json({ user });
};
```

### Type-Safe Module Access

Create typed helper functions:

```typescript
// src/modules/types.ts
export interface ModuleRegistry {
  database: Database;
  cache: CacheClient;
  logger: Logger;
  email: EmailService;
}

// Helper function
export function getModule<K extends keyof ModuleRegistry>(
  gctx: GlobalContext,
  name: K
): ModuleRegistry[K] {
  return gctx.modules[name] as ModuleRegistry[K];
}

// Usage in handler
const handler: Handler = async (req, res, gctx) => {
  const db = getModule(gctx, 'database');     // Typed as Database
  const cache = getModule(gctx, 'cache');     // Typed as CacheClient
  
  // TypeScript knows the types!
  const user = await db.query(/* ... */);
  await cache.set(/* ... */);
};
```

### Module Dependencies

Modules can depend on other modules:

```typescript
export function createUserServiceModule(): Module<UserService> {
  return {
    name: 'userService',
    version: '1.0.0',
    dependencies: ['database', 'cache'], // Requires these modules
    
    exports: {
      async getUser(id: string, gctx: GlobalContext) {
        const cache = gctx.modules['cache'] as CacheClient;
        const db = gctx.modules['database'] as Database;
        
        // Try cache first
        const cached = await cache.get(`user:${id}`);
        if (cached) return JSON.parse(cached);
        
        // Fallback to database
        const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        
        // Store in cache
        await cache.set(`user:${id}`, JSON.stringify(user), 3600);
        
        return user;
      },
    },
    
    async init(gctx: GlobalContext) {
      // Dependencies are guaranteed to be initialized
      const db = gctx.modules['database'];
      const cache = gctx.modules['cache'];
      
      console.log('User service initialized with dependencies');
    },
  };
}
```

### Dependency Ordering

The module loader automatically resolves dependencies:

```typescript
// These will be initialized in the correct order:
// 1. database (no dependencies)
// 2. cache (no dependencies)
// 3. userService (depends on database and cache)

modules: (gctx) => {
  gctx.modules['database'] = createDatabaseModule();
  gctx.modules['cache'] = createCacheModule();
  gctx.modules['userService'] = createUserServiceModule();
}
```

## Module Registration

### In Configuration File

Register modules in `gati.config.ts`:

```typescript
import type { GlobalContext } from 'gati';
import { createLoggerModule } from './src/modules/logger';
import { createDatabaseModule } from './src/modules/database';
import { createCacheModule } from './src/modules/cache';

export default {
  server: {
    port: 3000,
    host: 'localhost',
  },
  
  routes: [/* ... */],
  
  modules: (gctx: GlobalContext) => {
    // Register logger
    gctx.modules['logger'] = createLoggerModule({
      level: 'info',
      prefix: '[MyApp]',
    }).exports;
    
    // Register database
    gctx.modules['database'] = createDatabaseModule({
      url: process.env.DATABASE_URL!,
    }).exports;
    
    // Register cache
    gctx.modules['cache'] = createCacheModule({
      url: process.env.REDIS_URL!,
    }).exports;
  },
};
```

### With Module Loader

For advanced scenarios with lifecycle management:

```typescript
import { createModuleLoader } from 'gati/runtime';

export default {
  server: { port: 3000 },
  routes: [/* ... */],
  
  async modules(gctx: GlobalContext) {
    const loader = createModuleLoader({
      autoInit: true,
      initTimeout: 30000,
    });
    
    // Register modules
    await loader.register(createDatabaseModule(), gctx);
    await loader.register(createCacheModule(), gctx);
    await loader.register(createUserServiceModule(), gctx);
    
    // Get initialized modules
    gctx.modules['database'] = await loader.get('database', gctx);
    gctx.modules['cache'] = await loader.get('cache', gctx);
    gctx.modules['userService'] = await loader.get('userService', gctx);
    
    // Register cleanup
    gctx.lifecycle.onShutdown(async () => {
      await loader.shutdownAll();
    });
  },
};
```

## Testing Modules

### Unit Testing Modules

Test modules in isolation:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLoggerModule } from '../src/modules/logger';

describe('Logger Module', () => {
  let logger: Logger;
  
  beforeEach(() => {
    const module = createLoggerModule({ level: 'info' });
    logger = module.exports;
  });
  
  it('should log info messages', () => {
    const spy = vi.spyOn(console, 'log');
    logger.log('test message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('test message'));
  });
  
  it('should log error messages', () => {
    const spy = vi.spyOn(console, 'error');
    logger.error('error message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('error message'));
  });
});
```

### Testing Module Initialization

```typescript
import { describe, it, expect } from 'vitest';
import { createDatabaseModule } from '../src/modules/database';
import { createGlobalContext } from 'gati/runtime';

describe('Database Module', () => {
  it('should initialize connection', async () => {
    const gctx = createGlobalContext({
      config: { dbUrl: 'postgresql://localhost/testdb' },
    });
    
    const module = createDatabaseModule();
    
    // Initialize module
    await module.init?.(gctx);
    
    // Verify connection
    expect(module.exports.query).toBeDefined();
    
    // Cleanup
    await module.shutdown?.();
  });
  
  it('should handle initialization errors', async () => {
    const gctx = createGlobalContext({
      config: { dbUrl: 'invalid://url' },
    });
    
    const module = createDatabaseModule();
    
    // Should throw on invalid config
    await expect(module.init?.(gctx)).rejects.toThrow();
  });
});
```

### Mocking Modules in Handler Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createMockRequest, createMockResponse } from 'gati/testing';
import { getUserHandler } from '../src/handlers/user';

describe('User Handler', () => {
  it('should fetch user from database', async () => {
    // Create mock module
    const mockDb = {
      query: vi.fn().mockResolvedValue({ id: '1', name: 'Alice' }),
    };
    
    // Create mock context
    const gctx = createGlobalContext({
      modules: { database: mockDb },
    });
    const lctx = createLocalContext();
    
    // Create mock request/response
    const req = createMockRequest({ params: { id: '1' } });
    const res = createMockResponse();
    
    // Execute handler
    await getUserHandler(req, res, gctx, lctx);
    
    // Verify
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['1']
    );
    expect(res.json).toHaveBeenCalledWith({
      user: { id: '1', name: 'Alice' },
    });
  });
});
```

## Best Practices

### 1. Single Responsibility

Each module should have one clear purpose:

```typescript
// ✅ Good - Focused module
const loggerModule = createLoggerModule();

// ❌ Bad - Too many responsibilities
const utilsModule = {
  log: () => {},
  sendEmail: () => {},
  processPayment: () => {},
  generatePdf: () => {},
};
```

### 2. Explicit Dependencies

Declare module dependencies explicitly:

```typescript
// ✅ Good - Explicit dependencies
export function createUserServiceModule(): Module<UserService> {
  return {
    name: 'userService',
    dependencies: ['database', 'cache'],
    // ...
  };
}

// ❌ Bad - Hidden dependencies
export function createUserServiceModule(): Module<UserService> {
  return {
    name: 'userService',
    // Implicitly uses database and cache without declaring
  };
}
```

### 3. Handle Initialization Errors

Fail fast with clear error messages:

```typescript
async init(gctx: GlobalContext) {
  try {
    this.connection = await createConnection(config);
  } catch (error) {
    throw new ModuleInitializationError(
      'database',
      new Error(`Failed to connect: ${error.message}`)
    );
  }
}
```

### 4. Cleanup Resources

Always implement shutdown for resources:

```typescript
const dbModule: Module<Database> = {
  // ...
  
  async shutdown() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  },
};
```

### 5. Provide Health Checks

Implement health checks for monitoring:

```typescript
const dbModule: Module<Database> = {
  // ...
  
  async healthCheck() {
    if (!this.connection) return false;
    
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
};
```

### 6. Use Semantic Versioning

Version your modules properly:

```typescript
const module: Module<API> = {
  name: 'myModule',
  version: '2.1.0', // MAJOR.MINOR.PATCH
  // ...
};
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Real-World Examples

### Example 1: PostgreSQL Database Module

```typescript
import { Pool } from 'pg';
import type { Module, GlobalContext } from 'gati';

export interface Database {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  transaction: <T>(fn: (client: PoolClient) => Promise<T>) => Promise<T>;
}

export function createDatabaseModule(): Module<Database> {
  let pool: Pool | null = null;
  
  return {
    name: 'database',
    version: '1.0.0',
    description: 'PostgreSQL database connection pool',
    
    exports: {
      query: async (sql, params = []) => {
        if (!pool) throw new Error('Database not initialized');
        const result = await pool.query(sql, params);
        return result.rows;
      },
      
      transaction: async (fn) => {
        if (!pool) throw new Error('Database not initialized');
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          const result = await fn(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
    },
    
    async init(gctx: GlobalContext) {
      const config = gctx.config as { databaseUrl: string };
      
      pool = new Pool({
        connectionString: config.databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      // Test connection
      await pool.query('SELECT NOW()');
      console.log('Database connection pool created');
      
      // Register shutdown
      gctx.lifecycle.onShutdown(async () => {
        await this.shutdown?.();
      });
    },
    
    async shutdown() {
      if (pool) {
        await pool.end();
        pool = null;
        console.log('Database connection pool closed');
      }
    },
    
    async healthCheck() {
      if (!pool) return false;
      try {
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
  };
}
```

### Example 2: Redis Cache Module

```typescript
import { createClient } from 'redis';
import type { Module, GlobalContext } from 'gati';

export interface CacheClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
}

export function createCacheModule(): Module<CacheClient> {
  let client: ReturnType<typeof createClient> | null = null;
  
  return {
    name: 'cache',
    version: '1.0.0',
    description: 'Redis cache client',
    
    exports: {
      get: async (key) => {
        if (!client) throw new Error('Cache not initialized');
        return client.get(key);
      },
      
      set: async (key, value, ttl) => {
        if (!client) throw new Error('Cache not initialized');
        if (ttl) {
          await client.setEx(key, ttl, value);
        } else {
          await client.set(key, value);
        }
      },
      
      del: async (key) => {
        if (!client) throw new Error('Cache not initialized');
        await client.del(key);
      },
      
      exists: async (key) => {
        if (!client) throw new Error('Cache not initialized');
        const result = await client.exists(key);
        return result > 0;
      },
    },
    
    async init(gctx: GlobalContext) {
      const config = gctx.config as { redisUrl: string };
      
      client = createClient({ url: config.redisUrl });
      
      client.on('error', (err) => {
        console.error('Redis client error:', err);
      });
      
      await client.connect();
      console.log('Redis cache connected');
    },
    
    async shutdown() {
      if (client) {
        await client.quit();
        client = null;
        console.log('Redis cache disconnected');
      }
    },
    
    async healthCheck() {
      if (!client || !client.isOpen) return false;
      try {
        await client.ping();
        return true;
      } catch {
        return false;
      }
    },
  };
}
```

### Example 3: Email Service Module

```typescript
import nodemailer from 'nodemailer';
import type { Module, GlobalContext } from 'gati';

export interface EmailService {
  send: (to: string, subject: string, body: string) => Promise<void>;
  sendTemplate: (to: string, template: string, data: any) => Promise<void>;
}

export function createEmailModule(): Module<EmailService> {
  let transporter: nodemailer.Transporter | null = null;
  
  return {
    name: 'email',
    version: '1.0.0',
    description: 'Email service using nodemailer',
    
    exports: {
      send: async (to, subject, body) => {
        if (!transporter) throw new Error('Email service not initialized');
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to,
          subject,
          html: body,
        });
      },
      
      sendTemplate: async (to, template, data) => {
        // Load template and render with data
        const body = renderTemplate(template, data);
        
        if (!transporter) throw new Error('Email service not initialized');
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to,
          subject: data.subject,
          html: body,
        });
      },
    },
    
    async init(gctx: GlobalContext) {
      const config = gctx.config as {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPass: string;
      };
      
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
      
      // Verify connection
      await transporter.verify();
      console.log('Email service initialized');
    },
    
    async shutdown() {
      if (transporter) {
        transporter.close();
        transporter = null;
        console.log('Email service closed');
      }
    },
    
    async healthCheck() {
      if (!transporter) return false;
      try {
        await transporter.verify();
        return true;
      } catch {
        return false;
      }
    },
  };
}
```

## Common Pitfalls

### Pitfall 1: Not Handling Init Errors

❌ **Bad:**
```typescript
async init(gctx: GlobalContext) {
  this.connection = await createConnection(config);
  // No error handling - app crashes silently
}
```

✅ **Good:**
```typescript
async init(gctx: GlobalContext) {
  try {
    this.connection = await createConnection(config);
    console.log('Connected successfully');
  } catch (error) {
    console.error('Failed to initialize:', error);
    throw new ModuleInitializationError('database', error as Error);
  }
}
```

### Pitfall 2: Forgetting to Clean Up

❌ **Bad:**
```typescript
const module: Module<DB> = {
  // ... init creates connection
  // No shutdown function - connection leaks!
};
```

✅ **Good:**
```typescript
const module: Module<DB> = {
  async init(gctx) {
    this.connection = await createConnection();
  },
  
  async shutdown() {
    await this.connection?.close();
    this.connection = null;
  },
};
```

### Pitfall 3: Circular Dependencies

❌ **Bad:**
```typescript
// Module A depends on B
moduleA.dependencies = ['moduleB'];

// Module B depends on A (circular!)
moduleB.dependencies = ['moduleA'];
```

✅ **Good:**
```typescript
// Extract shared logic to a third module
moduleA.dependencies = ['shared'];
moduleB.dependencies = ['shared'];
```

### Pitfall 4: Mutating Module State

❌ **Bad:**
```typescript
const handler: Handler = (req, res, gctx) => {
  const module = gctx.modules['myModule'];
  module.counter++; // Shared state - race conditions!
};
```

✅ **Good:**
```typescript
// Use request-local state
const handler: Handler = (req, res, gctx, lctx) => {
  lctx.state.counter = (lctx.state.counter || 0) + 1;
};
```

### Pitfall 5: Not Declaring Dependencies

❌ **Bad:**
```typescript
const module: Module = {
  name: 'userService',
  // Missing dependencies declaration
  
  exports: {
    getUser: async (id, gctx) => {
      // Implicitly uses 'database' module
      return gctx.modules['database'].query(/* ... */);
    },
  },
};
```

✅ **Good:**
```typescript
const module: Module = {
  name: 'userService',
  dependencies: ['database'], // Explicit
  
  exports: {
    getUser: async (id, gctx) => {
      return gctx.modules['database'].query(/* ... */);
    },
  },
};
```

---

**Next:** [Architecture Documentation](./architecture.md) →

**See Also:**
- [Getting Started Guide](./getting-started.md)
- [Handler Development Guide](./handlers.md)
