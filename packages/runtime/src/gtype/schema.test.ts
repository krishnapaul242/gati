/**
 * @module runtime/gtype/schema.test
 * @description Tests for GType schema builders
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
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

describe('GType Schema Builders', () => {
  describe('primitive', () => {
    it('should create a primitive string type', () => {
      const schema = primitive('string');
      expect(schema).toEqual({
        kind: 'primitive',
        primitiveType: 'string',
      });
    });
    
    it('should create a primitive number type', () => {
      const schema = primitive('number');
      expect(schema).toEqual({
        kind: 'primitive',
        primitiveType: 'number',
      });
    });
    
    it('should support optional flag', () => {
      const schema = primitive('string', { optional: true });
      expect(schema.optional).toBe(true);
    });
    
    it('should support nullable flag', () => {
      const schema = primitive('string', { nullable: true });
      expect(schema.nullable).toBe(true);
    });
  });
  
  describe('literal', () => {
    it('should create a literal string type', () => {
      const schema = literal('hello');
      expect(schema).toEqual({
        kind: 'literal',
        value: 'hello',
      });
    });
    
    it('should create a literal number type', () => {
      const schema = literal(42);
      expect(schema).toEqual({
        kind: 'literal',
        value: 42,
      });
    });
    
    it('should create a literal boolean type', () => {
      const schema = literal(true);
      expect(schema).toEqual({
        kind: 'literal',
        value: true,
      });
    });
  });
  
  describe('object', () => {
    it('should create an object type', () => {
      const schema = object({
        name: primitive('string'),
        age: primitive('number'),
      });
      
      expect(schema.kind).toBe('object');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('age');
    });
    
    it('should support required fields', () => {
      const schema = object(
        {
          name: primitive('string'),
          age: primitive('number'),
        },
        { required: ['name'] }
      );
      
      expect(schema.required).toEqual(['name']);
    });
    
    it('should support additional properties', () => {
      const schema = object(
        {
          name: primitive('string'),
        },
        { additionalProperties: false }
      );
      
      expect(schema.additionalProperties).toBe(false);
    });
  });
  
  describe('array', () => {
    it('should create an array type', () => {
      const schema = array(primitive('string'));
      
      expect(schema.kind).toBe('array');
      expect(schema.items).toEqual(primitive('string'));
    });
    
    it('should support min/max items', () => {
      const schema = array(primitive('string'), {
        minItems: 1,
        maxItems: 10,
      });
      
      expect(schema.minItems).toBe(1);
      expect(schema.maxItems).toBe(10);
    });
  });
  
  describe('tuple', () => {
    it('should create a tuple type', () => {
      const schema = tuple([
        primitive('string'),
        primitive('number'),
        primitive('boolean'),
      ]);
      
      expect(schema.kind).toBe('tuple');
      expect(schema.items).toHaveLength(3);
    });
  });
  
  describe('union', () => {
    it('should create a union type', () => {
      const schema = union([
        primitive('string'),
        primitive('number'),
      ]);
      
      expect(schema.kind).toBe('union');
      expect(schema.types).toHaveLength(2);
    });
  });
  
  describe('intersection', () => {
    it('should create an intersection type', () => {
      const schema = intersection([
        object({ name: primitive('string') }),
        object({ age: primitive('number') }),
      ]);
      
      expect(schema.kind).toBe('intersection');
      expect(schema.types).toHaveLength(2);
    });
  });
  
  describe('enumType', () => {
    it('should create an enum type', () => {
      const schema = enumType(['red', 'green', 'blue']);
      
      expect(schema.kind).toBe('enum');
      expect(schema.values).toEqual(['red', 'green', 'blue']);
    });
  });
  
  describe('GTypes helpers', () => {
    it('should create common types', () => {
      expect(GTypes.string()).toEqual(primitive('string'));
      expect(GTypes.number()).toEqual(primitive('number'));
      expect(GTypes.boolean()).toEqual(primitive('boolean'));
      expect(GTypes.null()).toEqual(primitive('null'));
      expect(GTypes.undefined()).toEqual(primitive('undefined'));
    });
    
    it('should create optional types', () => {
      const schema = GTypes.optional(primitive('string'));
      expect(schema.optional).toBe(true);
    });
    
    it('should create nullable types', () => {
      const schema = GTypes.nullable(primitive('string'));
      expect(schema.nullable).toBe(true);
    });
    
    it('should create email type', () => {
      const schema = GTypes.email();
      expect(schema.validators).toBeDefined();
      expect(schema.validators?.[0].type).toBe('email');
    });
    
    it('should create URL type', () => {
      const schema = GTypes.url();
      expect(schema.validators).toBeDefined();
      expect(schema.validators?.[0].type).toBe('url');
    });
    
    it('should create UUID type', () => {
      const schema = GTypes.uuid();
      expect(schema.validators).toBeDefined();
      expect(schema.validators?.[0].type).toBe('uuid');
    });
  });
});

// Feature: runtime-architecture, Property 9: GType schema generation
describe('Property 9: GType schema generation', () => {
  it('should generate valid GType schemas for any TypeScript type structure', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('string'),
          fc.constant('number'),
          fc.constant('boolean')
        ),
        (primitiveType) => {
          const schema = primitive(primitiveType as 'string' | 'number' | 'boolean');
          
          // Schema should have correct structure
          expect(schema.kind).toBe('primitive');
          expect(schema.primitiveType).toBe(primitiveType);
          
          // Schema should be serializable
          const serialized = JSON.stringify(schema);
          const deserialized = JSON.parse(serialized);
          expect(deserialized).toEqual(schema);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate valid object schemas with arbitrary properties', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(
            fc.constant(primitive('string')),
            fc.constant(primitive('number')),
            fc.constant(primitive('boolean'))
          )
        ),
        (properties) => {
          const schema = object(properties);
          
          // Schema should have correct structure
          expect(schema.kind).toBe('object');
          expect(Object.keys(schema.properties)).toEqual(Object.keys(properties));
          
          // All properties should be valid GTypes
          for (const [key, value] of Object.entries(schema.properties)) {
            expect(value).toHaveProperty('kind');
            expect(properties[key]).toEqual(value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate valid array schemas', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(primitive('string')),
          fc.constant(primitive('number')),
          fc.constant(primitive('boolean'))
        ),
        (itemType) => {
          const schema = array(itemType);
          
          // Schema should have correct structure
          expect(schema.kind).toBe('array');
          expect(schema.items).toEqual(itemType);
        }
      ),
      { numRuns: 100 }
    );
  });
});
