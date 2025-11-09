/**
 * @module cli/utils/validator
 * @description Project validation utilities for build process
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

/**
 * Package.json interface
 */
interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate project structure and configuration
 */
export function validateProject(cwd: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required files
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'gati.config.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = resolve(cwd, file);
    if (!existsSync(filePath)) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Check for src directory
  const srcDir = resolve(cwd, 'src');
  if (!existsSync(srcDir)) {
    errors.push('Missing src/ directory');
  }

  // Check for handlers directory
  const handlersDir = resolve(cwd, 'src/handlers');
  if (!existsSync(handlersDir)) {
    warnings.push('No src/handlers/ directory found');
  }

  // Check for package.json validity
  const packageJsonPath = resolve(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent) as PackageJson;
      
      if (!packageJson.name) {
        warnings.push('package.json missing "name" field');
      }
      
      if (!packageJson.version) {
        warnings.push('package.json missing "version" field');
      }

      // Check for required scripts
      if (!packageJson.scripts?.['build'] && !packageJson.scripts?.['start']) {
        warnings.push('package.json missing recommended scripts (build, start)');
      }
    } catch (error) {
      errors.push(`Invalid package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Print validation results
 */
export function printValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.log(chalk.red('\n✖ Validation Errors:'));
    for (const error of result.errors) {
      // eslint-disable-next-line no-console
      console.log(chalk.red(`  • ${error}`));
    }
  }

  if (result.warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log(chalk.yellow('\n⚠ Warnings:'));
    for (const warning of result.warnings) {
      // eslint-disable-next-line no-console
      console.log(chalk.yellow(`  • ${warning}`));
    }
  }

  if (result.valid && result.warnings.length === 0) {
    // eslint-disable-next-line no-console
    console.log(chalk.green('\n✔ Project validation passed'));
  }
}
