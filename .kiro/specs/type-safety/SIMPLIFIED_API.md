# Simplified Gati Handler API
## Maximum Features, Minimum Code

**Philosophy:** Convention over configuration, progressive disclosure, self-documenting code

---

## The Three Levels of Gati

### Level 1: Beginner (Zero Config)

```typescript
// src/handlers/todos.ts

// Just write the function - types inferred automatically
export async function get(req, res, gctx) {
  const todos = gctx.storage.getAll();
  res.json({ todos });
}

export async function post(req, res, gctx) {
  const { title } = req.body;
  const todo = { id: Date.now(), title, done: false };
  gctx.storage.set(todo.id, todo);
  res.json({ todo });
}
```

**What you get:**
- ✅ Auto-generated types from usage
- ✅ Auto-validation
- ✅ Auto-routing from file path
- ✅ Auto-documentation

---

### Level 2: Intermediate (Type Hints)

```typescript
// src/handlers/todos.ts

type INPUT = { title: string };
type OUTPUT = { todo: Todo };

export async function post(req, res, gctx) {
  const { title } = req.body; // ✅ Typed as string
  const todo = { id: Date.now(), title, done: false };
  res.json({ todo }); // ✅ Validates against OUTPUT
}
```

**What you get:**
- ✅ Everything from Level 1
- ✅ Explicit type contracts
- ✅ Better IDE autocomplete
- ✅ Compile-time validation

---

### Level 3: Advanced (Full Control)

```typescript
// src/handlers/todos.ts
import { handler, auth, cache, validate } from '@gati/core';

export const post = handler()
  .input<{ title: string }>()
  .output<{ todo: Todo }>()
  .use(auth())
  .use(validate())
  .use(cache({ ttl: 60 }))
  .handle(async (req, res, gctx) => {
    const { title } = req.body;
    const todo = { id: Date.now(), title, done: false };
    res.json({ todo });
  });
```

**What you get:**
- ✅ Everything from Level 2
- ✅ Composable middleware
- ✅ Fine-grained control
- ✅ Reusable patterns

---

## Simplified Patterns

### 1. Resource Handlers (Convention-Based)

```typescript
// src/handlers/todos.ts

// Gati recognizes standard CRUD pattern
export const resource = {
  name: 'todo',
  
  async list(req, res, gctx) {
    const todos = gctx.storage.getAll();
    res.json({ todos });
  },
  
  async get(req, res, gctx) {
    const todo = gctx.storage.get(req.params.id);
    res.json({ todo });
  },
  
  async create(req, res, gctx) {
    const todo = { id: Date.now(), ...req.body };
    gctx.storage.set(todo.id, todo);
    res.json({ todo });
  },
  
  async update(req, res, gctx) {
    const todo = gctx.storage.update(req.params.id, req.body);
    res.json({ todo });
  },
  
  async delete(req, res, gctx) {
    gctx.storage.delete(req.params.id);
    res.json({ success: true });
  }
};
```

**Auto-generates:**
- `GET /todos` → list
- `GET /todos/:id` → get
- `POST /todos` → create
- `PATCH /todos/:id` → update
- `DELETE /todos/:id` → delete

---

### 2. Middleware (Decorator Syntax)

```typescript
// src/handlers/todos.ts

export async function post(req, res, gctx) {
  const { title } = req.body;
  res.json({ todo: { id: 1, title } });
}

// Add middleware with decorators
post.auth = true;
post.cache = 60;
post.rateLimit = { max: 10, window: 60 };
```

**Or use JSDoc:**
```typescript
/**
 * @auth required
 * @cache 60s
 * @rateLimit 10/min
 */
export async function post(req, res, gctx) {
  // ...
}
```

---

### 3. Validation (Schema Co-location)

```typescript
// src/handlers/todos.ts

export async function post(req, res, gctx) {
  const { title } = req.body;
  res.json({ todo: { id: 1, title } });
}

// Schema next to handler
post.input = {
  title: 'string',
  description: 'string?',
  priority: ['low', 'medium', 'high']
};

post.output = {
  todo: {
    id: 'number',
    title: 'string',
    done: 'boolean'
  }
};
```

**Or use TypeScript:**
```typescript
type INPUT = {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
};

type OUTPUT = {
  todo: {
    id: number;
    title: string;
    done: boolean;
  };
};

export async function post(req, res, gctx) {
  // Types auto-applied
}
```

---

### 4. Composition (Mixins as Functions)

```typescript
// src/handlers/todos.ts
import { withAuth, withCache, withValidation } from '@gati/core';

const baseHandler = async (req, res, gctx) => {
  const { title } = req.body;
  res.json({ todo: { id: 1, title } });
};

export const post = withAuth(
  withCache(60,
    withValidation({ title: 'string' }, 
      baseHandler
    )
  )
);
```

**Or use pipe:**
```typescript
import { pipe } from '@gati/core';

export const post = pipe(
  baseHandler,
  withAuth(),
  withCache(60),
  withValidation({ title: 'string' })
);
```

---

### 5. Builder Pattern (Fluent API)

```typescript
// src/handlers/todos.ts
import { handler } from '@gati/core';

export const post = handler()
  .auth()
  .cache(60)
  .validate({ title: 'string' })
  .handle(async (req, res, gctx) => {
    const { title } = req.body;
    res.json({ todo: { id: 1, title } });
  });
```

**With types:**
```typescript
export const post = handler<{ title: string }, { todo: Todo }>()
  .auth()
  .cache(60)
  .handle(async (req, res, gctx) => {
    const { title } = req.body; // ✅ Typed
    res.json({ todo: { id: 1, title } }); // ✅ Validated
  });
```

---

### 6. Config-Based (Declarative)

