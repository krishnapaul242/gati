/**
 * @module cli/extractor/type-extractor
 * @description Main type extraction engine using ts-morph
 */

import { Project, type Type } from 'ts-morph';
import { createHash } from 'crypto';
import type {
  GType,
  GPrimitive,
  GObject,
  GArray,
  GTuple,
  GUnion,
  GLiteral,
  StringConstraints,
  NumberConstraints,
} from '@gati-framework/types/gtype';
import { serializeGType } from '@gati-framework/types';
import { ExtractionCache } from './extraction-cache.js';
import { ConstraintExtractor } from './constraint-extractor.js';
import type {
  ExtractionOptions,
  ExtractionResult,
  ExtractionError,
  ExtractionWarning,
  TypeContext,
  CacheEntry,
} from './types.js';

/**
 * Default extraction options
 */
const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  depthLimit: { warn: 20, error: 50 },
  sizeLimit: { warn: 51200, error: 512000 }, // 50KB warn, 500KB error
  allowExternalTypes: false,
  incremental: true,
  cacheDir: '.gati/cache/types',
  sourceRoot: process.cwd(),
  tsConfigPath: 'tsconfig.json',
};

/**
 * Type extraction engine
 */
export class TypeExtractor {
  private project: Project;
  private options: Required<ExtractionOptions>;
  private cache: ExtractionCache | null;
  private constraintExtractor: ConstraintExtractor;

  constructor(options: ExtractionOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize ts-morph project
    this.project = new Project({
      tsConfigFilePath: this.options.tsConfigPath,
      skipAddingFilesFromTsConfig: false,
    });

    // Initialize cache if incremental extraction enabled
    this.cache = this.options.incremental
      ? new ExtractionCache(this.options.cacheDir)
      : null;

    // Initialize constraint extractor
    this.constraintExtractor = new ConstraintExtractor();
  }

