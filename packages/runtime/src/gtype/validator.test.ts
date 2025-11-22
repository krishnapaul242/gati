/**
 * @module runtime/gtype/validator.test
 * @description Tests for GType validator
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validate } from './validator.js';
import {
  primitive,
  literal,
  object,
  array,
  tuple,
  union,
  intersection,
  enumType,
  GTypes,
} from './schema.js';
import type { GType } from './schema.js';

describe('GType Validator', () => {
  describe('primitive validation', () => {
    it('should validate string primitives', () => {
      const schema = primitive('string');
      
      expect(validate('hello', schema).valid).toBe(true);
      expect(validate(123, schema).valid).toBe(false);
      expect(validate(true, schema).valid).toBe(false);
      expect(validate(null, schema).valid).toBe(false);
      expect(validate(undefined, schema).valid).toBe(false);
    });
    
    it('should validate number primitives', () => {
      const schema = primitive('number');
      
      expect(validate(123, schema).valid).toBe(true);
      expect(validate(3.14, schema).valid).toBe(true);
      expect(validate('hello', schema).valid).toBe(false);
      expect(validate(true, schema).valid).toBe(false);
    });
    
    it('should validate boolean primitives', () => {
      const schema = primitive('boolean');
      
      expect(validate(true, schema).valid).toBe(true);
      expect(validate(false, schema).valid).toBe(true);
      expect(validate('true', schema).valid).toBe(false);
      expect(validate(1, schema).valid).toBe(false);
    });
    
    it('should validate null primitives', () => {
      const schema = primitive('null');
      
      expect(validate(null, schema).valid).toBe(true);
      expect(validate(undefined, schema).valid).toBe(false);
      expect(validate('null', schema).valid).toBe(false);
    });
    
    it('should validate undefined primitives', () => {
      const schema = primitive('undefined');
      
      expect(validate(undefined, schema).valid).toBe(true);
      expect(validate(null, schema).valid).toBe(false);
      expect(validate('undefined', schema).valid).toBe(false);
    });
  });
  
  describe('optional and nullable', () => {
    it('should allow undefined for optional fields', () => {
      const schema = primitive('string', { optional: true });
      
      expect(validate(undefined, schema).valid).toBe(true);
      expect(validate('hello', schema).valid).toBe(true);
      expect(validate(null, schema).valid).toBe(false);
    });
    
    it('should allow null for nullable fields', () => {
      const schema = primitive('string', { nullable: true });
      
      expect(validate(null, schema).valid).toBe(true);
      expect(validate('hello', schema).valid).toBe(true);
      expect(validate(undefined, schema).valid).toBe(false);
    });
    
    it('should allow both null and undefined for optional nullable fields', () => {
      const schema = primitive('string', { optional: true, nullable: true });
      
      expect(validate(undefined, schema).valid).toBe(true);
      expect(validate(null, schema).valid).toBe(true);
      expect(validate('hello', schema).valid).toBe(true);
    });
  });
  
  describe('literal validation', () => {
    it('should validate string literals', () => {
      const schema = literal('hello');
      
      expect(validate('hello', schema).valid).toBe(true);
      expect(validate('world', schema).valid).toBe(false);
      expect(validate(123, schema).valid).toBe(false);
    });
    
    it('should validate number literals', () => {
      const schema = literal(42);
      
      expect(validate(42, schema).valid).toBe(true);
      expect(validate(43, schema).valid).toBe(false);
      expect(validate('42', schema).valid).toBe(false);
    });
    
    it('should validate boolean literals', () => {
      const schema = literal(true);
      
      expect(validate(true, schema).valid).toBe(true);
      expect(validate(false, schema).valid).toBe(false);
      expect(validate('true', schema).valid).toBe(false);
    });
  });
  
  describe('object validation', () => {
    it('should validate simple objects', () => {
      const schema = object({
        name: primitive('string'),
        age: primitive('number'),
      });
      
      expect(validate({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validate({ name: 'John', age: '30' }, schema).valid).toBe(false);
      expect(validate({ name: 'John' }, schema).valid).toBe(true); // age is optional
      expect(validate('not an object', schema).valid).toBe(false);
    });
    
    it('should validate required fields', () => {
      const schema = object(
        {
          name: primitive('string'),
          age: primitive('number'),
        },
        { required: ['name'] }
      );
      
      expect(validate({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validate({ name: 'John' }, schema).valid).toBe(true);
      expect(validate({ age: 30 }, schema).valid).toBe(false);
      expect(validate({}, schema).valid).toBe(false);
    });
    
    it('should reject additional properties when additionalProperties is false', () => {
      const schema = object(
        {
          name: primitive('string'),
        },
        { additionalProperties: false }
      );
      
      expect(validate({ name: 'John' }, schema).valid).toBe(true);
      expect(validate({ name: 'John', age: 30 }, schema).valid).toBe(false);
    });
    
    it('should validate additional properties against schema', () => {
      const schema = object(
        {
          name: primitive('string'),
        },
        { additionalProperties: primitive('number') }
      );
      
      expect(validate({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validate({ name: 'John', age: '30' }, schema).valid).toBe(false);
    });
    
    it('should validate nested objects', () => {
      const schema = object({
        user: object({
          name: primitive('string'),
          email: primitive('string'),
        }),
      });
      
      expect(
        validate(
          { user: { name: 'John', email: 'john@example.com' } },
          schema
        ).valid
      ).toBe(true);
      
      expect(
        validate(
          { user: { name: 'John', email: 123 } },
          schema
        ).valid
      ).toBe(false);
    });
  });
  
  describe('array validation', () => {
    it('should validate arrays', () => {
      const schema = array(primitive('string'));
      
      expect(validate(['a', 'b', 'c'], schema).valid).toBe(true);
      expect(validate([1, 2, 3], schema).valid).toBe(false);
      expect(validate(['a', 1, 'c'], schema).valid).toBe(false);
      expect(validate('not an array', schema).valid).toBe(false);
    });
    
    it('should validate empty arrays', () => {
      const schema = array(primitive('string'));
      
      expect(validate([], schema).valid).toBe(true);
    });
    
    it('should validate minItems constraint', () => {
      const schema = array(primitive('string'), { minItems: 2 });
      
      expect(validate(['a', 'b'], schema).valid).toBe(true);
      expect(validate(['a', 'b', 'c'], schema).valid).toBe(true);
      expect(validate(['a'], schema).valid).toBe(false);
      expect(validate([], schema).valid).toBe(false);
    });
    
    it('should validate maxItems constraint', () => {
      const schema = array(primitive('string'), { maxItems: 2 });
      
      expect(validate(['a'], schema).valid).toBe(true);
      expect(validate(['a', 'b'], schema).valid).toBe(true);
      expect(validate(['a', 'b', 'c'], schema).valid).toBe(false);
    });
    
    it('should validate arrays of objects', () => {
      const schema = array(
        object({
          id: primitive('number'),
          name: primitive('string'),
        })
      );
      
      expect(
        validate(
          [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ],
          schema
        ).valid
      ).toBe(true);
      
      expect(
        validate(
          [
            { id: 1, name: 'John' },
            { id: '2', name: 'Jane' },
          ],
          schema
        ).valid
      ).toBe(false);
    });
  });
  
  describe('tuple validation', () => {
    it('should validate tuples', () => {
      const schema = tuple([
        primitive('string'),
        primitive('number'),
        primitive('boolean'),
      ]);
      
      expect(validate(['hello', 42, true], schema).valid).toBe(true);
      expect(validate(['hello', 42, 'true'], schema).valid).toBe(false);
      expect(validate(['hello', 42], schema).valid).toBe(false);
      expect(validate(['hello', 42, true, 'extra'], schema).valid).toBe(false);
    });
  });
  
  describe('union validation', () => {
    it('should validate unions', () => {
      const schema = union([
        primitive('string'),
        primitive('number'),
      ]);
      
      expect(validate('hello', schema).valid).toBe(true);
      expect(validate(42, schema).valid).toBe(true);
      expect(validate(true, schema).valid).toBe(false);
    });
    
    it('should validate complex unions', () => {
      const schema = union([
        object({ type: literal('user'), name: primitive('string') }),
        object({ type: literal('admin'), role: primitive('string') }),
      ]);
      
      expect(validate({ type: 'user', name: 'John' }, schema).valid).toBe(true);
      expect(validate({ type: 'admin', role: 'superadmin' }, schema).valid).toBe(true);
      expect(validate({ type: 'guest' }, schema).valid).toBe(false);
    });
  });
  
  describe('intersection validation', () => {
    it('should validate intersections', () => {
      const schema = intersection([
        object({ name: primitive('string') }),
        object({ age: primitive('number') }),
      ]);
      
      expect(validate({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validate({ name: 'John' }, schema).valid).toBe(true); // age is optional
      expect(validate({ age: 30 }, schema).valid).toBe(true); // name is optional
      expect(validate({}, schema).valid).toBe(true);
    });
  });
  
  describe('enum validation', () => {
    it('should validate string enums', () => {
      const schema = enumType(['red', 'green', 'blue']);
      
      expect(validate('red', schema).valid).toBe(true);
      expect(validate('green', schema).valid).toBe(true);
      expect(validate('yellow', schema).valid).toBe(false);
    });
    
    it('should validate number enums', () => {
      const schema = enumType([1, 2, 3]);
      
      expect(validate(1, schema).valid).toBe(true);
      expect(validate(2, schema).valid).toBe(true);
      expect(validate(4, schema).valid).toBe(false);
    });
  });
  
  describe('custom validators', () => {
    it('should validate min constraint', () => {
      const schema = GTypes.min(10);
      
      expect(validate(10, schema).valid).toBe(true);
      expect(validate(15, schema).valid).toBe(true);
      expect(validate(5, schema).valid).toBe(false);
    });
    
    it('should validate max constraint', () => {
      const schema = GTypes.max(100);
      
      expect(validate(100, schema).valid).toBe(true);
      expect(validate(50, schema).valid).toBe(true);
      expect(validate(150, schema).valid).toBe(false);
    });
    
    it('should validate minLength constraint', () => {
      const schema = GTypes.minLength(3);
      
      expect(validate('abc', schema).valid).toBe(true);
      expect(validate('abcd', schema).valid).toBe(true);
      expect(validate('ab', schema).valid).toBe(false);
    });
    
    it('should validate maxLength constraint', () => {
      const schema = GTypes.maxLength(5);
      
      expect(validate('abc', schema).valid).toBe(true);
      expect(validate('abcde', schema).valid).toBe(true);
      expect(validate('abcdef', schema).valid).toBe(false);
    });
    
    it('should validate pattern constraint', () => {
      const schema = GTypes.stringWithPattern('^[A-Z][a-z]+$');
      
      expect(validate('Hello', schema).valid).toBe(true);
      expect(validate('World', schema).valid).toBe(true);
      expect(validate('hello', schema).valid).toBe(false);
      expect(validate('HELLO', schema).valid).toBe(false);
    });
    
    it('should validate email constraint', () => {
      const schema = GTypes.email();
      
      expect(validate('user@example.com', schema).valid).toBe(true);
      expect(validate('test.user@domain.co.uk', schema).valid).toBe(true);
      expect(validate('invalid-email', schema).valid).toBe(false);
      expect(validate('@example.com', schema).valid).toBe(false);
    });
    
    it('should validate url constraint', () => {
      const schema = GTypes.url();
      
      expect(validate('https://example.com', schema).valid).toBe(true);
      expect(validate('http://localhost:3000', schema).valid).toBe(true);
      expect(validate('not-a-url', schema).valid).toBe(false);
    });
    
    it('should validate uuid constraint', () => {
      const schema = GTypes.uuid();
      
      expect(validate('550e8400-e29b-41d4-a716-446655440000', schema).valid).toBe(true);
      expect(validate('not-a-uuid', schema).valid).toBe(false);
      expect(validate('550e8400-e29b-41d4-a716', schema).valid).toBe(false);
    });
    
    it('should validate custom function', () => {
      const schema = primitive('number', {
        validators: [
          {
            type: 'custom',
            fn: (value) => typeof value === 'number' && value % 2 === 0,
            message: 'Must be an even number',
          },
        ],
      });
      
      expect(validate(2, schema).valid).toBe(true);
      expect(validate(4, schema).valid).toBe(true);
      expect(validate(3, schema).valid).toBe(false);
    });
  });
  
  describe('error paths', () => {
    it('should include correct path for nested object errors', () => {
      const schema = object({
        user: object({
          name: primitive('string'),
          age: primitive('number'),
        }),
      });
      
      const result = validate({ user: { name: 'John', age: '30' } }, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toEqual(['user', 'age']);
    });
    
    it('should include correct path for array item errors', () => {
      const schema = array(primitive('number'));
      
      const result = validate([1, 2, 'three', 4], schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toEqual([2]);
    });
    
    it('should include correct path for nested array errors', () => {
      const schema = object({
        items: array(
          object({
            id: primitive('number'),
          })
        ),
      });
      
      const result = validate(
        {
          items: [
            { id: 1 },
            { id: '2' },
            { id: 3 },
          ],
        },
        schema
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toEqual(['items', 1, 'id']);
    });
  });
});

// Feature: runtime-architecture, Property 13: Validator function generation
describe('Property 13: Validator function generation', () => {
  it('should correctly validate any value against generated GType schemas', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (value) => {
          const schema = primitive('string');
          const result = validate(value, schema);
          
          // Should always be valid for matching type
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should reject values that do not match the schema type', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        (value) => {
          const schema = primitive('string');
          const result = validate(value, schema);
          
          // Should always be invalid for non-matching type
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should validate objects with arbitrary properties', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          age: fc.integer({ min: 0, max: 120 }),
        }),
        (value) => {
          const schema = object({
            name: primitive('string'),
            age: primitive('number'),
          });
          
          const result = validate(value, schema);
          
          // Should always be valid for matching structure
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should validate arrays with arbitrary items', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string()),
        (value) => {
          const schema = array(primitive('string'));
          const result = validate(value, schema);
          
          // Should always be valid for matching item type
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should enforce min/max constraints consistently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (value) => {
          const schema = primitive('number', {
            validators: [
              { type: 'min', value: 0 },
              { type: 'max', value: 100 },
            ],
          });
          
          const result = validate(value, schema);
          
          // Should always be valid within range
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should validate union types correctly', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer()),
        (value) => {
          const schema = union([
            primitive('string'),
            primitive('number'),
          ]);
          
          const result = validate(value, schema);
          
          // Should always be valid for union members
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: runtime-architecture, Property 12: Validation error structure
describe('Property 12: Validation error structure', () => {
  it('should provide structured diagnostic information for any validation failure', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (value) => {
          // Skip if value is actually a string
          if (typeof value === 'string') return;
          
          const schema = primitive('string');
          const result = validate(value, schema);
          
          if (!result.valid) {
            // Should have at least one error
            expect(result.errors.length).toBeGreaterThan(0);
            
            // Each error should have required fields
            for (const error of result.errors) {
              expect(error).toHaveProperty('path');
              expect(error).toHaveProperty('expected');
              expect(error).toHaveProperty('actual');
              expect(error).toHaveProperty('message');
              
              // Path should be an array
              expect(Array.isArray(error.path)).toBe(true);
              
              // Expected should be a string
              expect(typeof error.expected).toBe('string');
              
              // Message should be a string
              expect(typeof error.message).toBe('string');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should include field path in validation errors', () => {
    const schema = object({
      user: object({
        profile: object({
          email: primitive('string'),
        }),
      }),
    });
    
    const result = validate(
      {
        user: {
          profile: {
            email: 123,
          },
        },
      },
      schema
    );
    
    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toEqual(['user', 'profile', 'email']);
    expect(result.errors[0].expected).toBe('string');
    expect(result.errors[0].actual).toBe(123);
  });
  
  it('should include expected type in validation errors', () => {
    const schema = primitive('number');
    const result = validate('not a number', schema);
    
    expect(result.valid).toBe(false);
    expect(result.errors[0].expected).toBe('number');
  });
  
  it('should include actual value in validation errors', () => {
    const schema = primitive('boolean');
    const result = validate('not a boolean', schema);
    
    expect(result.valid).toBe(false);
    expect(result.errors[0].actual).toBe('not a boolean');
  });
  
  it('should provide human-readable error messages', () => {
    const schema = primitive('string');
    const result = validate(42, schema);
    
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('string');
    expect(result.errors[0].message).toContain('42');
  });
});
