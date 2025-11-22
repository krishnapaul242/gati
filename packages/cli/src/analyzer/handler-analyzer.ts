/**
 * @module cli/analyzer/handler-analyzer
 * @description Analyze handlers and modules using ts-morph
 */

import type { SourceFile} from 'ts-morph';
import { Project, SyntaxKind } from 'ts-morph';
import { resolve, relative } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

export interface HandlerInfo {
  filePath: string;
  relativePath: string;
  route: string;
  customRoute?: string;
  method?: string;
  exportName: string;
  exportType: 'default' | 'named';
  imports: string[];
  dependencies: string[];
}

export interface ModuleInfo {
  filePath: string;
  exportName: string;
  exportType: 'default' | 'named';
  methods: string[];
  dependencies: string[];
}

export interface RouteNode {
  path: string;
  handler?: HandlerInfo;
  children: Map<string, RouteNode>;
  conflicts: string[];
}

export interface ProjectManifest {
  handlers: HandlerInfo[];
  modules: ModuleInfo[];
  routeTree: RouteNode;
  conflicts: string[];
}

/**
 * Analyze entire project and create manifest
 */
export function analyzeProject(projectRoot: string): ProjectManifest {
  const project = new Project({
    tsConfigFilePath: resolve(projectRoot, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true
  });

  const srcDir = resolve(projectRoot, 'src');
  const handlers: HandlerInfo[] = [];
  const modules: ModuleInfo[] = [];
  
  // Scan all TypeScript files
  const files = scanDirectory(srcDir, ['.ts', '.js']);
  
  for (const filePath of files) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    
    if (filePath.includes('/handlers/') || filePath.includes('\\handlers\\')) {
      const handler = analyzeHandler(sourceFile, srcDir);
      if (handler) handlers.push(handler);
    } else if (filePath.includes('/modules/') || filePath.includes('\\modules\\')) {
      const module = analyzeModule(sourceFile);
      if (module) modules.push(module);
    }
  }
  
  const routeTree = buildRouteTree(handlers);
  const conflicts = detectConflicts(routeTree);
  
  return { handlers, modules, routeTree, conflicts };
}

/**
 * Analyze handler file
 */
function analyzeHandler(sourceFile: SourceFile, srcRoot: string): HandlerInfo | null {
  const filePath = sourceFile.getFilePath();
  const relativePath = relative(srcRoot, filePath);

  
  // Find handler exports
  const exports = sourceFile.getExportedDeclarations();
  
  for (const [name] of exports) {
    if (name.toLowerCase().includes('handler')) {
      const method = extractMethodFromExport(sourceFile) || 'GET';
      const customRoute = extractRouteFromExport(sourceFile);
      
      return {
        filePath,
        relativePath,
        route: customRoute ? buildFullRoute(relativePath, customRoute) : pathToRoute(relativePath),
        method,
        customRoute,
        exportName: name,
        exportType: sourceFile.getDefaultExportSymbol()?.getName() === name ? 'default' : 'named',
        imports: extractImports(sourceFile),
        dependencies: extractDependencies(sourceFile)
      };
    }
  }
  
  return null;
}

/**
 * Analyze module file
 */
function analyzeModule(sourceFile: SourceFile): ModuleInfo | null {
  const filePath = sourceFile.getFilePath();
  const exports = sourceFile.getExportedDeclarations();
  
  for (const [name] of exports) {
    if (!name.toLowerCase().includes('handler')) {
      const methods = extractModuleMethods(sourceFile);
      
      return {
        filePath,
        exportName: name,
        exportType: sourceFile.getDefaultExportSymbol()?.getName() === name ? 'default' : 'named',
        methods,
        dependencies: extractDependencies(sourceFile)
      };
    }
  }
  
  return null;
}

/**
 * Convert file path to route
 */
function pathToRoute(relativePath: string): string {
  let route = relativePath
    .replace(/\\/g, '/')
    .replace(/^handlers\//, '')
    .replace(/\.ts$/, '')
    .replace(/\.js$/, '')
    .replace(/\/index$/, '');
    
  // Handle dynamic routes [param] -> :param
  route = route.replace(/\[([^\]]+)\]/g, ':$1');
  
  // Ensure starts with /
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  
  return route === '/' ? '/' : route;
}

