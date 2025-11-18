/**
 * @file constraint-extractor.test.ts
 * @description Tests for ConstraintExtractor with boolean flag branch coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Project, Type } from 'ts-morph';
import { resolve } from 'path';
import { ConstraintExtractor } from './constraint-extractor';

describe('ConstraintExtractor', () => {
  let project: Project;
  let extractor: ConstraintExtractor;

  beforeEach(() => {
    const fixturesDir = resolve(__dirname, '__fixtures__');
    project = new Project({
      tsConfigFilePath: resolve(fixturesDir, 'tsconfig.json'),
    });
    extractor = new ConstraintExtractor();
  });

  describe('extractBrand', () => {
    it('should extract brand from type argument', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('EmailString')!;
      const type = typeAlias.getType();
      
      const brand = extractor.extractBrand(type);
      expect(brand).toEqual({ name: 'email', isBranded: true });
    });

    it('should extract brand from property', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('UserID')!;
      const type = typeAlias.getType();
      
      const brand = extractor.extractBrand(type);
      expect(brand).toEqual({ name: 'userId', isBranded: true });
    });

    it('should return undefined for non-branded types', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('StringType')!;
      const type = typeAlias.getType();
      
      const brand = extractor.extractBrand(type);
      expect(brand).toBeNull();
    });
  });

  describe('extractStringConstraints', () => {
    it('should extract minLength constraint', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('LongString')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractStringConstraints(type);
      expect(constraints.minLength).toBe(500);
    });

    it('should extract maxLength constraint', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('ShortString')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractStringConstraints(type);
      expect(constraints.maxLength).toBe(100);
    });

    it('should extract both min and max length', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('BoundedString')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractStringConstraints(type);
      expect(constraints.minLength).toBe(10);
      expect(constraints.maxLength).toBe(100);
    });

    it('should extract pattern constraint', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('HexString')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractStringConstraints(type);
      expect(constraints.pattern).toBe('^[0-9a-fA-F]+$');
    });

    it('should handle multiple constraints', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('complex-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('ConstrainedString')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractStringConstraints(type);
      expect(constraints.minLength).toBe(5);
      expect(constraints.maxLength).toBe(50);
      expect(constraints.pattern).toBe('^[a-zA-Z]+$');
    });
  });

  describe('extractNumberConstraints - Boolean Flag Coverage', () => {
    it('should extract minimum: 0 from __positive: true', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('PositiveNumberTrue')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.minimum).toBe(0);
    });

    it('should NOT extract minimum from __positive: false', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('PositiveNumberFalse')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.minimum).toBeUndefined();
    });

    it('should extract maximum: 0 from __negative: true', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('NegativeNumberTrue')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.maximum).toBe(0);
    });

    it('should NOT extract maximum from __negative: false', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('NegativeNumberFalse')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.maximum).toBeUndefined();
    });

    it('should extract integer: true from __integer: true', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('IntegerNumberTrue')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.integer).toBe(true);
    });

    it('should NOT extract integer flag from __integer: false', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('IntegerNumberFalse')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.integer).toBeUndefined();
    });

    it('should extract explicit minimum over __positive flag', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('PositiveTrueWithMin')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.minimum).toBe(10); // Explicit __min overrides
    });

    it('should extract explicit maximum over __negative flag', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('constraint-properties.ts')!;
      const typeAlias = sourceFile.getTypeAlias('NegativeTrueWithMax')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.maximum).toBe(-5); // Explicit __max overrides
    });

    it('should extract minimum and maximum constraints', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('BoundedNumber')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.minimum).toBe(10);
      expect(constraints.maximum).toBe(100);
    });

    it('should extract multipleOf constraint', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('EvenNumber')!;
      const type = typeAlias.getType();
      
      const constraints = extractor.extractNumberConstraints(type);
      expect(constraints.multipleOf).toBe(2);
    });
  });

  describe('isNullable', () => {
    it('should detect nullable types', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('edge-cases.ts')!;
      const typeAlias = sourceFile.getTypeAlias('NullableString')!;
      const type = typeAlias.getType();
      
      const isNullable = extractor.isNullable(type);
      expect(isNullable).toBe(true);
    });

    it('should return false for non-nullable types', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('StringType')!;
      const type = typeAlias.getType();
      
      const isNullable = extractor.isNullable(type);
      expect(isNullable).toBe(false);
    });
  });

  describe('isOptional', () => {
    it('should detect undefined in union', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('edge-cases.ts')!;
      const typeAlias = sourceFile.getTypeAlias('UndefinableNumber')!;
      const type = typeAlias.getType();
      
      const isOptional = extractor.isOptional(type);
      expect(isOptional).toBe(true);
    });

    it('should detect optional (null | undefined)', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('edge-cases.ts')!;
      const typeAlias = sourceFile.getTypeAlias('OptionalString')!;
      const type = typeAlias.getType();
      
      const isOptional = extractor.isOptional(type);
      expect(isOptional).toBe(true);
    });

    it('should return false for non-optional types', { timeout: 10000 }, () => {
      const sourceFile = project.getSourceFile('basic-types.ts')!;
      const typeAlias = sourceFile.getTypeAlias('NumberType')!;
      const type = typeAlias.getType();
      
      const isOptional = extractor.isOptional(type);
      expect(isOptional).toBe(false);
    });
  });
});
