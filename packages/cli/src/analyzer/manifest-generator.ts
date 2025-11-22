/**
 * @module cli/analyzer/manifest-generator
 * @description Generates handler and module manifests from TypeScript code
 * 
 * Implements Task 8: Handler Manifest Generation
 * - Extracts handler metadata (ID, path, methods)
 * - Generates GType references
 * - Extracts hook definitions
 * - Generates security policies
 * - Creates Timescape fingerprint
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Handler manifest structure
 */
export interface HandlerManifest {
  handlerId: string;
  path: string;
  method: string | string[];
  gtypes: {
    request: string;
    response: string;
    params?: string;
    headers?: string;
  };
  hooks: {
    before: string[];
    after: string[];
    catch?: string[];
  };
  timescapeVersion: string;
  policies: {
    roles?: string[];
    rateLimit?: {
      limit: number;
      window: number;
    };
  };
  dependencies: {
    modules: string[];
    plugins?: string[];
  };
}

/**
 * Module manifest structure
 */
export interface ModuleManifest {
  moduleId: string;
  runtime: 'node' | 'wasm' | 'oci' | 'binary';
  capabilities: Capability[];
  methods: ModuleMethod[];
  version: string;
  networkAccess: {
    egress: boolean;
    allowedHosts?: string[];
  };
}

/**
 * Module capability
 */
export interface Capability {
  name: string;
  description: string;
  required: boolean;
}

/**
 * Module method definition
 */
export interface ModuleMethod {
  name: string;
  inputType: string;
  outputType: string;
  timeout?: number;
}

/**
 * Manifest generator options
 */
export interface ManifestGeneratorOptions {
  /**
   * Project root directory
   */
  projectRoot: string;
  
  /**
   * TypeScript config file path
   */
  tsConfigPath?: string;
  
  /**
   * Output directory for manifests
   */
  outputDir?: string;
}

/**
 * Manifest generator for handlers and modules
 */
export class ManifestGenerator {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private options: ManifestGeneratorOptions;

  constructor(options: ManifestGeneratorOptions) {
    this.options = options;
    
    // Load TypeScript config
    const tsConfigPath = options.tsConfigPath || path.join(options.projectRoot, 'tsconfig.json');
    const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(tsConfigPath)
    );

