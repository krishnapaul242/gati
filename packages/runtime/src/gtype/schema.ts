/**
 * @module runtime/gtype/schema
 * @description GType schema definitions for runtime type validation
 */

/**
 * Primitive type kinds
 */
export type PrimitiveKind = 'string' | 'number' | 'boolean' | 'null' | 'undefined';

/**
 * GType kind discriminator
 */
export type GTypeKind = 'primitive' | 'object' | 'array' | 'union' | 'intersection' | 'literal' | 'tuple' | 'enum';

/**
 * Base GType interface
 */
export interface GTypeBase {
  kind: GTypeKind;
  description?: string;
  optional?: boolean;
  nullable?: boolean;
  validators?: Validator[];
}

/**
 * Primitive GType
 */
export interface GTypePrimitive extends GTypeBase {
  kind: 'primitive';
  primitiveType: PrimitiveKind;
}

/**
 * Literal GType (specific value)
 */
export interface GTypeLiteral extends GTypeBase {
  kind: 'literal';
  value: string | number | boolean | null;
}

/**
 * Object GType
 */
export interface GTypeObject extends GTypeBase {
  kind: 'object';
  properties: Record<string, GType>;
  required?: string[];
  additionalProperties?: boolean | GType;
}

/**
 * Array GType
 */
export interface GTypeArray extends GTypeBase {
  kind: 'array';
  items: GType;
  minItems?: number;
  maxItems?: number;
}

/**
 * Tuple GType (fixed-length array with specific types)
 */
export interface GTypeTuple extends GTypeBase {
  kind: 'tuple';
  items: GType[];
}

/**
 * Union GType (one of several types)
 */
export interface GTypeUnion extends GTypeBase {
  kind: 'union';
  types: GType[];
}

/**
 * Intersection GType (all of several types)
 */
export interface GTypeIntersection extends GTypeBase {
  kind: 'intersection';
  types: GType[];
}

/**
 * Enum GType (one of specific values)
 */
export interface GTypeEnum extends GTypeBase {
  kind: 'enum';
  values: (string | number)[];
}

/**
 * Union of all GType variants
 */
export type GType =
  | GTypePrimitive
  | GTypeLiteral
  | GTypeObject
  | GTypeArray
  | GTypeTuple
  | GTypeUnion
  | GTypeIntersection
  | GTypeEnum;

/**
 * Validator types
 */
export type ValidatorType =
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'uuid'
  | 'enum'
  | 'custom';

/**
 * Validator definition
 */
export interface Validator {
  type: ValidatorType;
  value?: unknown;
  message?: string;
  fn?: (value: unknown) => boolean;
}

/**
 * GType reference (for recursive types)
 */
export interface GTypeRef {
  $ref: string;
}

/**
 * GType schema with definitions
 */
export interface GTypeSchema {
  $id?: string;
  $schema?: string;
  type: GType;
  definitions?: Record<string, GType>;
}

/**
 * Create a primitive GType
 */
export function primitive(
  primitiveType: PrimitiveKind,
  options?: Partial<GTypeBase>
): GTypePrimitive {
  return {
    kind: 'primitive',
    primitiveType,
    ...options,
  };
}

/**
 * Create a literal GType
 */
export function literal(
  value: string | number | boolean | null,
  options?: Partial<GTypeBase>
): GTypeLiteral {
  return {
    kind: 'literal',
    value,
    ...options,
  };
}

/**
 * Create an object GType
 */
export function object(
  properties: Record<string, GType>,
  options?: Partial<Omit<GTypeObject, 'kind' | 'properties'>>
): GTypeObject {
  return {
    kind: 'object',
    properties,
    ...options,
  };
}

/**
 * Create an array GType
 */
export function array(
  items: GType,
  options?: Partial<Omit<GTypeArray, 'kind' | 'items'>>
): GTypeArray {
  return {
    kind: 'array',
    items,
    ...options,
  };
}

/**
 * Create a tuple GType
 */
export function tuple(
  items: GType[],
  options?: Partial<GTypeBase>
): GTypeTuple {
  return {
    kind: 'tuple',
    items,
    ...options,
  };
}

/**
 * Create a union GType
 */
export function union(
  types: GType[],
  options?: Partial<GTypeBase>
): GTypeUnion {
  return {
    kind: 'union',
    types,
    ...options,
  };
}

/**
 * Create an intersection GType
 */
export function intersection(
  types: GType[],
  options?: Partial<GTypeBase>
): GTypeIntersection {
  return {
    kind: 'intersection',
    types,
    ...options,
  };
}

/**
 * Create an enum GType
 */
export function enumType(
  values: (string | number)[],
  options?: Partial<GTypeBase>
): GTypeEnum {
  return {
    kind: 'enum',
    values,
    ...options,
  };
}

/**
 * Common GType helpers
 */
export const GTypes = {
  string: () => primitive('string'),
  number: () => primitive('number'),
  boolean: () => primitive('boolean'),
  null: () => primitive('null'),
  undefined: () => primitive('undefined'),
  
  optional: (type: GType): GType => ({ ...type, optional: true }),
  nullable: (type: GType): GType => ({ ...type, nullable: true }),
  
  stringWithPattern: (pattern: string, message?: string) =>
    primitive('string', {
      validators: [{ type: 'pattern', value: pattern, message }],
    }),
  
  email: () =>
    primitive('string', {
      validators: [{ type: 'email', message: 'Must be a valid email' }],
    }),
  
  url: () =>
    primitive('string', {
      validators: [{ type: 'url', message: 'Must be a valid URL' }],
    }),
  
  uuid: () =>
    primitive('string', {
      validators: [{ type: 'uuid', message: 'Must be a valid UUID' }],
    }),
  
  minLength: (min: number, message?: string) =>
    primitive('string', {
      validators: [{ type: 'minLength', value: min, message }],
    }),
  
  maxLength: (max: number, message?: string) =>
    primitive('string', {
      validators: [{ type: 'maxLength', value: max, message }],
    }),
  
  min: (min: number, message?: string) =>
    primitive('number', {
      validators: [{ type: 'min', value: min, message }],
    }),
  
  max: (max: number, message?: string) =>
    primitive('number', {
      validators: [{ type: 'max', value: max, message }],
    }),
};
