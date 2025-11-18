/**
 * @file constraint-properties.ts
 * @description Explicit boolean flag variations for branch coverage testing
 * 
 * This file contains type definitions with __positive, __negative, and __integer
 * flags set to both true AND false to ensure complete branch coverage in
 * constraint-extractor.ts extractNumberConstraints() method.
 */

// __positive flag variations
export type PositiveNumberTrue = number & { __positive: true };
export type PositiveNumberFalse = number & { __positive: false };

// __negative flag variations
export type NegativeNumberTrue = number & { __negative: true };
export type NegativeNumberFalse = number & { __negative: false };

// __integer flag variations
export type IntegerNumberTrue = number & { __integer: true };
export type IntegerNumberFalse = number & { __integer: false };

// Combined variations for testing precedence
export type PositiveIntegerTrue = number & { __positive: true } & { __integer: true };
export type PositiveIntegerFalse = number & { __positive: false } & { __integer: false };

export type NegativeIntegerTrue = number & { __negative: true } & { __integer: true };
export type NegativeIntegerFalse = number & { __negative: false } & { __integer: false };

// With explicit min/max constraints (should override boolean flags)
export type PositiveTrueWithMin = number & { __positive: true } & { __min: 10 };
export type PositiveFalseWithMin = number & { __positive: false } & { __min: 10 };

export type NegativeTrueWithMax = number & { __negative: true } & { __max: -5 };
export type NegativeFalseWithMax = number & { __negative: false } & { __max: -5 };

// Edge case: conflicting flags (should use explicit constraints)
export type ConflictingFlags = number & { __positive: true } & { __negative: true };
export type ConflictingWithExplicit = number & { __positive: true } & { __min: -100 };
