/**
 * Serialization round-trip tests
 */

import { describe, it, expect } from 'vitest';
import {
  serializeJSON,
  deserializeJSON,
  serializeMessagePack,
  deserializeMessagePack,
} from '../src/utils/serialization.js';

describe('Serialization Round-Trip Tests', () => {
  const testData = {
    envelope: {
      id: 'req-123',
      method: 'GET',
      path: '/api/test',
      headers: { 'content-type': 'application/json' },
      receivedAt: Date.now(),
    },
    manifest: {
      name: 'test-module',
      id: 'mod-123',
      version: '1.0.0',
      type: 'handler' as const,
    },
    gtype: {
      kind: 'object' as const,
      properties: {
        name: { kind: 'string' as const },
        age: { kind: 'number' as const },
      },
    },
  };

  describe('JSON Serialization', () => {
    it('should round-trip envelope data', () => {
      const serialized = serializeJSON(testData.envelope);
      expect(serialized.success).toBe(true);
      expect(serialized.data).toBeDefined();

      const deserialized = deserializeJSON(serialized.data!);
      expect(deserialized.success).toBe(true);
      expect(deserialized.data).toEqual(testData.envelope);
    });

    it('should round-trip manifest data', () => {
      const serialized = serializeJSON(testData.manifest);
      const deserialized = deserializeJSON(serialized.data!);
      expect(deserialized.data).toEqual(testData.manifest);
    });

    it('should round-trip gtype data', () => {
      const serialized = serializeJSON(testData.gtype);
      const deserialized = deserializeJSON(serialized.data!);
      expect(deserialized.data).toEqual(testData.gtype);
    });

    it('should handle serialization errors', () => {
      const circular: any = {};
      circular.self = circular;
      const result = serializeJSON(circular);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle deserialization errors', () => {
      const result = deserializeJSON('invalid json{');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('MessagePack Serialization', () => {
    it('should round-trip envelope data', () => {
      const serialized = serializeMessagePack(testData.envelope);
      expect(serialized.success).toBe(true);
      expect(serialized.data).toBeInstanceOf(Buffer);

      const deserialized = deserializeMessagePack(serialized.data!);
      expect(deserialized.success).toBe(true);
      expect(deserialized.data).toEqual(testData.envelope);
    });

    it('should round-trip manifest data', () => {
      const serialized = serializeMessagePack(testData.manifest);
      const deserialized = deserializeMessagePack(serialized.data!);
      expect(deserialized.data).toEqual(testData.manifest);
    });

    it('should round-trip gtype data', () => {
      const serialized = serializeMessagePack(testData.gtype);
      const deserialized = deserializeMessagePack(serialized.data!);
      expect(deserialized.data).toEqual(testData.gtype);
    });

    it('should handle complex nested objects', () => {
      const complex = {
        nested: {
          deep: {
            value: 'test',
            array: [1, 2, 3],
            obj: { key: 'value' },
          },
        },
      };
      const serialized = serializeMessagePack(complex);
      const deserialized = deserializeMessagePack(serialized.data!);
      expect(deserialized.data).toEqual(complex);
    });

    it('should be more compact than JSON', () => {
      const jsonResult = serializeJSON(testData.envelope);
      const msgpackResult = serializeMessagePack(testData.envelope);
      
      expect(msgpackResult.data!.length).toBeLessThan(jsonResult.data!.length);
    });
  });

  describe('Cross-Format Compatibility', () => {
    it('should maintain data integrity across formats', () => {
      const original = testData.envelope;
      
      // JSON round-trip
      const jsonSerialized = serializeJSON(original);
      const jsonDeserialized = deserializeJSON(jsonSerialized.data!);
      
      // MessagePack round-trip
      const msgpackSerialized = serializeMessagePack(original);
      const msgpackDeserialized = deserializeMessagePack(msgpackSerialized.data!);
      
      // Both should equal original
      expect(jsonDeserialized.data).toEqual(original);
      expect(msgpackDeserialized.data).toEqual(original);
      expect(jsonDeserialized.data).toEqual(msgpackDeserialized.data);
    });
  });
});
