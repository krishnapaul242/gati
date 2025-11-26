/**
 * @module cli/commands/generate
 * @description Generate code artifacts (validators, types, SDK, bundles)
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { watch } from 'chokidar';
import chalk from 'chalk';
import { generateValidators, generateTypes, generateSDK, generateBundle, generateAll } from '../codegen/index.js';
import type { HandlerManifest, ModuleManifest } from '../analyzer/manifest-generator.js';

interface GenerateOptions {
  output?: string;
  watch?: boolean;
  incremental?: boolean;
  format?: boolean;
}

/**
 * Load schemas from project
 */
async function loadSchemas(projectRoot: string): Promise<Record<string, any>> {
  // TODO: Implement schema loading from project
  // For now, return empty object
  return {};
}

/**
 * Load manifests from project
 */
async function loadManifests(projectRoot: string): Promise<{ handlers: HandlerManifest[]; modules: ModuleManifest[] }> {
  // TODO: Implement manifest loading from project
  // For now, return empty arrays
  return { handlers: [], modules: [] };
}

/**
 * Generate validators command
 */
const validatorsCommand = new Command('validators')
  .description('Generate validator functions from GType schemas')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes')
  .option('-i, --incremental', 'Only generate changed files')
  .option('--no-format', 'Skip code formatting')
  .action(async (options: GenerateOptions) => {
    const projectRoot = process.cwd();
    
    console.log(chalk.blue('🔧 Generating validators...'));
    
    const schemas = await loadSchemas(projectRoot);
    const result = await generateValidators(schemas, {
      projectRoot,
      outputDir: options.output,
      incremental: options.incremental,
      format: options.format !== false,
    });

    if (result.success) {
      console.log(chalk.green(`✅ Generated ${result.filesGenerated.length} validator files`));
    } else {
      console.error(chalk.red(`❌ Failed with ${result.errors.length} errors:`));
      result.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
      process.exit(1);
    }

    if (options.watch) {
      console.log(chalk.blue('👀 Watching for changes...'));
      const watcher = watch('**/*.gtype.ts', { cwd: projectRoot, ignoreInitial: true });
      
      watcher.on('change', async (path) => {
        console.log(chalk.yellow(`\n📝 Schema changed: ${path}`));
        const schemas = await loadSchemas(projectRoot);
        await generateValidators(schemas, {
          projectRoot,
          outputDir: options.output,
          incremental: true,
          format: options.format !== false,
        });
      });
    }
  });

/**
 * Generate types command
 */
const typesCommand = new Command('types')
  .description('Generate TypeScript type definitions from GType schemas')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes')
  .option('--no-format', 'Skip code formatting')
  .action(async (options: GenerateOptions) => {
    const projectRoot = process.cwd();
    
    console.log(chalk.blue('📝 Generating TypeScript definitions...'));
    
    const schemas = await loadSchemas(projectRoot);
    const result = await generateTypes(schemas, {
      projectRoot,
      outputDir: options.output,
      format: options.format !== false,
    });

    if (result.success) {
      console.log(chalk.green(`✅ Generated ${result.filesGenerated.length} type definition files`));
    } else {
      console.error(chalk.red(`❌ Failed with ${result.errors.length} errors:`));
      result.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
      process.exit(1);
    }

    if (options.watch) {
      console.log(chalk.blue('👀 Watching for changes...'));
      const watcher = watch('**/*.gtype.ts', { cwd: projectRoot, ignoreInitial: true });
      
      watcher.on('change', async (path) => {
        console.log(chalk.yellow(`\n📝 Schema changed: ${path}`));
        const schemas = await loadSchemas(projectRoot);
        await generateTypes(schemas, {
          projectRoot,
          outputDir: options.output,
          format: options.format !== false,
        });
      });
    }
  });

/**
 * Generate SDK command
 */
const sdkCommand = new Command('sdk')
  .description('Generate SDK client from handler manifests')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes')
  .option('--no-format', 'Skip code formatting')
  .action(async (options: GenerateOptions) => {
    const projectRoot = process.cwd();
    
    console.log(chalk.blue('🚀 Generating SDK client...'));
    
    const { handlers } = await loadManifests(projectRoot);
    const result = await generateSDK(handlers, {
      projectRoot,
      outputDir: options.output,
      format: options.format !== false,
    });

    if (result.success) {
      console.log(chalk.green(`✅ Generated ${result.filesGenerated.length} SDK files`));
    } else {
      console.error(chalk.red(`❌ Failed with ${result.errors.length} errors:`));
      result.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
      process.exit(1);
    }

    if (options.watch) {
      console.log(chalk.blue('👀 Watching for changes...'));
      const watcher = watch('src/handlers/**/*.ts', { cwd: projectRoot, ignoreInitial: true });
      
      watcher.on('change', async (path) => {
        console.log(chalk.yellow(`\n📝 Handler changed: ${path}`));
        const { handlers } = await loadManifests(projectRoot);
        await generateSDK(handlers, {
          projectRoot,
          outputDir: options.output,
          format: options.format !== false,
        });
      });
    }
  });

/**
 * Generate bundle command
 */
const bundleCommand = new Command('bundle')
  .description('Generate manifest bundle for deployment')
  .option('-o, --output <dir>', 'Output directory')
  .option('--no-format', 'Skip code formatting')
  .action(async (options: GenerateOptions) => {
    const projectRoot = process.cwd();
    
    console.log(chalk.blue('📦 Generating manifest bundle...'));
    
    const schemas = await loadSchemas(projectRoot);
    const { handlers, modules } = await loadManifests(projectRoot);
    const result = await generateBundle(handlers, modules, schemas, {
      projectRoot,
      outputDir: options.output,
      format: options.format !== false,
    });

    if (result.success) {
      console.log(chalk.green(`✅ Generated ${result.filesGenerated.length} bundle files`));
    } else {
      console.error(chalk.red(`❌ Failed with ${result.errors.length} errors:`));
      result.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
      process.exit(1);
    }
  });

/**
 * Generate all command
 */
const allCommand = new Command('all')
  .description('Generate all code artifacts (validators, types, SDK, bundle)')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes')
  .option('-i, --incremental', 'Only generate changed files')
  .option('--no-format', 'Skip code formatting')
  .action(async (options: GenerateOptions) => {
    const projectRoot = process.cwd();
    
    const schemas = await loadSchemas(projectRoot);
    const { handlers, modules } = await loadManifests(projectRoot);
    
    const result = await generateAll(handlers, modules, schemas, {
      projectRoot,
      outputDir: options.output,
      incremental: options.incremental,
      format: options.format !== false,
    });

    if (!result.success) {
      process.exit(1);
    }

    if (options.watch) {
      console.log(chalk.blue('\n👀 Watching for changes...'));
      const watcher = watch(['**/*.gtype.ts', 'src/handlers/**/*.ts'], { 
        cwd: projectRoot, 
        ignoreInitial: true 
      });
      
      watcher.on('change', async (path) => {
        console.log(chalk.yellow(`\n📝 File changed: ${path}`));
        const schemas = await loadSchemas(projectRoot);
        const { handlers, modules } = await loadManifests(projectRoot);
        await generateAll(handlers, modules, schemas, {
          projectRoot,
          outputDir: options.output,
          incremental: true,
          format: options.format !== false,
        });
      });
    }
  });

/**
 * Main generate command
 */
export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate code artifacts from schemas and manifests')
  .addCommand(validatorsCommand)
  .addCommand(typesCommand)
  .addCommand(sdkCommand)
  .addCommand(bundleCommand)
  .addCommand(allCommand);
