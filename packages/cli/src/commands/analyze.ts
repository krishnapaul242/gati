/**
 * @module cli/commands/analyze
 * @description Analyze project and generate config/types
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeProject } from '../analyzer/handler-analyzer.js';
import { generateConfig, generateTypes } from '../analyzer/manifest-generator.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

interface AnalyzeOptions {
  config?: boolean;
  types?: boolean;
  watch?: boolean;
}

/**
 * Analyze project command
 */
async function analyzeProjectCommand(cwd: string, options: AnalyzeOptions): Promise<void> {
  try {
    console.log(chalk.blue('🔍 Analyzing project...'));
    
    const manifest = analyzeProject(cwd);
    
    // Show analysis results
    console.log(chalk.green(`✅ Found ${manifest.handlers.length} handlers`));
    console.log(chalk.green(`✅ Found ${manifest.modules.length} modules`));
    
    if (manifest.conflicts.length > 0) {
      console.log(chalk.red('⚠️  Route conflicts detected:'));
      manifest.conflicts.forEach(conflict => {
        console.log(chalk.red(`   ${conflict}`));
      });
    }
    
    // Generate config if requested
    if (options.config !== false) {
      generateConfig(manifest, cwd);
      console.log(chalk.green('✅ Generated gati.config.ts'));
    }
    
    // Generate types if requested
    if (options.types !== false) {
      const typesContent = generateTypes(manifest);
      const typesDir = resolve(cwd, '.gati');
      const typesPath = resolve(typesDir, 'types.d.ts');
      
      if (!existsSync(typesDir)) {
        mkdirSync(typesDir, { recursive: true });
      }
      
      writeFileSync(typesPath, typesContent);
      console.log(chalk.green('✅ Generated .gati/types.d.ts'));
    }
    
    // Show route tree
    console.log(chalk.blue('\n📋 Route Tree:'));
    printRouteTree(manifest.routeTree);
    
  } catch (error) {
    console.error(chalk.red('✖ Analysis failed:'), error);
    process.exit(1);
  }
}

/**
 * Print route tree
 */
function printRouteTree(node: any, prefix = '', isLast = true): void {
  const connector = isLast ? '└── ' : '├── ';
  const path = node.path === '/' ? '/' : node.path;
  
  if (node.handler) {
    const method = node.handler.method || 'GET';
    console.log(chalk.gray(prefix + connector) + chalk.cyan(path) + chalk.yellow(` [${method}]`));
  } else if (node.children.size > 0) {
    console.log(chalk.gray(prefix + connector) + chalk.white(path + '/'));
  }
  
  const children = Array.from(node.children.values());
  children.forEach((child, index) => {
    const isChildLast = index === children.length - 1;
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    printRouteTree(child, childPrefix, isChildLast);
  });
}

export const analyzeCommand = new Command('analyze')
  .description('Analyze project handlers and generate config/types')
  .option('--no-config', 'Skip generating gati.config.ts')
  .option('--no-types', 'Skip generating types')
  .option('-w, --watch', 'Watch for changes and re-analyze')
  .action(async (options: AnalyzeOptions) => {
    const cwd = process.cwd();
    await analyzeProjectCommand(cwd, options);
  });