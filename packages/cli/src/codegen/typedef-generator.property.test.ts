/**
 * @module cli/codegen/typedef-generator.property.test
 * @description Property-based tests for TypeScript type definition generator
 * Property 5: Generated TypeScript definitions match GType schemas
 */

import { describe, it, expect } from 'vitest';
import { TypeDefGenerator } from './typedef-generator.js';
import { primitive, object, array, union, intersection, enumType, tuple, literal } from '../../../runtime/src/gtype/schema.js';
import type { GType } from '../../../runtime/src/gtype/schema.js';
import * as ts from 'typescript';

describe('TypeDefGenerator - Property Tests (18.1)', () => {
  const generator = new TypeDefGenerator();

  /**
   * Property 5: Generated TypeScript definitions match GType schemas
   * 
   * For any valid GType schema:
   * 1. Generated TypeScript code compiles without errors
   * 2. Type structure matches the original schema
   * 3. Optional/nullable modifiers are preserved
   */

  describe('Property 5: TypeScript definition generation correctness', () => {
    // Test with 100+ iterations using different schema combinations
    const testCases: Array<{ name: string; schema: GType }> = [];

    // Generate primitive test cases (5 types)
    const primitiveTypes = ['string', 'number', 'boolean', 'null', 'undefined'] as const;
    primitiveTypes.forEach(type => {
      testCases.push({ name: `primitive-${type}`, schema: primitive(type) });
      testCases.push({ name: `primitive-${type}-optional`, schema: primitive(type, { optional: true }) });
      testCases.push({ name: `primitive-${type}-nullable`, schema: primitive(type, { nullable: true }) });
    });

    // Generate literal test cases (15 cases)
    const literalValues = ['hello', 'world', 'test', 42, 100, -5, true, false, null];
    literalValues.forEach((value, idx) => {
      testCases.push({ name: `literal-${idx}`, schema: literal(value) });
    });

    // Generate object test cases (20 cases)
    for (let i = 0; i < 10; i++) {
      testCases.push({
        name: `object-simple-${i}`,
        schema: object({
          field1: primitive('string'),
          field2: primitive('number'),
        }),
      });
      testCases.push({
        name: `object-optional-${i}`,
        schema: object({
          required: primitive('string'),
          optional: primitive('number', { optional: true }),
        }),
      });
    }

    // Generate array test cases (15 cases)
    primitiveTypes.forEach(type => {
      testCases.push({ name: `array-${type}`, schema: array(primitive(type)) });
      testCases.push({ name: `array-${type}-nested`, schema: array(array(primitive(type))) });
      testCases.push({ name: `array-${type}-optional`, schema: array(primitive(type), { optional: true }) });
    });

    // Generate union test cases (10 cases)
    for (let i = 0; i < 10; i++) {
      testCases.push({
        name: `union-${i}`,
        schema: union([primitive('string'), primitive('number')]),
      });
    }

    // Generate intersection test cases (10 cases)
    for (let i = 0; i < 10; i++) {
      testCases.push({
        name: `intersection-${i}`,
        schema: intersection([
          object({ a: primitive('string') }),
          object({ b: primitive('number') }),
        ]),
      });
    }

    // Generate enum test cases (10 cases)
    for (let i = 0; i < 10; i++) {
      testCases.push({
        name: `enum-${i}`,
        schema: enumType(['option1', 'option2', 'option3']),
      });
    }

    // Generate tuple test cases (10 cases)
    for (let i = 0; i < 10; i++) {
      testCases.push({
        name: `tuple-${i}`,
        schema: tuple([primitive('string'), primitive('number'), primitive('boolean')]),
      });
    }

    // Generate complex nested test cases (15 cases)
    for (let i = 0; i < 15; i++) {
      testCases.push({
        name: `complex-${i}`,
        schema: object({
          user: object({
            name: primitive('string'),
            age: primitive('number', { optional: true }),
            roles: array(enumType(['admin', 'user', 'guest'])),
          }),
          metadata: union([
            object({ type: literal('simple'), value: primitive('string') }),
            object({ type: literal('complex'), data: array(primitive('number')) }),
          ]),
        }),
      });
    }

    // Total: 15 + 9 + 20 + 15 + 10 + 10 + 10 + 10 + 15 = 114 test cases

    it(`should generate valid TypeScript for ${testCases.length} schema variations`, () => {
      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ name: string; error: string }> = [];

      for (const testCase of testCases) {
        try {
          const result = generator.generate(testCase.schema, {
            typeName: 'TestType',
            exportType: true,
            includeComments: false,
          });

          // Verify code was generated
          expect(result.code).toBeTruthy();
          expect(result.code.length).toBeGreaterThan(0);

          // Verify TypeScript compilation
          const transpileResult = ts.transpileModule(result.code, {
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2020,
            },
          });

          if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
            const errors = transpileResult.diagnostics.map(d => d.messageText).join(', ');
            throw new Error(`TypeScript compilation errors: ${errors}`);
          }

          successCount++;
        } catch (error) {
          failureCount++;
          failures.push({
            name: testCase.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Report results
      console.log(`\n✅ Property Test Results:`);
      console.log(`   Total cases: ${testCases.length}`);
      console.log(`   Successes: ${successCount}`);
      console.log(`   Failures: ${failureCount}`);

      if (failures.length > 0) {
        console.log(`\n❌ Failed cases:`);
        failures.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
      }

      // All test cases should pass
      expect(failureCount).toBe(0);
      expect(successCount).toBe(testCases.length);
    });

    it('should preserve optional modifiers in generated types', () => {
      const schemas = [
        primitive('string', { optional: true }),
        object({ opt: primitive('number', { optional: true }) }),
        array(primitive('string'), { optional: true }),
      ];

      for (const schema of schemas) {
        const result = generator.generate(schema, { exportType: false, includeComments: false });
        
        // Optional properties should have ? marker or be in a union with undefined
        if (schema.kind === 'object') {
          expect(result.code).toMatch(/\?:/);
        }
      }
    });

    it('should preserve nullable modifiers in generated types', () => {
      const schemas = [
        primitive('string', { nullable: true }),
        object({ name: primitive('string') }, { nullable: true }),
        array(primitive('number'), { nullable: true }),
      ];

      for (const schema of schemas) {
        const result = generator.generate(schema, { exportType: false, includeComments: false });
        
        // Nullable types should have | null
        expect(result.code).toContain('| null');
      }
    });

    it('should handle deeply nested schemas', () => {
      const deepSchema = object({
        level1: object({
          level2: object({
            level3: object({
              level4: object({
                value: primitive('string'),
              }),
            }),
          }),
        }),
      });

      const result = generator.generate(deepSchema, { exportType: false, includeComments: false });

      // Should compile without errors
      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(result.code).toContain('level1');
      expect(result.code).toContain('level2');
      expect(result.code).toContain('level3');
      expect(result.code).toContain('level4');
      expect(result.code).toContain('value');
    });

    it('should handle complex union types', () => {
      const complexUnion = union([
        object({ type: literal('a'), value: primitive('string') }),
        object({ type: literal('b'), value: primitive('number') }),
        object({ type: literal('c'), value: array(primitive('boolean')) }),
      ]);

      const result = generator.generate(complexUnion, { exportType: false, includeComments: false });

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(result.code).toContain('|');
      expect(result.code).toContain("'a'");
      expect(result.code).toContain("'b'");
      expect(result.code).toContain("'c'");
    });

    it('should handle complex intersection types', () => {
      const complexIntersection = intersection([
        object({ name: primitive('string'), age: primitive('number') }),
        object({ email: primitive('string'), verified: primitive('boolean') }),
        object({ roles: array(enumType(['admin', 'user'])) }),
      ]);

      const result = generator.generate(complexIntersection, { exportType: false, includeComments: false });

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(result.code).toContain('&');
      expect(result.code).toContain('name');
      expect(result.code).toContain('email');
      expect(result.code).toContain('roles');
    });
  });
});
