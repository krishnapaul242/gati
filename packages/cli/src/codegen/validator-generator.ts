/**
 * @module cli/codegen/validator-generator
 * @description Generate optimized validator functions from GType schemas
 */

import type { GType, GTypePrimitive, GTypeObject, GTypeArray, GTypeUnion, GTypeIntersection, GTypeEnum, GTypeTuple, GTypeLiteral, Validator } from '@gati-framework/runtime';

export interface ValidatorGeneratorOptions {
  includeComments?: boolean;
  includeImports?: boolean;
  functionName?: string;
}

export interface GeneratedValidator {
  code: string;
  functionName: string;
}

/**
 * Generate validator function from GType schema
 */
export class ValidatorGenerator {
  generate(schema: GType, options: ValidatorGeneratorOptions = {}): GeneratedValidator {
    const opts = {
      includeComments: true,
      includeImports: true,
      functionName: 'validate',
      ...options,
    };

    const lines: string[] = [];

    // Imports
    if (opts.includeImports) {
      lines.push("import type { ValidationResult, ValidationError } from '@gati-framework/runtime/gtype/errors';");
      lines.push('');
    }

    // Function header
    if (opts.includeComments) {
      lines.push('/**');
      lines.push(' * Auto-generated validator function');
      if (schema.description) {
        lines.push(` * ${schema.description}`);
      }
      lines.push(' */');
    }

    lines.push(`export function ${opts.functionName}(value: unknown): ValidationResult {`);
    lines.push('  const errors: ValidationError[] = [];');
    lines.push('');

    // Generate validation logic
    lines.push(this.generateValidation(schema, 'value', []));

    lines.push('');
    lines.push('  return errors.length === 0');
    lines.push('    ? { valid: true, errors: [] }');
    lines.push('    : { valid: false, errors };');
    lines.push('}');

    return {
      code: lines.join('\n'),
      functionName: opts.functionName,
    };
  }

  private generateValidation(schema: GType, varName: string, path: string[]): string {
    const lines: string[] = [];

    // Handle optional
    if (schema.optional) {
      lines.push(`  if (${varName} === undefined) {`);
      lines.push('    // Optional field, skip validation');
      lines.push('  } else {');
      lines.push(this.generateTypeValidation(schema, varName, path, '  '));
      lines.push('  }');
      return lines.join('\n');
    }

    // Handle nullable
    if (schema.nullable) {
      lines.push(`  if (${varName} === null) {`);
      lines.push('    // Nullable field, skip validation');
      lines.push('  } else {');
      lines.push(this.generateTypeValidation(schema, varName, path, '  '));
      lines.push('  }');
      return lines.join('\n');
    }

    return this.generateTypeValidation(schema, varName, path, '');
  }

  private generateTypeValidation(schema: GType, varName: string, path: string[], indent: string): string {
    switch (schema.kind) {
      case 'primitive':
        return this.generatePrimitiveValidation(schema, varName, path, indent);
      case 'literal':
        return this.generateLiteralValidation(schema, varName, path, indent);
      case 'object':
        return this.generateObjectValidation(schema, varName, path, indent);
      case 'array':
        return this.generateArrayValidation(schema, varName, path, indent);
      case 'tuple':
        return this.generateTupleValidation(schema, varName, path, indent);
      case 'union':
        return this.generateUnionValidation(schema, varName, path, indent);
      case 'intersection':
        return this.generateIntersectionValidation(schema, varName, path, indent);
      case 'enum':
        return this.generateEnumValidation(schema, varName, path, indent);
      default:
        return `${indent}  // Unknown schema kind`;
    }
  }

  private generatePrimitiveValidation(schema: GTypePrimitive, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);

