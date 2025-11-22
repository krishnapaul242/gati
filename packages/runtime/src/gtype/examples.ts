/**
 * @module runtime/gtype/examples
 * @description Usage examples for the GType validation system
 */

import {
  primitive,
  object,
  array,
  union,
  literal,
  enumType,
  GTypes,
  validate,
  type GType,
} from './index.js';

/**
 * Example 1: Simple User Schema
 * 
 * Validates a basic user object with required fields
 */
export const userSchema = object(
  {
    id: primitive('string'),
    name: primitive('string'),
    email: GTypes.email(),
    age: primitive('number'),
  },
  { required: ['id', 'name', 'email'] }
);

// Usage:
const validUser = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
};

const invalidUser = {
  id: '123',
  name: 'John Doe',
  email: 'invalid-email', // Invalid email format
};

// Validate
const result1 = validate(validUser, userSchema);
console.log('Valid user:', result1.valid); // true

const result2 = validate(invalidUser, userSchema);
console.log('Invalid user:', result2.valid); // false
console.log('Errors:', result2.errors);

/**
 * Example 2: Product Schema with Constraints
 * 
 * Demonstrates custom validators and constraints
 */
export const productSchema = object(
  {
    id: GTypes.uuid(),
    name: primitive('string', {
      validators: [
        { type: 'minLength', value: 3, message: 'Name must be at least 3 characters' },
        { type: 'maxLength', value: 100, message: 'Name must be at most 100 characters' },
      ],
    }),
    price: primitive('number', {
      validators: [
        { type: 'min', value: 0, message: 'Price must be positive' },
      ],
    }),
    category: enumType(['electronics', 'clothing', 'food', 'books']),
    tags: array(primitive('string')),
    inStock: primitive('boolean'),
  },
  { required: ['id', 'name', 'price', 'category'] }
);

/**
 * Example 3: API Response Schema with Union Types
 * 
 * Demonstrates union types for success/error responses
 */
export const apiResponseSchema = union([
  // Success response
  object({
    success: literal(true),
    data: object({
      id: primitive('string'),
      message: primitive('string'),
    }),
  }),
  // Error response
  object({
    success: literal(false),
    error: object({
      code: primitive('string'),
      message: primitive('string'),
      details: GTypes.optional(array(primitive('string'))),
    }),
  }),
]);

/**
 * Example 4: Nested Object Schema
 * 
 * Demonstrates nested objects and optional fields
 */
export const orderSchema = object({
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
          { type: 'pattern', value: '^\\d{5}(-\\d{4})?$', message: 'Invalid ZIP code' },
        ],
      }),
      country: primitive('string'),
    }),
  }),
  items: array(
    object({
      productId: primitive('string'),
      quantity: primitive('number', {
        validators: [
          { type: 'min', value: 1, message: 'Quantity must be at least 1' },
        ],
      }),
      price: primitive('number'),
    })
  ),
  total: primitive('number'),
  status: enumType(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  createdAt: primitive('string'), // ISO date string
  updatedAt: GTypes.optional(primitive('string')),
});

/**
 * Example 5: Handler Request/Response Schemas
 * 
 * Demonstrates how to use GType for handler validation
 */

// Create User Request
export const createUserRequestSchema = object(
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
        { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
        {
          type: 'pattern',
          value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
          message: 'Password must contain uppercase, lowercase, and number',
        },
      ],
    }),
    age: GTypes.optional(
      primitive('number', {
        validators: [
          { type: 'min', value: 18 },
          { type: 'max', value: 120 },
        ],
      })
    ),
  },
  { required: ['name', 'email', 'password'] }
);

// Create User Response
export const createUserResponseSchema = object({
  id: GTypes.uuid(),
  name: primitive('string'),
  email: GTypes.email(),
  createdAt: primitive('string'),
});

/**
 * Example 6: Custom Validator
 * 
 * Demonstrates custom validation logic
 */
