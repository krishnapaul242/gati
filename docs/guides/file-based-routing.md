# File-Based Routing

Gati uses file-based routing to automatically map your handler files to API endpoints. No manual route registration required!

## How It Works

Place TypeScript files in `src/handlers/` and they become API routes:

```plaintext
src/handlers/
├── hello.ts              → GET /api/hello
├── users.ts              → GET /api/users
├── users/
│   ├── [id].ts          → GET /api/users/:id
│   └── create.ts        → POST /api/users/create
└── posts/
    ├── index.ts         → GET /api/posts
    └── [id]/
        └── comments.ts  → GET /api/posts/:id/comments
```

## Handler Structure

Each handler file exports `METHOD`, `ROUTE` (optional), and `handler`:

```typescript
// src/handlers/users/[id].ts
export const METHOD = 'GET';
export const ROUTE = '/users/:id'; // Optional: override auto-generated route
export const handler: Handler = (req, res) => {
  const userId = req.params.id;
  res.json({ userId });
};
```

## Route Generation Rules

### Basic Files
- `hello.ts` → `/api/hello`
- `users.ts` → `/api/users`

### Dynamic Parameters
- `[id].ts` → `/:id`
- `[userId].ts` → `/:userId`
- `users/[id].ts` → `/api/users/:id`

### Nested Routes
- `posts/[id]/comments.ts` → `/api/posts/:id/comments`
- `users/[id]/orders/[orderId].ts` → `/api/users/:id/orders/:orderId`

### Index Files
- `posts/index.ts` → `/api/posts`
- `users/index.ts` → `/api/users`

## HTTP Methods

Specify the HTTP method with the `METHOD` export:

```typescript
// GET request (default)
export const METHOD = 'GET';

// POST request
export const METHOD = 'POST';

// PUT request
export const METHOD = 'PUT';

// PATCH request
export const METHOD = 'PATCH';

// DELETE request
export const METHOD = 'DELETE';
```

## Custom Routes

Override the auto-generated route with `ROUTE` export:

```typescript
// src/handlers/auth/login.ts
export const METHOD = 'POST';
export const ROUTE = '/auth/login'; // Custom route
export const handler: Handler = (req, res) => {
  // Login logic
};
```

## Examples

### User CRUD API

```typescript
// src/handlers/users/index.ts - List users
export const METHOD = 'GET';
export const handler: Handler = async (req, res, gctx) => {
  const users = await gctx.modules.db.users.findAll();
  res.json({ users });
};

// src/handlers/users/[id].ts - Get user by ID
export const METHOD = 'GET';
export const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules.db.users.findById(req.params.id);
  res.json({ user });
};

// src/handlers/users/create.ts - Create user
export const METHOD = 'POST';
export const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules.db.users.create(req.body);
  res.status(201).json({ user });
};

// src/handlers/users/[id]/update.ts - Update user
export const METHOD = 'PUT';
export const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules.db.users.update(req.params.id, req.body);
  res.json({ user });
};

// src/handlers/users/[id]/delete.ts - Delete user
export const METHOD = 'DELETE';
export const handler: Handler = async (req, res, gctx) => {
  await gctx.modules.db.users.delete(req.params.id);
  res.status(204).end();
};
```

### Blog API

```typescript
// src/handlers/posts/index.ts
export const METHOD = 'GET';
export const handler: Handler = async (req, res, gctx) => {
  const posts = await gctx.modules.db.posts.findAll();
  res.json({ posts });
};

// src/handlers/posts/[id]/comments.ts
export const METHOD = 'GET';
export const handler: Handler = async (req, res, gctx) => {
  const comments = await gctx.modules.db.comments.findByPostId(req.params.id);
  res.json({ comments });
};

// src/handlers/posts/[id]/comments/create.ts
export const METHOD = 'POST';
export const handler: Handler = async (req, res, gctx) => {
  const comment = await gctx.modules.db.comments.create({
    postId: req.params.id,
    ...req.body
  });
  res.status(201).json({ comment });
};
```

## Best Practices

### 1. Use Descriptive Filenames
```plaintext
✅ Good
src/handlers/
├── users/
│   ├── create.ts
│   ├── [id]/
│   │   ├── update.ts
│   │   └── delete.ts
│   └── search.ts

❌ Avoid
src/handlers/
├── user.ts
├── u.ts
└── handler1.ts
```

### 2. Group Related Endpoints
```plaintext
src/handlers/
├── auth/
│   ├── login.ts
│   ├── logout.ts
│   └── refresh.ts
├── users/
│   ├── index.ts
│   ├── [id].ts
│   └── profile.ts
└── posts/
    ├── index.ts
    ├── [id].ts
    └── [id]/
        └── comments.ts
```

### 3. Use Consistent Naming
```plaintext
✅ Consistent
├── users/create.ts      → POST /api/users/create
├── posts/create.ts      → POST /api/posts/create
├── orders/create.ts     → POST /api/orders/create

❌ Inconsistent
├── users/new.ts         → POST /api/users/new
├── posts/add.ts         → POST /api/posts/add
├── orders/create.ts     → POST /api/orders/create
```

## Auto-Discovery

Gati automatically discovers handlers when:

1. **File Added**: New handler immediately available
2. **File Modified**: Route updates with hot reload
3. **File Deleted**: Route automatically removed

No server restart needed!

## Route Conflicts

If multiple handlers map to the same route, Gati uses this priority:

1. **Custom ROUTE export** (highest priority)
2. **Exact file match** (e.g., `users.ts` over `users/index.ts`)
3. **Alphabetical order** (for conflicts)

Example conflict resolution:
```plaintext
src/handlers/
├── users.ts              → /api/users (priority 2)
├── users/index.ts        → /api/users (priority 3)
└── custom.ts             → /api/users (priority 1, if ROUTE = '/users')
```

## Configuration Override

Override auto-discovered routes in `gati.config.ts`:

```typescript
export default {
  overrides: {
    // Disable auto-discovered route
    'GET /users/:id': false,
    
    // Override with custom handler
    'POST /webhook': customWebhookHandler,
    
    // Add middleware to auto-discovered route
    'GET /users': {
      middleware: [authMiddleware],
      rateLimit: { requests: 100, window: '1m' }
    }
  }
};
```

## Debugging Routes

Use the development server to see discovered routes:

```bash
pnpm dev
```

Output shows all discovered routes:
```plaintext
✅ Loaded GET /api/hello
✅ Loaded GET /api/users
✅ Loaded GET /api/users/:id
✅ Loaded POST /api/users/create
✅ Loaded GET /api/posts/:id/comments
```

## Next Steps

- [Manifest System](./manifest-system.md) - How route discovery works
- [Hot Reloading](./hot-reloading.md) - Development workflow
- [Handlers Guide](./handlers.md) - Writing effective handlers