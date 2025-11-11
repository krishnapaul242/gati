# Handler

The `Handler` type is the core function signature for all API route handlers in Gati.

## Type Definition

```typescript
type Handler = (
  req: Request,
  res: Response,
  gctx?: GlobalContext,
  lctx?: LocalContext
) => void | Promise<void>;
```

## Parameters

### `req: Request`

The incoming HTTP request object. Provides access to:

- `req.method` - HTTP method (GET, POST, etc.)
- `req.url` - Request URL
- `req.headers` - HTTP headers
- `req.params` - URL path parameters
- `req.query` - Query string parameters
- `req.body` - Parsed request body
- `req.cookies` - Request cookies

See [Request API](/api-reference/request) for details.

### `res: Response`

The HTTP response object. Used to send responses:

- `res.json(data)` - Send JSON response
- `res.status(code)` - Set status code
- `res.send(data)` - Send response
- `res.header(name, value)` - Set response header

See [Response API](/api-reference/response) for details.

### `gctx?: GlobalContext`

Global context shared across all requests. Optional parameter.

Contains:
- `gctx.modules` - Registered modules (database, auth, etc.)
- `gctx.config` - Application configuration
- `gctx.logger` - Application-wide logger

See [Context API](/api-reference/context) for details.

### `lctx?: LocalContext`

Request-scoped local context. Optional parameter.

Contains:
- `lctx.requestId` - Unique request identifier
- `lctx.logger` - Request-scoped logger
- `lctx.startTime` - Request start timestamp

See [Context API](/api-reference/context) for details.

## Examples

### Basic Handler

```typescript
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res) => {
  res.json({ message: 'Hello World' });
};
```

### With Query Parameters

```typescript
export const handler: Handler = (req, res) => {
  const { name } = req.query;
  res.json({ greeting: `Hello, ${name || 'World'}!` });
};
```

### With Path Parameters

```typescript
// Matches: GET /users/:id
export const handler: Handler = (req, res) => {
  const { id } = req.params;
  res.json({ userId: id });
};
```

### With Request Body

```typescript
export const handler: Handler = (req, res) => {
  const { email, password } = req.body;
  
  // Validation
  if (!email || !password) {
    res.status(400).json({ error: 'Missing credentials' });
    return;
  }
  
  // Process...
  res.status(201).json({ success: true });
};
```

### Async Handler

```typescript
export const handler: Handler = async (req, res) => {
  const data = await fetchFromDatabase();
  res.json({ data });
};
```

### Using Global Context

```typescript
export const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules.database;
  const users = await db.users.findAll();
  
  res.json({ users });
};
```

### Using Local Context (Logging)

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  lctx.logger.info('Processing request', { 
    userId: req.params.id 
  });
  
  // Business logic...
  
  lctx.logger.info('Request completed successfully');
  res.json({ ok: true });
};
```

### Error Handling

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    const result = await someAsyncOperation();
    res.json({ result });
  } catch (error) {
    lctx.logger.error('Operation failed', { error });
    res.status(500).json({ 
      error: 'Internal server error',
      requestId: lctx.requestId 
    });
  }
};
```

## Handler Patterns

### Validation Pattern

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  age: z.number().int().min(0).max(120).optional(),
});

export const handler: Handler = (req, res) => {
  const result = UserSchema.safeParse(req.body);
  
  if (!result.success) {
    res.status(400).json({ 
      error: 'Validation failed',
      details: result.error.errors 
    });
    return;
  }
  
  const user = result.data;
  // Process validated data...
};
```

### Middleware Pattern

```typescript
// Check authentication first
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  // Verify token...
  next();
};

export const handler: Handler = [
  requireAuth,
  (req, res) => {
    // Only runs if authenticated
    res.json({ protected: 'data' });
  }
];
```

### Repository Pattern

```typescript
// src/repositories/user-repository.ts
export class UserRepository {
  async findById(id: string) {
    // Database logic...
  }
  
  async create(data: any) {
    // Database logic...
  }
}

// src/handlers/users/get.ts
export const handler: Handler = async (req, res, gctx) => {
  const userRepo = gctx.modules.userRepository;
  const user = await userRepo.findById(req.params.id);
  
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  
  res.json({ user });
};
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad: Unhandled promise rejection
export const handler: Handler = async (req, res) => {
  const data = await fetchData(); // May throw
  res.json({ data });
};

// ✅ Good: Proper error handling
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    const data = await fetchData();
    res.json({ data });
  } catch (error) {
    lctx.logger.error('Fetch failed', { error });
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
```

### 2. Validate Input

```typescript
// ❌ Bad: No validation
export const handler: Handler = (req, res) => {
  const user = createUser(req.body); // Dangerous!
  res.json({ user });
};

// ✅ Good: Validate before processing
export const handler: Handler = (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }
  
  const user = createUser(req.body);
  res.json({ user });
};
```

### 3. Use Logging

```typescript
// ✅ Log important events
export const handler: Handler = (req, res, gctx, lctx) => {
  lctx.logger.info('User login attempt', { email: req.body.email });
  
  // Authentication logic...
  
  if (success) {
    lctx.logger.info('User logged in successfully');
  } else {
    lctx.logger.warn('Login failed: invalid credentials');
  }
  
  res.json({ success });
};
```

### 4. Keep Handlers Thin

```typescript
// ❌ Bad: Too much logic in handler
export const handler: Handler = async (req, res) => {
  const user = await db.user.findOne({ email: req.body.email });
  const hash = await bcrypt.hash(req.body.password, 10);
  // ... 50 more lines ...
};

// ✅ Good: Delegate to services
export const handler: Handler = async (req, res, gctx) => {
  const authService = gctx.modules.authService;
  const user = await authService.login(req.body);
  res.json({ user });
};
```

## Related

- [Request API](/api-reference/request) - Access request data
- [Response API](/api-reference/response) - Send responses
- [Context API](/api-reference/context) - Global and local context
- [Middleware Guide](/guides/middleware) - Composing handlers
