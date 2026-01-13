# Handler Type System Design
## INPUT/OUTPUT Generics with Auto-Generated Context

**Goal:** Zero type assertions with automatic type inference from handler signatures  
**Vision:** `gati dev` generates GCTX/LCTX types and extracts INPUT/OUTPUT from handler code

---

## The New Handler Signature

```typescript
type Handler<
  INPUT = unknown,
  OUTPUT = unknown,
  PARAMS = Record<string, string>,
  QUERY = Record<string, string>,
  CTX = GCTX & LCTX
> = (
  req: Request & { 
    body: INPUT;
    params: PARAMS;
    query: QUERY;
  },
  res: Response<OUTPUT>,
  gctx: CTX extends GCTX & LCTX ? GCTX : never,
  lctx: CTX extends GCTX & LCTX ? LCTX : never
) => void | Promise<void>;
```

### Key Features
1. **INPUT** - Request body type (auto-extracted from handler code)
2. **OUTPUT** - Response type (auto-extracted from res.json() calls)
3. **PARAMS** - URL parameters (auto-extracted from route path)
4. **QUERY** - Query string parameters (auto-extracted from req.query usage)
5. **CTX** - Combined context type (auto-generated from loaded modules/plugins)
6. **GCTX** - Global context (auto-generated per project)
7. **LCTX** - Local context (auto-generated per request)

---

## How It Works

### 1. Developer Writes Handler (No Type Annotations)

```typescript
// src/handlers/todos.ts
export const handler = async (req, res, gctx, lctx) => {
  const storage = gctx.modules['storage'];
  
  if (req.method === 'POST') {
    const { title, description } = req.body;
    
    const todo = {
      id: Date.now().toString(),
      title,
      description,
      completed: false
    };
    
    storage.set(`todo:${todo.id}`, todo);
    res.json({ todo });
  }
};
```

### 2. `gati dev` Analyzes Handler

**Type Extractor identifies:**
- `req.body` usage → extracts INPUT type
- `res.json()` calls → extracts OUTPUT type
- Route path `[id]` → extracts PARAMS type
- `req.query` usage → extracts QUERY type
- `gctx.modules['storage']` → identifies module dependencies

### 3. Auto-Generated Types

```typescript
// .gati/generated/handlers/todos.types.ts

// INPUT extracted from req.body destructuring
export type TodosInput = {
  title: string;
  description?: string;
};

// OUTPUT extracted from res.json() call
export type TodosOutput = {
  todo: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
  };
};

// PARAMS extracted from route path (none for /todos)
export type TodosParams = {};

// QUERY extracted from req.query usage
export type TodosQuery = {
  completed?: string;
  limit?: string;
};

// GCTX generated from loaded modules
export type GCTX = {
  modules: {
    storage: Storage;
    // ... other modules
  };
  config: AppConfig;
  logger: Logger;
};

// LCTX generated per request
export type LCTX = {
  requestId: string;
  timestamp: number;
  user?: User;
};

// Full handler type
export type TodosHandler = Handler<
  TodosInput,
  TodosOutput,
  TodosParams,
  TodosQuery,
  GCTX & LCTX
>;
```

### 4. Handler Gets Automatic Types

```typescript
// src/handlers/todos.ts
import type { TodosHandler } from '.gati/generated/handlers/todos.types';

// Now fully typed!
export const handler: TodosHandler = async (req, res, gctx, lctx) => {
  // req.body is TodosInput
  const { title, description } = req.body; // ✅ Typed!
  
  // gctx.modules is typed
  const storage = gctx.modules['storage']; // ✅ Typed!
  
  // res.json() expects TodosOutput
  res.json({ todo: { ... } }); // ✅ Typed!
};
```

---

## Multiple HTTP Methods Support

### Pattern 1: Single Handler with Method Switching

```typescript
// src/handlers/todos.ts
export const handler = async (req, res, gctx, lctx) => {
  if (req.method === 'GET') {
    // GET logic
    res.json({ todos: [] });
  }
  
  if (req.method === 'POST') {
    const { title } = req.body;
    res.json({ todo: { id: '1', title } });
  }
};
```

**Generated Types:**
```typescript
// INPUT is union of all method inputs
type TodosInput = 
  | { method: 'GET' }
  | { method: 'POST'; body: { title: string } };

// OUTPUT is union of all method outputs
type TodosOutput =
  | { todos: Todo[] }
  | { todo: Todo };
```

