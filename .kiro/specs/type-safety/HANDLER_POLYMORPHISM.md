# Handler Polymorphism & Composition
## Function Overloading, Overriding, and Composable Types

---

## Function Overloading for Handlers

### Pattern 1: Method-Based Overloading

```typescript
// src/handlers/todos/[id].ts

// Overload signatures
function handler(req: Request<void, { id: string }>, res: Response, gctx: GCTX, lctx: LCTX): Promise<void>;
function handler(req: Request<{ completed: boolean }, { id: string }>, res: Response, gctx: GCTX, lctx: LCTX): Promise<void>;
function handler(req: Request, res: Response, gctx: GCTX, lctx: LCTX): Promise<void>;

// Implementation
async function handler(req: any, res: any, gctx: any, lctx: any) {
  const { id } = req.params;
  
  if (req.method === 'GET') {
    const todo = gctx.modules.storage.get(`todo:${id}`);
    return res.json({ todo });
  }
  
  if (req.method === 'PATCH') {
    const { completed } = req.body;
    const todo = gctx.modules.storage.get(`todo:${id}`);
    todo.completed = completed;
    return res.json({ todo });
  }
}

export { handler };
```

### Pattern 2: Discriminated Union Overloading

```typescript
// src/handlers/api.ts

type GetRequest = { method: 'GET'; params: { id: string } };
type PostRequest = { method: 'POST'; body: { title: string } };
type PatchRequest = { method: 'PATCH'; params: { id: string }; body: { completed: boolean } };

type ApiRequest = GetRequest | PostRequest | PatchRequest;

export const handler: Handler<ApiRequest> = async (req, res, gctx) => {
  switch (req.method) {
    case 'GET': {
      const { id } = req.params; // ✅ Typed as string
      return res.json({ todo: gctx.modules.storage.get(`todo:${id}`) });
    }
    case 'POST': {
      const { title } = req.body; // ✅ Typed as string
      return res.json({ todo: { id: '1', title } });
    }
    case 'PATCH': {
      const { id } = req.params; // ✅ Typed as string
      const { completed } = req.body; // ✅ Typed as boolean
      return res.json({ todo: { id, completed } });
    }
  }
};
```

---

## Handler Inheritance & Override

### Base Handler Pattern

```typescript
// src/handlers/base/crud.ts

export abstract class CrudHandler<T, ID = string> {
  abstract getAll(gctx: GCTX): Promise<T[]>;
  abstract getById(id: ID, gctx: GCTX): Promise<T | null>;
  abstract create(data: Partial<T>, gctx: GCTX): Promise<T>;
  abstract update(id: ID, data: Partial<T>, gctx: GCTX): Promise<T | null>;
  abstract delete(id: ID, gctx: GCTX): Promise<boolean>;
  
  // Default handler implementation
  handler: Handler = async (req, res, gctx) => {
    if (req.method === 'GET' && !req.params.id) {
      const items = await this.getAll(gctx);
      return res.json({ items });
    }
    
    if (req.method === 'GET' && req.params.id) {
      const item = await this.getById(req.params.id, gctx);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json({ item });
    }
    
    if (req.method === 'POST') {
      const item = await this.create(req.body, gctx);
      return res.status(201).json({ item });
    }
    
    if (req.method === 'PATCH' && req.params.id) {
      const item = await this.update(req.params.id, req.body, gctx);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json({ item });
    }
    
    if (req.method === 'DELETE' && req.params.id) {
      const success = await this.delete(req.params.id, gctx);
      return res.json({ success });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  };
}

// src/handlers/todos.ts
import { CrudHandler } from './base/crud';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

class TodoHandler extends CrudHandler<Todo> {
  async getAll(gctx: GCTX): Promise<Todo[]> {
    return gctx.modules.storage.keys()
      .filter(k => k.startsWith('todo:'))
      .map(k => gctx.modules.storage.get(k));
  }
  
  async getById(id: string, gctx: GCTX): Promise<Todo | null> {
    return gctx.modules.storage.get(`todo:${id}`);
  }
  
  async create(data: Partial<Todo>, gctx: GCTX): Promise<Todo> {
    const todo: Todo = {
      id: Date.now().toString(),
      title: data.title!,
      completed: false
    };
    gctx.modules.storage.set(`todo:${todo.id}`, todo);
    return todo;
  }
  
  async update(id: string, data: Partial<Todo>, gctx: GCTX): Promise<Todo | null> {
    const todo = await this.getById(id, gctx);
    if (!todo) return null;
    Object.assign(todo, data);
    gctx.modules.storage.set(`todo:${id}`, todo);
    return todo;
  }
  
  async delete(id: string, gctx: GCTX): Promise<boolean> {
    return gctx.modules.storage.delete(`todo:${id}`);
  }
}

const todoHandler = new TodoHandler();
export const handler = todoHandler.handler;
```

---

## Composable Handler Types

### Type Composition with Intersection