  /**
   * Extract type from source file
   */
  extractType(filePath: string, typeName: string): ExtractionResult {
    const startTime = Date.now();
    const warnings: ExtractionWarning[] = [];
    const errors: ExtractionError[] = [];

    try {
      // Check cache first
      if (this.cache) {
        const cached = this.cache.get(filePath, typeName);
        if (cached) {
          return {
            schema: cached.schema,
            warnings: cached.warnings,
            errors: [],
            metadata: {
              filePath,
              typeName,
              maxDepth: cached.metadata.maxDepth,
              sizeBytes: cached.metadata.sizeBytes,
              durationMs: Date.now() - startTime,
              fromCache: true,
            },
          };
        }
      }

      // Get source file
      const sourceFile = this.project.getSourceFile(filePath);
      if (!sourceFile) {
        errors.push({
          type: 'parse-error',
          message: `Source file not found: ${filePath}`,
          location: { filePath, line: 0, column: 0 },
        });
        return this.createErrorResult(filePath, typeName, errors, startTime);
      }

      // Find type alias or interface
      const typeAlias = sourceFile.getTypeAlias(typeName);
      const interfaceDecl = sourceFile.getInterface(typeName);

      if (!typeAlias && !interfaceDecl) {
        errors.push({
          type: 'parse-error',
          message: `Type '${typeName}' not found in ${filePath}`,
          location: { filePath, line: 0, column: 0 },
          typeName,
        });
        return this.createErrorResult(filePath, typeName, errors, startTime);
      }

      // Get TypeScript type
      const tsType = typeAlias
        ? typeAlias.getType()
        : interfaceDecl!.getType();

      // Create extraction context
      const context: TypeContext = {
        depth: 0,
        visited: new Set(),
        stack: [typeName],
        warnings,
        options: this.options,
      };

      // Extract to GType
      const schema = this.extractTypeNode(tsType, context);

      if (!schema) {
        errors.push({
          type: 'unknown',
          message: `Failed to extract type '${typeName}'`,
          location: { filePath, line: 0, column: 0 },
          typeName,
        });
        return this.createErrorResult(filePath, typeName, errors, startTime);
      }

      // Calculate schema size
      // Validate size limits
      const sizeBytes = serializeGType(schema).length;

      // Check size limits
      if (sizeBytes > this.options.sizeLimit.error) {
        errors.push({
          type: 'size-exceeded',
          message: `Schema size (${sizeBytes} bytes) exceeds limit (${this.options.sizeLimit.error} bytes)`,
          location: { filePath, line: 0, column: 0 },
          typeName,
        });
        return this.createErrorResult(filePath, typeName, errors, startTime);
      }

      if (sizeBytes > this.options.sizeLimit.warn) {
        warnings.push({
          type: 'size-limit',
          message: `Schema size (${sizeBytes} bytes) exceeds warning threshold (${this.options.sizeLimit.warn} bytes)`,
          location: { filePath, line: 0, column: 0 },
          typeName,
        });
      }

      // Cache result
      if (this.cache) {
        const cacheEntry: CacheEntry = {
          filePath,
          typeName,
          contentHash: this.computeFileHash(filePath),
          schema,
          metadata: {
            maxDepth: context.depth,
            sizeBytes,
            extractedAt: Date.now(),
          },
          warnings,
        };
        this.cache.set(cacheEntry);
      }

      return {
        schema,
        warnings,
        errors,
        metadata: {
          filePath,
          typeName,
          maxDepth: context.depth,
          sizeBytes,
          durationMs: Date.now() - startTime,
          fromCache: false,
        },
      };
    } catch (error) {
      errors.push({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        location: { filePath, line: 0, column: 0 },
        typeName,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.createErrorResult(filePath, typeName, errors, startTime);
    }
  }

  /**
   * Extract TypeScript Type to GType
   */
  private extractTypeNode(type: Type, context: TypeContext): GType | null {
    // Check depth limit
    if (context.depth > context.options.depthLimit.error) {
      throw new Error(`Depth limit exceeded (${context.options.depthLimit.error} levels)`);
    }

    if (context.depth > context.options.depthLimit.warn) {
      context.warnings.push({
        type: 'depth-limit',
        message: `Type depth (${context.depth}) exceeds warning threshold (${context.options.depthLimit.warn})`,
      });
    }

    // Increment depth
    context.depth++;

    try {
      // Handle intersection types FIRST - check if it's an unwrappable branded/constrained type
      if (type.isIntersection()) {
        // Try to unwrap intersection to base primitive with constraints
        const members = type.getIntersectionTypes();
        
        // Detect base primitive type
        const basePrimitive = members.find((m) => m.isString() || m.isNumber() || m.isBoolean());
        
        // DEBUG: Log member types for PasswordString/PortNumber
        const typeText = type.getText();
        if (typeText.includes('PasswordString') || typeText.includes('PortNumber')) {
          console.log(`\n[DEBUG] ${typeText} intersection members:`);
          members.forEach((m, i) => {
            console.log(`  Member ${i}: isObject=${m.isObject()}, isString=${m.isString()}, isNumber=${m.isNumber()}, text="${m.getText()}"`);
            if (m.isObject()) {
              const props = m.getProperties();
              console.log(`    Properties: ${props.map(p => p.getName()).join(', ')}`);
            }
          });
        }
        
        // Detect constraint types (object literals with __brand, __minLength, etc.)
        const constraintTypes = members.filter((m) => {
          if (!m.isObject()) return false;
          const props = m.getProperties();
          return props.some((p) => {
            const name = p.getName();
            return name === '__brand' || name === '__gati_brand' ||  // Support both raw and @gati-framework/types Brand<>
                   name === '__minLength' || name === '__minLen' || name === '__gati_minLen' ||  // Support all forms
                   name === '__maxLength' || name === '__maxLen' || name === '__gati_maxLen' ||  // Support all forms
                   name === '__pattern' || name === '__gati_pattern' ||
                   name === '__format' || name === '__gati_format' ||
                   name === '__min' || name === '__gati_min' || 
                   name === '__max' || name === '__gati_max' ||
                   name === '__exclusiveMin' || name === '__gati_exclusiveMin' ||
                   name === '__exclusiveMax' || name === '__gati_exclusiveMax' ||
                   name === '__multipleOf' || name === '__gati_multipleOf' ||
                   name === '__integer' || name === '__gati_integer';
          });
        });
        
        // DEBUG: Log constraint detection results
        if (typeText.includes('PasswordString') || typeText.includes('PortNumber')) {
          console.log(`  basePrimitive: ${basePrimitive ? basePrimitive.getText() : 'none'}`);
          console.log(`  constraintTypes.length: ${constraintTypes.length}`);
        }
        
        // If it's a branded/constrained primitive, extract the base type
        // Pass the ORIGINAL intersection type so constraint extraction can see all members
        if (basePrimitive && constraintTypes.length > 0) {
          // Unwrap: extract the base primitive type with constraint extraction
          if (basePrimitive.isString()) {
            return this.extractStringType(type, context);  // Pass full intersection type
          }
          if (basePrimitive.isNumber()) {
            return this.extractNumberType(type, context);  // Pass full intersection type
          }
          if (basePrimitive.isBoolean()) {
            return this.createPrimitive('boolean');
          }
        }
        
        // Otherwise, extract as regular intersection type
        return this.extractIntersectionType(type, context);
      }

      // Handle primitive types
      if (type.isString()) {
        return this.extractStringType(type, context);
      }

      if (type.isNumber()) {
        return this.extractNumberType(type, context);
      }

      if (type.isBoolean()) {
        return this.createPrimitive('boolean');
      }

      if (type.isNull()) {
        return this.createPrimitive('null');
      }

      if (type.isUndefined()) {
        return { version: '1.0', type: 'null', nullable: true, optional: true };
      }

      // Handle literal types
      if (type.isLiteral()) {
        return this.extractLiteralType(type);
      }

      // Handle union types
      if (type.isUnion()) {
        return this.extractUnionType(type, context);
      }

      // Handle array types
      if (type.isArray()) {
        return this.extractArrayType(type, context);
      }

      // Handle tuple types
      if (type.isTuple()) {
        return this.extractTupleType(type, context);
      }

      // Handle object types
      if (type.isObject()) {
        return this.extractObjectType(type, context);
      }

      // Unsupported type
      context.warnings.push({
        type: 'unsupported-type',
        message: `Unsupported type: ${type.getText()}`,
      });

      return null;
    } finally {
      context.depth--;
    }
  }

  /**
   * Extract string type with constraints
   */
  private extractStringType(type: Type, _context: TypeContext): GPrimitive {
    // Extract constraints using constraint extractor
    const stringConstraints: StringConstraints = this.constraintExtractor.extractStringConstraints(type);

    // Extract brand information
    const brandInfo = this.constraintExtractor.extractBrand(type);

    // Check for nullable/optional
    const nullable = this.constraintExtractor.isNullable(type);
    const optional = this.constraintExtractor.isOptional(type);

    const primitive: GPrimitive = {
      version: '1.0',
      type: 'string',
    };

    // Set brand at top level for easy access
    if (brandInfo) {
      primitive.brand = brandInfo.name;
    }

    if (nullable) primitive.nullable = nullable;
    if (optional) primitive.optional = optional;
    
    // Add string constraints if any exist
    if (Object.keys(stringConstraints).length > 0) {
      primitive.constraints = { ...stringConstraints };
    }

    return primitive;
  }

  /**
   * Extract number type with constraints
   */
  private extractNumberType(type: Type, _context: TypeContext): GPrimitive {
    // Extract constraints using constraint extractor
    const numberConstraints: NumberConstraints = this.constraintExtractor.extractNumberConstraints(type);

    // Extract brand information
    const brandInfo = this.constraintExtractor.extractBrand(type);

    // Check for nullable/optional
    const nullable = this.constraintExtractor.isNullable(type);
    const optional = this.constraintExtractor.isOptional(type);

    const primitive: GPrimitive = {
      version: '1.0',
      type: 'number',
    };

    // Set brand at top level for easy access
    if (brandInfo) {
      primitive.brand = brandInfo.name;
    }

    if (nullable) primitive.nullable = nullable;
    if (optional) primitive.optional = optional;
    
    // Add number constraints if any exist
    if (Object.keys(numberConstraints).length > 0) {
      primitive.numberConstraints = { ...numberConstraints };
    }

    return primitive;
  }

  /**
   * Extract literal type
   */
  private extractLiteralType(type: Type): GLiteral {
    const literalValue = type.getLiteralValue();
    return {
      version: '1.0',
      type: 'literal',
      value: literalValue as string | number | boolean,
    };
  }

  /**
   * Extract union type
   */
  private extractUnionType(type: Type, context: TypeContext): GUnion | null {
    const unionTypes = type.getUnionTypes();
    const anyOf: GType[] = [];

    for (const unionType of unionTypes) {
      const extracted = this.extractTypeNode(unionType, context);
      if (extracted) {
        anyOf.push(extracted);
      }
    }

    if (anyOf.length === 0) {
      return null;
    }

    return {
      version: '1.0',
      type: 'union',
      anyOf,
    };
  }

  /**
   * Extract intersection type
   * 
   * Handles two cases:
   * 1. Branded/constrained primitives (string & Brand, number & Min<10>)
   *    → Returns base primitive with constraints attached
   * 2. True intersections (User & Metadata)
   *    → Returns GIntersection object
   */
  private extractIntersectionType(type: Type, context: TypeContext): GType | null {
    const intersectionTypes = type.getIntersectionTypes();
    
    // Check if this is a branded/constrained primitive pattern
    // Look for: base primitive (string/number) + constraint/brand types
    let basePrimitive: Type | null = null;
    let hasConstraintTypes = false;
    
    for (const member of intersectionTypes) {
      if (member.isString()) {
        basePrimitive = member;
      } else if (member.isNumber()) {
        basePrimitive = member;
      } else if (member.isObject()) {
        // Check if this is a constraint/brand type object (has __brand, __min, etc.)
        const props = member.getProperties();
        const propNames = props.map(p => p.getName());
        
        // Debug: Log what we're checking
        const isConstraintType = propNames.some(name =>
          name.startsWith('__brand') ||
          name.startsWith('__min') ||
          name.startsWith('__max') ||
          name.startsWith('__pattern') ||
          name.startsWith('__positive') ||
          name.startsWith('__negative') ||
          name.startsWith('__integer') ||
          name.startsWith('__multipleOf')
        );
        
        if (isConstraintType) {
          hasConstraintTypes = true;
        }
      }
    }
    
    // If we found a base primitive + constraint types, extract as primitive with constraints
    if (basePrimitive && hasConstraintTypes) {
      if (basePrimitive.isString()) {
        return this.extractStringType(type, context); // Pass full type to get constraints
      } else if (basePrimitive.isNumber()) {
        return this.extractNumberType(type, context); // Pass full type to get constraints
      }
    }
    
    // Otherwise, extract as true intersection
    const allOf: GType[] = [];
    for (const intersectionType of intersectionTypes) {
      const extracted = this.extractTypeNode(intersectionType, context);
      if (extracted) {
        allOf.push(extracted);
      }
    }

    if (allOf.length === 0) {
      return null;
    }

    return {
      version: '1.0',
      type: 'intersection',
      allOf,
    };
  }

  /**
   * Extract array type
   */
  private extractArrayType(type: Type, context: TypeContext): GArray | null {
    const typeArguments = type.getTypeArguments();
    if (typeArguments.length === 0) {
      return null;
    }

    const itemType = this.extractTypeNode(typeArguments[0]!, context);
    if (!itemType) {
      return null;
    }

    return {
      version: '1.0',
      type: 'array',
      items: itemType,
    };
  }

  /**
   * Extract tuple type
   */
  private extractTupleType(type: Type, context: TypeContext): GTuple | null {
    const typeArguments = type.getTypeArguments();
    const items: GType[] = [];

    for (const typeArg of typeArguments) {
      const extracted = this.extractTypeNode(typeArg, context);
      if (extracted) {
        items.push(extracted);
      }
    }

    if (items.length === 0) {
      return null;
    }

    return {
      version: '1.0',
      type: 'tuple',
      items,
    };
  }

  /**
   * Extract object type
   */
  private extractObjectType(type: Type, context: TypeContext): GObject | null {
    const properties = type.getProperties();
    const gtypeProperties: GObject['properties'] = {};
    const required: string[] = [];

    for (const prop of properties) {
      const propName = prop.getName();
      const propType = type.getPropertyOrThrow(propName);
      
      const isOptional = propType.isOptional();
      const extracted = this.extractTypeNode(propType.getTypeAtLocation(prop.getValueDeclaration()!), context);

      if (extracted) {
        gtypeProperties[propName] = {
          type: extracted,
          required: !isOptional,
        };

        if (!isOptional) {
          required.push(propName);
        }
      }
    }

    return {
      version: '1.0',
      type: 'object',
      properties: gtypeProperties,
      required,
    };
  }

  /**
   * Create primitive GType
   */
  private createPrimitive(kind: 'string' | 'number' | 'boolean' | 'null'): GPrimitive {
    return {
      version: '1.0',
      type: kind,
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(
    filePath: string,
    typeName: string,
    errors: ExtractionError[],
    startTime: number
  ): ExtractionResult {
    return {
      schema: null,
      warnings: [],
      errors,
      metadata: {
        filePath,
        typeName,
        maxDepth: 0,
        sizeBytes: 0,
        durationMs: Date.now() - startTime,
        fromCache: false,
      },
    };
  }
  /**
   * Compute file hash for caching
   */
  private computeFileHash(filePath: string): string {
    const sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) {
      return '';
    }

    return createHash('sha256')
      .update(sourceFile.getFullText())
      .digest('hex');
  }

  /**
   * Clear extraction cache
   */
  clearCache(): void {
    this.cache?.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; sizeBytes: number } {
    return this.cache?.getStats() ?? { total: 0, sizeBytes: 0 };
  }
}
