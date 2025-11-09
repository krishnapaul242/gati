/**
 * @module cli/utils/bundler
 * @description Build and bundle utilities using TypeScript compiler
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

/**
 * Build options
 */
export interface BuildOptions {
  /**
   * Enable source maps
   */
  sourcemap?: boolean;

  /**
   * Enable minification
   */
  minify?: boolean;

  /**
   * Build mode
   */
  mode?: 'development' | 'production';

  /**
   * Enable verbose logging
   */
  verbose?: boolean;
}

/**
 * Build result
 */
export interface BuildResult {
  success: boolean;
  duration: number;
  errors?: string[];
  outputDir: string;
}

/**
 * Run TypeScript compiler
 */
export async function runTypeScriptCompiler(
  cwd: string,
  options: BuildOptions = {}
): Promise<BuildResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Check for TypeScript configuration
    const tsconfigPath = resolve(cwd, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) {
      errors.push('tsconfig.json not found');
      return {
        success: false,
        duration: Date.now() - startTime,
        errors,
        outputDir: resolve(cwd, 'dist'),
      };
    }

    if (options.verbose) {
      // eslint-disable-next-line no-console
      console.log(chalk.blue('Running TypeScript compiler...'));
    }

    // Run tsc command
    const tscCommand = 'tsc';
    const { stdout, stderr } = await execAsync(tscCommand, {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: options.mode || 'production',
      },
    });

    if (options.verbose && stdout) {
      // eslint-disable-next-line no-console
      console.log(stdout);
    }

    if (stderr) {
      // TypeScript errors go to stderr but don't throw
      errors.push(stderr);
    }

    const duration = Date.now() - startTime;

    if (errors.length > 0 && errors.some((e) => e.includes('error TS'))) {
      return {
        success: false,
        duration,
        errors,
        outputDir: resolve(cwd, 'dist'),
      };
    }

    return {
      success: true,
      duration,
      outputDir: resolve(cwd, 'dist'),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      outputDir: resolve(cwd, 'dist'),
    };
  }
}

/**
 * Run type checking without emitting files
 */
export async function runTypeCheck(cwd: string, verbose = false): Promise<BuildResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(chalk.blue('Running type check...'));
    }

    // Run tsc --noEmit
    const { stdout, stderr } = await execAsync('tsc --noEmit', {
      cwd,
    });

    if (verbose && stdout) {
      // eslint-disable-next-line no-console
      console.log(stdout);
    }

    if (stderr) {
      errors.push(stderr);
    }

    const duration = Date.now() - startTime;

    if (errors.length > 0 && errors.some((e) => e.includes('error TS'))) {
      return {
        success: false,
        duration,
        errors,
        outputDir: resolve(cwd, 'dist'),
      };
    }

    return {
      success: true,
      duration,
      outputDir: resolve(cwd, 'dist'),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      outputDir: resolve(cwd, 'dist'),
    };
  }
}

/**
 * Print build results
 */
export function printBuildResults(result: BuildResult): void {
  if (result.success) {
    // eslint-disable-next-line no-console
    console.log(chalk.green(`\n✔ Build completed successfully in ${result.duration}ms`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Output: ${result.outputDir}`));
  } else {
    // eslint-disable-next-line no-console
    console.log(chalk.red(`\n✖ Build failed after ${result.duration}ms`));
    
    if (result.errors && result.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log(chalk.red('\nErrors:'));
      for (const error of result.errors) {
        // eslint-disable-next-line no-console
        console.log(chalk.red(error));
      }
    }
  }
}