### Pattern 2: Named Method Exports

```typescript
// src/handlers/todos.ts

// GET handler
export const get = async (req, res, gctx, lctx) => {
  const todos = await gctx.modules['storage'].keys();
  res.json({ todos });
};

// POST handler
export const post = async (req, res, gctx, lctx) => {
  const { title } = req.body;
  const todo = { id: '1', title, completed: false };
  res.json({ todo });
};

// Alternative names
export const getHandler = get;
export const postHandler = post;
```

**Generated Types:**
```typescript
// Separate types per method
export type TodosGetInput = void;
export type TodosGetOutput = { todos: Todo[] };
export type TodosGetHandler = Handler<TodosGetInput, TodosGetOutput, GCTX & LCTX>;

export type TodosPostInput = { title: string };
export type TodosPostOutput = { todo: Todo };
export type TodosPostHandler = Handler<TodosPostInput, TodosPostOutput, GCTX & LCTX>;
```

### Pattern 3: Method Object Export

```typescript
// src/handlers/todos.ts
export const methods = {
  GET: async (req, res, gctx, lctx) => {
    res.json({ todos: [] });
  },
  
  POST: async (req, res, gctx, lctx) => {
    const { title } = req.body;
    res.json({ todo: { id: '1', title } });
  }
};
```

---

## Type Extraction Strategy

### 1. PARAMS Type Extraction

**From route path:**
```typescript
// Route: /todos/[id]
// → Extract: { id: string }

// Route: /users/[userId]/posts/[postId]
// → Extract: { userId: string, postId: string }

// Route: /api/v[version]/todos
// → Extract: { version: string }
```

**From req.params usage:**
```typescript
const todoId = req.params.id;
// → Confirm: { id: string }

const { userId, postId } = req.params;
// → Confirm: { userId: string, postId: string }
```

### 2. QUERY Type Extraction

**From req.query usage:**
```typescript
// Pattern: Destructuring
const { completed, limit } = req.query;
// → Extract: { completed?: string, limit?: string }

// Pattern: Property access
const page = req.query.page;
// → Extract: { page?: string }

// Pattern: Type guard
if (req.query.completed === 'true') { ... }
// → Extract: { completed?: string }
```

**Note:** Query params are always `string | undefined` (URL encoding)

### 3. INPUT Type Extraction

**From req.body usage:**
```typescript
// Pattern: Destructuring
const { title, description } = req.body;
// → Extract: { title: unknown, description: unknown }

// Pattern: Property access
const title = req.body.title;
// → Extract: { title: unknown }

// Pattern: Type guard
if (typeof req.body.title === 'string') { ... }
// → Refine: { title: string }
```

**From validation code:**
```typescript
if (!req.body.title || typeof req.body.title !== 'string') {
  return res.status(400).json({ error: 'Title required' });
}
// → Extract: { title: string } (required)

if (req.body.description && typeof req.body.description === 'string') {
  // ...
}
// → Extract: { description?: string } (optional)
```

### 4. OUTPUT Type Extraction

**From res.json() calls:**
```typescript
res.json({ todo: { id: '1', title: 'Test' } });
// → Extract: { todo: { id: string, title: string } }

res.json({ todos: [] });
// → Extract: { todos: unknown[] }

res.json({ error: 'Not found' });
// → Extract: { error: string }
```

**Multiple outputs → Union type:**
```typescript
if (success) {
  res.json({ todo: { ... } });
} else {
  res.json({ error: 'Failed' });
}
// → Extract: { todo: Todo } | { error: string }
```

### 5. GCTX Type Generation

**From gati.config.js:**
```javascript
export default {
  modules: {
    storage: './modules/storage',
    db: '@gati-modules/postgres'
  },
  plugins: {
    auth: '@gati-plugins/jwt'
  }
};
```

**Generated GCTX:**
```typescript
export type GCTX = {
  modules: {
    storage: typeof import('./modules/storage');
    db: typeof import('@gati-modules/postgres');
  };
  plugins: {
    auth: typeof import('@gati-plugins/jwt');
  };
  config: AppConfig;
  logger: Logger;
};
```

### 6. LCTX Type Generation

**Standard fields:**
```typescript
export type LCTX = {
  requestId: string;
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
};
```

**Extended by middleware:**
```typescript
// If auth middleware is used
export type LCTX = {
  // ... standard fields
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
};
```

