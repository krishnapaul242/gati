/**
 * @module cli/extractor/params-extractor
 * @description Extract PARAMS type from route file path
 */

import type { GType } from '@gati-framework/types/gtype';

/**
 * Extract PARAMS from route file path
 * 
 * @example
 * extractParams('handlers/todos/[id].ts') → { id: string }
 * extractParams('handlers/users/[userId]/posts/[postId].ts') → { userId: string, postId: string }
 */
export function extractParams(filePath: string): GType | null {
  const paramPattern = /\[([^\]]+)\]/g;
  const matches = [...filePath.matchAll(paramPattern)];
  
  if (matches.length === 0) {
    return null;
  }
  
  const properties: Record<string, { type: GType; required: boolean }> = {};
  const required: string[] = [];
  
  for (const match of matches) {
    const paramName = match[1];
    properties[paramName] = {
      type: { version: '1.0', type: 'string' },
      required: true
    };
    required.push(paramName);
  }
  
  return {
    version: '1.0',
    type: 'object',
    properties,
    required
  };
}

/**
 * Validate params usage against extracted schema
 */
export function validateParamsUsage(
  extractedParams: GType | null,
  usedParams: string[]
): { valid: boolean; missing: string[]; extra: string[] } {
  if (!extractedParams || extractedParams.type !== 'object') {
    return { valid: true, missing: [], extra: usedParams };
  }
  
  const expectedParams = Object.keys(extractedParams.properties || {});
  const missing = expectedParams.filter(p => !usedParams.includes(p));
  const extra = usedParams.filter(p => !expectedParams.includes(p));
  
  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra
  };
}