export const passwordSchema = primitive('string', {
  validators: [
    { type: 'minLength', value: 8 },
    {
      type: 'custom',
      fn: (value) => {
        if (typeof value !== 'string') return false;
        // Check for at least one uppercase, one lowercase, one digit, one special char
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasDigit = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        return hasUpper && hasLower && hasDigit && hasSpecial;
      },
      message: 'Password must contain uppercase, lowercase, digit, and special character',
    },
  ],
});

/**
 * Example 7: Array with Constraints
 * 
 * Demonstrates array validation with min/max items
 */
export const tagListSchema = array(
  primitive('string', {
    validators: [
      { type: 'minLength', value: 2 },
      { type: 'maxLength', value: 20 },
      { type: 'pattern', value: '^[a-z0-9-]+$', message: 'Tags must be lowercase alphanumeric with hyphens' },
    ],
  }),
  {
    minItems: 1,
    maxItems: 10,
  }
);

/**
 * Example 8: Discriminated Union (Type-safe API)
 * 
 * Demonstrates discriminated unions for type-safe APIs
 */
export const eventSchema = union([
  object({
    type: literal('user.created'),
    data: object({
      userId: primitive('string'),
      email: GTypes.email(),
    }),
  }),
  object({
    type: literal('user.updated'),
    data: object({
      userId: primitive('string'),
      changes: array(primitive('string')),
    }),
  }),
  object({
    type: literal('user.deleted'),
    data: object({
      userId: primitive('string'),
      deletedAt: primitive('string'),
    }),
  }),
]);

/**
 * Example 9: Pagination Schema
 * 
 * Common pagination pattern
 */
export const paginationSchema = object({
  page: primitive('number', {
    validators: [{ type: 'min', value: 1 }],
  }),
  pageSize: primitive('number', {
    validators: [
      { type: 'min', value: 1 },
      { type: 'max', value: 100 },
    ],
  }),
  total: primitive('number'),
  totalPages: primitive('number'),
});

export const paginatedResponseSchema = <T extends GType>(itemSchema: T) =>
  object({
    items: array(itemSchema),
    pagination: paginationSchema,
  });

/**
 * Example 10: Optional and Nullable Fields
 * 
 * Demonstrates the difference between optional and nullable
 */
export const profileSchema = object({
  // Required field
  username: primitive('string'),
  
  // Optional field (can be undefined, but not null)
  bio: GTypes.optional(primitive('string')),
  
  // Nullable field (can be null, but not undefined)
  avatar: GTypes.nullable(primitive('string')),
  
  // Optional and nullable (can be undefined or null)
  website: GTypes.optional(GTypes.nullable(GTypes.url())),
});

/**
 * Helper function to validate and throw on error
 */
export function validateOrThrow<T>(value: unknown, schema: GType, name = 'value'): asserts value is T {
  const result = validate(value, schema);
  if (!result.valid) {
    const errors = result.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Validation failed for ${name}:\n${errors}`);
  }
}

/**
 * Helper function to validate with type guard
 */
export function isValid<T>(value: unknown, schema: GType): value is T {
  return validate(value, schema).valid;
}

/**
 * Example usage in a handler
 */
export function exampleHandlerUsage() {
  // In a handler, you would validate request body:
  const requestBody = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
  };
  
  try {
    validateOrThrow(requestBody, createUserRequestSchema, 'request body');
    
    // If we get here, requestBody is valid
    console.log('Request is valid:', requestBody);
    
    // Process the request...
    const response = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: requestBody.name,
      email: requestBody.email,
      createdAt: new Date().toISOString(),
    };
    
    // Validate response before sending
    validateOrThrow(response, createUserResponseSchema, 'response');
    
    return response;
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}

/**
 * Example: Type-safe validation with type guards
 */
export function exampleTypeGuard() {
  const data: unknown = {
    id: '123',
    name: 'John',
    email: 'john@example.com',
  };
  
  interface User {
    id: string;
    name: string;
    email: string;
    age?: number;
  }
  
  if (isValid<User>(data, userSchema)) {
    // TypeScript knows data is a valid user here
    console.log('User name:', data.name);
    console.log('User email:', data.email);
  } else {
    
  }
}
