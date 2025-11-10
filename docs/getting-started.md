# Getting Started with Gati

Welcome to **Gati** - a next-generation TypeScript/Node.js framework for building cloud-native, versioned APIs with automatic scaling, deployment, and SDK generation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Basic Concepts](#basic-concepts)
- [Your First API Endpoint](#your-first-api-endpoint)
- [Running Your Application](#running-your-application)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (recommended) or **npm** >= 8.0.0

Check your versions:

```bash
node --version  # Should be >= 18.0.0
pnpm --version  # Should be >= 8.0.0
```

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

## Installation

### Create a New Project with GatiC

**GatiC** (Gati Command) is the official project scaffolding tool. Use it via `npx` to create new Gati applications:

```bash
npx gatic create my-app
cd my-app
```

**What is GatiC?**

- `gatic` - The project creation command (wrapper around `@gati-framework/cli`)
- Used via `npx gatic create` - no global installation needed
- Always uses the latest published version
- Creates a complete project with all dependencies

**What is the difference between `gatic` and `gati`?**

- **`gatic`** - Global command for creating new projects (`npx gatic create`)
- **`gati`** - Local command installed in your project for development and deployment
  - Use `gati dev` to start development server
  - Use `gati build` to build for production
  - Use `gati deploy` to deploy to Kubernetes

### Option 2: Clone the Hello World Example

```bash
git clone https://github.com/krishnapaul242/gati.git
cd gati/examples/hello-world
pnpm install
```

## Quick Start

Let's build your first Gati application in under 5 minutes!

### Step 1: Create a New Project

```bash
npx gatic create my-first-app
cd my-first-app
```

The scaffolder will prompt you for:
- **Project description** - Brief description of your app
- **Author** - Your name
- **Template** - Choose between Default (with examples) or Minimal

### Step 2: Install Dependencies

Dependencies are automatically installed during creation. If you need to reinstall:

```bash
pnpm install
```

### Step 3: Understand the Project Structure

```text
my-first-app/
├── src/
│   ├── index.ts           # Application entry point (NEW in v2.0.0)
│   ├── handlers/          # Request handlers
│   │   ├── hello.ts       # Example handler
│   │   └── health.ts      # Health check endpoint (NEW)
│   └── modules/           # Reusable modules (optional)
├── deploy/
│   └── kubernetes/        # Kubernetes manifests (NEW)
│       ├── deployment.yaml
│       └── service.yaml
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── gati.config.ts         # Application configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── Dockerfile             # Production Docker image (NEW)
├── docker-compose.yml     # Local Docker setup (NEW)
├── .env.example           # Environment variables template
├── .gitignore
└── README.md              # Project documentation
```

**What's new in Runtime v2.0.0:**
- ✅ `src/index.ts` - Explicit application entry point using `createApp()` and `loadHandlers()`
- ✅ `src/handlers/health.ts` - Production-ready health check endpoint
- ✅ Kubernetes manifests for deployment
- ✅ Docker support out of the box
- ✅ Comprehensive README with deployment instructions

### Step 4: Examine Your First Handler

Open `src/handlers/hello.ts`:

```typescript
/**
 * @handler GET /hello
 * @description Simple hello world handler
 */

import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res) => {
  const name = req.query.name || 'World';
  
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
};
```

This simple handler demonstrates the core handler signature:
- `req` - HTTP request object (Express.js compatible)
- `res` - HTTP response object (Express.js compatible)
- Access query parameters via `req.query`
- Send JSON responses via `res.json()`

**Runtime v2.0.0 Changes:**
- Handlers now use standard Express.js `req` and `res` objects
- Global context (`gctx`) and local context (`lctx`) are available via `req.gatiContext`
- Simpler API for common use cases

### Step 5: Understand the Application Entry Point

Open `src/index.ts`:

```typescript
import { createApp, loadHandlers } from '@gati-framework/runtime';

async function main() {
  const app = createApp({ 
    port: Number(process.env['PORT']) || 3000, 
    host: process.env['HOST'] || '0.0.0.0' 
  });
  
  await loadHandlers(app, './src/handlers', { 
    basePath: '/api', 
    verbose: true 
  });
  
  await app.listen();
  
  console.log(`Server running on ${app.getConfig().host}:${app.getConfig().port}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);
    await app.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
```

**Key Features:**
- `createApp()` - Initialize the Gati application
- `loadHandlers()` - Auto-discover and register handlers from a directory
- `app.listen()` - Start the HTTP server
- `app.shutdown()` - Graceful shutdown with cleanup
- Environment variable support for PORT and HOST

### Step 6: Start the Development Server

```bash
pnpm dev
```

You should see:

```
Server running on 0.0.0.0:3000
```

The dev server includes:
- ✅ **Hot reload** - Changes automatically restart the server
- ✅ **File watching** - Monitors `src/**/*.ts` for changes
- ✅ **Environment loading** - Auto-loads `.env` files
- ✅ **Error reporting** - Clear error messages in development

### Step 7: Test Your API

In another terminal:

```bash
# Test hello endpoint
curl http://localhost:3000/api/hello

# With query parameter
curl http://localhost:3000/api/hello?name=Alice

# Test health check
curl http://localhost:3000/health
```

Response from `/api/hello`:

```json
{
  "message": "Hello, World!",
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

Response from `/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "uptime": 42.5
}
```

🎉 **Congratulations!** You've created your first Gati API endpoint!

## Project Structure

Let's understand each part of your Gati application:

### Handlers (`src/handlers/`)

Handlers are functions that process HTTP requests. Each handler follows this signature:

```typescript
handler(req, res, gctx, lctx)
```

- **Purpose**: Process requests and generate responses
- **Example**: `getUserHandler`, `createPostHandler`
- **Learn more**: [Handler Development Guide](./handlers.md)

### Modules (`src/modules/`)

Modules are reusable business logic components loaded via dependency injection:

```typescript
export function initLogger(gctx: GlobalContext): Logger {
  return {
    log: (message) => console.log(message),
    error: (message, error) => console.error(message, error),
  };
}
```

- **Purpose**: Shared functionality (database, cache, logger)
- **Pattern**: Initialized once, shared across requests
- **Learn more**: [Module Creation Guide](./modules.md)

### Configuration (`gati.config.ts`)

The main configuration file for your application:

```typescript
export default {
  server: {
    port: 3000,           // Server port
    host: 'localhost',    // Server host
  },
  routes: [/* ... */],    // Route definitions
  modules: (gctx) => {},  // Module initialization
  config: {/* ... */},    // App-level config
};
```

## Basic Concepts

### 1. Handlers

Handlers are pure functions that process requests:

```typescript
const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  const user = await gctx.modules['db'].findUser(userId);
  res.json({ user });
};
```

**Key Points:**
- Synchronous or asynchronous
- Access request data via `req`
- Send responses via `res`
- Use modules via `gctx.modules`
- Access request metadata via `lctx`

### 2. Modules

Modules provide shared functionality:

```typescript
// src/modules/database.ts
export function initDatabase(gctx: GlobalContext) {
  const connection = createConnection(/* ... */);
  
  gctx.lifecycle.onShutdown(() => {
    connection.close();
  });
  
  return {
    findUser: (id) => connection.query('SELECT * FROM users WHERE id = ?', [id]),
  };
}

// gati.config.ts
modules: (gctx) => {
  gctx.modules['db'] = initDatabase(gctx);
}
```

**Key Points:**
- Initialized once at startup
- Shared across all requests
- Support lifecycle hooks (init, shutdown)
- Accessed via `gctx.modules`

### 3. Context

Gati provides two types of context:

**Global Context (gctx)** - Shared across all requests:
- `gctx.modules` - Module registry
- `gctx.config` - Application configuration
- `gctx.state` - Shared state
- `gctx.lifecycle` - Lifecycle hooks

**Local Context (lctx)** - Scoped to a single request:
- `lctx.requestId` - Unique request identifier
- `lctx.timestamp` - Request timestamp
- `lctx.state` - Request-scoped state
- `lctx.lifecycle` - Request lifecycle hooks

### 4. Routing

Define routes by mapping HTTP methods and paths to handlers:

```typescript
routes: [
  { method: 'GET',    path: '/users',      handler: listUsersHandler },
  { method: 'GET',    path: '/users/:id',  handler: getUserHandler },
  { method: 'POST',   path: '/users',      handler: createUserHandler },
  { method: 'PUT',    path: '/users/:id',  handler: updateUserHandler },
  { method: 'DELETE', path: '/users/:id',  handler: deleteUserHandler },
]
```

**Path Parameters:**
- Use `:param` syntax for dynamic segments
- Access via `req.params.param`

**Query Parameters:**
- Access via `req.query.param`

## Your First API Endpoint

Let's build a complete user API with CRUD operations:

### Step 1: Create the Handler

Create `src/handlers/user.ts`:

```typescript
import type { Handler } from 'gati';
import { HandlerError } from 'gati';

// Mock data
const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

// GET /users
export const listUsersHandler: Handler = (req, res) => {
  const nameFilter = req.query.name as string | undefined;
  
  let filtered = users;
  if (nameFilter) {
    filtered = users.filter(u => 
      u.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }
  
  res.json({ users: filtered, count: filtered.length });
};

// GET /users/:id
export const getUserHandler: Handler = (req, res, gctx) => {
  const userId = req.params.id;
  
  // Use logger module
  const logger = gctx.modules['logger'] as any;
  logger?.log(`Fetching user ${userId}`);
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    throw new HandlerError('User not found', 404, { userId });
  }
  
  res.json({ user });
};

// POST /users
export const createUserHandler: Handler = (req, res) => {
  const { name, email } = req.body as { name: string; email: string };
  
  const newUser = {
    id: String(users.length + 1),
    name,
    email,
  };
  
  users.push(newUser);
  
  res.status(201).json({ user: newUser });
};
```

### Step 2: Add Routes

Update `gati.config.ts`:

```typescript
import { helloHandler } from './src/handlers/hello';
import { 
  listUsersHandler, 
  getUserHandler, 
  createUserHandler 
} from './src/handlers/user';

export default {
  server: {
    port: 3000,
    host: 'localhost',
  },
  
  routes: [
    { method: 'GET', path: '/hello', handler: helloHandler },
    { method: 'GET', path: '/users', handler: listUsersHandler },
    { method: 'GET', path: '/users/:id', handler: getUserHandler },
    { method: 'POST', path: '/users', handler: createUserHandler },
  ],
  
  modules: (gctx) => {
    // Modules will be added later
  },
};
```

### Step 3: Test Your Endpoints

```bash
# List all users
curl http://localhost:3000/users

# Get a specific user
curl http://localhost:3000/users/1

# Filter users by name
curl http://localhost:3000/users?name=Alice

# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'
```

## Running Your Application

### Development Mode

Start with hot-reload:

```bash
pnpm dev
```

Changes to your code will automatically reload the server.

### Production Build

Build for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

### Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000
HOST=localhost
DATABASE_URL=postgresql://localhost/mydb
```

Access in your code:

```typescript
const dbUrl = process.env.DATABASE_URL;
```

## Next Steps

Now that you have a basic Gati application running, explore these topics:

### Learn Handler Development
- [Handler Development Guide](./handlers.md)
- Path parameters and query strings
- Request body validation
- Error handling patterns
- Response formatting

### Create Modules
- [Module Creation Guide](./modules.md)
- Module lifecycle
- Dependency injection
- Testing strategies
- Best practices

### Understand Architecture
- [Architecture Documentation](./architecture.md)
- Component relationships
- Request flow
- Design decisions
- Extension points

### Advanced Topics
- **Middleware**: Add custom request processing
- **Validation**: Use Zod or similar for input validation
- **Authentication**: Implement auth middleware
- **Database**: Integrate PostgreSQL, MongoDB, etc.
- **Testing**: Write unit and integration tests
- **Deployment**: Deploy to Kubernetes, AWS, or GCP

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:** Change the port in `gati.config.ts`:

```typescript
server: {
  port: 8080,  // Use a different port
}
```

Or kill the process using the port:

```bash
# Find the process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### TypeScript Errors

**Error:** Module not found or type errors

**Solution:** Ensure dependencies are installed:

```bash
pnpm install
```

Check your `tsconfig.json` paths configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Module Not Loaded

**Error:** Module undefined or null in handlers

**Solution:** Ensure modules are initialized in `gati.config.ts`:

```typescript
modules: (gctx) => {
  gctx.modules['logger'] = initLogger(gctx);
  gctx.modules['db'] = initDatabase(gctx);
}
```

### Hot Reload Not Working

**Error:** Changes not reflected after saving

**Solution:**
1. Restart the dev server
2. Check for syntax errors in your code
3. Ensure files are in the `src/` directory

### Request Body is Undefined

**Error:** `req.body` is `undefined`

**Solution:** Gati automatically parses JSON bodies. Ensure:
1. Content-Type header is `application/json`
2. Request body is valid JSON

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

### 404 Not Found

**Error:** Route returns 404

**Solution:**
1. Check route is registered in `gati.config.ts`
2. Verify path matches exactly (case-sensitive)
3. Ensure handler is imported correctly

```typescript
import { myHandler } from './src/handlers/myHandler';  // Correct path

routes: [
  { method: 'GET', path: '/my-route', handler: myHandler },
]
```

## Additional Resources

- **GitHub Repository**: https://github.com/krishnapaul242/gati
- **Example Projects**: https://github.com/krishnapaul242/gati/tree/main/examples
- **Issue Tracker**: https://github.com/krishnapaul242/gati/issues
- **Discussions**: https://github.com/krishnapaul242/gati/discussions

## Getting Help

- **Community Discord**: [Join here](https://discord.gg/gati) (coming soon)
- **Stack Overflow**: Tag your questions with `gati-framework`
- **GitHub Issues**: For bug reports and feature requests

---

**Next:** [Handler Development Guide](./handlers.md) →

**See Also:**
- [Module Creation Guide](./modules.md)
- [Architecture Documentation](./architecture.md)
