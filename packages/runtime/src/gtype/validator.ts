/**
 * @module runtime/gtype/validator
 * @description GType validator implementation
 */

import type {
  GType,
  GTypePrimitive,
  GTypeObject,
  GTypeArray,
  GTypeTuple,
  GTypeUnion,
  GTypeIntersection,
  GTypeLiteral,
  GTypeEnum,
  Validator as ValidatorDef,
} from './schema.js';
import type { PathSegment, ValidationError, ValidationResult } from './errors.js';
import {
  createValidationError,
  validResult,
  invalidResult,
  mergeResults,
} from './errors.js';

/**
 * Validate a value against a GType schema
 */
export function validate(value: unknown, schema: GType, path: PathSegment[] = []): ValidationResult {
  // Special case: if schema explicitly expects undefined, allow it
  if (schema.kind === 'primitive' && schema.primitiveType === 'undefined') {
    if (value === undefined) {
      return validResult();
    }
    return invalidResult([
      createValidationError(path, 'undefined', value, undefined, schema),
    ]);
  }
  
  // Handle optional
  if (schema.optional && value === undefined) {
    return validResult();
  }
  
  // Handle nullable
  if (schema.nullable && value === null) {
    return validResult();
  }
  
  // Check for required value
  if (!schema.optional && value === undefined) {
    return invalidResult([
      createValidationError(path, 'defined value', value, 'Value is required', schema),
    ]);
  }
  
  // Validate based on kind
  let result: ValidationResult;
  
  switch (schema.kind) {
    case 'primitive':
      result = validatePrimitive(value, schema, path);
      break;
    case 'literal':
      result = validateLiteral(value, schema, path);
      break;
    case 'object':
      result = validateObject(value, schema, path);
      break;
    case 'array':
      result = validateArray(value, schema, path);
      break;
    case 'tuple':
      result = validateTuple(value, schema, path);
      break;
    case 'union':
      result = validateUnion(value, schema, path);
      break;
    case 'intersection':
      result = validateIntersection(value, schema, path);
      break;
    case 'enum':
      result = validateEnum(value, schema, path);
      break;
    default:
      return invalidResult([
        createValidationError(path, 'known type', value, `Unknown schema kind: ${(schema as GType).kind}`),
      ]);
  }
  
  // Apply custom validators
  if (result.valid && schema.validators) {
    const validatorErrors = validateCustom(value, schema.validators, path, schema);
    if (validatorErrors.length > 0) {
      result = invalidResult(validatorErrors);
    }
  }
  
  return result;
}

/**
 * Validate primitive type
 */
function validatePrimitive(
  value: unknown,
  schema: GTypePrimitive,
  path: PathSegment[]
): ValidationResult {
  const actualType = value === null ? 'null' : typeof value;
  
  if (actualType !== schema.primitiveType) {
    return invalidResult([
      createValidationError(path, schema.primitiveType, value, undefined, schema),
    ]);
  }
  
  return validResult();
}

/**
 * Validate literal value
 */
function validateLiteral(
  value: unknown,
  schema: GTypeLiteral,
  path: PathSegment[]
): ValidationResult {
  if (value !== schema.value) {
    return invalidResult([
      createValidationError(
        path,
        `literal ${JSON.stringify(schema.value)}`,
        value,
        undefined,
        schema
      ),
    ]);
  }
  
  return validResult();
}

/**
 * Validate object type
 */
function validateObject(
  value: unknown,
  schema: GTypeObject,
  path: PathSegment[]
): ValidationResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalidResult([
      createValidationError(path, 'object', value, undefined, schema),
    ]);
  }
  
  const obj = value as Record<string, unknown>;
  const errors: ValidationError[] = [];
  
  // Validate required properties
  const required = schema.required || [];
  for (const key of required) {
    if (!(key in obj)) {
      errors.push(
        createValidationError(
          [...path, key],
          'defined value',
          undefined,
          `Required property "${key}" is missing`,
          schema
        )
      );
    }
  }
  
  // Validate each property
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (key in obj) {
      const propResult = validate(obj[key], propSchema, [...path, key]);
      errors.push(...propResult.errors);
    }
  }
  
  // Check for additional properties
  if (schema.additionalProperties === false) {
    const allowedKeys = new Set(Object.keys(schema.properties));
    for (const key of Object.keys(obj)) {
      if (!allowedKeys.has(key)) {
        errors.push(
          createValidationError(
            [...path, key],
            'no additional properties',
            obj[key],
            `Additional property "${key}" is not allowed`,
            schema
          )
        );
      }
    }
  } else if (typeof schema.additionalProperties === 'object') {
    // Validate additional properties against schema
    const allowedKeys = new Set(Object.keys(schema.properties));
    for (const key of Object.keys(obj)) {
      if (!allowedKeys.has(key)) {
        const propResult = validate(obj[key], schema.additionalProperties, [...path, key]);
        errors.push(...propResult.errors);
      }
    }
  }
  
  return errors.length === 0 ? validResult() : invalidResult(errors);
}

/**
 * Validate array type
 */
