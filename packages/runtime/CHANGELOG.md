# @gati-framework/runtime

## 1.3.0

### Minor Changes

- **WHAT:** Added structured logging with pino for production observability

  **WHY:** Console logging is unstructured and provides no context for production debugging

  **NEW FEATURES:**
  - ✅ **Structured logging** - Integrated pino logger with JSON output in production
  - ✅ **Environment-aware logging** - Pretty-printed logs in development, JSON in production
  - ✅ **Request tracking** - Automatic request ID logging across all log statements
  - ✅ **Configurable log levels** - Support for trace, debug, info, warn, error, fatal levels

  **IMPROVEMENTS:**
  - Replaced all console.log/warn/error calls with structured logger
  - Added logger configuration to AppConfig
  - Exported createLogger() and default logger for user consumption
  - Performance metrics (request duration) logged automatically
  - Error logging includes full context (stack traces, metadata)

  **HOW TO USE:**

  ```typescript
  import { createApp, logger, createLogger } from '@gati-framework/runtime';

  // Configure logger at app level
  const app = createApp({
    port: 3000,
    logger: {
      level: 'info',
      pretty: process.env.NODE_ENV !== 'production',
    },
  });

  // Use default logger in handlers
  app.get('/users', (req, res, gctx, lctx) => {
    logger.info({ requestId: lctx.requestId }, 'Fetching users');
    const users = getUsersFromDB();
    logger.info(
      { requestId: lctx.requestId, count: users.length },
      'Users fetched successfully'
    );
    res.json({ users });
  });

  // Create custom loggers for modules
  const dbLogger = createLogger({
    name: 'database',
    level: 'debug',
  });
  ```

  **TESTING:**
  - Added 30 new tests for app-core.ts and handler-engine.ts
  - Test coverage increased from 65% to 78.29%
  - Total tests: 88 (up from 58)
  - All tests passing

## 1.2.0

### Minor Changes

- **WHAT:** Integrated structured logging with pino for production observability

  **WHY:** Console.log statements lack structure, context, and proper log levels for production monitoring

  **NEW FEATURES:**
  - ✅ **Structured logging** - Replaced all console.log/warn/error with pino-based structured logger
  - ✅ **Environment-aware output** - Pretty-printed logs in development, JSON in production
  - ✅ **Contextual logging** - Request IDs, methods, paths, durations tracked automatically
  - ✅ **Exported logger utilities** - `createLogger()` and default `logger` available for user code

  **IMPROVEMENTS:**
  - All HTTP requests logged with structured metadata (method, path, requestId, duration)
  - Errors logged with full context (stack traces, request IDs)
  - Module operations logged with structured metadata
  - Pretty printing in development for readability
  - JSON output in production for log aggregation tools

  **HOW TO USE:**

  ```typescript
  import { createApp, logger, createLogger } from '@gati-framework/runtime';

  // Use default logger
  logger.info({ userId: '123' }, 'User action performed');

  // Create custom logger
  const customLogger = createLogger({
    name: 'my-app',
    level: 'debug',
    pretty: false // Force JSON output
  });

  // Logging happens automatically in app-core
  const app = createApp({ 
    port: 3000,
    logger: { level: 'debug' } // Configure app logger
  });
  ```

  **DEPENDENCIES:**
  - Added `pino@9.14.0` for structured logging
  - Added `pino-pretty@13.1.2` (dev) for pretty output

  **TESTING:**
  - All 58 tests passing
  - No regressions introduced

## 1.2.0

### Minor Changes

- **WHAT:** Added production-ready reliability features

  **WHY:** Essential features for production deployments were missing

  **NEW FEATURES:**
  - ✅ **CORS middleware** - Built-in `createCorsMiddleware()` helper with full configuration
  - ✅ **Graceful shutdown** - Waits for active requests to complete before shutting down (10s timeout)
  - ✅ **Request timeout handling** - Automatic 408 timeout responses for hanging requests
  - ✅ **Request tracking** - Active request counter for monitoring

  **IMPROVEMENTS:**
  - CORS supports string, array, and dynamic origin validation
  - Graceful shutdown prevents abrupt connection termination
  - Per-request timeout prevents resource exhaustion
  - Server tracks active requests and reports count on shutdown

  **HOW TO USE:**

  ```typescript
  import { createApp, createCorsMiddleware } from '@gati-framework/runtime';

  const app = createApp({ 
    port: 3000,
    timeout: 30000 // 30 second request timeout
  });

  // Add CORS middleware
  app.use(createCorsMiddleware({
    origin: 'https://myapp.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }));

  await app.listen();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close(); // Waits for active requests to finish
  });
  ```

  **TESTING:**
  - Added 13 new CORS middleware tests
  - Total tests: 58 (up from 45)
  - All tests passing

## 1.1.0

### Minor Changes

- **WHAT:** Added critical runtime improvements for production readiness

  **WHY:** Essential features for handling real-world HTTP requests were missing from v1.0.0

  **NEW FEATURES:**
  - ✅ **Request body parsing** - Automatically parse JSON, form data, and text bodies
  - ✅ **Query string parsing** - Extract URL query parameters into `req.query`
  - ✅ **Header extraction** - Populate `req.headers` from incoming requests
  - ✅ **Wildcard middleware paths** - Support `/api/*`, `/api/:version/*` patterns
  - ✅ **Environment-aware errors** - Hide stack traces in production mode

  **IMPROVEMENTS:**
  - Body parsing supports `application/json`, `application/x-www-form-urlencoded`, and `text/*`
  - Query parameters properly handle arrays (e.g., `?tags=js&tags=ts`)
  - Middleware path matching now supports wildcards and parameter patterns
  - Error responses exclude sensitive details when `NODE_ENV=production`

  **HOW TO USE:**

  ```typescript
  // Body parsing (automatic)
  app.post('/users', (req, res) => {
    const { name, email } = req.body; // ✅ Now populated!
    res.json({ created: true });
  });

  // Query parameters (automatic)
  app.get('/search', (req, res) => {
    const { q, limit } = req.query; // ✅ Now populated!
    res.json({ results: [] });
  });

  // Wildcard middleware
  app.use(corsMiddleware, { path: '/api/*' }); // ✅ Matches all /api/* routes
  ```

  **TESTING:**
  - Added 14 new tests for request parsing and middleware path matching
  - Test coverage increased from 40% to 60%

## 1.0.0

### Major Changes

- **Initial Release of @gati-framework/runtime**

  **WHAT:** First major release (v1.0.0) of the runtime execution engine for Gati applications.

  **WHY:** Extracted runtime from monorepo core to enable standalone deployments. Scaffolded projects can now use `@gati-framework/runtime` as a dependency to execute handlers.

  **FEATURES:**
  - ✅ GatiApp class for HTTP server management
  - ✅ Automatic handler discovery from file system
  - ✅ Convention-based routing (e.g., `/handlers/hello.ts` → `GET /hello`)
  - ✅ Middleware pipeline support
  - ✅ Global and local context management
  - ✅ Module registry for dependency injection
  - ✅ Full TypeScript support with type exports

  **HOW TO USE:**

  ```typescript
  import { createApp, loadHandlers } from '@gati-framework/runtime';

  const app = createApp({ port: 3000 });
  await loadHandlers(app, './src/handlers');
  await app.listen();
  ```

  **BREAKING CHANGES:** None (initial release)
