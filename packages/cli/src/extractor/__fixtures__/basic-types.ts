/**
 * @file basic-types.ts
 * @description Basic primitive types and simple branded types for testing
 */

// Primitives
export type StringType = string;
export type NumberType = number;
export type BooleanType = boolean;
export type NullType = null;
export type UndefinedType = undefined;

// Simple branded types
export type EmailString = string & { __brand: 'email' };
export type UserID = string & { __brand: 'userId' };
export type Age = number & { __brand: 'age' };

// Simple constraints
export type ShortString = string & { __maxLen: 100 };
export type LongString = string & { __minLen: 500 };
export type BoundedString = string & { __minLen: 10 } & { __maxLen: 100 };

export type PositiveNumber = number & { __min: 0 };
export type NegativeNumber = number & { __max: 0 };
export type BoundedNumber = number & { __min: 10 } & { __max: 100 };

// Pattern constraints
export type HexString = string & { __pattern: '^[0-9a-fA-F]+$' };
export type AlphanumericString = string & { __pattern: '^[a-zA-Z0-9]+$' };

// Multiple of constraints
export type EvenNumber = number & { __multipleOf: 2 };
export type DivisibleBy10 = number & { __multipleOf: 10 };
