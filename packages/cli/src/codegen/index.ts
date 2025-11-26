/**
 * @module cli/codegen
 * @description Unified code generation orchestrator for validators, types, SDK, and bundles
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ValidatorGenerator } from './validator-generator.js';
import { TypeDefGenerator } from './typedef-generator.js';
import { SDKGenerator } from './sdk-generator.js';
import { BundleGenerator } from './bundle-generator.js';
import type { GType } from '@gati-framework/runtime';
import type { HandlerManifest, ModuleManifest } from '../analyzer/manifest-generator.js';

export interface CodegenOptions {
  projectRoot: string;
  outputDir?: string;
  watch?: boolean;
  incremental?: boolean;
  format?: boolean;
}

export interface CodegenResult {
  success: boolean;
  filesGenerated: string[];
  errors: string[];
}

/**
 * Generate validator functions from GType schemas
 */
export async function generateValidators(
  schemas: Record<string, GType>,
  options: CodegenOptions
): Promise<CodegenResult> {
  const generator = new ValidatorGenerator();
  const outputDir = path.join(options.outputDir || options.projectRoot, 'generated', 'validators');
  const filesGenerated: string[] = [];
  const errors: string[] = [];

  try {
    await fs.mkdir(outputDir, { recursive: true });

    for (const [name, schema] of Object.entries(schemas)) {
      try {
        const result = generator.generate(schema, {
          functionName: `validate${name}`,
          includeComments: true,
          includeImports: true,
        });

        const filePath = path.join(outputDir, `${name}.ts`);
        await fs.writeFile(filePath, result.code, 'utf-8');
        filesGenerated.push(filePath);
      } catch (error) {
        errors.push(`Failed to generate validator for ${name}: ${error}`);
      }
    }

    // Generate index file
    const indexLines = filesGenerated.map(file => {
      const baseName = path.basename(file, '.ts');
      return `export * from './${baseName}.js';`;
    });
    const indexPath = path.join(outputDir, 'index.ts');
    await fs.writeFile(indexPath, indexLines.join('\n') + '\n', 'utf-8');
    filesGenerated.push(indexPath);

    return { success: errors.length === 0, filesGenerated, errors };
  } catch (error) {
    return { success: false, filesGenerated, errors: [`Failed to generate validators: ${error}`] };
  }
}

/**
 * Generate TypeScript type definitions from GType schemas
 */
export async function generateTypes(
  schemas: Record<string, GType>,
  options: CodegenOptions
): Promise<CodegenResult> {
  const generator = new TypeDefGenerator();
  const outputDir = path.join(options.outputDir || options.projectRoot, 'generated', 'types');
  const filesGenerated: string[] = [];
  const errors: string[] = [];

  try {
    await fs.mkdir(outputDir, { recursive: true });

    // Generate all types in a single file
    const code = generator.generateMultiple(schemas, {
      exportType: true,
      includeComments: true,
    });

    const filePath = path.join(outputDir, 'index.ts');
    await fs.writeFile(filePath, code, 'utf-8');
    filesGenerated.push(filePath);

    return { success: true, filesGenerated, errors };
  } catch (error) {
    return { success: false, filesGenerated, errors: [`Failed to generate types: ${error}`] };
  }
}

/**
 * Generate SDK client from handler manifests
 */
export async function generateSDK(
  manifests: HandlerManifest[],
  options: CodegenOptions
): Promise<CodegenResult> {
  const generator = new SDKGenerator();
  const outputDir = path.join(options.outputDir || options.projectRoot, 'generated', 'sdk');
  const filesGenerated: string[] = [];
  const errors: string[] = [];

  try {
    await fs.mkdir(outputDir, { recursive: true });

    const result = generator.generate(manifests, {
      className: 'GatiClient',
      includeComments: true,
      includeAuth: true,
      includeTimeout: true,
    });

    const filePath = path.join(outputDir, 'client.ts');
    await fs.writeFile(filePath, result.code, 'utf-8');
    filesGenerated.push(filePath);

    // Generate index file
    const indexContent = `export { GatiClient } from './client.js';\nexport type { ClientOptions } from './client.js';\n`;
    const indexPath = path.join(outputDir, 'index.ts');
    await fs.writeFile(indexPath, indexContent, 'utf-8');
    filesGenerated.push(indexPath);

    return { success: true, filesGenerated, errors };
  } catch (error) {
    return { success: false, filesGenerated, errors: [`Failed to generate SDK: ${error}`] };
  }
}

