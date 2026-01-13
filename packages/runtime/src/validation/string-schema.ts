/**
 * @module runtime/validation/string-schema
 * @description String-based schema notation for simplified type definitions
 */

import type { GType } from '../gtype/schema.js';
import { primitive, array, union, object } from '../gtype/schema.js';

/**
 * Parse string schema notation to GType
 */
export function parseStringSchema(schema: string): GType {
  const trimmed = schema.trim();
  
  // Handle unions (e.g., 'admin | user')
  if (trimmed.includes('|')) {
    const types = trimmed.split('|').map(t => parseStringSchema(t.trim()));
    return union(types);
  }
  
  // Handle arrays (e.g., 'string[]')
  if (trimmed.endsWith('[]')) {
    const elementType = trimmed.slice(0, -2).trim();
    return array(parseStringSchema(elementType));
  }
  
  // Handle optional (e.g., 'string?')
  if (trimmed.endsWith('?')) {
    const baseType = trimmed.slice(0, -1).trim();
    return union([parseStringSchema(baseType), primitive('null')]);
  }
  
  // Handle primitives
  if (['string', 'number', 'boolean', 'null'].includes(trimmed)) {
    return primitive(trimmed as 'string' | 'number' | 'boolean' | 'null');
  }
  
  // Default to string
  return primitive('string');
}

/**
 * Parse object schema with string notation
 */
export function parseObjectSchema(schema: Record<string, string>): GType {
  const properties: Record<string, GType> = {};
  
  for (const [key, value] of Object.entries(schema)) {
    properties[key] = parseStringSchema(value);
  }
  
  return object(properties);
}

/**
 * Type guard for string schema
 */
export function isStringSchema(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z|[\]?]+$/i.test(value);
}

/**
 * Type guard for object schema
 */
export function isObjectSchema(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every(v => typeof v === 'string');
}