function validateArray(
  value: unknown,
  schema: GTypeArray,
  path: PathSegment[]
): ValidationResult {
  if (!Array.isArray(value)) {
    return invalidResult([
      createValidationError(path, 'array', value, undefined, schema),
    ]);
  }
  
  const errors: ValidationError[] = [];
  
  // Validate length constraints
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push(
      createValidationError(
        path,
        `array with at least ${schema.minItems} items`,
        value,
        `Array must have at least ${schema.minItems} items, got ${value.length}`,
        schema
      )
    );
  }
  
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push(
      createValidationError(
        path,
        `array with at most ${schema.maxItems} items`,
        value,
        `Array must have at most ${schema.maxItems} items, got ${value.length}`,
        schema
      )
    );
  }
  
  // Validate each item
  for (let i = 0; i < value.length; i++) {
    const itemResult = validate(value[i], schema.items, [...path, i]);
    errors.push(...itemResult.errors);
  }
  
  return errors.length === 0 ? validResult() : invalidResult(errors);
}

/**
 * Validate tuple type
 */
function validateTuple(
  value: unknown,
  schema: GTypeTuple,
  path: PathSegment[]
): ValidationResult {
  if (!Array.isArray(value)) {
    return invalidResult([
      createValidationError(path, 'tuple', value, undefined, schema),
    ]);
  }
  
  if (value.length !== schema.items.length) {
    return invalidResult([
      createValidationError(
        path,
        `tuple with ${schema.items.length} items`,
        value,
        `Tuple must have exactly ${schema.items.length} items, got ${value.length}`,
        schema
      ),
    ]);
  }
  
  const errors: ValidationError[] = [];
  
  for (let i = 0; i < schema.items.length; i++) {
    const itemResult = validate(value[i], schema.items[i], [...path, i]);
    errors.push(...itemResult.errors);
  }
  
  return errors.length === 0 ? validResult() : invalidResult(errors);
}

/**
 * Validate union type (value must match at least one type)
 */
function validateUnion(
  value: unknown,
  schema: GTypeUnion,
  path: PathSegment[]
): ValidationResult {
  for (const type of schema.types) {
    const result = validate(value, type, path);
    if (result.valid) {
      return validResult();
    }
  }
  
  return invalidResult([
    createValidationError(
      path,
      `one of ${schema.types.length} types`,
      value,
      'Value does not match any of the union types',
      schema
    ),
  ]);
}

/**
 * Validate intersection type (value must match all types)
 */
function validateIntersection(
  value: unknown,
  schema: GTypeIntersection,
  path: PathSegment[]
): ValidationResult {
  const results = schema.types.map((type) => validate(value, type, path));
  return mergeResults(...results);
}

/**
 * Validate enum type
 */
function validateEnum(
  value: unknown,
  schema: GTypeEnum,
  path: PathSegment[]
): ValidationResult {
  if (!schema.values.includes(value as string | number)) {
    return invalidResult([
      createValidationError(
        path,
        `one of [${schema.values.join(', ')}]`,
        value,
        undefined,
        schema
      ),
    ]);
  }
  
  return validResult();
}

/**
 * Validate custom validators
 */
function validateCustom(
  value: unknown,
  validators: ValidatorDef[],
  path: PathSegment[],
  schema: GType
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const validator of validators) {
    const error = validateSingle(value, validator, path, schema);
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * Validate a single custom validator
 */
function validateSingle(
  value: unknown,
  validator: ValidatorDef,
  path: PathSegment[],
  schema: GType
): ValidationError | null {
  switch (validator.type) {
    case 'min':
      if (typeof value === 'number' && value < (validator.value as number)) {
        return createValidationError(
          path,
          `>= ${validator.value}`,
          value,
          validator.message || `Value must be at least ${validator.value}`,
          schema
        );
      }
      break;
      
    case 'max':
      if (typeof value === 'number' && value > (validator.value as number)) {
        return createValidationError(
          path,
          `<= ${validator.value}`,
          value,
          validator.message || `Value must be at most ${validator.value}`,
          schema
        );
      }
      break;
      
    case 'minLength':
      if (typeof value === 'string' && value.length < (validator.value as number)) {
        return createValidationError(
          path,
          `string with length >= ${validator.value}`,
          value,
          validator.message || `String must be at least ${validator.value} characters`,
          schema
        );
      }
      break;
      
    case 'maxLength':
      if (typeof value === 'string' && value.length > (validator.value as number)) {
        return createValidationError(
          path,
          `string with length <= ${validator.value}`,
          value,
          validator.message || `String must be at most ${validator.value} characters`,
          schema
        );
      }
      break;
      
    case 'pattern':
      if (typeof value === 'string') {
        const regex = new RegExp(validator.value as string);
        if (!regex.test(value)) {
          return createValidationError(
            path,
            `string matching ${validator.value}`,
            value,
            validator.message || `String must match pattern ${validator.value}`,
            schema
          );
        }
      }
      break;
      
    case 'email':
      if (typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return createValidationError(
            path,
            'valid email',
            value,
            validator.message || 'Must be a valid email address',
            schema
          );
        }
      }
      break;
      
    case 'url':
      if (typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          return createValidationError(
            path,
            'valid URL',
            value,
            validator.message || 'Must be a valid URL',
            schema
          );
        }
      }
      break;
      
    case 'uuid':
      if (typeof value === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          return createValidationError(
            path,
            'valid UUID',
            value,
            validator.message || 'Must be a valid UUID',
            schema
          );
        }
      }
      break;
      
    case 'custom':
      if (validator.fn && !validator.fn(value)) {
        return createValidationError(
          path,
          'custom validation',
          value,
          validator.message || 'Custom validation failed',
          schema
        );
      }
      break;
  }
  
  return null;
}
