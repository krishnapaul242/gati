/**
 * @module cli/codegen/validator-generator.test
 * @description Tests for validator function generator
 */

import { describe, it, expect } from 'vitest';
import { ValidatorGenerator } from './validator-generator.js';
import { primitive, object, array, union, intersection, enumType, tuple, literal } from '../../../runtime/src/gtype/schema.js';
import * as ts from 'typescript';

describe('ValidatorGenerator', () => {
  const generator = new ValidatorGenerator();

  describe('primitive types', () => {
    it('should generate validator for string type', () => {
      const schema = primitive('string');
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('export function validate');
      expect(result.code).toContain("typeof value !== 'string'");
      expect(result.code).toContain('expected: \'string\'');
    });

    it('should generate validator for number type', () => {
      const schema = primitive('number');
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain("typeof value !== 'number'");
    });

    it('should generate validator for boolean type', () => {
      const schema = primitive('boolean');
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain("typeof value !== 'boolean'");
    });
  });

  describe('custom validators', () => {
    it('should generate min validator', () => {
      const schema = primitive('number', {
        validators: [{ type: 'min', value: 10 }],
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value < 10');
      expect(result.code).toContain('Value must be at least 10');
    });

    it('should generate max validator', () => {
      const schema = primitive('number', {
        validators: [{ type: 'max', value: 100 }],
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value > 100');
    });

    it('should generate minLength validator', () => {
      const schema = primitive('string', {
        validators: [{ type: 'minLength', value: 5 }],
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value.length < 5');
    });

    it('should generate email validator', () => {
      const schema = primitive('string', {
        validators: [{ type: 'email' }],
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('@');
      expect(result.code).toContain('valid email');
    });

    it('should generate uuid validator', () => {
      const schema = primitive('string', {
        validators: [{ type: 'uuid' }],
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('[0-9a-f]{8}-[0-9a-f]{4}');
      expect(result.code).toContain('valid UUID');
    });
  });

  describe('object types', () => {
    it('should generate validator for simple object', () => {
      const schema = object({
        name: primitive('string'),
        age: primitive('number'),
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('typeof value !== \'object\'');
      expect(result.code).toContain('"name"');
      expect(result.code).toContain('"age"');
    });

    it('should generate validator for object with required fields', () => {
      const schema = object(
        {
          name: primitive('string'),
          email: primitive('string'),
        },
        { required: ['name', 'email'] }
      );
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('Required property "name" is missing');
      expect(result.code).toContain('Required property "email" is missing');
    });

    it('should generate validator for nested objects', () => {
      const schema = object({
        user: object({
          name: primitive('string'),
          age: primitive('number'),
        }),
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('"user"');
      expect(result.code).toContain('"name"');
      expect(result.code).toContain('"age"');
    });
  });

  describe('array types', () => {
    it('should generate validator for array of primitives', () => {
      const schema = array(primitive('string'));
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('Array.isArray');
      expect(result.code).toContain('for (let i = 0');
    });

    it('should generate validator for array with length constraints', () => {
      const schema = array(primitive('number'), {
        minItems: 1,
        maxItems: 10,
      });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value.length < 1');
      expect(result.code).toContain('value.length > 10');
    });
  });

  describe('tuple types', () => {
    it('should generate validator for tuple', () => {
      const schema = tuple([
        primitive('string'),
        primitive('number'),
        primitive('boolean'),
      ]);
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value.length !== 3');
      expect(result.code).toContain('value[0]');
      expect(result.code).toContain('value[1]');
      expect(result.code).toContain('value[2]');
    });
  });

  describe('union types', () => {
    it('should generate validator for union', () => {
      const schema = union([
        primitive('string'),
        primitive('number'),
      ]);
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('matched');
      expect(result.code).toContain('unionErrors');
      expect(result.code).toContain('one of 2 types');
    });
  });

  describe('intersection types', () => {
    it('should generate validator for intersection', () => {
      const schema = intersection([
        object({ name: primitive('string') }),
        object({ age: primitive('number') }),
      ]);
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('"name"');
      expect(result.code).toContain('"age"');
    });
  });

  describe('enum types', () => {
    it('should generate validator for enum', () => {
      const schema = enumType(['admin', 'user', 'guest']);
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('admin');
      expect(result.code).toContain('user');
      expect(result.code).toContain('guest');
      expect(result.code).toContain('includes');
    });
  });

  describe('literal types', () => {
    it('should generate validator for string literal', () => {
      const schema = literal('hello');
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value !== "hello"');
    });

    it('should generate validator for number literal', () => {
      const schema = literal(42);
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value !== 42');
    });
  });

  describe('optional and nullable', () => {
    it('should generate validator for optional field', () => {
      const schema = primitive('string', { optional: true });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value === undefined');
      expect(result.code).toContain('Optional field');
    });

    it('should generate validator for nullable field', () => {
      const schema = primitive('string', { nullable: true });
      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('value === null');
      expect(result.code).toContain('Nullable field');
    });
  });

  describe('code generation', () => {
    it('should generate valid TypeScript code', () => {
      const schema = object({
        name: primitive('string'),
        age: primitive('number'),
        email: primitive('string', {
          validators: [{ type: 'email' }],
        }),
      });
      const result = generator.generate(schema);

      // Try to compile the generated code
      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      // Should not have syntax errors
      expect(transpileResult.diagnostics).toHaveLength(0);
    });

    it('should include imports when requested', () => {
      const schema = primitive('string');
      const result = generator.generate(schema, { includeImports: true });

      expect(result.code).toContain('import type');
      expect(result.code).toContain('ValidationResult');
    });

    it('should include comments when requested', () => {
      const schema = primitive('string', {
        description: 'User name field',
      });
      const result = generator.generate(schema, { includeComments: true });

      expect(result.code).toContain('/**');
      expect(result.code).toContain('User name field');
    });

    it('should use custom function name', () => {
      const schema = primitive('string');
      const result = generator.generate(schema, {
        functionName: 'validateUserName',
        includeImports: false,
      });

      expect(result.code).toContain('export function validateUserName');
      expect(result.functionName).toBe('validateUserName');
    });
  });

  describe('complex schemas', () => {
    it('should generate validator for complex nested schema', () => {
      const schema = object({
        user: object({
          name: primitive('string'),
          email: primitive('string', {
            validators: [{ type: 'email' }],
          }),
          roles: array(enumType(['admin', 'user', 'guest'])),
          metadata: object({
            createdAt: primitive('string'),
            updatedAt: primitive('string', { optional: true }),
          }),
        }),
        settings: object({
          theme: union([literal('light'), literal('dark')]),
          notifications: primitive('boolean'),
        }),
      });

      const result = generator.generate(schema, { includeImports: false });

      expect(result.code).toContain('"user"');
      expect(result.code).toContain('"email"');
      expect(result.code).toContain('"roles"');
      expect(result.code).toContain('"settings"');
      expect(result.code).toContain('"theme"');
      expect(result.code).toContain('admin');
      expect(result.code).toContain('light');
      expect(result.code).toContain('dark');
    });
  });
});
