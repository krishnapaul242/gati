/**
 * @module runtime/gtype/errors
 * @description Validation error types and formatting
 */

import type { GType } from './schema.js';

/**
 * Validation error path segment
 */
export type PathSegment = string | number;

/**
 * Validation error details
 */
export interface ValidationError {
  /**
   * Path to the field that failed validation
   */
  path: PathSegment[];
  
  /**
   * Expected type or constraint
   */
  expected: string;
  
  /**
   * Actual value received
   */
  actual: unknown;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * GType that was being validated against
   */
  schema?: GType;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;
  
  /**
   * List of validation errors (empty if valid)
   */
  errors: ValidationError[];
}

/**
 * Create a validation error
 */
export function createValidationError(
  path: PathSegment[],
  expected: string,
  actual: unknown,
  message?: string,
  schema?: GType
): ValidationError {
  return {
    path,
    expected,
    actual,
    message: message || `Expected ${expected}, got ${formatValue(actual)}`,
    schema,
  };
}

/**
 * Format a value for error messages
 */
export function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `array[${value.length}]`;
  if (typeof value === 'object') return 'object';
  return String(value);
}

/**
 * Format a path for error messages
 */
export function formatPath(path: PathSegment[]): string {
  if (path.length === 0) return '(root)';
  
  return path
    .map((segment, index) => {
      if (typeof segment === 'number') {
        return `[${segment}]`;
      }
      return index === 0 ? segment : `.${segment}`;
    })
    .join('');
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return 'No validation errors';
  
  return errors
    .map((error) => {
      const path = formatPath(error.path);
      return `  - ${path}: ${error.message}`;
    })
    .join('\n');
}

/**
 * Create a successful validation result
 */
export function validResult(): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Create a failed validation result
 */
export function invalidResult(errors: ValidationError[]): ValidationResult {
  return {
    valid: false,
    errors,
  };
}

/**
 * Merge multiple validation results
 */
export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  
  return allErrors.length === 0
    ? validResult()
    : invalidResult(allErrors);
}

/**
 * Validation exception
 */
export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    message?: string
  ) {
    super(message || `Validation failed with ${errors.length} error(s):\n${formatValidationErrors(errors)}`);
    this.name = 'ValidationException';
    Error.captureStackTrace(this, ValidationException);
  }
  
  /**
   * Get formatted error message
   */
  getFormattedErrors(): string {
    return formatValidationErrors(this.errors);
  }
  
  /**
   * Get errors for a specific path
   */
  getErrorsForPath(path: PathSegment[]): ValidationError[] {
    const pathStr = formatPath(path);
    return this.errors.filter((e) => formatPath(e.path) === pathStr);
  }
  
  /**
   * Check if a specific path has errors
   */
  hasErrorsForPath(path: PathSegment[]): boolean {
    return this.getErrorsForPath(path).length > 0;
  }
}
