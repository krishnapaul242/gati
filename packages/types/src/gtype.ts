/**
 * @module gtype
 * @description GType schema definitions - Gati's runtime type representation
 * 
 * GType is a JSON-serializable schema format that:
 * - Represents TypeScript branded types at runtime
 * - Enables schema diffing for Timescape version management
 * - Compiles to Ajv validators for high-performance validation
 * - Generates OpenAPI specifications automatically
 * - Supports version migration with schema version field
 */

/**
 * Schema version for migration support
 */
export const GTYPE_SCHEMA_VERSION = '1.0';

/**
 * Base GType interface - all GTypes extend this
 */
export interface GBase {
  /**
   * Schema version for migration support
   */
  version: string;

  /**
   * Type discriminator
   */
  type: string;

  /**
   * Whether this type is nullable (allows null)
   */
  nullable?: boolean;

  /**
   * Whether this type is optional (allows undefined)
   */
  optional?: boolean;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Default value (must match the type)
   */
  default?: unknown;

  /**
   * Custom metadata for extensions
   */
  metadata?: Record<string, unknown>;
}

/**
 * Primitive type kinds
 */
export type PrimitiveKind = 'string' | 'number' | 'boolean' | 'null' | 'bigint' | 'symbol';

/**
 * String constraints
 */
export interface StringConstraints {
  /**
   * Minimum length (inclusive)
   */
  minLength?: number;

  /**
   * Maximum length (inclusive)
   */
  maxLength?: number;

  /**
   * Regular expression pattern (as string)
   */
  pattern?: string;

  /**
   * Format validation (e.g., 'email', 'uuid', 'url')
   */
  format?: string;

  /**
   * Brand name for branded types
   */
  brand?: string;
}

/**
 * Number constraints
 */
export interface NumberConstraints {
  /**
   * Minimum value (inclusive)
   */
  minimum?: number;

  /**
   * Maximum value (inclusive)
   */
  maximum?: number;

  /**
   * Exclusive minimum value
   */
  exclusiveMinimum?: number;

  /**
   * Exclusive maximum value
   */
  exclusiveMaximum?: number;

  /**
   * Value must be a multiple of this number
   */
  multipleOf?: number;

  /**
   * Whether value must be an integer
   */
  integer?: boolean;

  /**
   * Brand name for branded types (e.g., 'positive', 'port')
   */
  brand?: string;
}

/**
 * Primitive GType (string, number, boolean, etc.)
 */
export interface GPrimitive extends GBase {
  type: PrimitiveKind;

  /**
   * Brand name for branded types (e.g., 'email', 'uuid', 'userId')
   */
  brand?: string;

  /**
   * String-specific constraints
   */
  constraints?: StringConstraints;

  /**
   * Number-specific constraints
   */
  numberConstraints?: NumberConstraints;
}

/**
 * Object property definition
 */
export interface GObjectProperty {
  /**
   * Property type (nested GType)
   */
  type: GType;

  /**
   * Whether property is required
   */
  required?: boolean;

  /**
   * Property description
   */
  description?: string;
}

/**
 * Object GType
 */
export interface GObject extends GBase {
  type: 'object';

  /**
   * Object properties
   */
  properties: Record<string, GObjectProperty>;

  /**
   * Required property names (alternative to per-property required flag)
   */
  required?: string[];

  /**
   * Whether additional properties are allowed
   */
  additionalProperties?: boolean | GType;

  /**
   * Minimum number of properties
   */
  minProperties?: number;

  /**
   * Maximum number of properties
   */
  maxProperties?: number;
}

/**
 * Array GType
 */
export interface GArray extends GBase {
  type: 'array';

  /**
   * Array item type
   */
  items: GType;

  /**
   * Minimum array length
   */
  minItems?: number;

  /**
   * Maximum array length
   */
  maxItems?: number;

  /**
   * Whether all items must be unique
   */
  uniqueItems?: boolean;
}

/**
 * Tuple GType (fixed-length array with typed positions)
 */
export interface GTuple extends GBase {
  type: 'tuple';

