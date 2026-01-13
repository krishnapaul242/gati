# Handler Type Examples
## Real-world patterns with INPUT/OUTPUT/PARAMS/QUERY

---

## Example 1: Simple Todo List (Fixed Type Names)

```typescript
// src/handlers/todos.ts

type INPUT = {
  title: string;
  description?: string;
};

type OUTPUT = {
  todo: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
  };
};

export const post: Handler<INPUT, OUTPUT> = async (req, res, gctx) => {
  const { title, description } = req.body;
  
  const todo = {
    id: Date.now().toString(),
    title,
    description,
    completed: false
  };
  
  gctx.modules.storage.set(`todo:${todo.id}`, todo);
  res.json({ todo });
};

export const get: Handler<void, { todos: OUTPUT['todo'][] }> = async (req, res, gctx) => {
  const keys = gctx.modules.storage.keys().filter(k => k.startsWith('todo:'));
  const todos = keys.map(k => gctx.modules.storage.get(k)).filter(Boolean);
  res.json({ todos });
};
```

---

## Example 2: Todo by ID (With PARAMS)

```typescript
// src/handlers/todos/[id].ts

type PARAMS = { id: string };
type OUTPUT = { todo: Todo } | { error: string };

export const get: Handler<void, OUTPUT, PARAMS> = async (req, res, gctx) => {
  const { id } = req.params;
  
  const todo = gctx.modules.storage.get(`todo:${id}`);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  res.json({ todo });
};

type INPUT = { completed: boolean };

export const patch: Handler<INPUT, OUTPUT, PARAMS> = async (req, res, gctx) => {
  const { id } = req.params;
  const { completed } = req.body;
  
  const todo = gctx.modules.storage.get(`todo:${id}`);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todo.completed = completed;
  gctx.modules.storage.set(`todo:${id}`, todo);
  res.json({ todo });
};

export const del: Handler<void, { success: boolean }, PARAMS> = async (req, res, gctx) => {
  const { id } = req.params;
  const deleted = gctx.modules.storage.delete(`todo:${id}`);
  res.json({ success: deleted });
};
```

---

## Example 3: Search with Query Params

```typescript
// src/handlers/todos/search.ts

type QUERY = {
  q?: string;
  completed?: string;
  limit?: string;
  offset?: string;
};

type OUTPUT = {
  todos: Todo[];
  total: number;
  hasMore: boolean;
};

export const get: Handler<void, OUTPUT, {}, QUERY> = async (req, res, gctx) => {
  const { q, completed, limit = '10', offset = '0' } = req.query;
  
  let todos = gctx.modules.storage.keys()
    .filter(k => k.startsWith('todo:'))
    .map(k => gctx.modules.storage.get(k))
    .filter(Boolean);
  
  // Filter by search query
  if (q) {
    todos = todos.filter(t => t.title.toLowerCase().includes(q.toLowerCase()));
  }
  
  // Filter by completed status
  if (completed === 'true') {
    todos = todos.filter(t => t.completed);
  } else if (completed === 'false') {
    todos = todos.filter(t => !t.completed);
  }
  
  const total = todos.length;
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  
  todos = todos.slice(offsetNum, offsetNum + limitNum);
  
  res.json({
    todos,
    total,
    hasMore: offsetNum + limitNum < total
  });
};
```

---

## Example 4: User Posts (Nested PARAMS)

```typescript
// src/handlers/users/[userId]/posts/[postId].ts

type PARAMS = {
  userId: string;
  postId: string;
};

type OUTPUT = {
  post: {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: string;
  };
} | { error: string };

export const get: Handler<void, OUTPUT, PARAMS> = async (req, res, gctx) => {
  const { userId, postId } = req.params;
  
  const post = gctx.modules.db.posts.findOne({ 
    id: postId, 
    userId 
  });
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  res.json({ post });
};

type INPUT = {
  title?: string;
  content?: string;
};

export const patch: Handler<INPUT, OUTPUT, PARAMS> = async (req, res, gctx) => {
  const { userId, postId } = req.params;
  const updates = req.body;
  
  const post = await gctx.modules.db.posts.updateOne(
    { id: postId, userId },
    updates
  );
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  res.json({ post });
};
```

---

## Example 5: Inline Generics (Quick Prototype)

```typescript
// src/handlers/health.ts

export const get: Handler<
  void,
  { status: 'ok'; uptime: number; timestamp: string }
> = async (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};
```

---

## Example 6: Generated Types (Production)

```typescript
// src/handlers/auth/login.ts
import type { LoginHandler } from '.gati/generated/handlers/auth/login.types';

// Types auto-generated from usage:
// - INPUT: { email: string; password: string }
// - OUTPUT: { token: string; user: User } | { error: string }

export const post: LoginHandler = async (req, res, gctx) => {
  const { email, password } = req.body;
  
  const user = await gctx.modules.auth.validateCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = await gctx.modules.auth.generateToken(user.id);
  res.json({ token, user });
};
```

---

## Example 7: Single Handler with Multiple Methods

```typescript
// src/handlers/todos.ts

type GetOutput = { todos: Todo[] };
type PostInput = { title: string; description?: string };
type PostOutput = { todo: Todo };

export const handler: Handler<
  void | PostInput,
  GetOutput | PostOutput
> = async (req, res, gctx) => {
  if (req.method === 'GET') {
    const todos = gctx.modules.storage.keys()
      .filter(k => k.startsWith('todo:'))
      .map(k => gctx.modules.storage.get(k));
    return res.json({ todos });
  }
  
  if (req.method === 'POST') {
    const { title, description } = req.body;
    const todo = {
      id: Date.now().toString(),
      title,
      description,
      completed: false
    };
    gctx.modules.storage.set(`todo:${todo.id}`, todo);
    return res.json({ todo });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
};
```