/**
 * Generate manifest bundle for deployment
 */
export async function generateBundle(
  handlers: HandlerManifest[],
  modules: ModuleManifest[],
  schemas: Record<string, GType>,
  options: CodegenOptions
): Promise<CodegenResult> {
  const generator = new BundleGenerator();
  const outputDir = path.join(options.outputDir || options.projectRoot, 'generated', 'bundle');
  const filesGenerated: string[] = [];
  const errors: string[] = [];

  try {
    await fs.mkdir(outputDir, { recursive: true });

    const bundle = generator.generate(handlers, modules, schemas, {
      version: '1.0.0',
      projectName: path.basename(options.projectRoot),
      includeMetadata: true,
    });

    // Validate bundle
    const validation = generator.validateBundle(bundle);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    const filePath = path.join(outputDir, 'manifest-bundle.json');
    await fs.writeFile(filePath, JSON.stringify(bundle, null, 2), 'utf-8');
    filesGenerated.push(filePath);

    // Generate index for fast lookup
    const index = generator.createIndex(bundle);
    const indexPath = path.join(outputDir, 'manifest-index.json');
    await fs.writeFile(
      indexPath,
      JSON.stringify(
        {
          handlers: Array.from(index.handlers.keys()),
          modules: Array.from(index.modules.keys()),
          paths: Array.from(index.paths.keys()),
        },
        null,
        2
      ),
      'utf-8'
    );
    filesGenerated.push(indexPath);

    return { success: errors.length === 0, filesGenerated, errors };
  } catch (error) {
    return { success: false, filesGenerated, errors: [`Failed to generate bundle: ${error}`] };
  }
}

/**
 * Generate all code artifacts (validators, types, SDK, bundle)
 */
export async function generateAll(
  handlers: HandlerManifest[],
  modules: ModuleManifest[],
  schemas: Record<string, GType>,
  options: CodegenOptions
): Promise<CodegenResult> {
  console.log('🔧 Starting code generation...');
  
  const allFiles: string[] = [];
  const allErrors: string[] = [];

  // Generate validators
  console.log('📝 Generating validators...');
  const validatorResult = await generateValidators(schemas, options);
  allFiles.push(...validatorResult.filesGenerated);
  allErrors.push(...validatorResult.errors);
  if (validatorResult.success) {
    console.log(`✅ Generated ${validatorResult.filesGenerated.length} validator files`);
  } else {
    console.error(`❌ Validator generation failed with ${validatorResult.errors.length} errors`);
  }

  // Generate types
  console.log('📝 Generating TypeScript definitions...');
  const typeResult = await generateTypes(schemas, options);
  allFiles.push(...typeResult.filesGenerated);
  allErrors.push(...typeResult.errors);
  if (typeResult.success) {
    console.log(`✅ Generated ${typeResult.filesGenerated.length} type definition files`);
  } else {
    console.error(`❌ Type generation failed with ${typeResult.errors.length} errors`);
  }

  // Generate SDK
  console.log('🚀 Generating SDK client...');
  const sdkResult = await generateSDK(handlers, options);
  allFiles.push(...sdkResult.filesGenerated);
  allErrors.push(...sdkResult.errors);
  if (sdkResult.success) {
    console.log(`✅ Generated ${sdkResult.filesGenerated.length} SDK files`);
  } else {
    console.error(`❌ SDK generation failed with ${sdkResult.errors.length} errors`);
  }

  // Generate bundle
  console.log('📦 Generating manifest bundle...');
  const bundleResult = await generateBundle(handlers, modules, schemas, options);
  allFiles.push(...bundleResult.filesGenerated);
  allErrors.push(...bundleResult.errors);
  if (bundleResult.success) {
    console.log(`✅ Generated ${bundleResult.filesGenerated.length} bundle files`);
  } else {
    console.error(`❌ Bundle generation failed with ${bundleResult.errors.length} errors`);
  }

  const success = allErrors.length === 0;
  if (success) {
    console.log(`\n✅ Code generation complete! Generated ${allFiles.length} files.`);
  } else {
    console.error(`\n❌ Code generation completed with ${allErrors.length} errors.`);
  }

  return {
    success,
    filesGenerated: allFiles,
    errors: allErrors,
  };
}

// Re-export generators
export { ValidatorGenerator } from './validator-generator.js';
export { TypeDefGenerator } from './typedef-generator.js';
export { SDKGenerator } from './sdk-generator.js';
export { BundleGenerator } from './bundle-generator.js';
