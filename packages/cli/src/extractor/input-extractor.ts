/**
 * @module cli/extractor/input-extractor
 * @description Extract INPUT type from req.body usage
 */

import type { SourceFile, Type } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { GType } from '@gati-framework/types/gtype';
import type { TypeExtractor } from './type-extractor.js';

/**
 * Extract INPUT from req.body usage in handler
 */
export function extractInput(
  sourceFile: SourceFile,
  handlerName: string,
  typeExtractor: TypeExtractor
): GType | null {
  // Find handler function
  let handlerFunc = sourceFile.getFunction(handlerName);
  if (!handlerFunc) {
    const varDecl = sourceFile.getVariableDeclaration(handlerName);
    if (varDecl) {
      const initializer = varDecl.getInitializer();
      if (initializer && (initializer.getKind() === SyntaxKind.ArrowFunction || initializer.getKind() === SyntaxKind.FunctionExpression)) {
        handlerFunc = initializer as any;
      }
    }
  }
  
  if (!handlerFunc) return null;
  
  // Get req parameter type
  const params = handlerFunc.getParameters();
  if (params.length === 0) return null;
  
  const reqParam = params[0];
  const reqType = reqParam.getType();
  
  // Get body property type
  const bodyProp = reqType.getProperty('body');
  if (!bodyProp) return null;
  
  const bodySymbol = bodyProp.getValueDeclaration();
  if (!bodySymbol) return null;
  
  try {
    const bodyType = reqType.getPropertyOrThrow('body').getTypeAtLocation(bodySymbol);
    const typeText = bodyType.getText();
    
    // Skip if body is unknown or any
    if (typeText === 'unknown' || typeText === 'any') {
      return null;
    }
    
    // Convert to GType using type extractor
    const context = {
      depth: 0,
      visited: new Set<string>(),
      stack: ['RequestBody'],
      warnings: [],
      options: {
        depthLimit: { warn: 20, error: 50 },
        sizeLimit: { warn: 51200, error: 512000 },
        allowExternalTypes: false,
        incremental: true,
        cacheDir: '.gati/cache/types',
        sourceRoot: process.cwd(),
        tsConfigPath: 'tsconfig.json'
      }
    };
    
    const schema = (typeExtractor as any).extractTypeNode(bodyType, context);
    return schema || null;
  } catch (error) {
    return null;
  }
}