```typescript
// src/types/handlers.ts

type WithAuth = {
  auth: {
    user: User;
    token: string;
  };
};

type WithPagination = {
  pagination: {
    page: number;
    limit: number;
  };
};

type WithTimestamps = {
  createdAt: string;
  updatedAt: string;
};

// Compose types
type AuthenticatedTodo = Todo & WithAuth & WithTimestamps;
type PaginatedTodos = { todos: Todo[] } & WithPagination;

// src/handlers/todos.ts
export const get: Handler<
  void,
  PaginatedTodos,
  {},
  { page?: string; limit?: string }
> = async (req, res, gctx) => {
  const { page = '1', limit = '20' } = req.query;
  const todos = await gctx.modules.storage.getAll();
  
  res.json({
    todos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
};
```

### Mixin Pattern for Handlers

```typescript
// src/handlers/mixins/auth.ts
export function withAuth<T extends Handler>(handler: T): T {
  return (async (req, res, gctx, lctx) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await gctx.modules.auth.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    lctx.user = user;
    return handler(req, res, gctx, lctx);
  }) as T;
}

// src/handlers/mixins/logging.ts
export function withLogging<T extends Handler>(handler: T): T {
  return (async (req, res, gctx, lctx) => {
    lctx.logger.info(`${req.method} ${req.path}`);
    const start = Date.now();
    
    const result = await handler(req, res, gctx, lctx);
    
    lctx.logger.info(`Completed in ${Date.now() - start}ms`);
    return result;
  }) as T;
}

// src/handlers/mixins/validation.ts
export function withValidation<INPUT>(
  schema: GType,
  handler: Handler<INPUT>
): Handler<INPUT> {
  return async (req, res, gctx, lctx) => {
    const result = validateGType(req.body, schema);
    if (!result.valid) {
      return res.status(400).json({ errors: result.errors });
    }
    return handler(req, res, gctx, lctx);
  };
}

// Usage: Compose mixins
import { withAuth } from './mixins/auth';
import { withLogging } from './mixins/logging';
import { withValidation } from './mixins/validation';

const baseHandler: Handler<{ title: string }> = async (req, res, gctx) => {
  const { title } = req.body;
  res.json({ todo: { id: '1', title } });
};

export const handler = withAuth(
  withLogging(
    withValidation(CreateTodoSchema, baseHandler)
  )
);
```

---

## Generic Handler Factories

### Factory Pattern

```typescript
// src/handlers/factories/resource.ts

export function createResourceHandler<T, ID = string>(config: {
  resourceName: string;
  getAll: (gctx: GCTX) => Promise<T[]>;
  getById: (id: ID, gctx: GCTX) => Promise<T | null>;
  create: (data: Partial<T>, gctx: GCTX) => Promise<T>;
  update: (id: ID, data: Partial<T>, gctx: GCTX) => Promise<T | null>;
  delete: (id: ID, gctx: GCTX) => Promise<boolean>;
}) {
  return {
    get: (async (req, res, gctx) => {
      if (req.params.id) {
        const item = await config.getById(req.params.id, gctx);
        if (!item) return res.status(404).json({ error: `${config.resourceName} not found` });
        return res.json({ [config.resourceName]: item });
      }
      
      const items = await config.getAll(gctx);
      return res.json({ [config.resourceName + 's']: items });
    }) as Handler,
    
    post: (async (req, res, gctx) => {
      const item = await config.create(req.body, gctx);
      return res.status(201).json({ [config.resourceName]: item });
    }) as Handler,
    
    patch: (async (req, res, gctx) => {
      const item = await config.update(req.params.id, req.body, gctx);
      if (!item) return res.status(404).json({ error: `${config.resourceName} not found` });
      return res.json({ [config.resourceName]: item });
    }) as Handler,
    
    del: (async (req, res, gctx) => {
      const success = await config.delete(req.params.id, gctx);
      return res.json({ success });
    }) as Handler
  };
}

// Usage
// src/handlers/todos.ts
import { createResourceHandler } from './factories/resource';

export const { get, post, patch, del } = createResourceHandler<Todo>({
  resourceName: 'todo',
  getAll: (gctx) => gctx.modules.storage.getAll('todo'),
  getById: (id, gctx) => gctx.modules.storage.get(`todo:${id}`),
  create: (data, gctx) => gctx.modules.storage.create('todo', data),
  update: (id, data, gctx) => gctx.modules.storage.update(`todo:${id}`, data),
  delete: (id, gctx) => gctx.modules.storage.delete(`todo:${id}`)
});
```

---

## Conditional Types for Polymorphism

### Method-Specific Types

```typescript
// src/types/handler-methods.ts

type MethodHandler<M extends string, I, O, P = {}, Q = {}> = 
  M extends 'GET' ? Handler<void, O, P, Q> :
  M extends 'POST' ? Handler<I, O, P, Q> :
  M extends 'PATCH' ? Handler<Partial<I>, O, P, Q> :
  M extends 'DELETE' ? Handler<void, { success: boolean }, P, Q> :
  never;

// Usage
type TodoGetHandler = MethodHandler<'GET', never, { todos: Todo[] }>;
type TodoPostHandler = MethodHandler<'POST', CreateTodoInput, { todo: Todo }>;
type TodoPatchHandler = MethodHandler<'PATCH', Todo, { todo: Todo }, { id: string }>;
type TodoDeleteHandler = MethodHandler<'DELETE', never, never, { id: string }>;

export const get: TodoGetHandler = async (req, res, gctx) => {
  const todos = await gctx.modules.storage.getAll();
  res.json({ todos });
};

export const post: TodoPostHandler = async (req, res, gctx) => {
  const { title } = req.body;
  const todo = { id: '1', title, completed: false };
  res.json({ todo });
};
```