  /**
   * Types for each position
   */
  items: GType[];

  /**
   * Minimum tuple length (usually same as items.length)
   */
  minItems?: number;

  /**
   * Maximum tuple length (usually same as items.length)
   */
  maxItems?: number;
}

/**
 * Union GType (type A | type B)
 */
export interface GUnion extends GBase {
  type: 'union';

  /**
   * Union member types
   */
  anyOf: GType[];
}

/**
 * Intersection GType (type A & type B)
 */
export interface GIntersection extends GBase {
  type: 'intersection';

  /**
   * Intersection member types
   */
  allOf: GType[];
}

/**
 * Enum GType (literal value union)
 */
export interface GEnum extends GBase {
  type: 'enum';

  /**
   * Allowed values
   */
  values: (string | number | boolean)[];

  /**
   * Base type of enum values
   */
  baseType?: 'string' | 'number' | 'boolean';
}

/**
 * Reference GType (for recursive/circular types)
 */
export interface GRef extends GBase {
  type: 'ref';

  /**
   * Reference path (e.g., '#/definitions/User')
   */
  $ref: string;
}

/**
 * Literal GType (specific constant value)
 */
export interface GLiteral extends GBase {
  type: 'literal';

  /**
   * The literal value
   */
  value: string | number | boolean | null;
}

/**
 * Any GType (no constraints)
 */
export interface GAny extends GBase {
  type: 'any';
}

/**
 * Unknown GType (unknown type)
 */
export interface GUnknown extends GBase {
  type: 'unknown';
}

/**
 * Never GType (impossible type)
 */
export interface GNever extends GBase {
  type: 'never';
}

/**
 * Union of all GType variants
 */
export type GType =
  | GPrimitive
  | GObject
  | GArray
  | GTuple
  | GUnion
  | GIntersection
  | GEnum
  | GRef
  | GLiteral
  | GAny
  | GUnknown
  | GNever;

/**
 * Complete GType schema with definitions
 */
export interface GTypeSchema {
  /**
   * Schema version for migration
   */
  version: string;

  /**
   * Root type
   */
  root: GType;

  /**
   * Type definitions (for references)
   */
  definitions?: Record<string, GType>;

  /**
   * Schema metadata
   */
  metadata?: {
    /**
     * Source file path
     */
    source?: string;

    /**
     * Generated timestamp
     */
    generated?: number;

    /**
     * Handler/module name
     */
    name?: string;

    /**
     * Additional custom metadata
     */
    [key: string]: unknown;
  };
}

/**
 * Type guard: Check if a GType is a primitive
 */
export function isPrimitive(gtype: GType): gtype is GPrimitive {
  return ['string', 'number', 'boolean', 'null', 'bigint', 'symbol'].includes(gtype.type);
}

/**
 * Type guard: Check if a GType is an object
 */
export function isObject(gtype: GType): gtype is GObject {
  return gtype.type === 'object';
}

/**
 * Type guard: Check if a GType is an array
 */
export function isArray(gtype: GType): gtype is GArray {
  return gtype.type === 'array';
}

/**
 * Type guard: Check if a GType is a tuple
 */
export function isTuple(gtype: GType): gtype is GTuple {
  return gtype.type === 'tuple';
}

/**
 * Type guard: Check if a GType is a union
 */
export function isUnion(gtype: GType): gtype is GUnion {
  return gtype.type === 'union';
}

/**
 * Type guard: Check if a GType is an intersection
 */
export function isIntersection(gtype: GType): gtype is GIntersection {
  return gtype.type === 'intersection';
}

/**
 * Type guard: Check if a GType is an enum
 */
export function isEnum(gtype: GType): gtype is GEnum {
  return gtype.type === 'enum';
}

/**
 * Type guard: Check if a GType is a reference
 */
export function isRef(gtype: GType): gtype is GRef {
  return gtype.type === 'ref';
}

/**
 * Type guard: Check if a GType is a literal
 */
export function isLiteral(gtype: GType): gtype is GLiteral {
  return gtype.type === 'literal';
}