    // Create TypeScript program
    this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    this.checker = this.program.getTypeChecker();
  }

  /**
   * Generate handler manifest from source file
   */
  generateHandlerManifest(filePath: string): HandlerManifest | null {
    const sourceFile = this.program.getSourceFile(filePath);
    if (!sourceFile) {
      return null;
    }

    let handlerInfo: Partial<HandlerManifest> = {
      hooks: { before: [], after: [], catch: [] },
      dependencies: { modules: [], plugins: [] },
      policies: {},
    };

    // Visit all nodes in the source file
    const visit = (node: ts.Node) => {
      // Look for handler function exports
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        
        // Check if this is a handler (has req, res, lctx, gctx parameters)
        if (this.isHandlerFunction(node)) {
          handlerInfo.handlerId = this.generateHandlerId(filePath, name);
          
          // Extract path and method from JSDoc or decorators
          const jsdoc = this.extractJSDoc(node);
          handlerInfo.path = jsdoc.path || `/${name}`;
          handlerInfo.method = jsdoc.method || 'GET';
          
          // Extract GType references
          handlerInfo.gtypes = this.extractGTypes(node);
          
          // Extract hooks
          handlerInfo.hooks = this.extractHooks(node);
          
          // Extract policies
          handlerInfo.policies = this.extractPolicies(jsdoc);
          
          // Extract dependencies
          handlerInfo.dependencies = this.extractDependencies(sourceFile);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Generate Timescape version (fingerprint)
    if (handlerInfo.handlerId) {
      handlerInfo.timescapeVersion = this.generateTimescapeVersion(sourceFile);
      return handlerInfo as HandlerManifest;
    }

    return null;
  }

  /**
   * Check if function is a handler
   */
  private isHandlerFunction(node: ts.FunctionDeclaration): boolean {
    if (!node.parameters || node.parameters.length !== 4) {
      return false;
    }

    const paramNames = node.parameters.map(p => 
      p.name.kind === ts.SyntaxKind.Identifier ? (p.name as ts.Identifier).text : ''
    );

    return (
      paramNames[0] === 'req' &&
      paramNames[1] === 'res' &&
      paramNames[2] === 'lctx' &&
      paramNames[3] === 'gctx'
    );
  }

  /**
   * Generate handler ID from file path and function name
   */
  private generateHandlerId(filePath: string, functionName: string): string {
    const relativePath = path.relative(this.options.projectRoot, filePath);
    const pathParts = relativePath.split(path.sep).filter(p => p !== 'handlers');
    const baseName = path.basename(filePath, path.extname(filePath));
    
    return `${pathParts.join('.')}.${functionName}`;
  }

  /**
   * Extract JSDoc comments
   */
  private extractJSDoc(node: ts.Node): Record<string, any> {
    const jsdoc: Record<string, any> = {};
    const jsDocTags = ts.getJSDocTags(node);

    for (const tag of jsDocTags) {
      const tagName = tag.tagName.text;
      const comment = tag.comment;
      
      if (tagName === 'path' && typeof comment === 'string') {
        jsdoc.path = comment;
      } else if (tagName === 'method' && typeof comment === 'string') {
        jsdoc.method = comment.toUpperCase();
      } else if (tagName === 'roles' && typeof comment === 'string') {
        jsdoc.roles = comment.split(',').map(r => r.trim());
      } else if (tagName === 'rateLimit' && typeof comment === 'string') {
        const [limit, window] = comment.split('/').map(s => parseInt(s.trim()));
        jsdoc.rateLimit = { limit, window };
      }
    }

    return jsdoc;
  }

  /**
   * Extract GType references from handler parameters
   */
  private extractGTypes(node: ts.FunctionDeclaration): HandlerManifest['gtypes'] {
    const gtypes: HandlerManifest['gtypes'] = {
      request: 'any',
      response: 'any',
    };

    // Extract request type from first parameter
    if (node.parameters[0]?.type) {
      gtypes.request = this.typeToString(node.parameters[0].type);
    }

    // Extract response type from return type
    if (node.type) {
      gtypes.response = this.typeToString(node.type);
    }

    return gtypes;
  }

  /**
   * Convert TypeScript type node to string
   */
  private typeToString(typeNode: ts.TypeNode): string {
    return typeNode.getText();
  }

  /**
   * Extract hook definitions from handler body
   */
  private extractHooks(node: ts.FunctionDeclaration): HandlerManifest['hooks'] {
    const hooks: HandlerManifest['hooks'] = {
      before: [],
      after: [],
      catch: [],
    };

    // TODO: Analyze function body for lctx.before(), lctx.after(), lctx.catch() calls
    // This requires more complex AST traversal

    return hooks;
  }

  /**
   * Extract security policies from JSDoc
   */
  private extractPolicies(jsdoc: Record<string, any>): HandlerManifest['policies'] {
    const policies: HandlerManifest['policies'] = {};

    if (jsdoc.roles) {
      policies.roles = jsdoc.roles;
    }

    if (jsdoc.rateLimit) {
      policies.rateLimit = jsdoc.rateLimit;
    }

    return policies;
  }

  /**
   * Extract module and plugin dependencies
   */
  private extractDependencies(sourceFile: ts.SourceFile): HandlerManifest['dependencies'] {
    const dependencies: HandlerManifest['dependencies'] = {
      modules: [],
      plugins: [],
    };

    // Look for gctx.modules.* usage
    const visit = (node: ts.Node) => {
      if (ts.isPropertyAccessExpression(node)) {
        const text = node.getText();
        if (text.startsWith('gctx.modules.')) {
          const moduleName = text.split('.')[2];
          if (moduleName && !dependencies.modules.includes(moduleName)) {
            dependencies.modules.push(moduleName);
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return dependencies;
  }

  /**
   * Generate Timescape version fingerprint
   */
  private generateTimescapeVersion(sourceFile: ts.SourceFile): string {
    const content = sourceFile.getFullText();
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `v${Date.now()}-${hash.substring(0, 8)}`;
  }

  /**
   * Write manifest to file
   */
  writeManifest(manifest: HandlerManifest | ModuleManifest, filename: string): void {
    const outputDir = this.options.outputDir || path.join(this.options.projectRoot, '.gati', 'manifests');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  }
}
