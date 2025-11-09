/**
 * @module tests/unit/cli/utils/validator.test
 * @description Tests for project validator utility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { validateProject } from '../../../../src/cli/utils/validator';

describe('Validator Utility', () => {
  const testDir = resolve(process.cwd(), 'test-validator-temp');

  beforeEach(() => {
    // Create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should pass validation for a complete project', () => {
    // Create required files
    writeFileSync(
      resolve(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          build: 'tsc',
          start: 'node dist/index.js',
        },
      })
    );
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: {} })
    );
    writeFileSync(resolve(testDir, 'gati.config.ts'), 'export default {};');
    mkdirSync(resolve(testDir, 'src/handlers'), { recursive: true });

    const result = validateProject(testDir);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should fail validation when package.json is missing', () => {
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src'));

    const result = validateProject(testDir);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required file: package.json');
  });

  it('should fail validation when tsconfig.json is missing', () => {
    writeFileSync(resolve(testDir, 'package.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src'));

    const result = validateProject(testDir);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required file: tsconfig.json');
  });

  it('should fail validation when gati.config.ts is missing', () => {
    writeFileSync(resolve(testDir, 'package.json'), '{}');
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    mkdirSync(resolve(testDir, 'src'));

    const result = validateProject(testDir);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required file: gati.config.ts');
  });

  it('should fail validation when src directory is missing', () => {
    writeFileSync(resolve(testDir, 'package.json'), '{}');
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');

    const result = validateProject(testDir);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing src/ directory');
  });

  it('should warn when handlers directory is missing', () => {
    writeFileSync(resolve(testDir, 'package.json'), '{ "name": "test" }');
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src'));

    const result = validateProject(testDir);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('No src/handlers/ directory found');
  });

  it('should warn when package.json is missing name field', () => {
    writeFileSync(
      resolve(testDir, 'package.json'),
      JSON.stringify({ version: '1.0.0' })
    );
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src/handlers'), { recursive: true });

    const result = validateProject(testDir);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('package.json missing "name" field');
  });

  it('should warn when package.json is missing version field', () => {
    writeFileSync(
      resolve(testDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src/handlers'), { recursive: true });

    const result = validateProject(testDir);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('package.json missing "version" field');
  });

  it('should warn when package.json is missing build and start scripts', () => {
    writeFileSync(
      resolve(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {},
      })
    );
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src/handlers'), { recursive: true });

    const result = validateProject(testDir);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      'package.json missing recommended scripts (build, start)'
    );
  });

  it('should fail validation when package.json has invalid JSON', () => {
    writeFileSync(resolve(testDir, 'package.json'), '{ invalid json }');
    writeFileSync(resolve(testDir, 'tsconfig.json'), '{}');
    writeFileSync(resolve(testDir, 'gati.config.ts'), '');
    mkdirSync(resolve(testDir, 'src'));

    const result = validateProject(testDir);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid package.json'))).toBe(true);
  });

  it('should handle multiple errors and warnings together', () => {
    // Only create package.json (missing other required files)
    writeFileSync(
      resolve(testDir, 'package.json'),
      JSON.stringify({ scripts: {} })
    );

    const result = validateProject(testDir);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