```typescript
// src/handlers/todos.ts

export default {
  method: 'POST',
  auth: true,
  cache: 60,
  input: { title: 'string' },
  output: { todo: 'Todo' },
  
  async handle(req, res, gctx) {
    const { title } = req.body;
    res.json({ todo: { id: 1, title } });
  }
};
```

---

## Recommended Patterns by Use Case

### Quick Prototype
```typescript
// Just write functions
export async function get(req, res, gctx) {
  res.json({ todos: [] });
}
```

### Small Project
```typescript
// Add type hints
type OUTPUT = { todos: Todo[] };

export async function get(req, res, gctx) {
  res.json({ todos: [] });
}
```

### Medium Project
```typescript
// Use resource pattern
export const resource = {
  name: 'todo',
  async list(req, res, gctx) { /* ... */ },
  async get(req, res, gctx) { /* ... */ }
};
```

### Large Project
```typescript
// Use builder pattern
export const get = handler<void, { todos: Todo[] }>()
  .cache(60)
  .handle(async (req, res, gctx) => {
    res.json({ todos: [] });
  });
```

### Enterprise
```typescript
// Use full composition
import { createResourceHandler } from '@gati/patterns';

export const { get, post, patch, del } = createResourceHandler({
  resource: 'todo',
  storage: 'todos',
  auth: true,
  cache: 60
});
```

---

## The Magic: Convention Over Configuration

### File-Based Routing
```
src/handlers/
  todos.ts          → /api/todos
  todos/[id].ts     → /api/todos/:id
  users/[id]/posts.ts → /api/users/:id/posts
```

### Method Detection
```typescript
// Function name = HTTP method
export async function get() { }    // GET
export async function post() { }   // POST
export async function patch() { }  // PATCH
export async function del() { }    // DELETE

// Or use 'handler' for all methods
export async function handler(req, res) {
  if (req.method === 'GET') { }
  if (req.method === 'POST') { }
}
```

### Auto-Validation
```typescript
// Types = validation rules
type INPUT = {
  email: string;      // Must be string
  age?: number;       // Optional number
  role: 'admin' | 'user'; // Enum
};

// Gati auto-validates before calling handler
export async function post(req, res) {
  const { email, age, role } = req.body; // ✅ Already validated
}
```

### Auto-Documentation
```typescript
/**
 * Create a new todo
 * @param title - Todo title (required)
 * @param description - Todo description (optional)
 * @returns Created todo object
 */
export async function post(req, res, gctx) {
  // JSDoc → OpenAPI spec
}
```

---

## Simplified Middleware

### Property-Based
```typescript
export async function post(req, res, gctx) { }

post.auth = true;
post.cache = 60;
post.rateLimit = 10;
```

### Decorator-Based (Future)
```typescript
@auth()
@cache(60)
@rateLimit(10)
export async function post(req, res, gctx) { }
```

### Inline
```typescript
export const post = handler()
  .auth()
  .cache(60)
  .rateLimit(10)
  .handle(async (req, res, gctx) => { });
```

---

## Simplified Types

### String Schemas (Beginner-Friendly)
```typescript
post.input = {
  email: 'string',
  age: 'number?',
  role: 'admin | user',
  tags: 'string[]',
  metadata: 'object'
};
```

### TypeScript Types (Type-Safe)
```typescript
type INPUT = {
  email: string;
  age?: number;
  role: 'admin' | 'user';
  tags: string[];
  metadata: Record<string, any>;
};
```

### GType Schemas (Advanced)
```typescript
import { g } from '@gati/core';

post.input = g.object({
  email: g.string().email(),
  age: g.number().optional().min(0).max(120),
  role: g.enum(['admin', 'user']),
  tags: g.array(g.string()),
  metadata: g.record(g.any())
});
```

---

## The Gati Way: Progressive Disclosure

```typescript
// Level 1: Start simple
export async function get(req, res, gctx) {
  res.json({ todos: [] });
}

// Level 2: Add types when needed
type OUTPUT = { todos: Todo[] };
export async function get(req, res, gctx) {
  res.json({ todos: [] });
}

// Level 3: Add middleware when needed
get.cache = 60;
get.auth = true;

// Level 4: Refactor to builder when complex
export const get = handler<void, OUTPUT>()
  .cache(60)
  .auth()
  .handle(async (req, res, gctx) => {
    res.json({ todos: [] });
  });

// Level 5: Extract to pattern when reusable
export const { get } = createResourceHandler({ resource: 'todo' });
```

---

## Implementation Priority

### Phase 1: Core Simplifications
1. ✅ Function-based handlers (no classes required)
2. ✅ Auto-type inference from usage
3. ✅ Property-based middleware (`handler.auth = true`)
4. ✅ String schemas for validation

### Phase 2: Patterns
1. ✅ Resource pattern (`export const resource = { ... }`)
2. ✅ Builder pattern (`handler().auth().cache()`)
3. ✅ Composition helpers (`withAuth`, `withCache`)

### Phase 3: Advanced
1. ✅ JSDoc → OpenAPI generation
2. ✅ Decorator syntax (when TC39 stable)
3. ✅ Visual handler builder (Playground)

---

## Summary

**Simplification Strategy:**
1. **Convention over configuration** - File paths = routes, function names = methods
2. **Progressive disclosure** - Start simple, add complexity only when needed
3. **Multiple patterns** - Choose what fits your style/project size
4. **Self-documenting** - Code structure = API structure
5. **Zero boilerplate** - Framework handles the boring stuff

**Result:**
- Beginners write plain functions
- Intermediates add type hints
- Advanced users compose patterns
- Experts build custom abstractions
- Everyone gets full type safety

**This is Gati simplified.** 🚀
