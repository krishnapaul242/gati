/**
 * @module cli/commands/generate-types
 * @description Generate TypeScript declarations from schema
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import type { TypeSchema } from '@gati-framework/runtime';

/**
 * Generate TypeScript declarations
 */
async function generateTypeDeclarations(cwd: string): Promise<void> {
  try {
    // Look for gati.types.json or gati.types.ts
    const jsonPath = resolve(cwd, 'gati.types.json');
    const tsPath = resolve(cwd, 'gati.types.ts');
    
    let schema: TypeSchema = {};
    
    if (existsSync(jsonPath)) {
      const content = JSON.parse(readFileSync(jsonPath, 'utf-8')) as TypeSchema;
      schema = content;
      console.log(chalk.blue('📄 Using gati.types.json'));
    } else if (existsSync(tsPath)) {
      // Dynamic import for TypeScript config
      const configUrl = new URL(`file://${tsPath.replace(/\\/g, '/')}`).href;
      const configModule = await import(configUrl);
      schema = configModule.default || configModule.schema;
      console.log(chalk.blue('📄 Using gati.types.ts'));
    } else {
      console.log(chalk.yellow('⚠ No type schema found. Creating default gati.types.json'));
      schema = {
        state: {
          user: 'object',
          permissions: 'array',
          authenticated: 'boolean'
        },
        modules: {
          db: {
            findUser: { params: { id: 'string' }, returns: 'object' },
            createUser: { params: { data: 'object' }, returns: 'object' }
          }
        }
      };
      writeFileSync(jsonPath, JSON.stringify(schema, null, 2));
    }
    
    // Generate TypeScript declarations
    const { generateTypes } = await import('@gati-framework/runtime');
    const declarations = generateTypes(schema);
    
    // Write to .gati/types.d.ts
    const outputDir = resolve(cwd, '.gati');
    const outputPath = resolve(outputDir, 'types.d.ts');
    
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    writeFileSync(outputPath, declarations);
    
    console.log(chalk.green('✅ Generated types at .gati/types.d.ts'));
    console.log(chalk.gray('💡 Add ".gati/types.d.ts" to your tsconfig.json includes'));
    
  } catch (error) {
    console.error(chalk.red('✖ Failed to generate types:'), error);
    process.exit(1);
  }
}

export const generateTypesCommand = new Command('generate:types')
  .description('Generate TypeScript declarations from schema')
  .action(async () => {
    const cwd = process.cwd();
    await generateTypeDeclarations(cwd);
  });
