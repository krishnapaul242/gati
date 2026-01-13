/**
 * @module cli/extractor/__tests__/extractors
 * @description Tests for type extractors
 */

import { describe, it, expect } from 'vitest';
import { extractParams, validateParamsUsage } from '../params-extractor';

describe('PARAMS Extractor', () => {
  it('should extract single param from route', () => {
    const schema = extractParams('handlers/todos/[id].ts');
    
    expect(schema).toEqual({
      version: '1.0',
      type: 'object',
      properties: {
        id: {
          type: { version: '1.0', type: 'string' },
          required: true
        }
      },
      required: ['id']
    });
  });

  it('should extract multiple params from route', () => {
    const schema = extractParams('handlers/users/[userId]/posts/[postId].ts');
    
    expect(schema).toEqual({
      version: '1.0',
      type: 'object',
      properties: {
        userId: {
          type: { version: '1.0', type: 'string' },
          required: true
        },
        postId: {
          type: { version: '1.0', type: 'string' },
          required: true
        }
      },
      required: ['userId', 'postId']
    });
  });

  it('should return null for routes without params', () => {
    const schema = extractParams('handlers/todos.ts');
    expect(schema).toBeNull();
  });

  it('should validate params usage', () => {
    const schema = extractParams('handlers/todos/[id].ts');
    
    const valid = validateParamsUsage(schema, ['id']);
    expect(valid).toEqual({ valid: true, missing: [], extra: [] });
    
    const missing = validateParamsUsage(schema, []);
    expect(missing).toEqual({ valid: false, missing: ['id'], extra: [] });
    
    const extra = validateParamsUsage(schema, ['id', 'userId']);
    expect(extra).toEqual({ valid: false, missing: [], extra: ['userId'] });
  });
});
