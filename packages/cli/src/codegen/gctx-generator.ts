/**
 * @module cli/codegen/gctx-generator
 * @description Generate GCTX type from gati.config.js
 */

import { resolve } from 'path';
import { existsSync } from 'fs';

export interface GCTXGeneratorOptions {
  projectRoot: string;
  configPath?: string;
}

/**
 * Generate GCTX interface from config
 */
export async function generateGCTX(options: GCTXGeneratorOptions): Promise<string> {
  const configPath = options.configPath || resolve(options.projectRoot, 'gati.config.js');
  
  if (!existsSync(configPath)) {
    return generateDefaultGCTX();
  }
  
  try {
    // Dynamic import of config
    const config = await import(configPath);
    const gatiConfig = config.default || config;
    
    const modules = gatiConfig.modules || {};
    const plugins = gatiConfig.plugins || {};
    
    return generateGCTXFromConfig(modules, plugins);
  } catch (error) {
    return generateDefaultGCTX();
  }
}

/**
 * Generate GCTX from config modules and plugins
 */
function generateGCTXFromConfig(
  modules: Record<string, string>,
  plugins: Record<string, string>
): string {
  const lines: string[] = [];
  
  lines.push('/**');
  lines.push(' * Auto-generated Global Context type');
  lines.push(' * @generated');
  lines.push(' */');
  lines.push('');
  
  // Import module types
  const moduleImports: string[] = [];
  for (const [name, path] of Object.entries(modules)) {
    const importName = `${capitalize(name)}Module`;
    moduleImports.push(`import type { default as ${importName} } from '${path}';`);
  }
  
  // Import plugin types
  const pluginImports: string[] = [];
  for (const [name, path] of Object.entries(plugins)) {
    const importName = `${capitalize(name)}Plugin`;
    pluginImports.push(`import type { default as ${importName} } from '${path}';`);
  }
  
  if (moduleImports.length > 0) {
    lines.push(...moduleImports);
    lines.push('');
  }
  
  if (pluginImports.length > 0) {
    lines.push(...pluginImports);
    lines.push('');
  }
  
  // Generate GCTX interface
  lines.push('export interface GCTX {');
  
  // Modules
  if (Object.keys(modules).length > 0) {
    lines.push('  modules: {');
    for (const name of Object.keys(modules)) {
      const importName = `${capitalize(name)}Module`;
      lines.push(`    '${name}': ${importName};`);
    }
    lines.push('  };');
  } else {
    lines.push('  modules: Record<string, unknown>;');
  }
  
  // Plugins
  if (Object.keys(plugins).length > 0) {
    lines.push('  plugins: {');
    for (const name of Object.keys(plugins)) {
      const importName = `${capitalize(name)}Plugin`;
      lines.push(`    '${name}': ${importName};`);
    }
    lines.push('  };');
  } else {
    lines.push('  plugins: Record<string, unknown>;');
  }
  
  // Standard fields
  lines.push('  config: Record<string, unknown>;');
  lines.push('  logger: {');
  lines.push('    info: (message: string, ...args: any[]) => void;');
  lines.push('    warn: (message: string, ...args: any[]) => void;');
  lines.push('    error: (message: string, ...args: any[]) => void;');
  lines.push('    debug: (message: string, ...args: any[]) => void;');
  lines.push('  };');
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generate default GCTX when no config found
 */
function generateDefaultGCTX(): string {
  return `/**
 * Auto-generated Global Context type
 * @generated
 */

export interface GCTX {
  modules: Record<string, unknown>;
  plugins: Record<string, unknown>;
  config: Record<string, unknown>;
  logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
}
`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
