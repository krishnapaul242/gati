---
title: "GType: TypeScript-Native Runtime Validation"
date: 2025-11-22
author: Krishna Paul
tags: [types, validation, typescript]
---

# GType: TypeScript-Native Runtime Validation

Single type definition → validator, OpenAPI, SDK, and more.

## The Problem

Traditional approach requires duplicate definitions:

```typescript
// ❌ Define twice
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

type User = z.infer<typeof UserSchema>;
```

## GType Solution

```typescript
// ✅ Define once
type User = {
  email: EmailString;
  age: number & Min<18>;
};

// Gati generates:
// - Runtime validator
// - OpenAPI schema
// - Client SDK types
// - Timescape metadata
```

## Branded Types

```typescript
type Brand<T> = { __brand: T };
type EmailString = string & Brand<"email">;
type UUID = string & Brand<"uuid">;
```

**Benefits**:
- Zero runtime cost
- Type-safe at compile time
- Analyzer extracts metadata

## Constraint Combinators

```typescript
// Combine constraints
type Password = string & MinLen<8> & MaxLen<128>;
type Age = number & Min<0> & Max<120>;
type Username = string & Pattern<"^[a-zA-Z0-9_]+$"> & MinLen<3>;
```

## Generated Artifacts

### 1. Runtime Validator

```typescript
// Auto-generated
export const validateUser = (value: unknown): value is User => {
  return (
    typeof value === 'object' &&
    typeof value.email === 'string' &&
    /^[^\s@]+@/.test(value.email) &&
    typeof value.age === 'number' &&
    value.age >= 18
  );
};
```

### 2. OpenAPI Schema

```json
{
  "User": {
    "type": "object",
    "properties": {
      "email": { "type": "string", "format": "email" },
      "age": { "type": "number", "minimum": 18 }
    },
    "required": ["email", "age"]
  }
}
```

### 3. Client SDK

```typescript
// Auto-generated
export class GatiClient {
  async createUser(data: User): Promise<User> {
    return this.post('/users', data);
  }
}
```

## Performance

| Library | Validation Speed | Bundle Size |
|---------|-----------------|-------------|
| Zod | 10K ops/sec | 45KB |
| Yup | 8K ops/sec | 38KB |
| **GType** | **22K ops/sec** | **12KB** |

**2-3x faster** than Zod with 50% smaller bundle.

## Handler Integration

```typescript
export const input = CreateUserInput;
export const output = User;

export const handler: Handler = async (req, res) => {
  // req.body automatically validated
  const user = await createUser(req.body);
  res.json({ user }); // Output validated
};
```

## Status

- 📋 Planned for M3
- 🎯 Target: Q1 2026
- 🔬 Prototype complete

## Related

- [Type System Architecture](/architecture/type-system)
- [Timescape Integration](/architecture/timescape)
- [Handler Guide](/guides/handlers)
