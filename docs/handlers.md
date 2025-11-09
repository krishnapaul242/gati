# Handler Development Guide

Handlers are the core of your Gati application - they process HTTP requests and generate responses. This guide covers everything you need to know about creating effective handlers.

## Table of Contents

- [Handler Anatomy](#handler-anatomy)
- [Handler Signature](#handler-signature)
- [Request Object](#request-object)
- [Response Object](#response-object)
- [HTTP Methods](#http-methods)
- [Path Parameters](#path-parameters)
- [Query Parameters](#query-parameters)
- [Request Body](#request-body)
- [Error Handling](#error-handling)
- [Context Usage](#context-usage)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Handler Anatomy

A handler is a function that processes an HTTP request and generates a response:

```typescript
import type { Handler } from 'gati';

export const myHandler: Handler = (req, res, gctx, lctx) => {
  // Process request
  // Generate response
};
```

### Basic Structure

```typescript
const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  // 1. Extract data from request
  const userId = req.params.id;
  
  // 2. Use modules from global context
  const db = gctx.modules['db'];
  
  // 3. Perform business logic
  const user = await db.findUser(userId);
  
  // 4. Send response
  res.json({ user });
};
```

## Handler Signature

Every handler follows this signature:

```typescript
type Handler = (
  req: Request,        // HTTP request
  res: Response,       // HTTP response
  gctx: GlobalContext, // Global context (shared)
  lctx: LocalContext   // Local context (request-scoped)
) => void | Promise<void>;
```

### Parameters

**`req` - Request Object**
- HTTP method, path, headers
- URL parameters and query strings
- Request body
- Raw Node.js IncomingMessage

**`res` - Response Object**
- Methods to send responses
- Set status codes and headers
- JSON, text, or raw responses
- Raw Node.js ServerResponse

**`gctx` - Global Context**
- Shared modules (database, cache, etc.)
- Application configuration
- Global state
- Lifecycle hooks

**`lctx` - Local Context**
- Unique request ID
- Request timestamp
- Request-scoped state
- Cleanup hooks

### Return Value

Handlers can be synchronous or asynchronous:

```typescript
// Synchronous
const syncHandler: Handler = (req, res) => {
  res.json({ message: 'Hello' });
};

// Asynchronous
const asyncHandler: Handler = async (req, res, gctx) => {
  const data = await gctx.modules['db'].fetch();
  res.json({ data });
};
```

## Request Object

The request object (`req`) provides access to all HTTP request data.

### Request Properties

```typescript
interface Request {
  method: HttpMethod;           // GET, POST, PUT, PATCH, DELETE, etc.
  path: string;                 // Request URL path
  query: QueryParams;           // Query string parameters
  params: PathParams;           // Route path parameters
  headers: HttpHeaders;         // HTTP headers
  body: unknown;                // Parsed request body
  rawBody?: string | Buffer;    // Raw (unparsed) body
  raw: IncomingMessage;         // Original Node.js request
}
```

### HTTP Method

```typescript
const handler: Handler = (req, res) => {
  console.log(req.method); // 'GET', 'POST', etc.
  
  if (req.method === 'POST') {
    // Handle POST request
  }
};
```

### Request Path

```typescript
const handler: Handler = (req, res) => {
  console.log(req.path); // '/users/123'
};
```

### HTTP Headers

Access request headers:

```typescript
const handler: Handler = (req, res) => {
  const contentType = req.headers['content-type'];
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-custom-header'];
  
  console.log({ contentType, authHeader, customHeader });
};
```

Common headers:
- `content-type` - Request body format
- `authorization` - Authentication token
- `user-agent` - Client information
- `accept` - Accepted response formats

### Raw Request

Access the underlying Node.js IncomingMessage:

```typescript
const handler: Handler = (req, res) => {
  const rawReq = req.raw;
  console.log(rawReq.socket.remoteAddress);
};
```

## Response Object

The response object (`res`) provides methods to send HTTP responses.

### Response Methods

```typescript
interface Response {
  status(code: number): Response;              // Set status code
  header(name: string, value: string): Response; // Set single header
  headers(headers: HttpHeaders): Response;     // Set multiple headers
  json(data: unknown): void;                   // Send JSON response
  text(data: string): void;                    // Send text response
  send(data: string | Buffer): void;           // Send raw response
  end(): void;                                 // End response without body
  isSent(): boolean;                           // Check if sent
  headersSent: boolean;                        // Check if headers sent
  raw: ServerResponse;                         // Raw Node.js response
}
```

### JSON Response

Most common response type:

```typescript
const handler: Handler = (req, res) => {
  res.json({
    message: 'Success',
    data: { id: 1, name: 'Alice' },
  });
};
```

### Text Response

Send plain text:

```typescript
const handler: Handler = (req, res) => {
  res.text('Hello, World!');
};
```

### Status Code

Set HTTP status codes:

```typescript
const handler: Handler = (req, res) => {
  // Method 1: Chain with response
  res.status(201).json({ message: 'Created' });
  
  // Method 2: Set before sending
  res.status(404);
  res.json({ error: 'Not found' });
};
```

Common status codes:
- `200` - OK (default)
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Custom Headers

Set response headers:

```typescript
const handler: Handler = (req, res) => {
  // Single header
  res.header('X-Custom-Header', 'value');
  
  // Multiple headers
  res.headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'X-Request-ID': '123',
  });
  
  res.json({ data: 'response' });
};
```

### Raw Response

Send binary data or custom formats:

```typescript
const handler: Handler = (req, res) => {
  const buffer = Buffer.from('binary data');
  res.send(buffer);
};
```

### Empty Response

Send response with no body:

```typescript
const handler: Handler = (req, res) => {
  res.status(204).end();
};
```

## HTTP Methods

Handle different HTTP methods with dedicated handlers:

### GET - Retrieve Data

```typescript
// GET /users
const listUsersHandler: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'];
  const users = await db.findAll();
  res.json({ users });
};

// GET /users/:id
const getUserHandler: Handler = async (req, res, gctx) => {
  const userId = req.params.id;
  const db = gctx.modules['db'];
  const user = await db.findById(userId);
  res.json({ user });
};
```

### POST - Create Data

```typescript
// POST /users
const createUserHandler: Handler = async (req, res, gctx) => {
  const { name, email } = req.body as { name: string; email: string };
  
  const db = gctx.modules['db'];
  const newUser = await db.create({ name, email });
  
  res.status(201).json({ user: newUser });
};
```

### PUT - Update Data (Full)

```typescript
// PUT /users/:id
const updateUserHandler: Handler = async (req, res, gctx) => {
  const userId = req.params.id;
  const { name, email } = req.body as { name: string; email: string };
  
  const db = gctx.modules['db'];
  const updated = await db.update(userId, { name, email });
  
  res.json({ user: updated });
};
```

### PATCH - Update Data (Partial)

```typescript
// PATCH /users/:id
const patchUserHandler: Handler = async (req, res, gctx) => {
  const userId = req.params.id;
  const updates = req.body as Partial<{ name: string; email: string }>;
  
  const db = gctx.modules['db'];
  const updated = await db.patch(userId, updates);
  
  res.json({ user: updated });
};
```

### DELETE - Remove Data

```typescript
// DELETE /users/:id
const deleteUserHandler: Handler = async (req, res, gctx) => {
  const userId = req.params.id;
  
  const db = gctx.modules['db'];
  await db.delete(userId);
  
  res.status(204).end();
};
```

## Path Parameters

Extract dynamic segments from URL paths:

### Basic Path Parameters

```typescript
// Route: /users/:id
const handler: Handler = (req, res) => {
  const userId = req.params.id;  // Extract :id
  console.log(userId);           // '123' from /users/123
};
```

### Multiple Parameters

```typescript
// Route: /users/:userId/posts/:postId
const handler: Handler = (req, res) => {
  const { userId, postId } = req.params;
  console.log({ userId, postId });  // { userId: '1', postId: '42' }
};
```

### Type Safety

Use type assertions for better type safety:

```typescript
interface UserParams {
  id: string;
}

const handler: Handler = (req, res) => {
  const { id } = req.params as UserParams;
  // 'id' is now typed as string
};
```

### Example: User Profile

```typescript
// GET /users/:id/profile
const getUserProfileHandler: Handler = async (req, res, gctx) => {
  const userId = req.params.id;
  
  const db = gctx.modules['db'];
  const user = await db.findById(userId);
  const posts = await db.findUserPosts(userId);
  
  res.json({
    user,
    posts,
    profileUrl: `/users/${userId}/profile`,
  });
};
```

## Query Parameters

Access URL query string parameters:

### Basic Query Parameters

```typescript
// URL: /users?name=Alice&active=true
const handler: Handler = (req, res) => {
  const name = req.query.name;       // 'Alice'
  const active = req.query.active;   // 'true' (string!)
};
```

### Type Conversion

Query parameters are always strings:

```typescript
const handler: Handler = (req, res) => {
  // String to number
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  // String to boolean
  const active = req.query.active === 'true';
  
  console.log({ page, limit, active });
};
```

### Optional Parameters

Handle missing query parameters:

```typescript
const handler: Handler = (req, res) => {
  const search = req.query.search as string | undefined;
  const filter = req.query.filter as string | undefined;
  
  if (search) {
    // Use search parameter
  }
  
  if (filter) {
    // Use filter parameter
  }
};
```

### Example: Pagination and Filtering

```typescript
// GET /users?page=2&limit=20&name=alice&active=true
const listUsersHandler: Handler = async (req, res, gctx) => {
  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  // Filtering
  const nameFilter = req.query.name as string | undefined;
  const activeFilter = req.query.active === 'true';
  
  // Build query
  const db = gctx.modules['db'];
  const users = await db.findUsers({
    limit,
    offset,
    name: nameFilter,
    active: activeFilter,
  });
  
  res.json({
    users,
    pagination: {
      page,
      limit,
      total: users.length,
    },
  });
};
```

### Array Query Parameters

```typescript
// URL: /users?tags=javascript&tags=typescript
const handler: Handler = (req, res) => {
  const tags = req.query.tags;
  
  // tags can be string or string[]
  const tagsArray = Array.isArray(tags) ? tags : [tags];
  
  console.log(tagsArray); // ['javascript', 'typescript']
};
```

## Request Body

Access parsed request body data:

### JSON Body

```typescript
interface CreateUserBody {
  name: string;
  email: string;
  age: number;
}

const handler: Handler = async (req, res, gctx) => {
  const body = req.body as CreateUserBody;
  
  const db = gctx.modules['db'];
  const user = await db.create(body);
  
  res.status(201).json({ user });
};
```

### Validation with Zod

Recommended approach for production:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
});

const createUserHandler: Handler = async (req, res, gctx) => {
  // Validate request body
  const result = UserSchema.safeParse(req.body);
  
  if (!result.success) {
    throw new HandlerError(
      'Invalid request body',
      400,
      { errors: result.error.errors }
    );
  }
  
  // Use validated data
  const { name, email, age } = result.data;
  
  const db = gctx.modules['db'];
  const user = await db.create({ name, email, age });
  
  res.status(201).json({ user });
};
```

### Raw Body

Access unparsed body data:

```typescript
const handler: Handler = (req, res) => {
  const rawBody = req.rawBody;  // string | Buffer | undefined
  
  if (rawBody) {
    console.log('Raw body:', rawBody);
  }
};
```

## Error Handling

Gati provides built-in error handling with the `HandlerError` class:

### HandlerError Class

```typescript
class HandlerError extends Error {
  constructor(
    message: string,           // Error message
    statusCode: number = 500,  // HTTP status code
    context?: Record<string, unknown> // Additional context
  )
}
```

### Basic Error Handling

```typescript
import { HandlerError } from 'gati';

const getUserHandler: Handler = async (req, res, gctx) => {
  const userId = req.params.id;
  
  const db = gctx.modules['db'];
  const user = await db.findById(userId);
  
  if (!user) {
    throw new HandlerError('User not found', 404, { userId });
  }
  
  res.json({ user });
};
```

### Error Response Format

When a `HandlerError` is thrown:

```json
{
  "error": "User not found",
  "context": {
    "userId": "123"
  }
}
```

Status code: `404`

### Common Error Patterns

**Not Found (404)**

```typescript
if (!resource) {
  throw new HandlerError('Resource not found', 404);
}
```

**Bad Request (400)**

```typescript
if (!isValid(input)) {
  throw new HandlerError('Invalid input', 400, { field: 'email' });
}
```

**Unauthorized (401)**

```typescript
if (!isAuthenticated) {
  throw new HandlerError('Unauthorized', 401);
}
```

**Forbidden (403)**

```typescript
if (!hasPermission) {
  throw new HandlerError('Forbidden', 403);
}
```

**Internal Server Error (500)**

```typescript
try {
  await dangerousOperation();
} catch (error) {
  throw new HandlerError('Operation failed', 500);
}
```

### Try-Catch for External Errors

```typescript
const handler: Handler = async (req, res, gctx) => {
  try {
    const db = gctx.modules['db'];
    const data = await db.query('SELECT * FROM users');
    res.json({ data });
  } catch (error) {
    // Convert database error to HandlerError
    throw new HandlerError(
      'Database query failed',
      500,
      { originalError: error instanceof Error ? error.message : 'Unknown' }
    );
  }
};
```

### Validation Errors

```typescript
const createUserHandler: Handler = async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  
  if (!name || !email) {
    throw new HandlerError(
      'Missing required fields',
      400,
      { required: ['name', 'email'] }
    );
  }
  
  if (!email.includes('@')) {
    throw new HandlerError(
      'Invalid email format',
      400,
      { field: 'email' }
    );
  }
  
  // Create user...
};
```

## Context Usage

### Global Context (gctx)

Shared resources across all requests:

```typescript
const handler: Handler = async (req, res, gctx, lctx) => {
  // Access modules
  const db = gctx.modules['db'];
  const cache = gctx.modules['cache'];
  const logger = gctx.modules['logger'];
  
  // Access config
  const apiKey = gctx.config.apiKey;
  
  // Access shared state
  const appState = gctx.state.someValue;
  
  // Register shutdown hook
  gctx.lifecycle.onShutdown(async () => {
    await cleanup();
  });
};
```

### Local Context (lctx)

Request-specific data:

```typescript
const handler: Handler = async (req, res, gctx, lctx) => {
  // Access request metadata
  console.log('Request ID:', lctx.requestId);
  console.log('Timestamp:', lctx.timestamp);
  
  // Store request-scoped data
  lctx.state.userId = req.params.id;
  lctx.state.startTime = Date.now();
  
  // Register cleanup hook
  lctx.lifecycle.onCleanup(async () => {
    const duration = Date.now() - (lctx.state.startTime as number);
    console.log(`Request completed in ${duration}ms`);
  });
  
  // Process request...
};
```

### Sharing Data Between Handlers

Use `lctx.state` for request-scoped data:

```typescript
// Middleware handler
const authHandler: Handler = async (req, res, gctx, lctx) => {
  const token = req.headers['authorization'];
  const user = await verifyToken(token);
  
  // Store user in local context
  lctx.state.user = user;
};

// Route handler
const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  // Access user from local context
  const currentUser = lctx.state.user;
  
  res.json({ user: currentUser });
};
```

## Best Practices

### 1. Keep Handlers Focused

Each handler should do one thing:

```typescript
// ✅ Good - Single responsibility
const getUserHandler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules['db'].findUser(req.params.id);
  res.json({ user });
};

// ❌ Bad - Too many responsibilities
const complexHandler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules['db'].findUser(req.params.id);
  const posts = await gctx.modules['db'].findPosts(user.id);
  const comments = await gctx.modules['db'].findComments(user.id);
  // ... too much logic
};
```

### 2. Use Type Safety

Leverage TypeScript for better code quality:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserBody {
  name: string;
  email: string;
}

const createUserHandler: Handler = async (req, res, gctx) => {
  const body = req.body as CreateUserBody;
  const db = gctx.modules['db'] as Database;
  
  const user: User = await db.create(body);
  res.status(201).json({ user });
};
```

### 3. Validate Input

Always validate user input:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const handler: Handler = async (req, res) => {
  const result = UserSchema.safeParse(req.body);
  
  if (!result.success) {
    throw new HandlerError('Invalid input', 400, {
      errors: result.error.errors,
    });
  }
  
  // Use validated data
  const { name, email } = result.data;
};
```

### 4. Use Async/Await

Modern async patterns are clearer:

```typescript
// ✅ Good - async/await
const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules['db'].findUser(req.params.id);
  res.json({ user });
};

// ❌ Avoid - promise chains
const handler: Handler = (req, res, gctx) => {
  gctx.modules['db']
    .findUser(req.params.id)
    .then(user => res.json({ user }))
    .catch(error => console.error(error));
};
```

### 5. Handle Errors Gracefully

Always provide meaningful error messages:

```typescript
const handler: Handler = async (req, res, gctx) => {
  try {
    const result = await gctx.modules['db'].query(/* ... */);
    res.json({ result });
  } catch (error) {
    // Log for debugging
    console.error('Database error:', error);
    
    // Return user-friendly error
    throw new HandlerError(
      'Failed to fetch data',
      500,
      { requestId: lctx.requestId }
    );
  }
};
```

### 6. Use Modules for Shared Logic

Don't duplicate code in handlers:

```typescript
// ✅ Good - use module
const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'];
  const user = await db.findUser(req.params.id);
  res.json({ user });
};

// ❌ Bad - duplicate database logic
const handler: Handler = async (req, res) => {
  const connection = await createConnection(/* ... */);
  const user = await connection.query(/* ... */);
  await connection.close();
  res.json({ user });
};
```

## Common Patterns

### Pattern 1: CRUD Operations

Complete CRUD example:

```typescript
// List all
const listHandler: Handler = async (req, res, gctx) => {
  const items = await gctx.modules['db'].findAll();
  res.json({ items });
};

// Get one
const getHandler: Handler = async (req, res, gctx) => {
  const item = await gctx.modules['db'].findById(req.params.id);
  if (!item) throw new HandlerError('Not found', 404);
  res.json({ item });
};

// Create
const createHandler: Handler = async (req, res, gctx) => {
  const item = await gctx.modules['db'].create(req.body);
  res.status(201).json({ item });
};

// Update
const updateHandler: Handler = async (req, res, gctx) => {
  const item = await gctx.modules['db'].update(req.params.id, req.body);
  res.json({ item });
};

// Delete
const deleteHandler: Handler = async (req, res, gctx) => {
  await gctx.modules['db'].delete(req.params.id);
  res.status(204).end();
};
```

### Pattern 2: Pagination

```typescript
const paginatedHandler: Handler = async (req, res, gctx) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  const db = gctx.modules['db'];
  const [items, total] = await Promise.all([
    db.findMany({ limit, offset }),
    db.count(),
  ]);
  
  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};
```

### Pattern 3: Search and Filter

```typescript
const searchHandler: Handler = async (req, res, gctx) => {
  const query = req.query.q as string;
  const category = req.query.category as string | undefined;
  const sortBy = req.query.sort as string || 'createdAt';
  
  const db = gctx.modules['db'];
  const results = await db.search({
    query,
    category,
    sortBy,
  });
  
  res.json({ results, count: results.length });
};
```

### Pattern 4: File Upload

```typescript
const uploadHandler: Handler = async (req, res, gctx) => {
  const file = req.body as { name: string; content: Buffer };
  
  const storage = gctx.modules['storage'];
  const fileUrl = await storage.upload(file);
  
  res.status(201).json({ fileUrl });
};
```

### Pattern 5: Batch Operations

```typescript
const batchHandler: Handler = async (req, res, gctx) => {
  const { ids } = req.body as { ids: string[] };
  
  const db = gctx.modules['db'];
  const results = await Promise.all(
    ids.map(id => db.findById(id))
  );
  
  res.json({ results });
};
```

---

**Next:** [Module Creation Guide](./modules.md) →

**See Also:**
- [Getting Started Guide](./getting-started.md)
- [Architecture Documentation](./architecture.md)
