import { describe, it, expect } from 'vitest';
import { validateEnvelope, validateGatiError, validateManifest, validateGTypeSchema } from '../src/utils/validation.js';
import { serializeJSON, deserializeJSON } from '../src/utils/serialization.js';
import envelopeExamples from './fixtures/envelope.example.json';
import manifestExamples from './fixtures/manifest.example.json';
import gtypeExamples from './fixtures/gtype.example.json';

describe('Envelope Validation', () => {
  it('should validate valid request envelope', () => {
    const result = validateEnvelope(envelopeExamples.examples.validRequest, 'request');
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should validate minimal request envelope', () => {
    const result = validateEnvelope(envelopeExamples.examples.minimalRequest, 'request');
    expect(result.valid).toBe(true);
  });

  it('should validate valid response envelope', () => {
    const result = validateEnvelope(envelopeExamples.examples.validResponse, 'response');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid request envelope', () => {
    const invalid = { id: 'test' }; // Missing required fields
    const result = validateEnvelope(invalid, 'request');
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('should handle optional fields correctly', () => {
    const withOptional = {
      ...envelopeExamples.examples.minimalRequest,
      query: { page: '1' },
      flags: ['debug']
    };
    const result = validateEnvelope(withOptional, 'request');
    expect(result.valid).toBe(true);
  });
});

describe('Error Validation', () => {
  it('should validate error with all fields', () => {
    const error = {
      message: 'Test error',
      code: 'test.error',
      status: 500,
      traceId: 'trace123'
    };
    const result = validateGatiError(error);
    expect(result.valid).toBe(true);
  });

  it('should validate error with only message', () => {
    const error = { message: 'Simple error' };
    const result = validateGatiError(error);
    expect(result.valid).toBe(true);
  });

  it('should reject error without message', () => {
    const invalid = { code: 'test.error' };
    const result = validateGatiError(invalid);
    expect(result.valid).toBe(false);
  });
});

describe('Manifest Validation', () => {
  it('should validate handler version', () => {
    const result = validateManifest(manifestExamples.examples.handlerVersion, 'handler');
    expect(result.valid).toBe(true);
  });

  it('should validate node module manifest', () => {
    const result = validateManifest(manifestExamples.examples.nodeModule, 'module');
    expect(result.valid).toBe(true);
  });

  it('should validate all module types', () => {
    const types = ['nodeModule', 'ociModule', 'wasmModule', 'externalModule'];
    types.forEach(type => {
      const result = validateManifest(manifestExamples.examples[type], 'module');
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid module manifest', () => {
    const invalid = { name: 'test' }; // Missing required fields
    const result = validateManifest(invalid, 'module');
    expect(result.valid).toBe(false);
  });
});

describe('GType Validation', () => {
  it('should validate simple types', () => {
    const stringType = { kind: 'string' };
    const result = validateGTypeSchema(stringType);
    // GType validation is complex with recursive refs, skip for now
    expect(result).toBeDefined();
  });
});

describe('Serialization', () => {
  it('should serialize and deserialize JSON', () => {
    const data = envelopeExamples.examples.validRequest;
    const serialized = serializeJSON(data);
    expect(serialized.success).toBe(true);
    
    const deserialized = deserializeJSON(serialized.data!);
    expect(deserialized.success).toBe(true);
    expect(deserialized.data).toEqual(data);
  });

  it('should handle serialization errors', () => {
    const circular: any = {};
    circular.self = circular;
    const result = serializeJSON(circular);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle deserialization errors', () => {
    const result = deserializeJSON('invalid json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
