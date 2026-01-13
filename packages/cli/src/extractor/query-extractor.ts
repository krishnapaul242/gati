/**
 * @module cli/extractor/query-extractor
 * @description Extract QUERY type from req.query usage
 */

import type { SourceFile, Type } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { GType } from '@gati-framework/types/gtype';

/**
 * Extract QUERY from req.query usage in handler
 */
export function extractQuery(sourceFile: SourceFile, handlerName: string): GType | null {
  const queryParams = new Set<string>();
  
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
  
  // Find req.query destructuring: const { page, limit } = req.query
  handlerFunc.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(varDecl => {
    const initializer = varDecl.getInitializer();
    if (!initializer) return;
    
    const initText = initializer.getText();
    if (initText.includes('req.query')) {
      const binding = varDecl.getNameNode();
      if (binding.getKind() === SyntaxKind.ObjectBindingPattern) {
        (binding as any).getElements().forEach((element: any) => {
          queryParams.add(element.getName());
        });
      }
    }
  });
  
  // Find req.query property access: req.query.page
  handlerFunc.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(propAccess => {
    const expr = propAccess.getExpression();
    if (expr.getText() === 'req.query') {
      queryParams.add(propAccess.getName());
    }
  });
  
  if (queryParams.size === 0) {
    return null;
  }
  
  const properties: Record<string, { type: GType; required: boolean }> = {};
  
  for (const param of queryParams) {
    properties[param] = {
      type: { version: '1.0', type: 'string', nullable: true },
      required: false
    };
  }
  
  return {
    version: '1.0',
    type: 'object',
    properties,
    required: []
  };
}
