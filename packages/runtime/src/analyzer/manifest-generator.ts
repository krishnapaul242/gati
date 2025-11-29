/**
 * @module runtime/analyzer/manifest-generator
 * @description Generate module manifests from TypeScript exports
 */

import * as ts from 'typescript';
import * as crypto from 'crypto';
import type { ModuleManifest, ModuleMethod, ModuleRuntime } from '../types/module-manifest.js';

export interface ManifestGeneratorOptions {
  runtime?: ModuleRuntime;
  moduleId?: string;
  version?: string;
}

/**
 * Generate module manifest from TypeScript source file
 */
export function generateModuleManifest(
  sourceFile: ts.SourceFile,
  options: ManifestGeneratorOptions = {}
): ModuleManifest {
  const methods: ModuleMethod[] = [];
  
  // Extract exported functions
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const hasExportModifier = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      );
      
      if (hasExportModifier) {
        const method = extractMethodFromFunction(node);
        if (method) methods.push(method);
      }
    }
  });

  const manifest: ModuleManifest = {
    moduleId: options.moduleId || 'unknown-module',
    version: options.version || '1.0.0',
    runtime: options.runtime || 'node',
    capabilities: [],
    methods,
    networkAccess: { egress: false },
    hash: '',
    createdAt: Date.now()
  };

  manifest.hash = generateManifestHash(manifest);
  return manifest;
}

/**
 * Extract method definition from function declaration
 */
function extractMethodFromFunction(node: ts.FunctionDeclaration): ModuleMethod | null {
  if (!node.name) return null;

  return {
    name: node.name.text,
    inputType: 'any', // Would extract from parameters in full implementation
    outputType: 'any', // Would extract from return type in full implementation
    description: extractJSDocComment(node)
  };
}

/**
 * Extract JSDoc comment from node
 */
function extractJSDocComment(node: ts.Node): string | undefined {
  const jsDoc = (node as any).jsDoc;
  if (jsDoc && jsDoc.length > 0) {
    return jsDoc[0].comment;
  }
  return undefined;
}

/**
 * Generate hash for manifest integrity
 */
function generateManifestHash(manifest: Omit<ModuleManifest, 'hash'>): string {
  const content = JSON.stringify({
    moduleId: manifest.moduleId,
    version: manifest.version,
    methods: manifest.methods.map(m => ({ name: m.name, inputType: m.inputType, outputType: m.outputType }))
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate manifest from TypeScript source code string
 */
export function generateManifestFromSource(
  source: string,
  fileName: string,
  options: ManifestGeneratorOptions = {}
): ModuleManifest {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true
  );
  return generateModuleManifest(sourceFile, options);
}
