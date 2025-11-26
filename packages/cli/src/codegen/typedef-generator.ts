/**
 * @module cli/codegen/typedef-generator
 * @description Generate TypeScript type definitions from GType schemas
 */

import type { GType, GTypePrimitive, GTypeObject, GTypeArray, GTypeUnion, GTypeIntersection, GTypeEnum, GTypeTuple, GTypeLiteral } from '@gati-framework/runtime';

export interface TypeDefGeneratorOptions {
  includeComments?: boolean;
  exportType?: boolean;
  typeName?: string;
  useInterface?: boolean;
}

export interface GeneratedTypeDef {
  code: string;
  typeName: string;
}

/**
 * Generate TypeScript type definition from GType schema
 */
export class TypeDefGenerator {
  generate(schema: GType, options: TypeDefGeneratorOptions = {}): GeneratedTypeDef {
    const opts = {
      includeComments: true,
      exportType: true,
      typeName: 'GeneratedType',
      useInterface: true,
      ...options,
    };

    const lines: string[] = [];

    // JSDoc comment
    if (opts.includeComments && schema.description) {
      lines.push('/**');
      lines.push(` * ${schema.description}`);
      lines.push(' */');
    }

    // Generate type definition
    const typeDeclaration = this.generateTypeDeclaration(schema, opts);
    
    if (opts.exportType) {
      lines.push(`export ${typeDeclaration}`);
    } else {
      lines.push(typeDeclaration);
    }

    return {
      code: lines.join('\n'),
      typeName: opts.typeName,
    };
  }

  private generateTypeDeclaration(schema: GType, options: TypeDefGeneratorOptions): string {
    const typeName = options.typeName!;
    
    // For objects, prefer interface unless it has nullable/optional modifiers at root level
    if (schema.kind === 'object' && options.useInterface && !schema.nullable) {
      return this.generateInterface(schema, typeName);
    }
    
    const typeExpr = this.generateTypeExpression(schema);
    return `type ${typeName} = ${typeExpr};`;
  }

  private generateInterface(schema: GTypeObject, typeName: string): string {
    const lines: string[] = [];
    
    lines.push(`interface ${typeName} {`);
    
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // JSDoc for property
      if (propSchema.description) {
        lines.push(`  /** ${propSchema.description} */`);
      }
      
      // Property is optional if explicitly marked optional OR not in required list
      const isInRequiredList = schema.required?.includes(key) ?? false;
      const isOptional = propSchema.optional === true || (!isInRequiredList && schema.required !== undefined);
      const optionalMarker = isOptional ? '?' : '';
      
      const propType = this.generateTypeExpression(propSchema);
      lines.push(`  ${key}${optionalMarker}: ${propType};`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private generateTypeExpression(schema: GType): string {
    let baseType: string;

    switch (schema.kind) {
      case 'primitive':
        baseType = this.generatePrimitiveType(schema);
        break;
      case 'literal':
        baseType = this.generateLiteralType(schema);
        break;
      case 'object':
        baseType = this.generateObjectType(schema);
        break;
      case 'array':
        baseType = this.generateArrayType(schema);
        break;
      case 'tuple':
        baseType = this.generateTupleType(schema);
        break;
      case 'union':
        baseType = this.generateUnionType(schema);
        break;
      case 'intersection':
        baseType = this.generateIntersectionType(schema);
        break;
      case 'enum':
        baseType = this.generateEnumType(schema);
        break;
      default:
        baseType = 'unknown';
    }

    // Apply nullable modifier
    if (schema.nullable) {
      baseType = `${baseType} | null`;
    }

    return baseType;
  }

  private generatePrimitiveType(schema: GTypePrimitive): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      null: 'null',
      undefined: 'undefined',
    };

    return typeMap[schema.primitiveType] || 'unknown';
  }

  private generateLiteralType(schema: GTypeLiteral): string {
    if (typeof schema.value === 'string') {
      return `'${schema.value}'`;
    }
    return String(schema.value);
  }

  private generateObjectType(schema: GTypeObject): string {
    if (Object.keys(schema.properties).length === 0) {
      return 'Record<string, never>';
    }

    const props: string[] = [];
    
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // Property is optional if explicitly marked optional OR not in required list
      const isInRequiredList = schema.required?.includes(key) ?? false;
      const isOptional = propSchema.optional === true || (!isInRequiredList && schema.required !== undefined);
      const optionalMarker = isOptional ? '?' : '';
      
      const propType = this.generateTypeExpression(propSchema);
      props.push(`${key}${optionalMarker}: ${propType}`);
    }

    return `{ ${props.join('; ')} }`;
  }

  private generateArrayType(schema: GTypeArray): string {
    const itemType = this.generateTypeExpression(schema.items);
    return `Array<${itemType}>`;
  }

  private generateTupleType(schema: GTypeTuple): string {
    const itemTypes = schema.items.map(item => this.generateTypeExpression(item));
    return `[${itemTypes.join(', ')}]`;
  }

  private generateUnionType(schema: GTypeUnion): string {
    const types = schema.types.map(type => {
      const expr = this.generateTypeExpression(type);
      // Wrap complex types in parentheses
      if (type.kind === 'intersection' || type.kind === 'union') {
        return `(${expr})`;
      }
      return expr;
    });
    return types.join(' | ');
  }

  private generateIntersectionType(schema: GTypeIntersection): string {
    const types = schema.types.map(type => {
      const expr = this.generateTypeExpression(type);
      // Wrap unions in parentheses
      if (type.kind === 'union') {
        return `(${expr})`;
      }
      return expr;
    });
    return types.join(' & ');
  }

  private generateEnumType(schema: GTypeEnum): string {
    const values = schema.values.map(value => {
      if (typeof value === 'string') {
        return `'${value}'`;
      }
      return String(value);
    });
    return values.join(' | ');
  }

  /**
   * Generate multiple type definitions from a schema map
   */
  generateMultiple(schemas: Record<string, GType>, options: Omit<TypeDefGeneratorOptions, 'typeName'> = {}): string {
    const lines: string[] = [];

    for (const [name, schema] of Object.entries(schemas)) {
      const result = this.generate(schema, {
        ...options,
        typeName: name,
      });
      
      lines.push(result.code);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate branded type
   */
  generateBrandedType(schema: GType, typeName: string, brandName: string): GeneratedTypeDef {
    const baseType = this.generateTypeExpression(schema);
    const code = `export type ${typeName} = ${baseType} & { __brand: '${brandName}' };`;
    
    return {
      code,
      typeName,
    };
  }
}

/**
 * Create type definition generator instance
 */
export function createTypeDefGenerator(): TypeDefGenerator {
  return new TypeDefGenerator();
}
