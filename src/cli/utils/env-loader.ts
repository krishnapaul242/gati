/**
 * @module cli/utils/env-loader
 * @description Load environment variables from .env files for development
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

/**
 * Environment loading options
 */
export interface EnvLoaderOptions {
  /**
   * Path to .env file
   * @default '.env'
   */
  path?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Override existing environment variables
   * @default false
   */
  override?: boolean;
}

/**
 * Load environment variables from .env file
 */
export function loadEnv(cwd: string, options: EnvLoaderOptions = {}): void {
  const {
    path = '.env',
    verbose = false,
    override = false,
  } = options;

  const envPath = resolve(cwd, path);

  // Check if .env file exists
  if (!existsSync(envPath)) {
    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(chalk.yellow(`⚠ No .env file found at ${envPath}`));
    }
    return;
  }

  try {
    // Load environment variables
    const result = config({
      path: envPath,
      override,
    });

    if (result.error) {
      throw result.error;
    }

    if (verbose) {
      const count = Object.keys(result.parsed || {}).length;
      // eslint-disable-next-line no-console
      console.log(chalk.green(`✔ Loaded ${count} environment variable(s) from ${path}`));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(chalk.red(`✖ Error loading .env file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    throw error;
  }
}

/**
 * Load environment variables for development mode
 * Tries to load .env.local, .env.development, and .env in that order
 */
export function loadDevEnv(cwd: string, verbose = false): void {
  const envFiles = ['.env.local', '.env.development', '.env'];

  for (const file of envFiles) {
    const envPath = resolve(cwd, file);
    if (existsSync(envPath)) {
      loadEnv(cwd, { path: file, verbose, override: true });
      return;
    }
  }

  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(chalk.yellow('⚠ No environment file found (.env.local, .env.development, or .env)'));
  }
}
