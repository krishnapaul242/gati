/**
 * @module @gati-framework/types
 * @description Gati Type System - TypeScript-first branded types and constraint combinators
 */

/**
 * Brand helper - attach semantic tag to primitive types
 * Zero runtime cost - exists only at compile time
 * 
 * @example
 * ```typescript
 * type Email = string & Brand<'email'>;
 * type UUID = string & Brand<'uuid'>;
 * ```
 */
export type Brand<Name extends string> = {
  readonly __gati_brand?: Name;
};

/**
 * Minimum value constraint for numbers
 * 
 * @example
 * ```typescript
 * type Age = number & Min<0>;
 * type Port = number & Min<1> & Max<65535>;
 * ```
 */
export type Min<N extends number> = {
  readonly __gati_min?: N;
};

/**
 * Maximum value constraint for numbers
 * 
 * @example
 * ```typescript
 * type Percentage = number & Min<0> & Max<100>;
 * ```
 */
export type Max<N extends number> = {
  readonly __gati_max?: N;
};

/**
 * Minimum length constraint for strings
 * 
 * @example
 * ```typescript
 * type Password = string & MinLen<8>;
 * type Username = string & MinLen<3> & MaxLen<20>;
 * ```
 */
export type MinLen<N extends number> = {
  readonly __gati_minLen?: N;
};

/**
 * Maximum length constraint for strings
 * 
 * @example
 * ```typescript
 * type ShortString = string & MaxLen<100>;
 * ```
 */
export type MaxLen<N extends number> = {
  readonly __gati_maxLen?: N;
};

/**
 * Regex pattern constraint for strings
 * 
 * @example
 * ```typescript
 * type Slug = string & Pattern<'^[a-z0-9-]+$'>;
 * type HexColor = string & Pattern<'^#[0-9a-fA-F]{6}$'>;
 * ```
 */
export type Pattern<S extends string> = {
  readonly __gati_pattern?: S;
};

/**
 * Enum constraint for literal unions
 * 
 * @example
 * ```typescript
 * type UserRole = Enum<'admin' | 'user' | 'guest'>;
 * type HttpMethod = Enum<'GET' | 'POST' | 'PUT' | 'DELETE'>;
 * ```
 */
export type Enum<T extends string | number> = {
  readonly __gati_enum?: T;
};

/**
 * Nullable type helper - allows null
 * 
 * @example
 * ```typescript
 * type OptionalEmail = Nullable<Email>;
 * ```
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper - allows undefined
 * 
 * @example
 * ```typescript
 * type MaybeString = Optional<string>;
 * ```
 */
export type Optional<T> = T | undefined;

// Re-export registry and brands
export * from './registry.js';
export * from './brands/index.js';

// Re-export GType schema definitions
export type {
  GType,
  GTypeSchema,
  GPrimitive,
  GObject,
  GArray,
  GTuple,
  GUnion,
  GIntersection,
  GEnum,
  GRef,
  GLiteral,
  GAny,
  GUnknown,
  GNever,
  GBase,
  GObjectProperty,
  StringConstraints,
  NumberConstraints,
  PrimitiveKind,
} from './gtype.js';

export {
  GTYPE_SCHEMA_VERSION,
  isPrimitive,
  isObject,
  isArray,
  isTuple,
  isUnion,
  isIntersection,
  isEnum,
  isRef,
  isLiteral,
} from './gtype.js';

// Re-export serialization utilities
export {
  serializeGType,
  deserializeGType,
  fingerprint,
  areGTypesEqual,
  cloneGType,
  validateGTypeSchema,
} from './serialization.js';
