# GType Validation System

A powerful, type-safe runtime validation system for TypeScript applications.

## Features

- ✅ **Type-Safe**: Full TypeScript support with type inference
- ✅ **Comprehensive**: Supports primitives, objects, arrays, tuples, unions, intersections, enums, and literals
- ✅ **Extensible**: Custom validators with easy composition
- ✅ **Detailed Errors**: Structured error messages with field paths
- ✅ **Zero Dependencies**: Lightweight and self-contained
- ✅ **Property-Based Tested**: 1,100+ property test runs ensure correctness

## Installation

```bash
npm install @gati-framework/runtime
# or
pnpm add @gati-framework/runtime
```

## Quick Start

```typescript
import { object, primitive, GTypes, validate } from '@gati-framework/runtime';

// Define a schema
const userSchema = object(
  {
    id: primitive('string'),
    name: primitive('string'),
    email: GTypes.email(),
    age: primitive('number'),
  },
  { required: ['id', 'name', 'email'] }
);

// Validate data
const result = validate(
  {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  userSchema
);

if (result.valid) {
  console.log('Valid!');
} else {
  console.error('Validation errors:', result.errors);
}
```

## Schema Types

### Primitives

```typescript
import { primitive, GTypes } from '@gati-framework/runtime';

// Basic primitives
const stringSchema = primitive('string');
const numberSchema = primitive('number');
const booleanSchema = primitive('boolean');
const nullSchema = primitive('null');
const undefinedSchema = primitive('undefined');

// Helper shortcuts
const str = GTypes.string();
const num = GTypes.number();
const bool = GTypes.boolean();
```

### Objects

```typescript
import { object, primitive } from '@gati-framework/runtime';

const personSchema = object(
  {
    name: primitive('string'),
    age: primitive('number'),
    email: primitive('string'),
  },
  {
    required: ['name', 'email'], // age is optional
    additionalProperties: false, // reject extra properties
  }
);
```

### Arrays

```typescript
import { array, primitive } from '@gati-framework/runtime';

const stringArraySchema = array(primitive('string'));

const constrainedArraySchema = array(primitive('number'), {
  minItems: 1,
  maxItems: 10,
});
```

### Tuples

```typescript
import { tuple, primitive } from '@gati-framework/runtime';

const coordinateSchema = tuple([
  primitive('number'), // latitude
  primitive('number'), // longitude
]);
```

### Unions

```typescript
import { union, primitive, literal } from '@gati-framework/runtime';

const stringOrNumberSchema = union([
  primitive('string'),
  primitive('number'),
]);

// Discriminated union
const resultSchema = union([
  object({ success: literal(true), data: primitive('string') }),
  object({ success: literal(false), error: primitive('string') }),
]);
```

### Enums

```typescript
import { enumType } from '@gati-framework/runtime';

const statusSchema = enumType(['pending', 'active', 'completed']);
const prioritySchema = enumType([1, 2, 3, 4, 5]);
```

### Literals

```typescript
import { literal } from '@gati-framework/runtime';

const trueSchema = literal(true);
const versionSchema = literal('v1.0.0');
const answerSchema = literal(42);
```

## Custom Validators

### Built-in Validators

```typescript
import { GTypes } from '@gati-framework/runtime';

// String validators
const email = GTypes.email();
const url = GTypes.url();
const uuid = GTypes.uuid();
const minLength = GTypes.minLength(3);
const maxLength = GTypes.maxLength(100);
const pattern = GTypes.stringWithPattern('^[A-Z][a-z]+$');

// Number validators
const min = GTypes.min(0);
const max = GTypes.max(100);
```

### Custom Validator Functions

```typescript
import { primitive } from '@gati-framework/runtime';

const passwordSchema = primitive('string', {
  validators: [
    { type: 'minLength', value: 8 },
    {
      type: 'custom',
      fn: (value) => {
        if (typeof value !== 'string') return false;
        return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
      },
      message: 'Password must contain uppercase, lowercase, and digit',
    },
  ],
});
```

## Optional and Nullable

```typescript
import { GTypes, primitive } from '@gati-framework/runtime';

// Optional (can be undefined)
const optionalString = GTypes.optional(primitive('string'));

// Nullable (can be null)
const nullableString = GTypes.nullable(primitive('string'));

// Both optional and nullable
const optionalNullableString = GTypes.optional(
  GTypes.nullable(primitive('string'))
);
```

## Error Handling

### Validation Errors

```typescript
import { validate } from '@gati-framework/runtime';

const result = validate(invalidData, schema);

if (!result.valid) {
  result.errors.forEach((error) => {
    console.log('Path:', error.path); // ['user', 'email']
    console.log('Expected:', error.expected); // 'valid email'
    console.log('Actual:', error.actual); // 'invalid-email'
    console.log('Message:', error.message); // 'Must be a valid email'
  });
}
```

