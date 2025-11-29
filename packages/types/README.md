# @gati-framework/types

> TypeScript-first branded types and runtime validation system

[![npm version](https://img.shields.io/npm/v/@gati-framework/types.svg)](https://www.npmjs.com/package/@gati-framework/types)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

GType system providing branded types, constraint combinators, and runtime validation for type-safe APIs.

## Installation

```bash
npm install @gati-framework/types
```

## Quick Start

```typescript
import { GType, Email, PositiveInt } from '@gati-framework/types';

// Define branded types
type UserId = PositiveInt<'UserId'>;
type UserEmail = Email<'UserEmail'>;

// Runtime validation
const userId = GType.validate<UserId>(123); // ✓
const email = GType.validate<UserEmail>('user@example.com'); // ✓
```

## Features

- ✅ **Branded Types** - Nominal typing for TypeScript
- ✅ **Constraint Combinators** - Compose type constraints
- ✅ **Runtime Validation** - Type-safe validation
- ✅ **Type Registry** - Global type definitions
- ✅ **Schema Generation** - OpenAPI/JSON Schema
- 🚧 **SDK Generation** - Auto-generated clients (M5)

## Branded Types

Prevent type confusion with nominal typing.

```typescript
import { Brand } from '@gati-framework/types';

// Define branded types
type UserId = Brand<number, 'UserId'>;
type ProductId = Brand<number, 'ProductId'>;

// Type-safe functions
function getUser(id: UserId) { /* ... */ }
function getProduct(id: ProductId) { /* ... */ }

const userId = 123 as UserId;
const productId = 456 as ProductId;

getUser(userId);        // ✓
getUser(productId);     // ✗ Type error
```

### Built-in Branded Types

```typescript
import { 
  Email, 
  URL, 
  UUID, 
  PositiveInt, 
  NonEmptyString 
} from '@gati-framework/types';

type UserEmail = Email<'UserEmail'>;
type ProfileURL = URL<'ProfileURL'>;
type SessionId = UUID<'SessionId'>;
type Age = PositiveInt<'Age'>;
type Username = NonEmptyString<'Username'>;
```

## Constraint Combinators

Compose type constraints.

```typescript
import { GType } from '@gati-framework/types';

// String constraints
const Username = GType.string()
  .minLength(3)
  .maxLength(20)
  .pattern(/^[a-zA-Z0-9_]+$/);

// Number constraints
const Age = GType.number()
  .min(0)
  .max(120)
  .integer();

// Object constraints
const User = GType.object({
  id: GType.number().positive(),
  username: Username,
  age: Age,
  email: GType.string().email()
});
```

### Validation

```typescript
// Validate at runtime
const result = User.validate({
  id: 123,
  username: 'john_doe',
  age: 25,
  email: 'john@example.com'
});

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.error('Invalid:', result.errors);
}
```

## Type Registry

Global type definitions for reuse.

```typescript
import { TypeRegistry } from '@gati-framework/types';

const registry = new TypeRegistry();

// Register types
registry.register('UserId', GType.number().positive());
registry.register('Email', GType.string().email());

// Use registered types
const User = GType.object({
  id: registry.get('UserId'),
  email: registry.get('Email')
});
```

## Schema Generation

Generate OpenAPI/JSON Schema.

```typescript
import { generateSchema } from '@gati-framework/types';

const User = GType.object({
  id: GType.number(),
  name: GType.string(),
  email: GType.string().email()
});

const schema = generateSchema(User);
```

**Output**:
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["id", "name", "email"]
}
```

## Handler Integration

Use GType in handlers for validation.

```typescript
import type { Handler } from '@gati-framework/runtime';
import { GType } from '@gati-framework/types';

const CreateUserInput = GType.object({
  name: GType.string().minLength(1),
  email: GType.string().email(),
  age: GType.number().min(0).max(120)
});

export const handler: Handler = async (req, res) => {
  const result = CreateUserInput.validate(req.body);
  
  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }
  
  const user = await createUser(result.data);
  res.status(201).json({ user });
};
```

## Advanced Types

### Union Types

```typescript
const Status = GType.union([
  GType.literal('active'),
  GType.literal('inactive'),
  GType.literal('pending')
]);

type Status = GType.Infer<typeof Status>;
// 'active' | 'inactive' | 'pending'
```

### Array Types

```typescript
const Tags = GType.array(GType.string().minLength(1));

const result = Tags.validate(['typescript', 'gati']);
```

### Optional Types

```typescript
const User = GType.object({
  id: GType.number(),
  name: GType.string(),
  bio: GType.string().optional()
});
```

### Nullable Types

```typescript
const User = GType.object({
  id: GType.number(),
  deletedAt: GType.string().nullable()
});
```

## Type Inference

Infer TypeScript types from GType schemas.

```typescript
const User = GType.object({
  id: GType.number(),
  name: GType.string(),
  email: GType.string().email()
});

type User = GType.Infer<typeof User>;
// { id: number; name: string; email: string; }
```

## Custom Validators

Create custom validation logic.

```typescript
const Password = GType.string()
  .minLength(8)
  .custom((value) => {
    if (!/[A-Z]/.test(value)) {
      return 'Must contain uppercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Must contain number';
    }
    return true;
  });
```

## Error Messages

Customize error messages.

```typescript
const Age = GType.number()
  .min(0, 'Age must be positive')
  .max(120, 'Age must be less than 120');

const result = Age.validate(-5);
// { success: false, errors: ['Age must be positive'] }
```

## Transformation

Transform values during validation.

```typescript
const Email = GType.string()
  .email()
  .transform((value) => value.toLowerCase().trim());

const result = Email.validate('  USER@EXAMPLE.COM  ');
// { success: true, data: 'user@example.com' }
```

## Examples

### User Registration

```typescript
const RegisterInput = GType.object({
  username: GType.string()
    .minLength(3)
    .maxLength(20)
    .pattern(/^[a-zA-Z0-9_]+$/),
  email: GType.string().email(),
  password: GType.string()
    .minLength(8)
    .custom((v) => /[A-Z]/.test(v) || 'Need uppercase'),
  age: GType.number().min(13).max(120).optional()
});

export const handler: Handler = async (req, res) => {
  const result = RegisterInput.validate(req.body);
  
  if (!result.success) {
    return res.status(400).json({ errors: result.errors });
  }
  
  const user = await createUser(result.data);
  res.status(201).json({ user });
};
```

### Product API

```typescript
const Product = GType.object({
  id: GType.number().positive(),
  name: GType.string().minLength(1),
  price: GType.number().min(0),
  tags: GType.array(GType.string()),
  inStock: GType.boolean()
});

type Product = GType.Infer<typeof Product>;
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:watch
```

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/core](../core) - Core types
- [@gati-framework/contracts](../contracts) - Module contracts

## Documentation

- [Type System Guide](https://krishnapaul242.github.io/gati/architecture/type-system)
- [GType Deep Dive](https://krishnapaul242.github.io/gati/blog/gtype-type-system)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