/**
 * Extract HTTP method from METHOD export
 */
function extractMethodFromExport(sourceFile: SourceFile): string | undefined {
  const exports = sourceFile.getExportedDeclarations();
  const methodExport = exports.get('METHOD');
  
  if (methodExport && methodExport[0]) {
    const declaration = methodExport[0];
    if (declaration.getKind() === 273) { // VariableDeclaration
      const initializer = (declaration as any).getInitializer();
      if (initializer && initializer.getLiteralValue) {
        return initializer.getLiteralValue();
      }
    }
  }
  
  return undefined;
}

/**
 * Extract route from ROUTE export
 */
function extractRouteFromExport(sourceFile: SourceFile): string | undefined {
  const exports = sourceFile.getExportedDeclarations();
  const routeExport = exports.get('ROUTE');
  
  if (routeExport && routeExport[0]) {
    const declaration = routeExport[0];
    if (declaration.getKind() === 273) { // VariableDeclaration
      const initializer = (declaration as any).getInitializer();
      if (initializer && initializer.getLiteralValue) {
        return initializer.getLiteralValue();
      }
    }
  }
  
  return undefined;
}

/**
 * Build full route from file path and custom route
 */
function buildFullRoute(relativePath: string, customRoute: string): string {
  const parentPath = relativePath
    .replace(/\\/g, '/')
    .replace(/^handlers\//, '')
    .replace(/\/[^/]*$/, '') // Remove filename
    .replace(/\/index$/, ''); // Remove index
    
  if (!parentPath) {
    return customRoute;
  }
  
  return `/${parentPath}${customRoute}`;
}

/**
 * Extract imports
 */
function extractImports(sourceFile: SourceFile): string[] {
  return sourceFile.getImportDeclarations()
    .map(imp => imp.getModuleSpecifierValue())
    .filter(module => module.startsWith('.'));
}

/**
 * Extract external dependencies
 */
function extractDependencies(sourceFile: SourceFile): string[] {
  return sourceFile.getImportDeclarations()
    .map(imp => imp.getModuleSpecifierValue())
    .filter(module => !module.startsWith('.') && !module.startsWith('@gati-framework'));
}

/**
 * Extract module methods
 */
function extractModuleMethods(sourceFile: SourceFile): string[] {
  const methods: string[] = [];
  
  sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
    methods.push(method.getName());
  });
  
  sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach(prop => {
    if (prop.getParent()?.getKind() === SyntaxKind.ObjectLiteralExpression) {
      methods.push(prop.getName());
    }
  });
  
  return methods;
}

/**
 * Build route tree from handlers
 */
function buildRouteTree(handlers: HandlerInfo[]): RouteNode {
  const root: RouteNode = {
    path: '/',
    children: new Map(),
    conflicts: []
  };
  
  for (const handler of handlers) {
    const segments = handler.route.split('/').filter(Boolean);
    let current = root;
    
    for (const segment of segments) {
      if (!current.children.has(segment)) {
        current.children.set(segment, {
          path: segment,
          children: new Map(),
          conflicts: []
        });
      }
      current = current.children.get(segment)!;
    }
    
    if (current.handler) {
      current.conflicts.push(`Duplicate route: ${handler.route}`);
    }
    current.handler = handler;
  }
  
  return root;
}

/**
 * Detect route conflicts
 */
function detectConflicts(node: RouteNode, conflicts: string[] = []): string[] {
  if (node.conflicts.length > 0) {
    conflicts.push(...node.conflicts);
  }
  
  for (const child of node.children.values()) {
    detectConflicts(child, conflicts);
  }
  
  return conflicts;
}

/**
 * Scan directory for files
 */
function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  if (!existsSync(dir)) return files;
  
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...scanDirectory(fullPath, extensions));
    } else if (extensions.some(ext => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}