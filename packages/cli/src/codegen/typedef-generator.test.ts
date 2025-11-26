/**
 * @module cli/codegen/typedef-generator.test
 * @description Tests for TypeScript type definition generator
 */

import { describe, it, expect } from 'vitest';
import { TypeDefGenerator } from './typedef-generator.js';
import { primitive, object, array, union, intersection, enumType, tuple, literal } from '../../../runtime/src/gtype/schema.js';
import * as ts from 'typescript';

describe('TypeDefGenerator', () => {
  const generator = new TypeDefGenerator();

  describe('primitive types', () => {
    it('should generate string type', () => {
      const schema = primitive('string');
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = string');
    });

    it('should generate number type', () => {
      const schema = primitive('number');
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = number');
    });

    it('should generate boolean type', () => {
      const schema = primitive('boolean');
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = boolean');
    });

    it('should generate null type', () => {
      const schema = primitive('null');
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = null');
    });

    it('should generate undefined type', () => {
      const schema = primitive('undefined');
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = undefined');
    });
  });

  describe('literal types', () => {
    it('should generate string literal type', () => {
      const schema = literal('hello');
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain("type GeneratedType = 'hello'");
    });

    it('should generate number literal type', () => {
      const schema = literal(42);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = 42');
    });

    it('should generate boolean literal type', () => {
      const schema = literal(true);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('type GeneratedType = true');
    });
  });

  describe('object types', () => {
    it('should generate interface for simple object', () => {
      const schema = object({
        name: primitive('string'),
        age: primitive('number'),
      });
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: false,
        typeName: 'User',
      });

      expect(result.code).toContain('interface User');
      expect(result.code).toContain('name');
      expect(result.code).toContain('age');
    });

    it('should generate optional properties', () => {
      const schema = object({
        name: primitive('string'),
        email: primitive('string', { optional: true }),
      });
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: false,
      });

      expect(result.code).toContain('name:');
      expect(result.code).toContain('email?:');
    });

    it('should generate required properties', () => {
      const schema = object(
        {
          name: primitive('string'),
          email: primitive('string'),
        },
        { required: ['name', 'email'] }
      );
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: false,
      });

      expect(result.code).toContain('name:');
      expect(result.code).toContain('email:');
      expect(result.code).not.toContain('?');
    });

    it('should generate nested objects', () => {
      const schema = object({
        user: object({
          name: primitive('string'),
          age: primitive('number'),
        }),
      });
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: false,
      });

      expect(result.code).toContain('user:');
      expect(result.code).toContain('name');
      expect(result.code).toContain('age');
    });

    it('should include property descriptions', () => {
      const schema = object({
        name: primitive('string', { description: 'User name' }),
        email: primitive('string', { description: 'User email address' }),
      });
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: true,
      });

      expect(result.code).toContain('/** User name */');
      expect(result.code).toContain('/** User email address */');
    });
  });

  describe('array types', () => {
    it('should generate array of primitives', () => {
      const schema = array(primitive('string'));
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('Array<string>');
    });

    it('should generate array of objects', () => {
      const schema = array(object({
        id: primitive('number'),
        name: primitive('string'),
      }));
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('Array<');
      expect(result.code).toContain('id');
      expect(result.code).toContain('name');
    });
  });

  describe('tuple types', () => {
    it('should generate tuple type', () => {
      const schema = tuple([
        primitive('string'),
        primitive('number'),
        primitive('boolean'),
      ]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('[string, number, boolean]');
    });

    it('should generate tuple with mixed types', () => {
      const schema = tuple([
        primitive('string'),
        object({ id: primitive('number') }),
        array(primitive('string')),
      ]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('[');
      expect(result.code).toContain('string');
      expect(result.code).toContain('Array<string>');
    });
  });

  describe('union types', () => {
    it('should generate union of primitives', () => {
      const schema = union([
        primitive('string'),
        primitive('number'),
      ]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('string | number');
    });

    it('should generate union of literals', () => {
      const schema = union([
        literal('admin'),
        literal('user'),
        literal('guest'),
      ]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain("'admin' | 'user' | 'guest'");
    });

    it('should generate union with complex types', () => {
      const schema = union([
        object({ type: literal('user'), name: primitive('string') }),
        object({ type: literal('admin'), role: primitive('string') }),
      ]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('|');
      expect(result.code).toContain('type');
      expect(result.code).toContain('name');
      expect(result.code).toContain('role');
    });
  });

  describe('intersection types', () => {
    it('should generate intersection of objects', () => {
      const schema = intersection([
        object({ name: primitive('string') }),
        object({ age: primitive('number') }),
      ]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('&');
      expect(result.code).toContain('name');
      expect(result.code).toContain('age');
    });
  });

  describe('enum types', () => {
    it('should generate enum as union of literals', () => {
      const schema = enumType(['admin', 'user', 'guest']);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain("'admin' | 'user' | 'guest'");
    });

    it('should generate numeric enum', () => {
      const schema = enumType([1, 2, 3]);
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('1 | 2 | 3');
    });
  });

  describe('nullable types', () => {
    it('should generate nullable primitive', () => {
      const schema = primitive('string', { nullable: true });
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('string | null');
    });

    it('should generate nullable object', () => {
      const schema = object(
        { name: primitive('string') },
        { nullable: true }
      );
      const result = generator.generate(schema, { exportType: false, includeComments: false });

      expect(result.code).toContain('| null');
    });
  });

  describe('export and naming', () => {
    it('should export type when requested', () => {
      const schema = primitive('string');
      const result = generator.generate(schema, { 
        exportType: true, 
        includeComments: false,
      });

      expect(result.code).toContain('export');
    });

    it('should use custom type name', () => {
      const schema = primitive('string');
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: false,
        typeName: 'UserId',
      });

      expect(result.code).toContain('UserId');
      expect(result.typeName).toBe('UserId');
    });

    it('should include JSDoc comments', () => {
      const schema = primitive('string', {
        description: 'User identifier',
      });
      const result = generator.generate(schema, { 
        exportType: false, 
        includeComments: true,
      });

      expect(result.code).toContain('/**');
      expect(result.code).toContain('User identifier');
      expect(result.code).toContain('*/');
    });
  });

  describe('TypeScript compilation', () => {
    it('should generate valid TypeScript for primitives', () => {
      const schema = primitive('string');
      const result = generator.generate(schema);

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });

    it('should generate valid TypeScript for objects', () => {
      const schema = object({
        name: primitive('string'),
        age: primitive('number'),
        email: primitive('string', { optional: true }),
      });
      const result = generator.generate(schema);

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });

    it('should generate valid TypeScript for complex types', () => {
      const schema = object({
        user: object({
          name: primitive('string'),
          email: primitive('string'),
          roles: array(enumType(['admin', 'user', 'guest'])),
        }),
        settings: union([
          object({ theme: literal('light') }),
          object({ theme: literal('dark') }),
        ]),
      });
      const result = generator.generate(schema);

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });
  });

  describe('multiple type generation', () => {
    it('should generate multiple types', () => {
      const schemas = {
        User: object({
          name: primitive('string'),
          email: primitive('string'),
        }),
        Post: object({
          title: primitive('string'),
          content: primitive('string'),
          authorId: primitive('string'),
        }),
      };

      const result = generator.generateMultiple(schemas, { 
        exportType: true,
        includeComments: false,
      });

      expect(result).toContain('User');
      expect(result).toContain('Post');
      expect(result).toContain('name');
      expect(result).toContain('title');
    });
  });

  describe('branded types', () => {
    it('should generate branded type', () => {
      const schema = primitive('string');
      const result = generator.generateBrandedType(schema, 'UserId', 'UserId');

      expect(result.code).toContain('UserId');
      expect(result.code).toContain('__brand');
      expect(result.code).toContain("'UserId'");
    });

    it('should generate branded type with constraints', () => {
      const schema = primitive('string', {
        validators: [{ type: 'email' }],
      });
      const result = generator.generateBrandedType(schema, 'Email', 'Email');

      expect(result.code).toContain('Email');
      expect(result.code).toContain('__brand');
    });
  });

  describe('complex nested schemas', () => {
    it('should generate types for deeply nested schema', () => {
      const schema = object({
        user: object({
          profile: object({
            name: primitive('string'),
            bio: primitive('string', { optional: true }),
            avatar: union([
              primitive('string'),
              primitive('null'),
            ]),
          }),
          settings: object({
            theme: enumType(['light', 'dark', 'auto']),
            notifications: object({
              email: primitive('boolean'),
              push: primitive('boolean'),
            }),
          }),
        }),
        metadata: object({
          createdAt: primitive('string'),
          updatedAt: primitive('string', { optional: true }),
          tags: array(primitive('string')),
        }),
      });

      const result = generator.generate(schema, { 
        exportType: true,
        includeComments: false,
        typeName: 'ComplexType',
      });

      expect(result.code).toContain('ComplexType');
      expect(result.code).toContain('user');
      expect(result.code).toContain('profile');
      expect(result.code).toContain('settings');
      expect(result.code).toContain('metadata');
      expect(result.code).toContain('theme');
      expect(result.code).toContain('notifications');

      // Should compile
      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });
  });
});
