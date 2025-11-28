/**
 * Edge case tests for contract validation
 */

import { describe, it, expect } from 'vitest';
import { validateEnvelope, validateManifest, validateGTypeSchema } from '../src/utils/validation.js';

describe('Edge Case Tests', () => {
  describe('Envelope Edge Cases', () => {
    it('should reject envelope with missing required fields', () => {
      const invalid = {
        method: 'GET',
        // missing id, path, headers, receivedAt
      };
      const result = validateEnvelope(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle empty strings', () => {
      const envelope = {
        id: '',
        method: 'GET',
        path: '',
        headers: {},
        receivedAt: Date.now(),
      };
      const result = validateEnvelope(envelope);
      // Empty strings are valid (schema doesn't enforce minLength)
      expect(result.valid).toBe(true);
    });

    it('should reject invalid HTTP methods', () => {
      const invalid = {
        id: 'req-123',
        method: 'INVALID',
        path: '/test',
        headers: {},
        receivedAt: Date.now(),
      };
      const result = validateEnvelope(invalid);
      expect(result.valid).toBe(false);
    });

    it('should handle null vs undefined', () => {
      const withNull = {
        id: 'req-123',
        method: 'GET',
        path: '/test',
        headers: {},
        receivedAt: Date.now(),
        body: null,
      };
      const result = validateEnvelope(withNull);
      expect(result.valid).toBe(true);
    });

    it('should handle very large timestamps', () => {
      const envelope = {
        id: 'req-123',
        method: 'GET',
        path: '/test',
        headers: {},
        receivedAt: Number.MAX_SAFE_INTEGER,
      };
      const result = validateEnvelope(envelope);
      expect(result.valid).toBe(true);
    });
  });

  describe('Manifest Edge Cases', () => {
    it('should reject manifest with invalid type', () => {
      const invalid = {
        name: 'test',
        id: 'mod-123',
        version: '1.0.0',
        type: 'invalid-type',
      };
      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
    });

    it('should handle minimal valid manifest', () => {
      const minimal = {
        name: 'test',
        id: 'mod-123',
        version: '1.0.0',
        type: 'handler',
      };
      const result = validateManifest(minimal);
      expect(result.valid).toBe(true);
    });

    it('should handle manifest with all optional fields', () => {
      const complete = {
        name: 'test',
        id: 'mod-123',
        version: '1.0.0',
        type: 'handler',
        exports: { handler: 'index.js' },
        capabilities: ['read', 'write'],
        resources: { memory: '256MB', cpu: '0.5' },
        signature: 'sig-123',
      };
      const result = validateManifest(complete);
      expect(result.valid).toBe(true);
    });
  });

  describe('GType Edge Cases', () => {
    it('should handle deeply nested objects', () => {
      const deepNested = {
        kind: 'object',
        properties: {
          level1: {
            kind: 'object',
            properties: {
              level2: {
                kind: 'object',
                properties: {
                  level3: {
                    kind: 'string',
                  },
                },
              },
            },
          },
        },
      };
      const result = validateGTypeSchema(deepNested);
      expect(result.valid).toBe(true);
    });

    it('should handle arrays of arrays', () => {
      const arrayOfArrays = {
        kind: 'array',
        items: {
          kind: 'array',
          items: {
            kind: 'number',
          },
        },
      };
      const result = validateGTypeSchema(arrayOfArrays);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid GType kind', () => {
      const invalid = {
        kind: 'invalid-kind',
      };
      const result = validateGTypeSchema(invalid);
      expect(result.valid).toBe(false);
    });

    it('should handle union types', () => {
      const union = {
        kind: 'union',
        types: [
          { kind: 'string' },
          { kind: 'number' },
          { kind: 'null' },
        ],
      };
      const result = validateGTypeSchema(union);
      expect(result.valid).toBe(true);
    });
  });

  describe('Malformed Data', () => {
    it('should handle non-object input', () => {
      const result = validateEnvelope('not an object' as any);
      expect(result.valid).toBe(false);
    });

    it('should handle array input', () => {
      const result = validateEnvelope([] as any);
      expect(result.valid).toBe(false);
    });

    it('should handle null input', () => {
      const result = validateEnvelope(null as any);
      expect(result.valid).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = validateEnvelope(undefined as any);
      expect(result.valid).toBe(false);
    });
  });
});