    lines.push(`${indent}  if (typeof ${varName} !== '${schema.primitiveType}') {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: '${schema.primitiveType}',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: \`Expected ${schema.primitiveType}, got \${typeof ${varName}}\`,`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  }`);

    // Custom validators
    if (schema.validators && schema.validators.length > 0) {
      lines.push(`${indent}  else {`);
      for (const validator of schema.validators) {
        lines.push(this.generateCustomValidator(validator, varName, path, indent + '  '));
      }
      lines.push(`${indent}  }`);
    }

    return lines.join('\n');
  }

  private generateLiteralValidation(schema: GTypeLiteral, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);
    const literalValue = JSON.stringify(schema.value);

    lines.push(`${indent}  if (${varName} !== ${literalValue}) {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: 'literal ${literalValue}',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: \`Expected ${literalValue}, got \${${varName}}\`,`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  }`);

    return lines.join('\n');
  }

  private generateObjectValidation(schema: GTypeObject, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);

    lines.push(`${indent}  if (typeof ${varName} !== 'object' || ${varName} === null || Array.isArray(${varName})) {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: 'object',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: 'Expected object',`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  } else {`);
    lines.push(`${indent}    const obj = ${varName} as Record<string, unknown>;`);

    // Validate required properties
    if (schema.required && schema.required.length > 0) {
      for (const key of schema.required) {
        const propPath = [...path, key];
        const propPathStr = this.formatPath(propPath);
        lines.push(`${indent}    if (!(${JSON.stringify(key)} in obj)) {`);
        lines.push(`${indent}      errors.push({`);
        lines.push(`${indent}        path: ${propPathStr},`);
        lines.push(`${indent}        expected: 'defined value',`);
        lines.push(`${indent}        actual: undefined,`);
        lines.push(`${indent}        message: 'Required property "${key}" is missing',`);
        lines.push(`${indent}      });`);
        lines.push(`${indent}    }`);
      }
    }