---

## Implementation Steps

### Phase 1: Type Extraction (Weeks 1-2)

**Task 1.1:** Extract PARAMS from route path
- Parse route file path
- Extract [param] segments
- Generate PARAMS type
- Validate against req.params usage

**Task 1.2:** Extract QUERY from req.query usage
- Analyze destructuring patterns
- Analyze property access
- All query params are optional strings
- Generate QUERY type

**Task 1.3:** Extract INPUT from req.body usage
- Analyze destructuring patterns
- Analyze property access
- Analyze type guards
- Generate GType schema

**Task 1.4:** Extract OUTPUT from res.json() calls
- Find all res.json() calls in handler
- Extract argument types
- Union multiple outputs
- Generate GType schema

**Task 1.5:** Extract module dependencies
- Analyze gctx.modules usage
- Identify required modules
- Track module types

### Phase 2: Context Generation (Weeks 3-4)

**Task 2.1:** Generate GCTX from config
- Read gati.config.js
- Load module types
- Load plugin types
- Generate GCTX interface

**Task 2.2:** Generate LCTX from middleware
- Analyze middleware chain
- Extract context extensions
- Generate LCTX interface

**Task 2.3:** Combine CTX types
- Merge GCTX & LCTX
- Handle conflicts
- Generate final CTX type

### Phase 3: Handler Type Generation (Weeks 5-6)

**Task 3.1:** Generate handler type files
- Create `.gati/generated/handlers/[name].types.ts`
- Export INPUT, OUTPUT, GCTX, LCTX types
- Export full Handler type

**Task 3.2:** Update handler imports
- Add type import to handler file
- Apply handler type annotation
- Validate types match usage

**Task 3.3:** Watch mode integration
- Regenerate on handler changes
- Regenerate on config changes
- Hot reload with new types

---

## Example: Complete Flow

### 1. Developer Writes Handler

```typescript
// src/handlers/todos/[id].ts
export const handler = async (req, res, gctx, lctx) => {
  const storage = gctx.modules['storage'];
  const { id } = req.params;
  const { includeCompleted } = req.query;
  
  if (req.method === 'GET') {
    const todo = storage.get(`todo:${id}`);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Filter based on query param
    if (includeCompleted === 'false' && todo.completed) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ todo });
  }
  
  if (req.method === 'PATCH') {
    const { completed } = req.body;
    const todo = storage.get(`todo:${id}`);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    todo.completed = completed;
    storage.set(`todo:${id}`, todo);
    res.json({ todo });
  }
};
```

### 2. `gati dev` Analyzes

**Extracts:**
- PARAMS: `{ id: string }` (from route path `[id]`)
- QUERY: `{ includeCompleted?: string }` (from req.query usage)
- INPUT (PATCH): `{ completed: boolean }`
- OUTPUT (GET): `{ todo: Todo } | { error: string }`
- OUTPUT (PATCH): `{ todo: Todo } | { error: string }`
- Module: `storage`

### 3. Generates Types

```typescript
// .gati/generated/handlers/todos/[id].types.ts

export type TodoIdParams = {
  id: string;
};

export type TodoIdQuery = {
  includeCompleted?: string;
};

export type TodoIdGetInput = void;
export type TodoIdGetOutput = 
  | { todo: Todo }
  | { error: string };

export type TodoIdPatchInput = {
  completed: boolean;
};
export type TodoIdPatchOutput = 
  | { todo: Todo }
  | { error: string };

export type GCTX = {
  modules: {
    storage: Storage;
  };
  config: AppConfig;
  logger: Logger;
};

export type LCTX = {
  requestId: string;
  timestamp: number;
};

export type TodoIdHandler = Handler<
  TodoIdGetInput | TodoIdPatchInput,
  TodoIdGetOutput | TodoIdPatchOutput,
  TodoIdParams,
  TodoIdQuery,
  GCTX & LCTX
>;
```

### 4. Developer Imports Type (Multiple Patterns)

**Pattern 1: Import full handler type**
```typescript
// src/handlers/todos/[id].ts
import type { TodoIdHandler } from '.gati/generated/handlers/todos/[id].types';

export const handler: TodoIdHandler = async (req, res, gctx, lctx) => {
  const { id } = req.params; // ✅ string type
  const { includeCompleted } = req.query; // ✅ string | undefined type
  const { completed } = req.body; // ✅ boolean type
};
```

