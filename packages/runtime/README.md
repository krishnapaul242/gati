# @gati-framework/runtime

> Runtime execution engine for Gati handler-based applications

## Installation

```bash
npm install @gati-framework/runtime
# or
pnpm add @gati-framework/runtime
# or
yarn add @gati-framework/runtime
```

## Usage

### Basic Setup

```typescript
import { createApp } from '@gati-framework/runtime';

const app = createApp({
  port: 3000,
  host: 'localhost',
  logging: true,
});

// Register handlers manually
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// Start the server
await app.listen();
```

### Automatic Handler Discovery

The runtime can automatically discover and register handlers from a directory:

```typescript
import { createApp, loadHandlers } from '@gati-framework/runtime';

const app = createApp();

// Automatically load all handlers from ./src/handlers
await loadHandlers(app, './src/handlers', {
  basePath: '/api',  // Optional: prefix all routes
  verbose: true,      // Optional: log registration
});

await app.listen();
```

### Handler File Structure

Handlers should export a `handler` function:

```typescript
// src/handlers/hello.ts
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
};

// Optional: Export metadata for registration
export const metadata = {
  method: 'GET',
  route: '/hello'
};
```

**File path routing:**
- `src/handlers/hello.ts` → `GET /hello`
- `src/handlers/users/create.ts` → `POST /users/create`
- `src/handlers/api/v1/posts.ts` → `GET /api/v1/posts`

### Configuration

```typescript
import { createApp } from '@gati-framework/runtime';

const app = createApp({
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  timeout: 30000,  // 30 seconds
  logging: process.env.NODE_ENV !== 'production',
  logger: {        // Optional logger configuration
    level: 'info', // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
    pretty: process.env.NODE_ENV !== 'production', // Pretty print in dev
  },
});
```

### Structured Logging

The runtime includes structured logging with pino for production observability:

```typescript
import { createApp, logger, createLogger } from '@gati-framework/runtime';

// Use the default logger in your handlers
app.get('/users', (req, res, gctx, lctx) => {
  logger.info({ requestId: lctx.requestId }, 'Fetching users');
  
  // Your logic here
  const users = getUsersFromDB();
  
  logger.info(
    { requestId: lctx.requestId, count: users.length },
    'Users fetched successfully'
  );
  
  res.json({ users });
});

// Create a custom logger for specific modules
const dbLogger = createLogger({
  name: 'database',
  level: 'debug',
  pretty: false, // Force JSON output
});

dbLogger.info({ query: 'SELECT * FROM users' }, 'Running query');
dbLogger.error({ error: err.message }, 'Database error');
```

**Log Levels:**
- `trace` - Very detailed debugging information
- `debug` - Debugging information
- `info` - Informational messages (default)
- `warn` - Warning messages
- `error` - Error messages
- `fatal` - Critical errors

**Output Formats:**
- Development: Pretty-printed, human-readable logs
- Production: JSON logs for aggregation tools (e.g., ELK, Datadog)

### Middleware

```typescript
import { createApp, createCorsMiddleware } from '@gati-framework/runtime';

const app = createApp();

// Add custom middleware
app.use(async (req, res, gctx, lctx, next) => {
  console.log(`${req.method} ${req.path}`);
  await next();
});

// Add CORS middleware (built-in helper)
app.use(createCorsMiddleware({
  origin: 'https://myapp.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply middleware to specific paths
app.use(authMiddleware, { path: '/api/*' });

// Error handling middleware
app.useError((error, req, res, gctx, lctx) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});
```

### CORS Configuration

The built-in CORS middleware supports multiple configuration options:

```typescript
import { createCorsMiddleware } from '@gati-framework/runtime';

// Allow all origins (default)
app.use(createCorsMiddleware());

// Specific origin
app.use(createCorsMiddleware({ origin: 'https://myapp.com' }));

// Multiple origins
app.use(createCorsMiddleware({ 
  origin: ['https://app1.com', 'https://app2.com'] 
}));

// Dynamic origin validation
app.use(createCorsMiddleware({
  origin: (origin) => origin.endsWith('.myapp.com'),
  credentials: true,
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
}));
```

### Graceful Shutdown

The server supports graceful shutdown, waiting for active requests to complete:

```typescript
const app = createApp({ 
  port: 3000,
  timeout: 30000 // Request timeout: 30 seconds
});

await app.listen();

// Handle shutdown signals
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await app.close(); // Waits up to 10 seconds for active requests
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await app.close();
  process.exit(0);
});
```

### Method-specific Routes

```typescript
app.get('/users', getUsersHandler);
app.post('/users', createUserHandler);
app.put('/users/:id', updateUserHandler);
app.patch('/users/:id', patchUserHandler);
app.delete('/users/:id', deleteUserHandler);
```

## API Reference

### `createApp(config?: AppConfig): GatiApp`

Creates a new Gati application instance.

**Config options:**
- `port?: number` - Port to listen on (default: 3000)
- `host?: string` - Host to bind to (default: 'localhost')
- `timeout?: number` - Server timeout in ms (default: 30000)
- `logging?: boolean` - Enable request logging (default: true)

### `loadHandlers(app, dir, options?): Promise<void>`

Automatically discovers and registers handlers from a directory.

**Parameters:**
- `app: GatiApp` - Application instance
- `dir: string` - Directory path (e.g., './src/handlers')
- `options.basePath?: string` - Route prefix (default: '')
- `options.verbose?: boolean` - Log registration (default: false)

### `GatiApp Methods`

- `get(path, handler)` - Register GET route
- `post(path, handler)` - Register POST route
- `put(path, handler)` - Register PUT route
- `patch(path, handler)` - Register PATCH route
- `delete(path, handler)` - Register DELETE route
- `use(middleware)` - Add middleware
- `useError(errorMiddleware)` - Add error handler
- `listen()` - Start HTTP server
- `close()` - Stop HTTP server gracefully
- `isRunning()` - Check if server is running
- `getConfig()` - Get current configuration

## Type Definitions

All TypeScript types are exported:

```typescript
import type {
  Handler,
  Request,
  Response,
  GlobalContext,
  LocalContext,
  Middleware,
  ErrorMiddleware,
  AppConfig,
} from '@gati-framework/runtime';
```

## Examples

See the [examples directory](../../examples) for complete examples:
- [hello-world](../../examples/hello-world) - Basic application
- [scaffold-verify](../../examples/scaffold-verify) - Scaffolded project structure

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3.0 (for development)

## License

MIT © Krishna Paul

## Links

- [Documentation](https://github.com/krishnapaul242/gati)
- [GitHub Repository](https://github.com/krishnapaul242/gati)
- [Report Issues](https://github.com/krishnapaul242/gati/issues)
