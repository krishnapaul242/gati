# Gati Type Safety - Vision vs Current State

## The Vision: Zero Type Assertions

Gati's goal is **automatic type safety** without manual type assertions. You should never write `as` in your handlers.

### How It Should Work (M3 - Timescape & Type System)

```typescript
// Define schema once
export const CreateTodoSchema = {
  kind: 'object',
  properties: {
    title: { kind: 'string', minLength: 1, maxLength: 100 },
    description: { kind: 'string', nullable: true }
  },
  required: ['title']
} as const;

// Handler automatically typed and validated
export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
  // req.body is automatically typed as { title: string; description?: string }
  const { title, description } = req.body; // ✅ Type-safe, no 'as' needed
  
  // Validation happens automatically before handler runs
  // If validation fails, 400 error returned automatically
  
  const todo = { id: '1', title, description };
  res.json({ todo });
};
```

---

## Current State: Manual Validation Required

Right now, `req.body` is `unknown` and requires runtime validation.

### Current Approach (Correct for Now)

```typescript
export const handler: Handler = async (req, res, gctx) => {
  if (req.method === 'POST') {
    // Step 1: Check body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // Step 2: Access as Record (minimal assertion)
    const body = req.body as Record<string, unknown>;
    
    // Step 3: Validate each field at runtime
    const title = body.title;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Step 4: Now safe to use
    const todo = { id: '1', title, completed: false };
    res.json({ todo });
  }
};
```

**Why this pattern?**
- ✅ Runtime safety - validates untrusted input
- ✅ Minimal type assertions - only `Record<string, unknown>`
- ✅ Explicit validation - clear what's being checked
- ✅ Good error messages - tells user what's wrong

---

## The Problem with Current Approach

### ❌ Repetitive Validation
```typescript
// Every handler needs this boilerplate
if (!req.body || typeof req.body !== 'object') { ... }
const body = req.body as Record<string, unknown>;
if (!body.title || typeof body.title !== 'string') { ... }
```

### ❌ No Type Inference
```typescript
// TypeScript doesn't know title is a string after validation
const title = body.title; // still unknown
if (typeof title !== 'string') return error;
// Now title is string, but only in this scope
```

### ❌ Validation Drift
```typescript
// Schema in your head doesn't match code
// Easy to forget to validate a field
// No single source of truth
```

---

## The Solution: GType Schemas (M3)

### 1. Define Schema Once

```typescript
// src/handlers/todos.schema.ts
import type { GObjectType } from '@gati-framework/contracts';

export const CreateTodoSchema: GObjectType = {
  kind: 'object',
  properties: {
    title: {
      kind: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Todo title'
    },
    description: {
      kind: 'string',
      maxLength: 500,
      nullable: true
    }
  },
  required: ['title']
};
```

### 2. Handler Automatically Typed

```typescript
// src/handlers/todos.ts
import { CreateTodoSchema } from './todos.schema';

// Handler<Schema> provides automatic typing
export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
  // req.body is typed as:
  // { title: string; description?: string }
  
  const { title, description } = req.body; // ✅ No 'as' needed!
  
  // Validation already happened before handler runs
  // If validation failed, 400 error already sent
  
  const todo = { id: '1', title, description, completed: false };
  res.json({ todo });
};
```

### 3. Automatic Validation

```typescript
// Framework does this automatically:
// 1. Parse request body
// 2. Validate against schema
// 3. If invalid, return 400 with details
// 4. If valid, call handler with typed body
```

---

## How GType Works

### Type Extraction (Compile Time)

```typescript
// Your TypeScript types
interface CreateTodoRequest {
  title: string;
  description?: string;
}

// Analyzer extracts to GType schema
const schema = {
  kind: 'object',
  properties: {
    title: { kind: 'string' },
    description: { kind: 'string', nullable: true }
  },
  required: ['title']
};
```

### Validation (Runtime)

```typescript
// Generated validator function
function validateCreateTodo(data: unknown): data is CreateTodoRequest {
  if (typeof data !== 'object' || data === null) return false;
  if (!('title' in data)) return false;
  if (typeof data.title !== 'string') return false;
  if ('description' in data && typeof data.description !== 'string') return false;
  return true;
}
```

### Type Inference (Compile Time)

```typescript
// TypeScript infers from schema
type Inferred = InferGType<typeof CreateTodoSchema>;
// Result: { title: string; description?: string }
```

---

## Migration Path

### Phase 1: Current (Manual Validation)
```typescript
const body = req.body as Record<string, unknown>;
if (!body.title || typeof body.title !== 'string') {
  return res.status(400).json({ error: 'Title required' });
}
```

### Phase 2: Schema Definition (M3 Start)
```typescript
// Define schema
export const CreateTodoSchema = { ... };

// Still manual validation, but schema documented
const body = req.body as Record<string, unknown>;
// TODO: Use schema for validation
```

### Phase 3: Automatic Validation (M3 Complete)
```typescript
// Handler automatically typed and validated
export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
  const { title } = req.body; // ✅ Fully typed, no 'as'
};
```

---

## Why Not Use Zod/Yup Now?

You could use validation libraries today:

```typescript
import { z } from 'zod';

const CreateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional()
});

export const handler: Handler = async (req, res) => {
  const result = CreateTodoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  const { title, description } = result.data; // ✅ Typed
};
```

**But Gati's GType is better because:**
1. **Single source of truth** - Schema used for validation, OpenAPI, SDK generation
2. **Framework integration** - Automatic validation before handler runs
3. **Timescape support** - Schema versioning and diffing built-in
4. **Multi-language** - Same schema works for TypeScript, Python, Go clients
5. **Minimal runtime** - Optimized validators, no heavy dependencies

---

## Current Best Practice

Until M3 is complete, use this pattern:

```typescript
export const handler: Handler = async (req, res, gctx) => {
  if (req.method === 'POST') {
    // 1. Validate body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // 2. Minimal assertion
    const body = req.body as Record<string, unknown>;
    
    // 3. Validate each field
    const title = body.title;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (title.length > 100) {
      return res.status(400).json({ error: 'Title too long' });
    }
    
    // 4. Use safely
    const todo = { id: Date.now().toString(), title, completed: false };
    storage.set(`todo:${todo.id}`, todo);
    res.status(201).json({ todo });
  }
};
```

**Key points:**
- ✅ Only one `as` - `Record<string, unknown>`
- ✅ Explicit validation for each field
- ✅ Clear error messages
- ✅ Type-safe after validation
- ✅ Ready to migrate to GType schemas

---

## Summary

**Current State:**
- `req.body` is `unknown` (intentional)
- Manual validation required
- Minimal type assertions (`Record<string, unknown>`)
- Explicit runtime checks

**Vision (M3):**
- Define GType schema once
- Automatic validation
- Automatic typing
- Zero type assertions
- Single source of truth

**For Now:**
- Use the pattern shown above
- Document schemas separately (see `todos.schema.ts`)
- Prepare for easy migration to GType

**The Goal:**
```typescript
// This is where we're going - no 'as', no manual validation
export const handler: Handler<typeof Schema> = async (req, res) => {
  const { title } = req.body; // ✅ Just works
};
```
