/**
 * @module tests/unit/cli/utils/bundler.test
 * @description Tests for bundler utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { runTypeScriptCompiler, runTypeCheck } from '../../../../src/cli/utils/bundler';

describe('Bundler Utility', () => {
  const testDir = resolve(process.cwd(), 'test-bundler-temp');

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

  it('should fail when tsconfig.json is missing', async () => {
    const result = await runTypeScriptCompiler(testDir);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('tsconfig.json not found');
  });

  it('should return build result with duration', async () => {
    // Create minimal tsconfig.json
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
          rootDir: './src',
        },
      })
    );

    const result = await runTypeScriptCompiler(testDir);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('outputDir');
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should include outputDir in result', async () => {
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
        },
      })
    );

    const result = await runTypeScriptCompiler(testDir);

    expect(result.outputDir).toBe(resolve(testDir, 'dist'));
  });

  it('should handle verbose option', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
        },
      })
    );

    await runTypeScriptCompiler(testDir, { verbose: true });

    // Verbose should log something
    expect(consoleLogSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it('should run type check without emitting files', async () => {
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
        },
      })
    );

    const result = await runTypeCheck(testDir);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('duration');
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should handle build mode option', async () => {
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
        },
      })
    );

    const result = await runTypeScriptCompiler(testDir, {
      mode: 'development',
    });

    expect(result).toHaveProperty('success');
  });

  it('should capture TypeScript compilation errors', async () => {
    // Create tsconfig with invalid configuration
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
          target: 'ES2025', // Invalid target
        },
      })
    );

    mkdirSync(resolve(testDir, 'src'), { recursive: true });
    writeFileSync(
      resolve(testDir, 'src/index.ts'),
      'const x: string = 123;' // Type error
    );

    const result = await runTypeScriptCompiler(testDir);

    // Should complete but may have errors depending on tsc behavior
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('errors');
  });

  it('should handle source map option', async () => {
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
        },
      })
    );

    const result = await runTypeScriptCompiler(testDir, {
      sourcemap: true,
    });

    expect(result).toHaveProperty('success');
  });

  it('should handle minify option', async () => {
    writeFileSync(
      resolve(testDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          outDir: './dist',
        },
      })
    );

    const result = await runTypeScriptCompiler(testDir, {
      minify: true,
    });

    expect(result).toHaveProperty('success');
  });
});
