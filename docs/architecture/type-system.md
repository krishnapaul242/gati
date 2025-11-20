# Gati Type System: Branded Types & Constraint Combinators

> **Status**: Core Priority - Active Development (Planned for M2)

## Overview

Gati's type system is a **TypeScript-native approach** to runtime validation, API documentation, and version management. Unlike traditional schema libraries (Zod, Yup, class-validator), Gati uses **branded types** with **constraint combinators** to achieve **zero boilerplate** and **automatic code generation**.

## Philosophy: Single Definition → Many Artifacts

Traditional approach (Zod):
```typescript
// ❌ Duplicate definitions
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18).max(100).optional(),
});

type User = z.infer<typeof UserSchema>; // Derived from schema
```

**Problem**: Schema and type are separate, must be kept in sync manually.

---

Gati approach (Branded Types):
```typescript
// ✅ Single definition
type User = {
  email: EmailString;
  password: string & MinLen<8>;
  age?: number & Min<18> & Max<100>;
};

// ✅ Gati analyzer automatically generates:
// - Runtime validator
// - GType schema (manifest metadata)
// - OpenAPI specification
// - Client SDK types
// - Timescape diff metadata
// - Transformer suggestions
```

**Benefit**: Write once, use everywhere. No manual sync required.

## Core Concepts

### Branded Types

A **branded type** is a TypeScript primitive with metadata that Gati's analyzer can extract:

```typescript
// Brand helper (zero runtime cost)
type Brand<T extends string> = { __brand: T };

// EmailString is a string with "email" brand
type EmailString = string & Brand<"email">;

// At compile time: EmailString is just a string
const email: EmailString = "user@example.com" as EmailString;

// At analysis time: Gati extracts { "type": "string", "format": "email" }
```

**Why brands?**
- TypeScript understands them (type safety)
- Zero runtime cost (just type metadata)
- Analyzer can extract semantic meaning
- Enables automatic validator generation

### Constraint Combinators

Constraints are **intersected** with primitives using TypeScript's `&` operator:

```typescript
// String constraints
type MinLen<N extends number> = { __minLen: N };
type MaxLen<N extends number> = { __maxLen: N };
type Pattern<S extends string> = { __pattern: S };

// Number constraints
type Min<N extends number> = { __min: N };
type Max<N extends number> = { __max: N };

// Enum constraint
type Enum<T> = { __enum: T };

// Combine constraints
type Password = string & MinLen<8> & MaxLen<128>;
type Age = number & Min<0> & Max<120>;
type Username = string & Pattern<"^[a-zA-Z0-9_]+$"> & MinLen<3>;
```

**How it works**:
1. Constraints are phantom types (no runtime code)
2. TypeScript type checker enforces them at compile time
3. Analyzer extracts constraint metadata during build
4. Runtime validator uses extracted metadata

## Built-in Constraint Combinators

Located in `@gati-framework/types` (when implemented):

### String Constraints

```typescript
type MinLen<N extends number> = { __minLen: N };
type MaxLen<N extends number> = { __maxLen: N };
type Pattern<S extends string> = { __pattern: S };
type Trim = { __trim: true };
type Lowercase = { __lowercase: true };
type Uppercase = { __uppercase: true };

// Examples
type ShortString = string & MaxLen<100>;
type ValidSlug = string & Pattern<"^[a-z0-9-]+$"> & Lowercase;
type TrimmedInput = string & Trim;
```

### Number Constraints

```typescript
type Min<N extends number> = { __min: N };
type Max<N extends number> = { __max: N };
type MultipleOf<N extends number> = { __multipleOf: N };
type Positive = { __positive: true };
type Negative = { __negative: true };
type Integer = { __integer: true };

// Examples
type PositiveInt = number & Positive & Integer;
type EvenNumber = number & MultipleOf<2>;
type Percentage = number & Min<0> & Max<100>;
```

### Enum Constraints

```typescript
type Enum<T> = { __enum: T };

// Examples
type UserRole = Enum<"admin" | "user" | "guest">;
type HttpMethod = Enum<"GET" | "POST" | "PUT" | "DELETE">;
```

### Array Constraints

```typescript
type MinItems<N extends number> = { __minItems: N };
type MaxItems<N extends number> = { __maxItems: N };
type UniqueItems = { __uniqueItems: true };

// Examples
type NonEmptyArray<T> = T[] & MinItems<1>;
type TagList = string[] & MaxItems<10> & UniqueItems;
```

