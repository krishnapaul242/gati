/**
 * @module cli/commands/build
 * @description Build command for production bundling (Issue #11)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { validateProject, printValidationResults } from '../utils/validator.js';
import { runTypeScriptCompiler, printBuildResults } from '../utils/bundler.js';
import type { BuildOptions } from '../utils/bundler.js';

interface BuildCommandOptions {
  minify: boolean;
  sourcemap: boolean;
  mode?: 'development' | 'production';
  skipValidation?: boolean;
}

/**
 * Execute the build process
 */
async function executeBuild(cwd: string, options: BuildCommandOptions): Promise<void> {
  const spinner = ora('Building project...').start();

  try {
    // Step 1: Validate project structure
    if (!options.skipValidation) {
      spinner.text = 'Validating project structure...';
      const validationResult = validateProject(cwd);
      
      if (!validationResult.valid) {
        spinner.fail(chalk.red('✖ Project validation failed'));
        printValidationResults(validationResult);
        process.exit(1);
      }

      if (validationResult.warnings.length > 0) {
        spinner.warn(chalk.yellow('⚠ Project validation completed with warnings'));
        printValidationResults(validationResult);
      } else {
        spinner.succeed(chalk.green('✔ Project validation passed'));
      }
    }

    // Step 2: Build with TypeScript
    spinner.start('Compiling TypeScript...');

    const buildOptions: BuildOptions = {
      sourcemap: options.sourcemap,
      minify: options.minify,
      mode: options.mode || 'production',
      verbose: false,
    };

    const buildResult = await runTypeScriptCompiler(cwd, buildOptions);

    if (!buildResult.success) {
      spinner.fail(chalk.red('✖ Build failed'));
      printBuildResults(buildResult);
      process.exit(1);
    }

    spinner.succeed(chalk.green('✔ TypeScript compilation completed'));
    printBuildResults(buildResult);

    // Build success summary
    // eslint-disable-next-line no-console
    console.log(chalk.cyan('\n📦 Build Summary:'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Mode: ${buildOptions.mode}`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Source Maps: ${options.sourcemap ? 'enabled' : 'disabled'}`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Minification: ${options.minify ? 'enabled' : 'disabled'}`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Duration: ${buildResult.duration}ms`));
    // eslint-disable-next-line no-console
    console.log(chalk.green('\n✨ Ready for deployment!'));

  } catch (error) {
    spinner.fail(chalk.red('✖ Build process failed'));
    // eslint-disable-next-line no-console
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

export const buildCommand = new Command('build')
  .description('Build project for production')
  .option('--no-minify', 'Disable minification (enabled by default)')
  .option('--sourcemap', 'Generate source maps (disabled by default)')
  .option('--mode <mode>', 'Build mode (development or production)', 'production')
  .option('--skip-validation', 'Skip project validation')
  .action(async (options: BuildCommandOptions) => {
    const cwd = process.cwd();
    await executeBuild(cwd, options);
  });

