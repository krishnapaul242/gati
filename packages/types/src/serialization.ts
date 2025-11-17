/**
 * @module serialization
 * @description GType serialization, deserialization, and fingerprinting
 */

import { createHash } from 'crypto';
import type { GType, GTypeSchema } from './gtype.js';
import { GTYPE_SCHEMA_VERSION } from './gtype.js';

/**
 * Serialize GType to JSON string
 * 
 * @param gtype - GType to serialize
 * @param pretty - Whether to pretty-print JSON
 * @returns JSON string
 * 
 * @example
 * ```typescript
 * const serialized = serializeGType(myType, true);
 * console.log(serialized);
 * ```
 */
export function serializeGType(gtype: GType | GTypeSchema, pretty = false): string {
  return JSON.stringify(gtype, null, pretty ? 2 : 0);
}

/**
 * Deserialize JSON string to GType
 * Handles version migration automatically
 * 
 * @param json - JSON string
 * @returns Parsed GType
 * @throws {Error} If JSON is invalid or migration fails
 * 
 * @example
 * ```typescript
 * const gtype = deserializeGType(jsonString);
 * ```
 */
export function deserializeGType(json: string): GType | GTypeSchema {
  try {
    const parsed = JSON.parse(json) as GType | GTypeSchema;
    
    // Check if it's a GTypeSchema (has root property)
    const isSchema = 'root' in parsed;
    
    if (isSchema) {
      const schema = parsed as GTypeSchema;
      
      // Handle version migration
      if (!schema.version) {
        // Pre-v1.0 schema - add version field
        schema.version = '1.0';
      } else if (schema.version !== GTYPE_SCHEMA_VERSION) {
        // Future version migration logic goes here
        // For now, we only support 1.0
        if (schema.version > GTYPE_SCHEMA_VERSION) {
          throw new Error(
            `GType schema version ${schema.version} is newer than supported version ${GTYPE_SCHEMA_VERSION}. ` +
            `Please update @gati-framework/types.`
          );
        }
        
        // Migrate from older versions
        migrateSchema(schema);
      }
      
      return schema;
    } else {
      const gtype = parsed as GType;
      
      // Add version field if missing (pre-v1.0)
      if (!gtype.version) {
        gtype.version = '1.0';
      }
      
      return gtype;
    }
  } catch (error) {
    throw new Error(
      `Failed to deserialize GType: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Migrate schema from older versions to current version
 * 
 * @param schema - Schema to migrate (mutates in place)
 */
function migrateSchema(schema: GTypeSchema): void {
  // Future migration logic will go here
  // For now, we only support 1.0, so this is a no-op
  schema.version = GTYPE_SCHEMA_VERSION;
}

/**
 * Generate a stable fingerprint (SHA-256 hash) of a GType
 * Used for schema comparison and caching
 * 
 * @param gtype - GType to fingerprint
 * @returns SHA-256 hash (hex string)
 * 
 * @example
 * ```typescript
 * const hash1 = fingerprint(type1);
 * const hash2 = fingerprint(type2);
 * 
 * if (hash1 === hash2) {
 *   console.log('Types are identical');
 * }
 * ```
 */
export function fingerprint(gtype: GType | GTypeSchema): string {
  // Normalize: serialize without version field for stable hashing
  const normalized = normalizeForFingerprint(gtype);
  const serialized = serializeGType(normalized, false);
  
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Normalize GType for fingerprinting
 * Removes version field and sorts keys for consistent hashing
 * 
 * @param gtype - GType to normalize
 * @returns Normalized copy
 */
function normalizeForFingerprint(gtype: GType | GTypeSchema): GType | GTypeSchema {
  // Deep clone to avoid mutation
  const clone = JSON.parse(JSON.stringify(gtype)) as GType | GTypeSchema;
  
  // Remove version field for stable hashing across versions
  // Use destructuring to avoid delete operator issue with TypeScript
  const { version: _version, ...withoutVersion } = clone as typeof clone & { version?: string };
  
  // Sort object keys recursively for deterministic output
  return sortKeys(withoutVersion as GType | GTypeSchema);
}

/**
 * Recursively sort object keys for deterministic serialization
 * 
 * @param obj - Object to sort
 * @returns Sorted object
 */
function sortKeys<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortKeys) as T;
  }
  
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  
  return sorted as T;
}

/**
 * Compare two GTypes for structural equality
 * More efficient than comparing fingerprints for simple checks
 * 
 * @param a - First GType
 * @param b - Second GType
 * @returns True if types are structurally equal
 * 
 * @example
 * ```typescript
 * if (areGTypesEqual(type1, type2)) {
 *   console.log('Types are equivalent');
 * }
 * ```
 */
export function areGTypesEqual(a: GType | GTypeSchema, b: GType | GTypeSchema): boolean {
  // Fast path: fingerprint comparison
  return fingerprint(a) === fingerprint(b);
}

/**
 * Create a deep copy of a GType
 * 
 * @param gtype - GType to clone
 * @returns Deep copy
 */
export function cloneGType<T extends GType | GTypeSchema>(gtype: T): T {
  return JSON.parse(JSON.stringify(gtype)) as T;
}

/**
 * Validate a GType schema for correctness
 * 
 * @param gtype - GType to validate
 * @returns Validation result with errors
 * 
 * @example
 * ```typescript
 * const result = validateGTypeSchema(myType);
 * if (!result.valid) {
 *   console.error('Schema errors:', result.errors);
 * }
 * ```
 */
export function validateGTypeSchema(gtype: GType | GTypeSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check version field
  if (!gtype.version) {
    errors.push('Missing version field');
  } else if (gtype.version > GTYPE_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version: ${gtype.version}`);
  }
  
  // Check type field
  if (!('type' in gtype) && !('root' in gtype)) {
    errors.push('Missing type or root field');
  }
  
  // Additional validation logic can be added here
  // - Check for circular references without $ref
  // - Validate constraint values
  // - Check for invalid type combinations
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
