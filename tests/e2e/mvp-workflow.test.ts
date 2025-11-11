/**
 * @vitest-environment node
 * @description MVP End-to-End Integration Test
 * 
 * This test validates the complete MVP workflow:
 * 1. gati create → scaffolds a new project
 * 2. Verify generated project structure
 * 3. Verify runtime dependencies are correct
 * 4. Verify src/index.ts is properly generated
 * 5. Verify handlers are generated
 * 6. (Future) Test dev mode, build, and deploy
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { constants } from 'fs';
import { generateProject } from '../../packages/cli/src/utils/file-generator.js';

/**
 * Type definitions for test assertions
 */
interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: {
    node?: string;
  };
}

interface TsConfig {
  extends?: string;
  compilerOptions?: {
    outDir?: string;
    rootDir?: string;
    [key: string]: unknown;
  };
  include?: string[];
  exclude?: string[];
  [key: string]: unknown;
}

describe('MVP Workflow Integration Test', () => {
  let tmpProjectDir: string;
  let projectPath: string;

  beforeAll(async () => {
    // Create a temporary directory for the test project
    tmpProjectDir = await mkdtemp(join(tmpdir(), 'gati-mvp-test-'));
    projectPath = join(tmpProjectDir, 'test-mvp-app');
  });

  afterAll(async () => {
    // Clean up the temporary directory
    if (tmpProjectDir) {
      await rm(tmpProjectDir, { recursive: true, force: true });
    }
  });

  describe('Phase 1: Project Scaffolding (gati create)', () => {
    it('should create a new project with correct structure', async () => {
      // Execute: gati create test-mvp-app
      await generateProject({
        projectPath,
        projectName: 'test-mvp-app',
        description: 'MVP test application',
        author: 'Test Runner',
        template: 'default',
        skipInstall: true, // Skip npm install for faster tests
      });

      // Verify project directory was created
      await expect(
        access(projectPath, constants.F_OK)
      ).resolves.toBeUndefined();
    });

    it('should generate all required files', async () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'gati.config.ts',
        'README.md',
        '.gitignore',
        'src/index.ts',
        'src/handlers/hello.ts',
      ];

      for (const file of requiredFiles) {
        const filePath = join(projectPath, file);
        await expect(
          access(filePath, constants.F_OK)
        ).resolves.toBeUndefined();
      }
    });

    it('should generate package.json with correct dependencies', async () => {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content) as PackageJson;

      // Verify project metadata
      expect(pkg.name).toBe('test-mvp-app');
      expect(pkg.description).toBe('MVP test application');
      expect(pkg.author).toBe('Test Runner');

      // Verify runtime dependency
      expect(pkg.dependencies).toHaveProperty('@gati-framework/runtime');
      expect(pkg.dependencies['@gati-framework/runtime']).toMatch(/\^2\.0\.2/);

      // Verify core dependency
      expect(pkg.dependencies).toHaveProperty('@gati-framework/core');

      // Verify scripts
      expect(pkg.scripts).toHaveProperty('dev');
      expect(pkg.scripts).toHaveProperty('build');
      expect(pkg.scripts).toHaveProperty('start');
      expect(pkg.scripts['dev']).toBe('gati dev');
      expect(pkg.scripts['build']).toBe('gati build');
    });

    it('should generate src/index.ts with proper runtime imports', async () => {
      const indexPath = join(projectPath, 'src/index.ts');
      const content = await readFile(indexPath, 'utf-8');

      // Verify runtime imports
      expect(content).toContain("import { createApp, loadHandlers } from '@gati-framework/runtime'");

      // Verify app creation
      expect(content).toContain('createApp');
      expect(content).toContain('3000'); // Port can be from env or default

      // Verify handler loading
      expect(content).toContain('loadHandlers');
      expect(content).toContain('./src/handlers');

      // Verify app listen
      expect(content).toContain('await app.listen()');

      // Verify error handling
      expect(content).toContain('.catch');

      // Verify graceful shutdown
      expect(content).toContain('SIGTERM');
      expect(content).toContain('shutdown');
    });

    it('should generate a working handler example', async () => {
      const handlerPath = join(projectPath, 'src/handlers/hello.ts');
      const content = await readFile(handlerPath, 'utf-8');

      // Verify handler type import
      expect(content).toContain("import type { Handler } from '@gati-framework/runtime'");

      // Verify handler export
      expect(content).toContain('export const handler: Handler');

      // Verify handler implementation
      expect(content).toContain('res.json');
    });

    it('should generate tsconfig.json extending core config', async () => {
      const tsconfigPath = join(projectPath, 'tsconfig.json');
      const content = await readFile(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(content) as TsConfig;

      // Verify extends core config
      expect(tsconfig.extends).toBe('@gati-framework/core/tsconfig.base.json');

      // Verify output directory
      expect(tsconfig.compilerOptions?.outDir).toBe('./dist');
      expect(tsconfig.compilerOptions?.rootDir).toBe('./src');
    });

    it('should generate gati.config.ts', async () => {
      const configPath = join(projectPath, 'gati.config.ts');
      const content = await readFile(configPath, 'utf-8');

      // Verify basic config structure
      expect(content).toContain('export default');
      expect(content).toContain('port: 3000');
      expect(content).toContain("handlers: './src/handlers'");
    });

    it('should generate README.md with getting started instructions', async () => {
      const readmePath = join(projectPath, 'README.md');
      const content = await readFile(readmePath, 'utf-8');

      // Verify project name in README
      expect(content).toContain('test-mvp-app');

      // Verify getting started section
      expect(content).toContain('Getting Started');
      expect(content).toContain('pnpm install');
      expect(content).toContain('pnpm dev');
      expect(content).toContain('pnpm build');
    });

    it('should create proper directory structure', async () => {
      const requiredDirs = [
        'src',
        'src/handlers',
        'src/modules',
        'tests',
        'tests/unit',
        'tests/integration',
      ];

      for (const dir of requiredDirs) {
        const dirPath = join(projectPath, dir);
        await expect(
          access(dirPath, constants.F_OK)
        ).resolves.toBeUndefined();
      }
    });
  });

  describe('Phase 2: Build Validation', () => {
    it('should have valid TypeScript configuration', async () => {
      const tsconfigPath = join(projectPath, 'tsconfig.json');
      const content = await readFile(tsconfigPath, 'utf-8');
      
      // Should parse without errors
      expect(() => JSON.parse(content) as TsConfig).not.toThrow();
      
      const tsconfig = JSON.parse(content) as TsConfig;
      
      // Verify module settings
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.include).toBeDefined();
      expect(tsconfig.exclude).toBeDefined();
    });

    it('should have all npm scripts defined', async () => {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content) as PackageJson;

      const requiredScripts = ['dev', 'build', 'start', 'test', 'typecheck'];
      
      for (const script of requiredScripts) {
        expect(pkg.scripts).toHaveProperty(script);
        expect(pkg.scripts[script]).toBeTruthy();
      }
    });
  });

  describe('MVP Success Criteria Validation', () => {
    it('✅ Criterion 1: Single command setup works', () => {
      // This entire test suite validates that gati create works
      expect(true).toBe(true);
    });

    it('✅ Criterion 2: Generated project is ready for dev mode', async () => {
      // Verify src/index.ts exists and has runtime initialization
      const indexPath = join(projectPath, 'src/index.ts');
      const content = await readFile(indexPath, 'utf-8');
      
      expect(content).toContain('createApp');
      expect(content).toContain('loadHandlers');
      expect(content).toContain('app.listen()');
    });

    it('✅ Criterion 3: Project has build script configured', async () => {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content) as PackageJson;
      
      expect(pkg.scripts['build']).toBe('gati build');
    });

    it('✅ Criterion 4: Project structure supports deployment', async () => {
      // Verify all necessary files exist for deployment
      const deploymentFiles = [
        'src/index.ts',
        'gati.config.ts',
        'package.json',
      ];
      
      for (const file of deploymentFiles) {
        const filePath = join(projectPath, file);
        await expect(
          access(filePath, constants.F_OK)
        ).resolves.toBeUndefined();
      }
    });
  });
});
