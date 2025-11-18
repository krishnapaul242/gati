/**
 * @module cli/extractor/constraint-extractor
 * @description Extract branded types and constraint combinators from TypeScript types
 */

import type { Type } from 'ts-morph';
import type { StringConstraints, NumberConstraints } from '@gati-framework/types/gtype';

/**
 * Extracted brand information
 */
export interface BrandInfo {
  /**
   * Brand name (from Brand<"name">)
   */
  name: string;

  /**
   * Whether this is a branded type
   */
  isBranded: true;
}

/**
 * Constraint extractor for branded types and combinators
 */
export class ConstraintExtractor {
  /**
   * Extract brand from type intersection
   * 
   * Detects patterns like:
   * - string & Brand<"email">
   * - number & Brand<"positive">
   */
  extractBrand(type: Type): BrandInfo | null {
    if (!type.isIntersection()) {
      return null;
    }

    const intersectionTypes = type.getIntersectionTypes();

    for (const intersectType of intersectionTypes) {
      const symbol = intersectType.getSymbol();
      if (!symbol) continue;

      const name = symbol.getName();
      
      // Prefer alias-based Brand<T> extraction for imported types
      const aliasSymbol = intersectType.getAliasSymbol?.();
      const aliasName = aliasSymbol ? aliasSymbol.getName() : undefined;
      const aliasArgs = typeof intersectType.getAliasTypeArguments === 'function' ? intersectType.getAliasTypeArguments() : [];
      if (aliasName === 'Brand') {
        const brandArg = aliasArgs[0];
        if (brandArg?.isStringLiteral()) {
          const brandName = brandArg.getLiteralValue() as string;
          return { name: brandName, isBranded: true };
        }
      }
      
      // Check if this is a Brand<T> type
      if (name === '__type' || name.includes('Brand')) {
        // Get type arguments
        const typeArgs = intersectType.getTypeArguments();
        if (typeArgs.length > 0) {
          const brandArg = typeArgs[0];
          if (brandArg?.isStringLiteral()) {
            const brandName = brandArg.getLiteralValue() as string;
            return { name: brandName, isBranded: true };
          }
        }
        
        // Fallback: check for __brand or __gati_brand property
        const properties = intersectType.getProperties();
        const brandProp = properties.find(p => p.getName() === '__brand' || p.getName() === '__gati_brand');
        if (brandProp) {
          const propName = brandProp.getName();
          const propType = intersectType.getProperty(propName);
          const valueDecl = brandProp.getValueDeclaration();
          if (valueDecl && propType) {
            const propTypeNode = propType.getTypeAtLocation(valueDecl);
            if (propTypeNode.isStringLiteral()) {
              const brandName = propTypeNode.getLiteralValue() as string;
              return { name: brandName, isBranded: true };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract string constraints from type intersection
   * 
   * Detects patterns like:
   * - string & MinLen<8>
   * - string & MaxLen<100>
   * - string & Pattern<"^[a-z]+$">
   */
  extractStringConstraints(type: Type): StringConstraints {
    const constraints: StringConstraints = {};

    if (!type.isIntersection()) {
      return constraints;
    }

    const intersectionTypes = type.getIntersectionTypes();

    for (const intersectType of intersectionTypes) {
      const symbol = intersectType.getSymbol();
      if (!symbol) continue;

      const name = symbol.getName();

      // Prefer alias-based generic extraction for imported combinators
      const aliasSymbol = intersectType.getAliasSymbol?.();
      const aliasName = aliasSymbol ? aliasSymbol.getName() : undefined;
      const aliasArgs = typeof intersectType.getAliasTypeArguments === 'function' ? intersectType.getAliasTypeArguments() : [];
      if (aliasName === 'MinLen') {
        const arg = aliasArgs[0];
        if (arg?.isNumberLiteral()) {
          constraints.minLength = arg.getLiteralValue() as number;
        }
      }
      if (aliasName === 'MaxLen') {
        const arg = aliasArgs[0];
        if (arg?.isNumberLiteral()) {
          constraints.maxLength = arg.getLiteralValue() as number;
        }
      }
      if (aliasName === 'Pattern') {
        const arg = aliasArgs[0];
        if (arg?.isStringLiteral()) {
          constraints.pattern = arg.getLiteralValue() as string;
        }
      }

      // MinLen<N>
      if (name === '__type' || name.includes('MinLen')) {
        const minLen = this.extractNumericTypeArg(intersectType);
        if (minLen !== null) {
          constraints.minLength = minLen;
        }
      }

      // MaxLen<N>
      if (name === '__type' || name.includes('MaxLen')) {
        const maxLen = this.extractNumericTypeArg(intersectType);
        if (maxLen !== null) {
          constraints.maxLength = maxLen;
        }
      }

      // Pattern<S>
      if (name === '__type' || name.includes('Pattern')) {
        const pattern = this.extractStringTypeArg(intersectType);
        if (pattern !== null) {
          constraints.pattern = pattern;
        }
      }

      // Check for constraint properties
      const properties = intersectType.getProperties();
      
      for (const prop of properties) {
        const propName = prop.getName();
        const valueDecl = prop.getValueDeclaration();
        
        if (!valueDecl) continue;

        const propType = intersectType.getPropertyOrThrow(propName);
        const propTypeNode = propType.getTypeAtLocation(valueDecl);

        // __minLen or __gati_minLen property
        if ((propName === '__minLen' || propName === '__gati_minLen') && propTypeNode.isNumberLiteral()) {
          constraints.minLength = propTypeNode.getLiteralValue() as number;
        }

        // __maxLen or __gati_maxLen property
        if ((propName === '__maxLen' || propName === '__gati_maxLen') && propTypeNode.isNumberLiteral()) {
          constraints.maxLength = propTypeNode.getLiteralValue() as number;
        }

        // __pattern or __gati_pattern property
        if ((propName === '__pattern' || propName === '__gati_pattern') && propTypeNode.isStringLiteral()) {
          constraints.pattern = propTypeNode.getLiteralValue() as string;
        }
      }
    }

    return constraints;
  }

  /**
   * Extract number constraints from type intersection
   * 
   * Detects patterns like:
   * - number & Min<0>
   * - number & Max<100>
   * - number & MultipleOf<5>
   */
  extractNumberConstraints(type: Type): NumberConstraints {
    const constraints: NumberConstraints = {};

    if (!type.isIntersection()) {
      return constraints;
    }

    const intersectionTypes = type.getIntersectionTypes();

    for (const intersectType of intersectionTypes) {
      const symbol = intersectType.getSymbol();
      if (!symbol) continue;

      const name = symbol.getName();

      // Prefer alias-based generic extraction for imported number combinators
      const aliasSymbol = intersectType.getAliasSymbol?.();
      const aliasName = aliasSymbol ? aliasSymbol.getName() : undefined;
      const aliasArgs = typeof intersectType.getAliasTypeArguments === 'function' ? intersectType.getAliasTypeArguments() : [];
      if (aliasName === 'Min') {
        const arg = aliasArgs[0];
        if (arg?.isNumberLiteral()) {
          constraints.minimum = arg.getLiteralValue() as number;
        }
      }
      if (aliasName === 'Max') {
        const arg = aliasArgs[0];
        if (arg?.isNumberLiteral()) {
          constraints.maximum = arg.getLiteralValue() as number;
        }
      }
      if (aliasName === 'MultipleOf') {
        const arg = aliasArgs[0];
        if (arg?.isNumberLiteral()) {
          constraints.multipleOf = arg.getLiteralValue() as number;
        }
      }

      // Min<N>
      if (name === '__type' || name.includes('Min')) {
        const min = this.extractNumericTypeArg(intersectType);
        if (min !== null) {
          constraints.minimum = min;
        }
      }

      // Max<N>
      if (name === '__type' || name.includes('Max')) {
        const max = this.extractNumericTypeArg(intersectType);
        if (max !== null) {
          constraints.maximum = max;
        }
      }

      // MultipleOf<N>
      if (name === '__type' || name.includes('MultipleOf')) {
        const multipleOf = this.extractNumericTypeArg(intersectType);
        if (multipleOf !== null) {
          constraints.multipleOf = multipleOf;
        }
      }

      // Check for constraint properties
      const properties = intersectType.getProperties();
      
      for (const prop of properties) {
        const propName = prop.getName();
        const valueDecl = prop.getValueDeclaration();
        
        if (!valueDecl) continue;

        const propType = intersectType.getPropertyOrThrow(propName);
        const propTypeNode = propType.getTypeAtLocation(valueDecl);

        // __min or __gati_min property
        if ((propName === '__min' || propName === '__gati_min') && propTypeNode.isNumberLiteral()) {
          constraints.minimum = propTypeNode.getLiteralValue() as number;
        }

        // __max or __gati_max property
        if ((propName === '__max' || propName === '__gati_max') && propTypeNode.isNumberLiteral()) {
          constraints.maximum = propTypeNode.getLiteralValue() as number;
        }

        // __multipleOf property
        if (propName === '__multipleOf' && propTypeNode.isNumberLiteral()) {
          constraints.multipleOf = propTypeNode.getLiteralValue() as number;
        }

        // __integer property (boolean flag)
        if (propName === '__integer') {
          if (propTypeNode.isLiteral()) {
            const typeText = propTypeNode.getText();
            if (typeText === 'true') {
              constraints.integer = true;
            }
          }
        }

        // __positive property (boolean flag)
        if (propName === '__positive') {
          if (propTypeNode.isLiteral()) {
            const typeText = propTypeNode.getText();
            if (typeText === 'true') {
              constraints.minimum = 0;
            }
          }
        }

        // __negative property (boolean flag)
        if (propName === '__negative') {
          if (propTypeNode.isLiteral()) {
            const typeText = propTypeNode.getText();
            if (typeText === 'true') {
              constraints.maximum = 0;
            }
          }
        }
      }
    }

    return constraints;
  }

  /**
   * Extract numeric type argument from generic type
   */
  private extractNumericTypeArg(type: Type): number | null {
    const typeArgs = type.getTypeArguments();
    if (typeArgs.length > 0) {
      const arg = typeArgs[0];
      if (arg?.isNumberLiteral()) {
        return arg.getLiteralValue() as number;
      }
    }
    return null;
  }

  /**
   * Extract string type argument from generic type
   */
  private extractStringTypeArg(type: Type): string | null {
    const typeArgs = type.getTypeArguments();
    if (typeArgs.length > 0) {
      const arg = typeArgs[0];
      if (arg?.isStringLiteral()) {
        return arg.getLiteralValue() as string;
      }
    }
    return null;
  }

  /**
   * Check if type has Nullable<T> wrapper
   */
  isNullable(type: Type): boolean {
    if (!type.isIntersection() && !type.isUnion()) {
      return false;
    }

    // Check for Nullable<T> pattern
    const symbol = type.getSymbol();
    if (symbol?.getName().includes('Nullable')) {
      return true;
    }

    // Check for union with null
    if (type.isUnion()) {
      const unionTypes = type.getUnionTypes();
      return unionTypes.some(t => t.isNull());
    }

    return false;
  }

  /**
   * Check if type has Optional<T> wrapper
   */
  isOptional(type: Type): boolean {
    if (!type.isIntersection() && !type.isUnion()) {
      return false;
    }

    // Check for Optional<T> pattern
    const symbol = type.getSymbol();
    if (symbol?.getName().includes('Optional')) {
      return true;
    }

    // Check for union with undefined
    if (type.isUnion()) {
      const unionTypes = type.getUnionTypes();
      return unionTypes.some(t => t.isUndefined());
    }

    return false;
  }
}