## Common Branded Types Library

Pre-defined types for convenience (avoid reinventing):

### Strings

```typescript
// Identity
type EmailString = string & Brand<"email">;
type URLString = string & Brand<"url">;
type PhoneString = string & Brand<"phone">;

// Security
type PasswordString = string & MinLen<8>;
type StrongPassword = string & MinLen<12> & Pattern<"^(?=.*[A-Z])(?=.*[0-9])">;
type JWTString = string & Brand<"jwt">;

// Identifiers
type UUID = string & Brand<"uuid">;
type CUID = string & Brand<"cuid">;
type ObjectId = string & Brand<"objectId">;
type SlugString = string & Pattern<"^[a-z0-9-]+$">;

// Encoding
type HexString = string & Pattern<"^[0-9a-fA-F]+$">;
type Base64String = string & Brand<"base64">;
type JSONString = string & Brand<"json">;

// User input
type UsernameString = string & Pattern<"^[a-zA-Z0-9_]+$"> & MinLen<3> & MaxLen<30>;
type NameString = string & MinLen<1> & MaxLen<100> & Trim;
```

### Numbers

```typescript
// Basic
type PositiveNumber = number & Min<0>;
type NegativeNumber = number & Max<0>;
type IntegerNumber = number & Integer;
type FloatNumber = number & Brand<"float">;

// Ranges
type Percentage = number & Min<0> & Max<100>;
type PortNumber = number & Min<1> & Max<65535> & Integer;
type HttpStatus = number & Min<100> & Max<599> & Integer;

// Business
type PriceInCents = number & Min<0> & Integer;
type QuantityNumber = number & Min<1> & Integer;
```

### Timestamps

```typescript
type TimestampString = string & Brand<"timestamp">; // ISO 8601
type DateString = string & Brand<"date">; // YYYY-MM-DD
type TimeString = string & Brand<"time">; // HH:MM:SS
type UnixTimestamp = number & Min<0> & Integer;
```

## How Gati Analyzer Extracts Types

### Process Flow

```
TypeScript Source Code
  ↓
1. AST Parsing (ts-morph)
  ↓
2. Type Extraction (TypeChecker API)
  ↓
3. Branded Type Detection
  ↓
4. Constraint Extraction
  ↓
5. GType Schema Generation (JSON Schema-like)
  ↓
6. Manifest Integration (.gati/manifests/_app.json)
  ↓
7. Validation Compilation (Optimized validators)
```

### Example Extraction

**Source code**:
```typescript
type CreateUser = {
  email: EmailString;
  password: string & MinLen<8> & MaxLen<128>;
  age?: number & Min<18> & Max<100>;
  roles: UserRole[];
};

type UserRole = Enum<"admin" | "user" | "guest">;
```

**Analyzer output (GType schema)**:
```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "maxLength": 128
    },
    "age": {
      "type": "number",
      "minimum": 18,
      "maximum": 100
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["admin", "user", "guest"]
      }
    }
  },
  "required": ["email", "password", "roles"]
}
```

**Generated validator**:
```typescript
// Auto-generated by Gati CLI
export const validateCreateUser = (value: unknown): value is CreateUser => {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  // email: EmailString
  if (typeof obj.email !== 'string') return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) return false;
  
  // password: string & MinLen<8> & MaxLen<128>
  if (typeof obj.password !== 'string') return false;
  if (obj.password.length < 8 || obj.password.length > 128) return false;
  
  // age?: number & Min<18> & Max<100>
  if (obj.age !== undefined) {
    if (typeof obj.age !== 'number') return false;
    if (obj.age < 18 || obj.age > 100) return false;
  }
  
  // roles: UserRole[]
  if (!Array.isArray(obj.roles)) return false;
  for (const role of obj.roles) {
    if (!['admin', 'user', 'guest'].includes(role as string)) return false;
  }
  
  return true;
};
```

## Handler Integration

### Automatic Validation (Future)

```typescript
// Handler with type exports
export const input = CreateUserInput;
export const output = User;

export const createUserHandler: Handler = async (req, res, gctx, lctx) => {
  // req.body is automatically validated by runtime
  // Type is correctly inferred as CreateUserInput
  const { email, password, age } = req.body;
  
  // Business logic
  const user = await gctx.modules['database']?.createUser({ email, password, age });
  
  res.json({ user }); // Output validated against User type
};
```