### Throwing on Validation Failure

```typescript
import { ValidationException } from '@gati-framework/runtime';

function validateOrThrow(value: unknown, schema: GType) {
  const result = validate(value, schema);
  if (!result.valid) {
    throw new ValidationException(result.errors);
  }
}

try {
  validateOrThrow(data, schema);
} catch (error) {
  if (error instanceof ValidationException) {
    console.error(error.getFormattedErrors());
  }
}
```

## Type Guards

```typescript
import { validate } from '@gati-framework/runtime';

function isValid<T>(value: unknown, schema: GType): value is T {
  return validate(value, schema).valid;
}

const data: unknown = getUserData();

if (isValid(data, userSchema)) {
  // TypeScript knows data is a valid user here
  console.log(data.name);
  console.log(data.email);
}
```

## Real-World Examples

### API Request Validation

```typescript
import { object, primitive, GTypes, validate } from '@gati-framework/runtime';

const createUserRequest = object(
  {
    name: primitive('string', {
      validators: [
        { type: 'minLength', value: 2 },
        { type: 'maxLength', value: 50 },
      ],
    }),
    email: GTypes.email(),
    password: primitive('string', {
      validators: [
        { type: 'minLength', value: 8 },
        {
          type: 'pattern',
          value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
          message: 'Password must contain uppercase, lowercase, and number',
        },
      ],
    }),
  },
  { required: ['name', 'email', 'password'] }
);

// In your handler
export const createUser: Handler = async (req, res, gctx, lctx) => {
  const result = validate(req.body, createUserRequest);
  
  if (!result.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.errors,
    });
  }
  
  // Process valid request...
};
```

### Nested Object Validation

```typescript
const orderSchema = object({
  orderId: GTypes.uuid(),
  customer: object({
    id: primitive('string'),
    name: primitive('string'),
    email: GTypes.email(),
    address: object({
      street: primitive('string'),
      city: primitive('string'),
      zipCode: primitive('string', {
        validators: [
          { type: 'pattern', value: '^\\d{5}(-\\d{4})?$' },
        ],
      }),
    }),
  }),
  items: array(
    object({
      productId: primitive('string'),
      quantity: primitive('number', {
        validators: [{ type: 'min', value: 1 }],
      }),
      price: primitive('number'),
    })
  ),
  total: primitive('number'),
});
```

### Discriminated Unions

```typescript
const apiResponse = union([
  // Success
  object({
    success: literal(true),
    data: object({
      id: primitive('string'),
      message: primitive('string'),
    }),
  }),
  // Error
  object({
    success: literal(false),
    error: object({
      code: primitive('string'),
      message: primitive('string'),
    }),
  }),
]);
```

## Performance

- **Validation**: ~0.1-1ms per validation (depending on schema complexity)
- **Schema Creation**: Negligible overhead (schemas are created once)
- **Memory**: Minimal footprint, schemas are lightweight objects

## Testing

The GType system is extensively tested with:
- 75 unit tests
- 1,100+ property-based test runs
- 100% coverage of public API

## API Reference

### Schema Builders

- `primitive(type, options?)` - Create a primitive type schema
- `literal(value, options?)` - Create a literal value schema
- `object(properties, options?)` - Create an object schema
- `array(items, options?)` - Create an array schema
- `tuple(items, options?)` - Create a tuple schema
- `union(types, options?)` - Create a union schema
- `intersection(types, options?)` - Create an intersection schema
- `enumType(values, options?)` - Create an enum schema

### Validators

- `validate(value, schema, path?)` - Validate a value against a schema

### Error Utilities

- `createValidationError(...)` - Create a validation error
- `formatValidationErrors(errors)` - Format errors for display
- `formatPath(path)` - Format a path for display
- `validResult()` - Create a successful validation result
- `invalidResult(errors)` - Create a failed validation result
- `mergeResults(...results)` - Merge multiple validation results

### Helper Functions

- `GTypes.string()` - String primitive
- `GTypes.number()` - Number primitive
- `GTypes.boolean()` - Boolean primitive
- `GTypes.optional(schema)` - Make schema optional
- `GTypes.nullable(schema)` - Make schema nullable
- `GTypes.email()` - Email validator
- `GTypes.url()` - URL validator
- `GTypes.uuid()` - UUID validator
- `GTypes.min(value)` - Minimum number validator
- `GTypes.max(value)` - Maximum number validator
- `GTypes.minLength(value)` - Minimum string length validator
- `GTypes.maxLength(value)` - Maximum string length validator

## Contributing

See the main [CONTRIBUTING.md](../../../../CONTRIBUTING.md) for guidelines.

## License

MIT
