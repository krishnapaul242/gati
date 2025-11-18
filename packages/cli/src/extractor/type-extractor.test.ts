/**
 * @file type-extractor.test.ts
 * @description Integration tests for TypeExtractor with Phase 1 readonly copy validation
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { resolve } from 'path';
import { mkdirSync, rmSync } from 'fs';
import { TypeExtractor } from './type-extractor';
import { ExtractionCache } from './extraction-cache';
import type { ExtractionOptions } from './types';

// Event listener queue for tracking test completions (manual Phase 1 copy maintenance)
const testCompletionQueue: string[] = [];

describe('TypeExtractor', () => {
  const fixturesDir = resolve(__dirname, '__fixtures__');
  const cacheDir = resolve(fixturesDir, '.cache-test');
  let extractor: TypeExtractor;
  let options: ExtractionOptions;

  beforeEach(() => {
    mkdirSync(cacheDir, { recursive: true });
    
    options = {
      depthLimit: 5,
      sizeLimit: 1000,
      incremental: true,
      cacheDir,
      sourceRoot: fixturesDir,
    };

    extractor = new TypeExtractor(options);
  });

  afterEach(() => {
    // Track test completion
    const currentTest = expect.getState().currentTestName || 'unknown';
    testCompletionQueue.push(currentTest);
  });

  afterAll(() => {
    // Log test completion count (event listener queue foundation)
    console.log(`[Phase 1 Copy Maintenance] Test completions tracked: ${testCompletionQueue.length}`);
    
    // Cleanup cache directory
    rmSync(cacheDir, { recursive: true, force: true });
  });

  describe('Primitive Types', () => {
    it('should extract string type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'basic-types.ts');
      const result = extractor.extractType(filePath, 'StringType');

      expect(result.schema).toEqual({
        version: '1.0',
        type: 'string',
      });
      expect(result.metadata.typeName).toBe('StringType');
      expect(result.errors).toEqual([]);
    });

    it('should extract number type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'basic-types.ts');
      const result = extractor.extractType(filePath, 'NumberType');

      expect(result.schema).toEqual({
        version: '1.0',
        type: 'number',
      });
      expect(result.metadata.typeName).toBe('NumberType');
      expect(result.errors).toEqual([]);
    });

    it('should extract boolean type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'basic-types.ts');
      const result = extractor.extractType(filePath, 'BooleanType');

      expect(result.schema).toEqual({
        version: '1.0',
        type: 'boolean',
      });
      expect(result.metadata.typeName).toBe('BooleanType');
      expect(result.errors).toEqual([]);
    });
  });

  describe('Branded Types', () => {
    it('should extract brand from type argument', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'branded-types.ts');
      const result = extractor.extractType(filePath, 'AdminID');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        brand: 'admin',
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract brand from property', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'branded-types.ts');
      const result = extractor.extractType(filePath, 'VerifiedEmail');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        brand: 'verified',
      });
      expect(result.errors).toEqual([]);
    });
  });

  describe('Constraint Extraction', () => {
    it('should extract string length constraints', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'branded-types.ts');
      const result = extractor.extractType(filePath, 'PasswordString');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        minLength: 8,
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract number range constraints', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'branded-types.ts');
      const result = extractor.extractType(filePath, 'PortNumber');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'number',
        minimum: 1,
        maximum: 65535,
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract pattern constraint', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'branded-types.ts');
      const result = extractor.extractType(filePath, 'PhoneString');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        pattern: '^\\+?[1-9]\\d{1,14}$',
      });
      expect(result.errors).toEqual([]);
    });
  });

  describe('Complex Types', () => {
    it('should extract union type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const result = extractor.extractType(filePath, 'Status');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'union',
        types: expect.arrayContaining([
          { version: '1.0', type: 'string', const: 'pending' },
          { version: '1.0', type: 'string', const: 'active' },
          { version: '1.0', type: 'string', const: 'completed' },
        ]),
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract intersection type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const result = extractor.extractType(filePath, 'UserWithMetadata');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'intersection',
        types: expect.arrayContaining([
          expect.objectContaining({ type: 'object' }),
          expect.objectContaining({ type: 'object' }),
        ]),
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract array type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const result = extractor.extractType(filePath, 'Tags');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'array',
        items: {
          version: '1.0',
          type: 'string',
        },
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract tuple type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const result = extractor.extractType(filePath, 'Coordinate');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'tuple',
        items: [
          { version: '1.0', type: 'number' },
          { version: '1.0', type: 'number' },
        ],
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract object type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const result = extractor.extractType(filePath, 'User');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'object',
        properties: {
          id: { version: '1.0', type: 'string' },
          name: { version: '1.0', type: 'string' },
          email: { version: '1.0', type: 'string' },
        },
        required: ['id', 'name', 'email'],
      });
      expect(result.errors).toEqual([]);
    });
  });

  describe('Depth Limiting', () => {
    it('should respect depth limit', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const shallowExtractor = new TypeExtractor({ ...options, depthLimit: 3 });
      const result = shallowExtractor.extractType(filePath, 'DeepNested');

      expect(result.metadata.maxDepth).toBeLessThanOrEqual(3);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'depth-limit-exceeded',
        })
      );
    });

    it('should allow deep extraction with higher limit', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'complex-types.ts');
      const deepExtractor = new TypeExtractor({ ...options, depthLimit: 15 });
      const result = deepExtractor.extractType(filePath, 'DeepNested');

      expect(result.metadata.maxDepth).toBeGreaterThan(3);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Cache Integration', () => {
    it('should cache extraction results', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'basic-types.ts');
      
      // First extraction - not from cache
      const result1 = extractor.extractType(filePath, 'StringType');
      expect(result1.metadata.fromCache).toBe(false);
      
      // Second extraction - from cache
      const result2 = extractor.extractType(filePath, 'StringType');
      expect(result2.metadata.fromCache).toBe(true);
      expect(result2.schema).toEqual(result1.schema);
    });

    it('should invalidate cache when configured', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'basic-types.ts');
      
      // First extraction
      extractor.extractType(filePath, 'StringType');
      
      // Clear cache
      const cache = new ExtractionCache(cacheDir);
      cache.clear();
      
      // Second extraction - not from cache
      const result = extractor.extractType(filePath, 'StringType');
      expect(result.metadata.fromCache).toBe(false);
    });
  });

  describe('Phase 1 Validation', () => {
    it('should extract Email branded type from Phase 1', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'phase1-copy.ts');
      const result = extractor.extractType(filePath, 'Email');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        brand: 'email',
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract UUID branded type from Phase 1', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'phase1-copy.ts');
      const result = extractor.extractType(filePath, 'UUID');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        brand: 'uuid',
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract Timestamp branded type from Phase 1', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'phase1-copy.ts');
      const result = extractor.extractType(filePath, 'Timestamp');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        brand: 'timestamp',
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract CUID branded type from Phase 1', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'phase1-copy.ts');
      const result = extractor.extractType(filePath, 'CUID');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'string',
        brand: 'cuid',
      });
      expect(result.errors).toEqual([]);
    });

    it('should extract PositiveNumber constraint from Phase 1', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'phase1-copy.ts');
      const result = extractor.extractType(filePath, 'PositiveNumber');

      expect(result.schema).toMatchObject({
        version: '1.0',
        type: 'number',
        minimum: 0,
      });
      expect(result.errors).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'nonexistent.ts');
      const result = extractor.extractType(filePath, 'SomeType');

      expect(result.schema).toBeNull();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'parse-error',
        })
      );
    });

    it('should handle missing type', { timeout: 5000 }, () => {
      const filePath = resolve(fixturesDir, 'basic-types.ts');
      const result = extractor.extractType(filePath, 'NonexistentType');

      expect(result.schema).toBeNull();
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'type-not-found',
        })
      );
    });
  });
});