**What happens**:
1. Analyzer extracts `input` and `output` types
2. Generates validators in `.gati/validators/`
3. Runtime automatically validates `req.body` against input type
4. Runtime validates `res.json()` payload against output type
5. Errors are caught and returned as 400/500 responses

### Current Approach (Until Implemented)

```typescript
// Use Zod or similar for runtime validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  age: z.number().min(18).max(100).optional(),
});

export const createUserHandler: Handler = async (req, res, gctx, lctx) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    throw new HandlerError('Validation failed', 400, result.error);
  }
  
  const userData = result.data;
  // Business logic
};
```

## Timescape Integration

### Schema Diff Detection

Branded types enable automatic breaking change detection:

```typescript
// Version 1
type User = {
  name: string;
  email: EmailString;
};

// Version 2 (non-breaking: added constraint)
type User = {
  name: string & MinLen<3>; // Constraint added
  email: EmailString;
};

// Timescape analysis:
// - Constraint tightened on 'name'
// - Non-breaking for old data (optional transformer)
// - Breaking for new submissions (reject <3 chars)

// Version 3 (breaking: shape change)
type User = {
  firstName: string;  // name split into two
  lastName: string;
  email: EmailString;
};

// Timescape analysis:
// - Shape changed (name → firstName + lastName)
// - Breaking change detected
// - Auto-generate transformer stub
```

### Transformer Generation

```typescript
// Auto-generated transformer stub (AI-assisted)
export const transformV1toV3 = (v1: UserV1): UserV3 => ({
  firstName: v1.name.split(' ')[0],
  lastName: v1.name.split(' ')[1] || '',
  email: v1.email,
});
```

Timescape uses type metadata to:
- Detect field additions/removals
- Identify type changes (string → number)
- Recognize constraint modifications
- Suggest transformation logic

## What Gati Generates from Types

### Single Type Definition Produces

1. **Runtime Validator** - High-performance validation (Ajv-level)
2. **GType Schema** - Manifest metadata
3. **OpenAPI Spec** - API documentation (automatic)
4. **Client SDK Types** - TypeScript, Python, Go (future)
5. **Timescape Metadata** - Version diff analysis
6. **Transformer Hints** - AI-generated migration suggestions
7. **Playground Config** - Auto-complete and validation
8. **Test Fixtures** - Mock data generators (future)

### Example: Complete Code Generation

**Developer writes**:
```typescript
type CreateUser = {
  email: EmailString;
  password: PasswordString;
};
```

**Gati generates**:

#### Validator (`dist/validators/create-user.validator.js`)
```typescript
export const validateCreateUser = (value: unknown): value is CreateUser => {
  // Optimized validation logic
};
```

#### OpenAPI (`dist/openapi.json`)
```json
{
  "components": {
    "schemas": {
      "CreateUser": {
        "type": "object",
        "properties": {
          "email": { "type": "string", "format": "email" },
          "password": { "type": "string", "minLength": 8 }
        }
      }
    }
  }
}
```

#### TypeScript SDK (`dist/sdk/client.ts`)
```typescript
export class GatiClient {
  async createUser(data: CreateUser): Promise<User> {
    // Auto-generated API call
  }
}
```

#### Timescape Entry (`.gati/timescape/registry.json`)
```json
{
  "handlers": {
    "/users": {
      "versions": [
        {
          "schema": { /* CreateUser GType schema */ }
        }
      ]
    }
  }
}
```

#### Playground Config (`.gati/playground/schemas.json`)
```json
{
  "CreateUser": {
    "email": { "type": "email", "required": true },
    "password": { "type": "password", "minLength": 8, "required": true }
  }
}
```

## Design Principles

### ✅ DO: Use Branded Types

```typescript
// ✅ Type-safe identifiers
type UserId = string & Brand<"userId">;
type ProductId = string & Brand<"productId">;

const getUserById = (id: UserId) => { /* ... */ };

// TypeScript prevents mixing IDs
getUserById(productId); // ❌ Type error
```

### ✅ DO: Combine Constraints

```typescript
// ✅ Composable constraints
type StrongPassword = string 
  & MinLen<12> 
  & Pattern<"^(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])">;

type VerifiedEmail = EmailString & Brand<"verified">;
```

### ✅ DO: Keep Types DRY

```typescript
// ✅ Reusable base types
type BaseEntity = {
  id: UUID;
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

type User = BaseEntity & {
  email: EmailString;
  username: UsernameString;
};

type Product = BaseEntity & {
  name: string;
  price: PriceInCents;
};
```