    // Validate each property
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const propPath = [...path, key];
      lines.push(`${indent}    if (${JSON.stringify(key)} in obj) {`);
      lines.push(this.generateValidation(propSchema, `obj[${JSON.stringify(key)}]`, propPath).split('\n').map(l => `${indent}  ${l}`).join('\n'));
      lines.push(`${indent}    }`);
    }

    // Additional properties check
    if (schema.additionalProperties === false) {
      const allowedKeys = Object.keys(schema.properties);
      lines.push(`${indent}    const allowedKeys = new Set(${JSON.stringify(allowedKeys)});`);
      lines.push(`${indent}    for (const key of Object.keys(obj)) {`);
      lines.push(`${indent}      if (!allowedKeys.has(key)) {`);
      lines.push(`${indent}        errors.push({`);
      lines.push(`${indent}          path: [...${pathStr}, key],`);
      lines.push(`${indent}          expected: 'no additional properties',`);
      lines.push(`${indent}          actual: obj[key],`);
      lines.push(`${indent}          message: \`Additional property "\${key}" is not allowed\`,`);
      lines.push(`${indent}        });`);
      lines.push(`${indent}      }`);
      lines.push(`${indent}    }`);
    }

    lines.push(`${indent}  }`);

    return lines.join('\n');
  }

  private generateArrayValidation(schema: GTypeArray, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);

    lines.push(`${indent}  if (!Array.isArray(${varName})) {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: 'array',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: 'Expected array',`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  } else {`);

    // Length constraints
    if (schema.minItems !== undefined) {
      lines.push(`${indent}    if (${varName}.length < ${schema.minItems}) {`);
      lines.push(`${indent}      errors.push({`);
      lines.push(`${indent}        path: ${pathStr},`);
      lines.push(`${indent}        expected: 'array with at least ${schema.minItems} items',`);
      lines.push(`${indent}        actual: ${varName},`);
      lines.push(`${indent}        message: \`Array must have at least ${schema.minItems} items, got \${${varName}.length}\`,`);
      lines.push(`${indent}      });`);
      lines.push(`${indent}    }`);
    }

    if (schema.maxItems !== undefined) {
      lines.push(`${indent}    if (${varName}.length > ${schema.maxItems}) {`);
      lines.push(`${indent}      errors.push({`);
      lines.push(`${indent}        path: ${pathStr},`);
      lines.push(`${indent}        expected: 'array with at most ${schema.maxItems} items',`);
      lines.push(`${indent}        actual: ${varName},`);
      lines.push(`${indent}        message: \`Array must have at most ${schema.maxItems} items, got \${${varName}.length}\`,`);
      lines.push(`${indent}      });`);
      lines.push(`${indent}    }`);
    }

    // Validate items
    lines.push(`${indent}    for (let i = 0; i < ${varName}.length; i++) {`);
    const itemPath = [...path, 'i'];
    lines.push(this.generateValidation(schema.items, `${varName}[i]`, itemPath).split('\n').map(l => `${indent}  ${l}`).join('\n'));
    lines.push(`${indent}    }`);

    lines.push(`${indent}  }`);

    return lines.join('\n');
  }

  private generateTupleValidation(schema: GTypeTuple, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);

    lines.push(`${indent}  if (!Array.isArray(${varName})) {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: 'tuple',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: 'Expected tuple',`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  } else if (${varName}.length !== ${schema.items.length}) {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: 'tuple with ${schema.items.length} items',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: \`Tuple must have exactly ${schema.items.length} items, got \${${varName}.length}\`,`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  } else {`);

    // Validate each item
    schema.items.forEach((itemSchema, index) => {
      const itemPath = [...path, String(index)];
      lines.push(this.generateValidation(itemSchema, `${varName}[${index}]`, itemPath).split('\n').map(l => `${indent}  ${l}`).join('\n'));
    });

    lines.push(`${indent}  }`);

    return lines.join('\n');
  }

  private generateUnionValidation(schema: GTypeUnion, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);

    lines.push(`${indent}  {`);
    lines.push(`${indent}    let matched = false;`);
    lines.push(`${indent}    const unionErrors: ValidationError[][] = [];`);

    schema.types.forEach((typeSchema, index) => {
      lines.push(`${indent}    {`);
      lines.push(`${indent}      const tempErrors: ValidationError[] = [];`);
      lines.push(`${indent}      const originalLength = errors.length;`);
      
      // Temporarily collect errors
      const validation = this.generateTypeValidation(typeSchema, varName, path, indent + '    ');
      lines.push(validation.replace(/errors\.push/g, 'tempErrors.push'));
      
      lines.push(`${indent}      if (tempErrors.length === 0) {`);
      lines.push(`${indent}        matched = true;`);
      lines.push(`${indent}      } else {`);
      lines.push(`${indent}        unionErrors.push(tempErrors);`);
      lines.push(`${indent}      }`);
      lines.push(`${indent}    }`);
      
      if (index < schema.types.length - 1) {
        lines.push(`${indent}    if (!matched) {`);
      }
    });

    // Close if statements
    for (let i = 0; i < schema.types.length - 1; i++) {
      lines.push(`${indent}    }`);
    }

    lines.push(`${indent}    if (!matched) {`);
    lines.push(`${indent}      errors.push({`);
    lines.push(`${indent}        path: ${pathStr},`);
    lines.push(`${indent}        expected: 'one of ${schema.types.length} types',`);
    lines.push(`${indent}        actual: ${varName},`);
    lines.push(`${indent}        message: 'Value does not match any of the union types',`);
    lines.push(`${indent}      });`);
    lines.push(`${indent}    }`);
    lines.push(`${indent}  }`);

    return lines.join('\n');
  }

  private generateIntersectionValidation(schema: GTypeIntersection, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];

    // Validate against all types
    schema.types.forEach((typeSchema) => {
      lines.push(this.generateTypeValidation(typeSchema, varName, path, indent));
    });

    return lines.join('\n');
  }

  private generateEnumValidation(schema: GTypeEnum, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);
    const allowedValues = JSON.stringify(schema.values);

    lines.push(`${indent}  if (!${allowedValues}.includes(${varName} as any)) {`);
    lines.push(`${indent}    errors.push({`);
    lines.push(`${indent}      path: ${pathStr},`);
    lines.push(`${indent}      expected: 'one of [${schema.values.join(', ')}]',`);
    lines.push(`${indent}      actual: ${varName},`);
    lines.push(`${indent}      message: \`Expected one of [${schema.values.join(', ')}], got \${${varName}}\`,`);
    lines.push(`${indent}    });`);
    lines.push(`${indent}  }`);

    return lines.join('\n');
  }

  private generateCustomValidator(validator: Validator, varName: string, path: string[], indent: string): string {
    const lines: string[] = [];
    const pathStr = this.formatPath(path);

    switch (validator.type) {
      case 'min':
        lines.push(`${indent}  if (typeof ${varName} === 'number' && ${varName} < ${validator.value}) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: '>= ${validator.value}',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || `Value must be at least ${validator.value}`)},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;

      case 'max':
        lines.push(`${indent}  if (typeof ${varName} === 'number' && ${varName} > ${validator.value}) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: '<= ${validator.value}',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || `Value must be at most ${validator.value}`)},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;

      case 'minLength':
        lines.push(`${indent}  if (typeof ${varName} === 'string' && ${varName}.length < ${validator.value}) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: 'string with length >= ${validator.value}',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || `String must be at least ${validator.value} characters`)},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;

      case 'maxLength':
        lines.push(`${indent}  if (typeof ${varName} === 'string' && ${varName}.length > ${validator.value}) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: 'string with length <= ${validator.value}',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || `String must be at most ${validator.value} characters`)},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;

      case 'pattern':
        lines.push(`${indent}  if (typeof ${varName} === 'string' && !/${validator.value}/.test(${varName})) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: 'string matching ${validator.value}',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || `String must match pattern ${validator.value}`)},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;

      case 'email':
        lines.push(`${indent}  if (typeof ${varName} === 'string' && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${varName})) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: 'valid email',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || 'Must be a valid email address')},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;

      case 'url':
        lines.push(`${indent}  if (typeof ${varName} === 'string') {`);
        lines.push(`${indent}    try {`);
        lines.push(`${indent}      new URL(${varName});`);
        lines.push(`${indent}    } catch {`);
        lines.push(`${indent}      errors.push({`);
        lines.push(`${indent}        path: ${pathStr},`);
        lines.push(`${indent}        expected: 'valid URL',`);
        lines.push(`${indent}        actual: ${varName},`);
        lines.push(`${indent}        message: ${JSON.stringify(validator.message || 'Must be a valid URL')},`);
        lines.push(`${indent}      });`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}  }`);
        break;

      case 'uuid':
        lines.push(`${indent}  if (typeof ${varName} === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(${varName})) {`);
        lines.push(`${indent}    errors.push({`);
        lines.push(`${indent}      path: ${pathStr},`);
        lines.push(`${indent}      expected: 'valid UUID',`);
        lines.push(`${indent}      actual: ${varName},`);
        lines.push(`${indent}      message: ${JSON.stringify(validator.message || 'Must be a valid UUID')},`);
        lines.push(`${indent}    });`);
        lines.push(`${indent}  }`);
        break;
    }

    return lines.join('\n');
  }

  private formatPath(path: (string | number)[]): string {
    if (path.length === 0) return '[]';
    
    // Handle numeric indices (array items)
    const formatted = path.map(segment => {
      if (segment === 'i') return 'i'; // Loop variable
      return JSON.stringify(segment);
    });
    
    return `[${formatted.join(', ')}]`;
  }
}

/**
 * Create validator generator instance
 */
export function createValidatorGenerator(): ValidatorGenerator {
  return new ValidatorGenerator();
}
