/**
 * @module cli/analyzer/manifest-generator
 * @description Generate gati.config.ts from analyzed handlers
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import type { ProjectManifest, HandlerInfo } from './handler-analyzer.js';

/**
 * Generate gati.config.ts from project manifest
 */
export function generateConfig(manifest: ProjectManifest, projectRoot: string): void {
  const configContent = generateConfigContent(manifest);
  const configPath = resolve(projectRoot, 'gati.config.ts');
  
  writeFileSync(configPath, configContent);
}

/**
 * Generate config file content
 */
function generateConfigContent(manifest: ProjectManifest): string {
  const imports = generateImports(manifest.handlers);
  const routes = generateRoutes(manifest.handlers);
  const modules = generateModules(manifest.modules);
  
  return `/**
 * Auto-generated Gati configuration
 * DO NOT EDIT - This file is generated from your handlers
 */

${imports}

export default {
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  routes: [
${routes}
  ],
  
  modules: (gctx) => {
${modules}
  }
};
`;
}

/**
 * Generate import statements with unique aliases
 */
function generateImports(handlers: HandlerInfo[]): string {
  const imports: string[] = [];
  
  for (const handler of handlers) {
    const importPath = handler.relativePath.replace(/\.ts$/, '').replace(/\\/g, '/');
    const method = (handler.method || 'GET').toLowerCase();
    const methodCase = method.charAt(0).toUpperCase() + method.slice(1);
    const routePath = handler.route.replace(/:/g, 'by_').replace(/\//g, '_').replace(/^_/, '');
    const alias = `${methodCase}_${routePath}`;
    
    if (handler.exportType === 'default') {
      imports.push(`import ${alias} from './src/${importPath}';`);
    } else {
      imports.push(`import { ${handler.exportName} as ${alias} } from './src/${importPath}';`);
    }
  }
  
  return imports.join('\n');
}

/**
 * Generate routes array with unique aliases
 */
function generateRoutes(handlers: HandlerInfo[]): string {
  const routes: string[] = [];
  
  for (const handler of handlers) {
    const method = handler.method || 'GET';
    const methodCase = method.toLowerCase().charAt(0).toUpperCase() + method.toLowerCase().slice(1);
    const routePath = handler.route.replace(/:/g, 'by_').replace(/\//g, '_').replace(/^_/, '');
    const alias = `${methodCase}_${routePath}`;
    
    routes.push(`    {
      method: '${method}',
      path: '${handler.route}',
      handler: ${alias}
    }`);
  }
  
  return routes.join(',\n');
}

/**
 * Generate modules initialization
 */
function generateModules(modules: any[]): string {
  if (modules.length === 0) {
    return '    // No modules found';
  }
  
  const moduleInits: string[] = [];
  
  for (const module of modules) {
    moduleInits.push(`    // Initialize ${module.exportName} module`);
  }
  
  return moduleInits.join('\n');
}

/**
 * Generate TypeScript types from manifest
 */
export function generateTypes(manifest: ProjectManifest): string {
  const stateTypes = generateStateTypes(manifest);
  const moduleTypes = generateModuleTypes(manifest);
  
  return `// Auto-generated types from handlers and modules

declare module '@gati-framework/runtime' {
${stateTypes}
${moduleTypes}
}
`;
}

/**
 * Generate state interface types
 */
function generateStateTypes(manifest: ProjectManifest): string {
  // Analyze handlers for common state patterns
  const stateFields = new Set<string>();
  
  if (manifest.handlers.length > 0) {
    // This would be enhanced to analyze actual usage
    stateFields.add('user: any');
    stateFields.add('authenticated: boolean');
  }
  
  if (stateFields.size === 0) {
    return '';
  }
  
  return `  interface LocalContextState {
    ${Array.from(stateFields).join(';\n    ')};
  }`;
}

/**
 * Generate module interface types
 */
function generateModuleTypes(manifest: ProjectManifest): string {
  if (manifest.modules.length === 0) {
    return '';
  }
  
  const moduleInterfaces: string[] = [];
  
  for (const module of manifest.modules) {
    const methods = module.methods.map(method => `${method}(...args: any[]): any`);
    moduleInterfaces.push(`    ${module.exportName}: {
      ${methods.join(';\n      ')};
    }`);
  }
  
  return `  interface ModuleRegistry {
${moduleInterfaces.join(';\n')}
  }`;
}