**Pattern 2: Import individual types**
```typescript
// src/handlers/todos/[id].ts
import type { 
  TodoIdParams, 
  TodoIdQuery, 
  TodoIdPatchInput, 
  TodoIdPatchOutput 
} from '.gati/generated/handlers/todos/[id].types';

export const handler: Handler<
  TodoIdPatchInput,
  TodoIdPatchOutput,
  TodoIdParams,
  TodoIdQuery
> = async (req, res, gctx, lctx) => {
  // Same typing
};
```

**Pattern 3: Use fixed type names (no import)**
```typescript
// src/handlers/todos/[id].ts

// Define types inline
type INPUT = { completed: boolean };
type OUTPUT = { todo: Todo } | { error: string };
type PARAMS = { id: string };
type QUERY = { includeCompleted?: string };

export const handler: Handler<INPUT, OUTPUT, PARAMS, QUERY> = async (req, res, gctx, lctx) => {
  // Fully typed without generated imports
};
```

**Pattern 4: Pass as generics directly**
```typescript
// src/handlers/todos/[id].ts

export const handler: Handler<
  { completed: boolean },           // INPUT
  { todo: Todo } | { error: string }, // OUTPUT
  { id: string },                    // PARAMS
  { includeCompleted?: string }      // QUERY
> = async (req, res, gctx, lctx) => {
  // Inline type definitions
};
```

---

## Type Definition Patterns

### Pattern Comparison

| Pattern | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Generated types** | Auto-updated, DRY | Requires codegen | Production apps |
| **Fixed type names** | Simple, explicit | Manual updates | Small projects |
| **Inline generics** | No imports needed | Verbose | Quick prototypes |
| **Individual imports** | Flexible, reusable | More imports | Shared types |

### When to Use Each Pattern

**Use Generated Types when:**
- Building production apps
- Types change frequently
- Want automatic updates
- Team collaboration

**Use Fixed Type Names when:**
- Small projects
- Stable APIs
- Don't want codegen
- Learning Gati

**Use Inline Generics when:**
- Prototyping
- One-off handlers
- Simple types
- No shared types

**Use Individual Imports when:**
- Sharing types across handlers
- Need specific type exports
- Building SDKs
- Type composition

---

## Benefits

### 1. Zero Type Assertions
```typescript
// Before
const body = req.body as Record<string, unknown>;
const title = body.title as string;

// After
const { title } = req.body; // ✅ Already typed
```

### 2. Automatic Params/Query Types
```typescript
// Before
const id = req.params.id as string;
const limit = req.query.limit as string | undefined;

// After
const { id } = req.params; // ✅ Already typed as string
const { limit } = req.query; // ✅ Already typed as string | undefined
```

### 3. Automatic Context Types
```typescript
// Before
const storage = gctx.modules['storage'] as Storage;

// After
const storage = gctx.modules['storage']; // ✅ Already typed
```

### 4. Single Source of Truth
- Handler code defines types
- Types extracted automatically
- No manual type definitions needed

### 5. Refactoring Safety
- Change handler code
- Types regenerate automatically
- TypeScript catches mismatches

### 6. IDE Support
- Full IntelliSense
- Go to definition
- Find all references
- Rename refactoring

---

## Summary

**Vision:** Developers choose their preferred typing pattern.

**Key Innovation:** 
- **Auto-generated types** - Extracted FROM code, updated automatically
- **Fixed type names** - Simple INPUT/OUTPUT/PARAMS/QUERY convention
- **Inline generics** - Direct type definitions in handler signature
- **Individual imports** - Granular control over type usage

**Result:** 
- Zero type assertions
- Automatic type safety
- Perfect IDE support
- Developer choice

**Flexibility Examples:**

```typescript
// Beginner: Fixed names
type INPUT = { title: string };
export const handler: Handler<INPUT> = ...

// Intermediate: Inline
export const handler: Handler<{ title: string }> = ...

// Advanced: Generated
import type { TodosHandler } from '.gati/generated/...';
export const handler: TodosHandler = ...

// Expert: Individual imports + composition
import type { TodosInput, TodosOutput } from '.gati/generated/...';
import type { BaseParams } from '../types';
export const handler: Handler<TodosInput, TodosOutput, BaseParams> = ...
```

**This is the Gati way.** 🚀
