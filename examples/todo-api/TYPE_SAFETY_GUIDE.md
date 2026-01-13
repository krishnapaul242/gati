# Type Safety in Gati Handlers

## Why `req.body` is `unknown`

Gati intentionally types `req.body` as `unknown` for safety. The framework cannot know at compile-time what shape your request body will have.

This is a **feature, not a bug** - it forces you to validate incoming data.

---

## The Problem

```typescript
// ❌ This gives a TypeScript error
const { title } = req.body;
// Error: Property 'title' does not exist on type 'unknown'
```

---

## Solutions

### Solution 1: Type Assertion + Validation (Recommended)

```typescript
export const handler: Handler = async (req, res, gctx) => {
  if (req.method === 'POST') {
    // Assert the expected shape
    const body = req.body as { title?: string };
    
    // Validate at runtime
    if (!body.title || typeof body.title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Now TypeScript knows title is a string
    const title = body.title;
    
    // Use it safely
    const todo = { id: '1', title, completed: false };
    res.json({ todo });
  }
};
```

### Solution 2: Type Guard Function

```typescript
interface CreateTodoBody {
  title: string;
  description?: string;
}

function isCreateTodoBody(body: unknown): body is CreateTodoBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'title' in body &&
    typeof (body as any).title === 'string'
  );
}

export const handler: Handler = async (req, res, gctx) => {
  if (req.method === 'POST') {
    if (!isCreateTodoBody(req.body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // TypeScript knows req.body is CreateTodoBody
    const { title, description } = req.body;
    
    const todo = { id: '1', title, description, completed: false };
    res.json({ todo });
  }
};
```

### Solution 3: Validation Library (Best for Production)

```typescript
import { z } from 'zod';

const CreateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional()
});

export const handler: Handler = async (req, res, gctx) => {
  if (req.method === 'POST') {
    const result = CreateTodoSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: result.error.errors
      });
    }
    
    // TypeScript knows the exact shape
    const { title, description } = result.data;
    
    const todo = { id: '1', title, description, completed: false };
    res.json({ todo });
  }
};
```

---

## Best Practices

### ✅ DO: Always Validate

```typescript
// Good - validate before using
const body = req.body as { title?: string };
if (!body.title || typeof body.title !== 'string') {
  return res.status(400).json({ error: 'Invalid title' });
}
const title = body.title; // Safe to use
```

### ❌ DON'T: Blind Type Assertion

```typescript
// Bad - no validation
const { title } = req.body as { title: string };
// What if title is undefined or not a string?
```

### ✅ DO: Use Type Guards

```typescript
// Good - reusable validation
function isValidTodo(body: unknown): body is { title: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'title' in body &&
    typeof (body as any).title === 'string'
  );
}
```

### ✅ DO: Provide Clear Error Messages

```typescript
// Good - helpful errors
if (!body.title) {
  return res.status(400).json({ 
    error: 'Title is required',
    field: 'title'
  });
}

if (typeof body.title !== 'string') {
  return res.status(400).json({ 
    error: 'Title must be a string',
    field: 'title',
    received: typeof body.title
  });
}
```

---

## Why This Design?

### Type Safety at Runtime

```typescript
// Without validation, this could crash:
const { title } = req.body; // What if body is null?
const upperTitle = title.toUpperCase(); // Runtime error!

// With validation, you catch errors early:
const body = req.body as { title?: string };
if (!body.title) {
  return res.status(400).json({ error: 'Title required' });
}
const upperTitle = body.title.toUpperCase(); // Safe!
```

### Security

```typescript
// Prevents injection attacks
const body = req.body as { title?: string };

// Validate type
if (typeof body.title !== 'string') {
  return res.status(400).json({ error: 'Invalid type' });
}

// Validate length
if (body.title.length > 100) {
  return res.status(400).json({ error: 'Title too long' });
}

// Sanitize
const title = body.title.trim();
```

---

## Future: Gati Contracts (M3)

In Milestone 3, Gati will support automatic validation:

```typescript
import { defineContract } from '@gati-framework/contracts';

const TodoContract = defineContract({
  request: {
    body: {
      title: 'string',
      completed: 'boolean?'
    }
  },
  response: {
    todo: {
      id: 'string',
      title: 'string',
      completed: 'boolean'
    }
  }
});

// Handler automatically validates and types
export const handler: Handler<typeof TodoContract> = async (req, res) => {
  // req.body is automatically typed and validated!
  const { title } = req.body; // TypeScript knows this is a string
  
  const todo = { id: '1', title, completed: false };
  res.json({ todo }); // Response is also type-checked!
};
```

---

## Summary

1. **`req.body` is `unknown`** - This is intentional for safety
2. **Always validate** - Use type assertions + runtime checks
3. **Use type guards** - For reusable validation logic
4. **Consider validation libraries** - Zod, Yup, etc. for production
5. **Provide clear errors** - Help API consumers understand issues

**The pattern:**
```typescript
const body = req.body as ExpectedType;
if (!isValid(body)) {
  return res.status(400).json({ error: 'Validation failed' });
}
// Now safe to use body
```
