/**
 * @module cli/analyzer/single-file-analyzer
 * @description Analyze single file for handler/module info
 */

import { Project } from 'ts-morph';
import { relative } from 'path';
import type { HandlerInfo, ModuleInfo } from './handler-analyzer.js';

/**
 * Analyze single file
 */
export function analyzeSingleFile(filePath: string, srcRoot: string): HandlerInfo | ModuleInfo | null {
  try {
    const project = new Project({ useInMemoryFileSystem: true });
    const normalizedPath = filePath.replace(/\\/g, '/');
    const sourceFile = project.addSourceFileAtPath(normalizedPath);
    
    const relativePath = relative(srcRoot, filePath);
    
    if (filePath.includes('/handlers/') || filePath.includes('\\handlers\\')) {
      return analyzeHandler(sourceFile, srcRoot, relativePath);
    } else if (filePath.includes('/modules/') || filePath.includes('\\modules\\')) {
      return analyzeModule(sourceFile, relativePath);
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to analyze ${filePath}:`, error);
    return null;
  }
}

function analyzeHandler(sourceFile: any, _srcRoot: string, relativePath: string): HandlerInfo | null {
  const filePath = sourceFile.getFilePath();
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
        imports: [],
        dependencies: []
      };
    }
  }
  
  return null;
}

function analyzeModule(sourceFile: any, _relativePath: string): ModuleInfo | null {
  const filePath = sourceFile.getFilePath();
  const exports = sourceFile.getExportedDeclarations();
  
  for (const [name] of exports) {
    if (!name.toLowerCase().includes('handler')) {
      return {
        filePath,
        exportName: name,
        exportType: sourceFile.getDefaultExportSymbol()?.getName() === name ? 'default' : 'named',
        methods: [],
        dependencies: []
      };
    }
  }
  
  return null;
}

function extractMethodFromExport(sourceFile: any): string | undefined {
  const exports = sourceFile.getExportedDeclarations();
  const methodExport = exports.get('METHOD');
  
  if (methodExport && methodExport[0]) {
    const declaration = methodExport[0];
    if (declaration.getKind() === 273) {
      const initializer = (declaration as any).getInitializer();
      if (initializer && initializer.getLiteralValue) {
        return initializer.getLiteralValue();
      }
    }
  }
  
  return undefined;
}

function extractRouteFromExport(sourceFile: any): string | undefined {
  const exports = sourceFile.getExportedDeclarations();
  const routeExport = exports.get('ROUTE');
  
  if (routeExport && routeExport[0]) {
    const declaration = routeExport[0];
    if (declaration.getKind() === 273) {
      const initializer = (declaration as any).getInitializer();
      if (initializer && initializer.getLiteralValue) {
        return initializer.getLiteralValue();
      }
    }
  }
  
  return undefined;
}

function pathToRoute(relativePath: string): string {
  let route = relativePath
    .replace(/\\/g, '/')
    .replace(/^handlers\//, '')
    .replace(/\.ts$/, '')
    .replace(/\.js$/, '')
    .replace(/\/index$/, '');
    
  route = route.replace(/\[([^\]]+)\]/g, ':$1');
  
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  
  return route === '/' ? '/' : route;
}

function buildFullRoute(relativePath: string, customRoute: string): string {
  const parentPath = relativePath
    .replace(/\\/g, '/')
    .replace(/^handlers\//, '')
    .replace(/\/[^/]*$/, '')
    .replace(/\/index$/, '');
    
  if (!parentPath) {
    return customRoute;
  }
  
  return `/${parentPath}${customRoute}`;
}