---

## Example 8: Complex Query Filtering

```typescript
// src/handlers/products.ts

type QUERY = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: 'price' | 'name' | 'date';
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
};

type OUTPUT = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export const get: Handler<void, OUTPUT, {}, QUERY> = async (req, res, gctx) => {
  const {
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = 'date',
    order = 'desc',
    page = '1',
    limit = '20'
  } = req.query;
  
  let products = await gctx.modules.db.products.findAll();
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  if (minPrice) {
    products = products.filter(p => p.price >= parseFloat(minPrice));
  }
  
  if (maxPrice) {
    products = products.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  if (inStock === 'true') {
    products = products.filter(p => p.stock > 0);
  }
  
  // Sort
  products.sort((a, b) => {
    const aVal = a[sort];
    const bVal = b[sort];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return order === 'asc' ? comparison : -comparison;
  });
  
  // Paginate
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const total = products.length;
  const pages = Math.ceil(total / limitNum);
  
  products = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  
  res.json({
    products,
    pagination: { page: pageNum, limit: limitNum, total, pages }
  });
};
```

---

## Example 9: File Upload with Multipart

```typescript
// src/handlers/upload.ts

type INPUT = {
  file: File;
  title?: string;
  description?: string;
};

type OUTPUT = {
  url: string;
  id: string;
  size: number;
} | { error: string };

export const post: Handler<INPUT, OUTPUT> = async (req, res, gctx) => {
  const { file, title, description } = req.body;
  
  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }
  
  const id = Date.now().toString();
  const url = await gctx.modules.storage.uploadFile(file, {
    id,
    title,
    description
  });
  
  res.json({
    url,
    id,
    size: file.size
  });
};
```

---

## Example 10: Webhook Handler

```typescript
// src/handlers/webhooks/stripe.ts

type INPUT = {
  type: string;
  data: {
    object: any;
  };
};

type OUTPUT = { received: boolean };

export const post: Handler<INPUT, OUTPUT> = async (req, res, gctx, lctx) => {
  const { type, data } = req.body;
  
  lctx.logger.info(`Received webhook: ${type}`);
  
  switch (type) {
    case 'payment_intent.succeeded':
      await gctx.modules.payments.handleSuccess(data.object);
      break;
    case 'payment_intent.failed':
      await gctx.modules.payments.handleFailure(data.object);
      break;
    default:
      lctx.logger.warn(`Unhandled webhook type: ${type}`);
  }
  
  res.json({ received: true });
};
```

---

## Example 11: Batch Operations

```typescript
// src/handlers/todos/batch.ts

type INPUT = {
  operation: 'delete' | 'complete' | 'uncomplete';
  ids: string[];
};

type OUTPUT = {
  success: boolean;
  processed: number;
  failed: string[];
};

export const post: Handler<INPUT, OUTPUT> = async (req, res, gctx) => {
  const { operation, ids } = req.body;
  const failed: string[] = [];
  let processed = 0;
  
  for (const id of ids) {
    try {
      const todo = gctx.modules.storage.get(`todo:${id}`);
      if (!todo) {
        failed.push(id);
        continue;
      }
      
      switch (operation) {
        case 'delete':
          gctx.modules.storage.delete(`todo:${id}`);
          break;
        case 'complete':
          todo.completed = true;
          gctx.modules.storage.set(`todo:${id}`, todo);
          break;
        case 'uncomplete':
          todo.completed = false;
          gctx.modules.storage.set(`todo:${id}`, todo);
          break;
      }
      
      processed++;
    } catch (error) {
      failed.push(id);
    }
  }
  
  res.json({
    success: failed.length === 0,
    processed,
    failed
  });
};
```

---

## Example 12: Shared Types Across Handlers

```typescript
// src/types/common.ts
export type PaginationQuery = {
  page?: string;
  limit?: string;
};

export type PaginationOutput<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

// src/handlers/todos.ts
import type { PaginationQuery, PaginationOutput } from '../types/common';

export const get: Handler<
  void,
  PaginationOutput<Todo>,
  {},
  PaginationQuery
> = async (req, res, gctx) => {
  const { page = '1', limit = '20' } = req.query;
  // ... implementation
};

// src/handlers/users.ts
import type { PaginationQuery, PaginationOutput } from '../types/common';

export const get: Handler<
  void,
  PaginationOutput<User>,
  {},
  PaginationQuery
> = async (req, res, gctx) => {
  const { page = '1', limit = '20' } = req.query;
  // ... implementation
};
```

---

## Pattern Summary

| Example | Pattern | Use Case |
|---------|---------|----------|
| 1 | Fixed type names | Simple CRUD |
| 2 | PARAMS extraction | Resource by ID |
| 3 | QUERY filtering | Search/filter |
| 4 | Nested PARAMS | Nested resources |
| 5 | Inline generics | Quick prototype |
| 6 | Generated types | Production app |
| 7 | Single handler | Multiple methods |
| 8 | Complex QUERY | Advanced filtering |
| 9 | File upload | Multipart data |
| 10 | Webhook | External events |
| 11 | Batch operations | Bulk actions |
| 12 | Shared types | Type reuse |

---

## Key Takeaways

1. **Fixed type names** (`INPUT`, `OUTPUT`, `PARAMS`, `QUERY`) are simple and explicit
2. **Inline generics** work for quick prototypes
3. **Generated types** scale for production apps
4. **Shared types** enable reuse across handlers
5. **All patterns** provide full type safety with zero assertions
6. **Choose based on** project size, team preference, and complexity
