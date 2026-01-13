# Type Safety in Gati - Quick Explanation

## Why `req.body` is `unknown`

**It's intentional.** The framework cannot know at compile-time what your request body contains.

## Current Pattern (Correct)

```typescript
export const handler: Handler = async (req, res, gctx) => {
  if (req.method === 'POST') {
    // Validate body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // Minimal assertion
    const body = req.body as Record<string, unknown>;
    
    // Validate fields
    if (!body.title || typeof body.title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Now safe to use
    const title = body.title;
    const todo = { id: '1', title, completed: false };
    res.json({ todo });
  }
};
```

**This is the right approach until M3 (Timescape & Type System) is complete.**

## Future: Automatic Type Safety (M3)

```typescript
// Define schema once
export const CreateTodoSchema = {
  kind: 'object',
  properties: {
    title: { kind: 'string', minLength: 1 }
  },
  required: ['title']
} as const;

// Handler automatically typed and validated
export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
  const { title } = req.body; // ✅ Typed automatically, no 'as' needed
  const todo = { id: '1', title, completed: false };
  res.json({ todo });
};
```

## Key Points

1. **Current:** Manual validation with minimal type assertions
2. **Future:** Automatic validation and typing via GType schemas
3. **Pattern:** Validate at runtime, then use safely
4. **Goal:** Zero type assertions in handlers

## See Also

- `TYPE_SAFETY_VISION.md` - Complete explanation
- `todos.schema.ts` - Example GType schemas
- Developer Experience spec - `.kiro/specs/developer-experience/`

## Summary

**For now:** Use runtime validation with `Record<string, unknown>`  
**Soon (M3):** Define schemas, get automatic typing and validation  
**Vision:** Zero type assertions, single source of truth
