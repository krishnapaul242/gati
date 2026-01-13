/**
 * @module cli/extractor/output-extractor
 * @description Extract OUTPUT type from res.json() calls
 */

import type { SourceFile } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { GType } from '@gati-framework/types/gtype';
import type { TypeExtractor } from './type-extractor.js';

/**
 * Extract OUTPUT from res.json() calls in handler
 */
export function extractOutput(
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
  
  const outputTypes: GType[] = [];
  
  // Find all res.json() calls
  handlerFunc.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
    const expr = callExpr.getExpression();
    
    // Check if it's res.json()
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr as any;
      const obj = propAccess.getExpression();
      const prop = propAccess.getName();
      
      if (obj.getText() === 'res' && prop === 'json') {
        const args = callExpr.getArguments();
        if (args.length > 0) {
          const arg = args[0];
          const argType = arg.getType();
          
          try {
            const context = {
              depth: 0,
              visited: new Set<string>(),
              stack: ['ResponseBody'],
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
            
            const schema = (typeExtractor as any).extractTypeNode(argType, context);
            if (schema) {
              outputTypes.push(schema);
            }
          } catch (error) {
            // Skip this output
          }
        }
      }
    }
  });
  
  if (outputTypes.length === 0) {
    return null;
  }
  
  // If single output, return it
  if (outputTypes.length === 1) {
    return outputTypes[0];
  }
  
  // Multiple outputs → union type
  return {
    version: '1.0',
    type: 'union',
    anyOf: outputTypes
  };
}