### ❌ DON'T: Duplicate Schemas

```typescript
// ❌ Separate schema and type
const UserSchema = z.object({ email: z.string().email() });
type User = { email: string }; // Must keep in sync

// ✅ Single definition
type User = { email: EmailString };
```

### ❌ DON'T: Use 'any'

```typescript
// ❌ Defeats type extraction
type UserData = any;

// ✅ Use specific types
type UserData = {
  email: EmailString;
  name: string;
};
```

## Performance Considerations

### Zero Runtime Cost for Brands

Branded types are **compile-time only**:

```typescript
type EmailString = string & Brand<"email">;

// Compiles to plain JavaScript:
const email = "user@example.com"; // Just a string at runtime
```

### Optimized Validators

Gati compiles validators to optimized code (similar to Ajv):

```typescript
// Instead of generic schema validation:
const validate = (schema, value) => {
  for (const key in schema.properties) {
    // Generic iteration
  }
};

// Gati generates specialized validators:
export const validateUser = (value) => {
  return (
    typeof value === 'object' &&
    typeof value.email === 'string' &&
    /^[^\s@]+@/.test(value.email) &&
    typeof value.password === 'string' &&
    value.password.length >= 8
  );
};
```

**Benchmark targets** (vs Zod):
- 2-3x faster validation
- 50% smaller bundle size
- Zero schema runtime cost

### Analyzer & Validator Generation Performance Model

The type system introduces two performance-critical phases:

#### 1. Analysis Phase (Development/Build Time)

**Performance Characteristics**:

| Operation | Complexity | Target | Notes |
|-----------|-----------|--------|-------|
| Single file analysis | O(N types + AST) | < 50ms | Per handler file |
| Incremental reanalysis | O(changed + deps) | < 100ms | Small edits only |
| Full project analysis | O(all files) | Seconds | 100-1000+ files |
| Constraint extraction | O(type depth) | < 10ms | Per type |
| GType schema generation | O(fields × depth) | < 20ms | Per type |

**Optimization Strategies**:
- ✅ Use TypeScript language service incremental API
- ✅ Cache parsed ASTs and resolved types
- ✅ Perform targeted re-analysis for import-dependent files only
- ✅ Debounce file change events (500ms default)
- ✅ Serialize analyzed schemas to binary cache
- ✅ Offload heavy analysis to worker threads

**Key Performance Indicator**: Incremental analysis for single endpoint edit should complete in **30-150ms** to maintain smooth development experience.

#### 2. Validation Phase (Runtime)

**Performance Characteristics**:

| Type Shape | Fields | Target Latency | Ops/sec |
|-----------|--------|----------------|---------|
| Simple object | 3-10 | < 0.1ms | 10,000+ |
| Nested object | Depth 3-5 | 0.2-1ms | 1,000-5,000 |
| Large array | 100 items | < 10ms | 100-1,000 |
| Complex unions | 5-10 branches | 0.5-2ms | 500-2,000 |

**Optimization Strategies**:
- ✅ Compile validators to imperative code (no reflection)
- ✅ Inline common checks (type, null, bounds)
- ✅ Use SIMD-friendly algorithms for unique/dedupe
- ✅ Provide streaming/chunked validation for huge payloads
- ✅ Cache compiled validators in memory

**Comparison Baseline**: Gati validators should be **2-5× faster than Zod** for common object shapes while using 50% less memory.

#### 3. Generator Performance

**Artifact Generation Targets**:

| Artifact | Input Size | Target | Notes |
|----------|-----------|--------|-------|
| Validator code | Simple type | < 50ms | Per type |
| Validator code | Complex type | < 200ms | Deep nesting |
| TypeScript .d.ts | Simple type | < 30ms | Type definitions |
| OpenAPI schema | Simple type | < 40ms | API documentation |
| Database schema | Simple type | < 60ms | SQL DDL |

**Critical Path**: Runtime validators must be pre-compiled during build phase - **zero generation cost at request time**.

#### 4. Memory Usage

**Development (Analyzer)**:

- AST cache: ~10-50MB for 100 files
- Type registry: ~5-20MB for 100 types
- Total heap: ~100-300MB typical
- Peak: ~500MB for large monorepos

**Production (Validators)**:

- Compiled validators: ~10-100KB per type
- In-memory cache: 1-10MB for 100 validators
- Zero schema metadata in production builds

