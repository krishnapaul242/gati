/**
 * @module contracts/types/gtype
 * @description GType minimal schema type system for validation and analysis
 */

/**
 * GType kind discriminator
 */
export type GTypeKind = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'object' 
  | 'array' 
  | 'union' 
  | 'enum' 
  | 'ref' 
  | 'tuple' 
  | 'null';

/**
 * Base type for all GTypes
 */
export interface GTypeBase {
  /** Type kind discriminator */
  kind: GTypeKind;
  
  /** Whether type is nullable */
  nullable?: boolean;
  
  /** Type description */
  description?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Primitive type (string, number, boolean)
 */
export interface GPrimitiveType extends GTypeBase {
  kind: 'string' | 'number' | 'boolean';
  
  /** Brand for nominal typing */
  brand?: string;
  
  /** Minimum value (number) or length (string) */
  min?: number;
  
  /** Maximum value (number) or length (string) */
  max?: number;
  
  /** Minimum length (string only) */
  minLength?: number;
  
  /** Maximum length (string only) */
  maxLength?: number;
  
  /** Pattern regex (string only) */
  pattern?: string;
}

/**
 * Object type with properties
 */
export interface GObjectType extends GTypeBase {
  kind: 'object';
  
  /** Object properties */
  properties: Record<string, GType>;
  
  /** Required property names */
  required?: string[];
  
  /** Allow additional properties */
  additionalProperties?: boolean;
}

/**
 * Array type
 */
export interface GArrayType extends GTypeBase {
  kind: 'array';
  
  /** Array item type */
  items: GType;
  
  /** Minimum items */
  minItems?: number;
  
  /** Maximum items */
  maxItems?: number;
}

/**
 * Reference type for schema reuse
 */
export interface GRefType extends GTypeBase {
  kind: 'ref';
  
  /** Reference identifier */
  refId: string;
}

/**
 * Union of all GType variants
 */
export type GType = 
  | GPrimitiveType 
  | GObjectType 
  | GArrayType 
  | GRefType;
