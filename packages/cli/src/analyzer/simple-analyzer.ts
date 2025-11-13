/**
 * @module cli/analyzer/simple-analyzer
 * @description Simple file-based analyzer without ts-morph
 */

import { readFileSync } from 'fs';
import { relative } from 'path';

export interface HandlerInfo {
  filePath: string;
  relativePath: string;
  route: string;
  method: string;
  exportName: string;
  exportType: 'default' | 'named';
}

export interface ModuleInfo {
  filePath: string;
  exportName: string;
  exportType: 'default' | 'named';
  methods: string[];
}

export function analyzeFile(filePath: string, srcRoot: string): HandlerInfo | ModuleInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = relative(srcRoot, filePath);
    
    if (filePath.includes('/handlers/') || filePath.includes('\\handlers\\')) {
      return analyzeHandler(content, filePath, relativePath);
    } else if (filePath.includes('/modules/') || filePath.includes('\\modules\\')) {
      return analyzeModule(content, filePath);
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to analyze ${filePath}:`, error);
    return null;
  }
}

function analyzeHandler(content: string, filePath: string, relativePath: string): HandlerInfo | null {
  // Extract METHOD export
  const methodMatch = content.match(/export\s+const\s+METHOD\s*=\s*['"`]([^'"`]+)['"`]/);
  const method = methodMatch?.[1] || 'GET';
  
  // Extract ROUTE export
  const routeMatch = content.match(/export\s+const\s+ROUTE\s*=\s*['"`]([^'"`]+)['"`]/);
  const customRoute = routeMatch?.[1] || null;
  
  // Extract handler export
  const handlerMatch = content.match(/export\s+const\s+(\w*[Hh]andler\w*)/);
  if (!handlerMatch?.[1]) return null;
  
  const exportName = handlerMatch[1];
  const route = customRoute ? buildFullRoute(relativePath, customRoute) : pathToRoute(relativePath);
  
  return {
    filePath,
    relativePath,
    route,
    method,
    exportName,
    exportType: 'named'
  };
}

function analyzeModule(content: string, filePath: string): ModuleInfo | null {
  // Extract module export
  const moduleMatch = content.match(/export\s+const\s+(\w+)/);
  if (!moduleMatch?.[1]) return null;
  
  const exportName = moduleMatch[1];
  
  // Extract method names (simple regex)
  const methods = [...content.matchAll(/(\w+):\s*(?:async\s+)?\(/g)]
    .map(match => match[1])
    .filter((name): name is string => name !== undefined && !['export', 'const', 'function'].includes(name));
  
  return {
    filePath,
    exportName,
    exportType: 'named',
    methods
  };
}

function pathToRoute(relativePath: string): string {
  let route = relativePath
    .replace(/\\/g, '/') // Normalize to forward slashes
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
  let parentPath = relativePath
    .replace(/\\/g, '/') // Normalize to forward slashes
    .replace(/^handlers\//, '');
    
  // Remove filename (everything after last slash, or entire string if no slash)
  const lastSlash = parentPath.lastIndexOf('/');
  if (lastSlash >= 0) {
    parentPath = parentPath.substring(0, lastSlash);
  } else {
    parentPath = ''; // No parent directory
  }
    
  if (!parentPath) {
    return customRoute;
  }
  
  return `/${parentPath}${customRoute}`;
}