### Performance Anti-Patterns

#### ❌ DON'T: Over-Complex Types

```typescript
// ❌ Deep recursive unions slow analysis
type DeepRecursive = {
  value: string;
  nested?: DeepRecursive | DeepRecursive[] | Map<string, DeepRecursive>;
};

// ✅ Keep type depth reasonable
type SimpleTree = {
  value: string;
  children?: SimpleTree[];
};
```

#### ❌ DON'T: Massive Inline Unions

```typescript
// ❌ Hundreds of literal types slow validation
type MassiveEnum = 'val1' | 'val2' | /* ...hundreds more */ | 'val999';

// ✅ Use enum arrays or sets
const VALID_VALUES = new Set(['val1', 'val2', /* ... */]);
type ValueEnum = string & Brand<"validValue">;
```

#### ❌ DON'T: Skip Validation Caching

```typescript
// ❌ Regenerate validator every request
const validate = (data) => generateValidator(MyType)(data);

// ✅ Cache compiled validators
const validateOnce = generateValidator(MyType);
const validate = (data) => validateOnce(data);
```

### Benchmarking Validator Performance

Use micro-benchmarks to validate performance claims:

```typescript
import { bench, describe } from 'vitest';

describe('Type System Performance', () => {
  bench('validate simple user object (Gati)', () => {
    const data = { id: 'user_123', email: 'test@example.com', age: 25 };
    validateUser(data);
  });

  bench('validate simple user object (Zod)', () => {
    const data = { id: 'user_123', email: 'test@example.com', age: 25 };
    UserSchema.parse(data);
  });

  bench('validate nested order (Gati)', () => {
    const data = {
      id: 'order_456',
      user: { id: 'user_123', name: 'John' },
      items: [
        { id: 'item_1', price: 29.99, quantity: 2 },
        { id: 'item_2', price: 49.99, quantity: 1 }
      ]
    };
    validateOrder(data);
  });
});
```

**Acceptance Criteria**:
- Gati validators must be ≥2× faster than Zod for simple objects
- Gati validators must be ≥1.5× faster than Zod for nested objects
- Memory usage must be ≤50% of Zod's schema overhead

See [Benchmarking Guide](../../guides/benchmarking.md) for complete benchmark suite specification.

---

## Migration Guide

### From Zod

**Before (Zod)**:
```typescript
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18).optional(),
});

type User = z.infer<typeof UserSchema>;
```

**After (Gati Branded Types)**:
```typescript
type User = {
  email: EmailString;
  password: string & MinLen<8>;
  age?: number & Min<18>;
};

// Validator auto-generated by analyzer
```

### From class-validator

**Before (class-validator)**:
```typescript
class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @Min(18)
  @Max(100)
  age?: number;
}
```

**After (Gati Branded Types)**:
```typescript
type CreateUser = {
  email: EmailString;
  password: string & MinLen<8> & MaxLen<128>;
  age?: number & Min<18> & Max<100>;
};
```

## Implementation Checklist

- [ ] Define core branded type helper: `Brand<T>`
- [ ] Implement constraint combinators: `Min`, `Max`, `MinLen`, `MaxLen`, `Pattern`, `Enum`
- [ ] Create common branded types library: `EmailString`, `UUID`, `PasswordString`, etc.
- [ ] Build analyzer extraction: AST parsing → GType schema generation
- [ ] Implement runtime validator: Compile GType → optimized validation functions
- [ ] Integrate with Timescape: Schema diff detection, breaking change analysis
- [ ] Generate OpenAPI: GType → OpenAPI 3.0 spec
- [ ] Support handler `input`/`output` exports for automatic validation
- [ ] Add Playground integration: Type-aware request building
- [ ] Create transformer suggestion engine: Breaking changes → AI-generated stubs
- [ ] Write migration guide: Zod/Yup → Gati branded types
- [ ] Performance optimization: Ensure validator performance matches Ajv
- [ ] Documentation: Type system guide, examples, best practices

## References

- [Timescape Architecture](./timescape.md) - Version management integration
- [Manifest System](../guides/manifest-system.md) - How types are tracked
- [TypeScript Handbook: Branded Types](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [JSON Schema Specification](https://json-schema.org/) - GType schema format

---

**Implementation Status**: Planned for M2  
**Priority**: P0 (Core differentiator)  
**Dependencies**: Analyzer, codegen  
**Related Issues**: #159, #160, #161