### Branded Handler Types

```typescript
// src/types/branded-handlers.ts

type Brand<T, B> = T & { __brand: B };

type AuthenticatedHandler<I, O, P = {}, Q = {}> = Brand<
  Handler<I, O, P, Q>,
  'authenticated'
>;

type AdminHandler<I, O, P = {}, Q = {}> = Brand<
  Handler<I, O, P, Q>,
  'admin'
>;

type PublicHandler<I, O, P = {}, Q = {}> = Brand<
  Handler<I, O, P, Q>,
  'public'
>;

// Usage
export const get: PublicHandler<void, { todos: Todo[] }> = async (req, res, gctx) => {
  // Public endpoint - no auth required
  const todos = await gctx.modules.storage.getAll();
  res.json({ todos });
};

export const post: AuthenticatedHandler<CreateTodoInput, { todo: Todo }> = async (req, res, gctx, lctx) => {
  // Requires authentication
  const { title } = req.body;
  const todo = { id: '1', title, userId: lctx.user.id };
  res.json({ todo });
};

export const deleteAll: AdminHandler<void, { deleted: number }> = async (req, res, gctx, lctx) => {
  // Requires admin role
  if (!lctx.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const deleted = await gctx.modules.storage.deleteAll();
  res.json({ deleted });
};
```

---

## Higher-Order Handlers

### Decorator Pattern

```typescript
// src/handlers/decorators/cache.ts

export function cached<I, O, P, Q>(
  ttl: number,
  handler: Handler<I, O, P, Q>
): Handler<I, O, P, Q> {
  const cache = new Map<string, { data: O; expires: number }>();
  
  return async (req, res, gctx, lctx) => {
    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      lctx.logger.info('Cache hit');
      return res.json(cached.data);
    }
    
    // Intercept response
    const originalJson = res.json;
    res.json = (data: O) => {
      cache.set(cacheKey, { data, expires: Date.now() + ttl });
      return originalJson.call(res, data);
    };
    
    return handler(req, res, gctx, lctx);
  };
}

// Usage
import { cached } from './decorators/cache';

const baseHandler: Handler<void, { todos: Todo[] }> = async (req, res, gctx) => {
  const todos = await gctx.modules.storage.getAll();
  res.json({ todos });
};

export const get = cached(60000, baseHandler); // Cache for 60s
```

### Rate Limiting Decorator

```typescript
// src/handlers/decorators/rate-limit.ts

export function rateLimit<I, O, P, Q>(
  maxRequests: number,
  windowMs: number,
  handler: Handler<I, O, P, Q>
): Handler<I, O, P, Q> {
  const requests = new Map<string, number[]>();
  
  return async (req, res, gctx, lctx) => {
    const key = lctx.user?.id || req.ip;
    const now = Date.now();
    const userRequests = requests.get(key) || [];
    
    // Remove old requests
    const validRequests = userRequests.filter(t => t > now - windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    return handler(req, res, gctx, lctx);
  };
}

// Usage
export const post = rateLimit(10, 60000, basePostHandler); // 10 req/min
```

---

## Polymorphic Response Types

### Union Response Types

```typescript
type SuccessResponse<T> = { success: true; data: T };
type ErrorResponse = { success: false; error: string; code: string };
type Response<T> = SuccessResponse<T> | ErrorResponse;

export const get: Handler<void, Response<Todo[]>> = async (req, res, gctx) => {
  try {
    const todos = await gctx.modules.storage.getAll();
    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      code: 'INTERNAL_ERROR' 
    });
  }
};
```

### Discriminated Response Types

```typescript
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; details?: any }
  | { status: 'loading' }
  | { status: 'empty' };

export const get: Handler<void, ApiResponse<Todo[]>> = async (req, res, gctx) => {
  const todos = await gctx.modules.storage.getAll();
  
  if (todos.length === 0) {
    return res.json({ status: 'empty' });
  }
  
  res.json({ status: 'success', data: todos });
};
```

---

## Summary

**Polymorphism Features:**
1. ✅ Function overloading with discriminated unions
2. ✅ Handler inheritance with abstract base classes
3. ✅ Type composition with intersections
4. ✅ Mixin pattern for cross-cutting concerns
5. ✅ Generic handler factories
6. ✅ Conditional types for method-specific handlers
7. ✅ Branded types for access control
8. ✅ Higher-order handlers (decorators)
9. ✅ Polymorphic response types

**Benefits:**
- Code reuse across handlers
- Type-safe composition
- Flexible architecture
- Maintainable patterns
- Zero runtime overhead

**This is advanced Gati.** 🚀
