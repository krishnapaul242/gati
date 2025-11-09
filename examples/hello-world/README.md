# Hello World Example

A simple Hello World application demonstrating the core features of the Gati framework.

## 📋 What You'll Learn

- Creating handlers with the `handler(req, res, gctx, lctx)` signature
- Using path parameters (`/user/:id`)
- Using query parameters (`/users?name=Alice`)
- Creating and using modules with dependency injection
- Configuring a Gati application

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Installation

1. Navigate to this directory:
```bash
cd examples/hello-world
```

2. Install dependencies:
```bash
pnpm install
```

### Running the Application

Start the development server:
```bash
pnpm dev
```

The server will start on `http://localhost:3000`

## 🧪 Try It Out

### Basic Hello World

```bash
curl http://localhost:3000/hello
```

**Response:**
```json
{
  "message": "Hello, World!",
  "timestamp": 1699564800000,
  "requestId": "req_123456"
}
```

### Personalized Greeting (Path Parameters)

```bash
curl http://localhost:3000/hello/name/Alice
```

**Response:**
```json
{
  "message": "Hello, Alice!",
  "timestamp": 1699564800000,
  "requestId": "req_123457"
}
```

### Get User by ID (Path Parameters)

```bash
curl http://localhost:3000/user/1
```

**Response:**
```json
{
  "user": {
    "id": "1",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

### List All Users

```bash
curl http://localhost:3000/users
```

**Response:**
```json
{
  "users": [
    { "id": "1", "name": "Alice", "email": "alice@example.com" },
    { "id": "2", "name": "Bob", "email": "bob@example.com" },
    { "id": "3", "name": "Charlie", "email": "charlie@example.com" }
  ],
  "count": 3
}
```

### List Users with Query Filter

```bash
curl http://localhost:3000/users?name=Alice
```

**Response:**
```json
{
  "users": [
    { "id": "1", "name": "Alice", "email": "alice@example.com" }
  ],
  "count": 1
}
```

## 📁 Project Structure

```
hello-world/
├── src/
│   ├── handlers/
│   │   ├── hello.ts         # Hello World handlers
│   │   └── user.ts          # User handlers (demo path params)
│   └── modules/
│       └── logger.ts        # Logger module (demo DI)
├── gati.config.ts           # Application configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 📖 Understanding the Code

### Handler Anatomy

Handlers in Gati follow this signature:

```typescript
import type { Handler } from 'gati';

export const myHandler: Handler = (req, res, gctx, lctx) => {
  // req: HTTP request (method, path, params, query, body)
  // res: HTTP response (status, headers, json, text, send)
  // gctx: Global context (modules, config, shared state)
  // lctx: Local context (requestId, timestamp, request state)

  res.json({ message: 'Hello!' });
};
```

### Path Parameters

Extract dynamic segments from URLs:

```typescript
// Route: /user/:id
export const getUserHandler: Handler = (req, res, gctx, lctx) => {
  const userId = req.params.id; // Extract :id from path
  // Use userId...
};
```

### Query Parameters

Access query string parameters:

```typescript
// URL: /users?name=Alice&limit=10
export const listUsersHandler: Handler = (req, res, gctx, lctx) => {
  const name = req.query.name;   // "Alice"
  const limit = req.query.limit; // "10"
  // Use parameters...
};
```

### Using Modules (Dependency Injection)

Modules are initialized once and shared across requests:

```typescript
export const myHandler: Handler = (req, res, gctx, lctx) => {
  // Access modules from global context
  const logger = gctx.modules['logger'];
  logger.log('Processing request...');
  
  // Modules are typed - you can create interfaces
  const db = gctx.modules['db'] as Database;
  const user = await db.findUser(userId);
};
```

### Configuration

The `gati.config.ts` file defines your application:

```typescript
export default {
  server: {
    port: 3000,
    host: 'localhost',
  },
  
  routes: [
    { method: 'GET', path: '/hello', handler: helloHandler },
    { method: 'GET', path: '/user/:id', handler: getUserHandler },
  ],
  
  modules: (gctx) => {
    gctx.modules['logger'] = initLogger(gctx);
    gctx.modules['db'] = initDatabase(gctx);
  },
};
```

## 🔨 Building for Production

Build the application:
```bash
pnpm build
```

Run the production build:
```bash
pnpm start
```

## 🎓 Next Steps

- **Add Database**: Integrate a real database module
- **Add Validation**: Use Zod or similar for request validation
- **Add Authentication**: Create auth middleware
- **Add Tests**: Write unit tests for handlers
- **Add Error Handling**: Create custom error handlers

## 📚 Learn More

- [Gati Documentation](../../docs/README.md)
- [Handler Development Guide](../../docs/handlers.md)
- [Module Creation Guide](../../docs/modules.md)
- [API Reference](../../docs/api.md)

## 💡 Tips

1. **Hot Reload**: The dev server automatically reloads on file changes
2. **Type Safety**: Use TypeScript for better developer experience
3. **Module Pattern**: Keep modules simple and focused
4. **Error Handling**: Use `HandlerError` for proper error responses
5. **Testing**: Handlers are pure functions - easy to test!

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is busy, change it in `gati.config.ts`:
```typescript
server: {
  port: 8080, // Use different port
}
```

### TypeScript Errors

Make sure dependencies are installed:
```bash
pnpm install
```

### Module Not Found

Ensure paths in `tsconfig.json` match your project structure.

## 📝 License

MIT
