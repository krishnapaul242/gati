/**
 * @module cli/analyzer/hook-extractor
 * @description Extracts hook definitions from handler TypeScript code
 * 
 * Implements Task 21: Hook Manifest Recording
 * - Detects lctx.before(), lctx.after(), lctx.catch() calls
 * - Extracts hook metadata (id, level, async, timeout, retries)
 * - Captures source location for debugging
 */

import * as ts from 'typescript';

/**
 * Extracted hook definition
 */
export interface ExtractedHook {
  id: string;
  type: 'before' | 'after' | 'catch';
  level: 'global' | 'handler' | 'request';
  isAsync: boolean;
  timeout?: number;
  retries?: number;
  sourceLocation: {
    file: string;
    line: number;
    column: number;
  };
}

/**
 * Extract all hooks from a TypeScript source file
 */
export function extractHooks(sourceFile: ts.SourceFile): ExtractedHook[] {
  const hooks: ExtractedHook[] = [];
  
  function visit(node: ts.Node) {
    // Look for lctx.before(), lctx.after(), lctx.catch() calls
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression;
        const method = expr.name.text;
        
        // Check if it's lctx.before/after/catch
        if (
          ts.isIdentifier(obj) &&
          obj.text === 'lctx' &&
          ['before', 'after', 'catch'].includes(method)
        ) {
          const hook = extractHookFromCall(node, method as any, sourceFile);
          if (hook) {
            hooks.push(hook);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return hooks;
}

/**
 * Extract hook details from a call expression
 */
function extractHookFromCall(
  node: ts.CallExpression,
  type: 'before' | 'after' | 'catch',
  sourceFile: ts.SourceFile
): ExtractedHook | null {
  const args = node.arguments;
  if (args.length === 0) {
    return null;
  }
  
  const hookConfig = args[0];
  
  return {
    id: extractStringLiteral(hookConfig, 'id') || `${type}_${Date.now()}`,
    type,
    level: (extractStringLiteral(hookConfig, 'level') as any) || 'handler',
    isAsync: isAsyncFunction(hookConfig),
    timeout: extractNumberLiteral(hookConfig, 'timeout'),
    retries: extractNumberLiteral(hookConfig, 'retries'),
    sourceLocation: getSourceLocation(node, sourceFile),
  };
}

/**
 * Extract string literal from object property
 */
function extractStringLiteral(node: ts.Node, propertyName: string): string | undefined {
  if (!ts.isObjectLiteralExpression(node)) {
    return undefined;
  }
  
  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === propertyName &&
      ts.isStringLiteral(prop.initializer)
    ) {
      return prop.initializer.text;
    }
  }
  
  return undefined;
}

/**
 * Extract number literal from object property
 */
function extractNumberLiteral(node: ts.Node, propertyName: string): number | undefined {
  if (!ts.isObjectLiteralExpression(node)) {
    return undefined;
  }
  
  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === propertyName &&
      ts.isNumericLiteral(prop.initializer)
    ) {
      return parseInt(prop.initializer.text, 10);
    }
  }
  
  return undefined;
}

/**
 * Check if hook function is async
 */
function isAsyncFunction(node: ts.Node): boolean {
  if (!ts.isObjectLiteralExpression(node)) {
    return false;
  }
  
  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === 'fn'
    ) {
      const fn = prop.initializer;
      
      // Check for async keyword
      if (ts.isFunctionExpression(fn) || ts.isArrowFunction(fn)) {
        return !!(fn.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword));
      }
    }
  }
  
  return false;
}

/**
 * Get source location for a node
 */
function getSourceLocation(
  node: ts.Node,
  sourceFile: ts.SourceFile
): { file: string; line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  
  return {
    file: sourceFile.fileName,
    line: line + 1, // Convert to 1-based
    column: character + 1, // Convert to 1-based
  };
}
