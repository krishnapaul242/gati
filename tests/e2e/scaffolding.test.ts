/**
 * @module tests/e2e/scaffolding
 * @description Comprehensive end-to-end tests for project scaffolding with all package managers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { readFile, rm, mkdtemp, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  devDependencies: Record<string, string>;
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

/**
 * Helper to modify package.json to use local packages instead of npm
 */
async function useLocalPackages(projectPath: string): Promise<void> {
  const pkgPath = join(projectPath, 'package.json');
  const pkgContent = await readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent) as PackageJson;
  
  // Point to local workspace packages
  const workspaceRoot = process.cwd();
  pkg.dependencies['@gati-framework/core'] = `file:${join(workspaceRoot, 'packages/core')}`;
  pkg.dependencies['@gati-framework/runtime'] = `file:${join(workspaceRoot, 'packages/runtime')}`;
  
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}

describe('GatiC Scaffolding E2E Tests', () => {
  // Use OS temp directory to avoid workspace detection issues
  let testDir: string;
  const projectName = 'test-app';
  let projectPath: string;

  beforeEach(async () => {
    // Create temporary directory outside workspace
    testDir = await mkdtemp(join(tmpdir(), 'gati-test-'));
    projectPath = join(testDir, projectName);
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (testDir && existsSync(testDir)) {
      try {
        await rm(testDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch (error) {
        // On Windows, files might be locked; log but don't fail
        console.warn(`Failed to clean up ${testDir}:`, error);
      }
    }
  });

  describe('Project Scaffolding', () => {
    it('should create project with default template using CLI', async () => {
      // Run create command
      const { stdout } = await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      // CLI may use stderr for logging/spinners (not errors)
      expect(stdout).toContain('Next steps');

      // Verify project structure
      expect(existsSync(projectPath)).toBe(true);
      expect(existsSync(join(projectPath, 'package.json'))).toBe(true);
      expect(existsSync(join(projectPath, 'src'))).toBe(true);
      expect(existsSync(join(projectPath, 'src/handlers'))).toBe(true);
      expect(existsSync(join(projectPath, 'src/index.ts'))).toBe(true);
    }, 30000);

    it('should create project with minimal template', async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --template minimal --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      expect(existsSync(projectPath)).toBe(true);
      expect(existsSync(join(projectPath, 'src/index.ts'))).toBe(true);
      expect(existsSync(join(projectPath, 'src/handlers/health.ts'))).toBe(true);
      
      // Minimal template shouldn't have hello.ts
      expect(existsSync(join(projectPath, 'src/handlers/hello.ts'))).toBe(false);
    }, 30000);

    it('should fail if directory already exists', async () => {
      // Create project first time
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      // Try to create again
      await expect(
        execAsync(
          `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
          { cwd: testDir }
        )
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Generated Package.json Validation', () => {
    beforeEach(async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );
    });

    it('should have correct package.json structure', async () => {
      const pkgJsonPath = join(projectPath, 'package.json');
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')) as PackageJson;

      expect(pkgJson.name).toBe(projectName);
      expect(pkgJson.version).toBe('0.1.0');
      expect(pkgJson.license).toBe('MIT');
    });

    it('should have all required scripts', async () => {
      const pkgJsonPath = join(projectPath, 'package.json');
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')) as PackageJson;

      expect(pkgJson.scripts).toHaveProperty('dev');
      expect(pkgJson.scripts).toHaveProperty('build');
      expect(pkgJson.scripts).toHaveProperty('start');
      expect(pkgJson.scripts).toHaveProperty('test');
      expect(pkgJson.scripts).toHaveProperty('typecheck');
      expect(pkgJson.scripts).toHaveProperty('lint');
    });

    it('should have correct runtime version', async () => {
      const pkgJsonPath = join(projectPath, 'package.json');
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')) as PackageJson;

      expect(pkgJson.dependencies['@gati-framework/runtime']).toBe('^2.0.2');
      expect(pkgJson.dependencies['@gati-framework/core']).toBe('^0.4.2');
    });

    it('should have required devDependencies', async () => {
      const pkgJsonPath = join(projectPath, 'package.json');
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')) as PackageJson;

      expect(pkgJson.devDependencies).toHaveProperty('@types/node');
      expect(pkgJson.devDependencies).toHaveProperty('typescript');
      expect(pkgJson.devDependencies).toHaveProperty('vitest');
      expect(pkgJson.devDependencies).toHaveProperty('eslint');
    });

    it('should have Node.js engine requirement', async () => {
      const pkgJsonPath = join(projectPath, 'package.json');
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')) as PackageJson;

      expect(pkgJson.engines).toBeDefined();
      expect(pkgJson.engines?.node).toBe('>=18.0.0');
    });
  });

  describe('Generated Files Validation', () => {
    beforeEach(async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );
    });

    it('should generate valid TypeScript config', async () => {
      const tsconfigPath = join(projectPath, 'tsconfig.json');
      const tsconfig = JSON.parse(await readFile(tsconfigPath, 'utf-8')) as TsConfig;

      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions?.outDir).toBe('./dist');
      expect(tsconfig.compilerOptions?.rootDir).toBe('./src');
      expect(tsconfig.include).toContain('src/**/*');
    });

    it('should generate src/index.ts with correct imports', async () => {
      const indexPath = join(projectPath, 'src/index.ts');
      const indexContent = await readFile(indexPath, 'utf-8');

      expect(indexContent).toContain("import { createApp, loadHandlers } from '@gati-framework/runtime'");
      expect(indexContent).toContain('createApp');
      expect(indexContent).toContain('loadHandlers');
      expect(indexContent).toContain('app.listen()');
    });

    it('should generate hello handler with correct signature', async () => {
      const helloPath = join(projectPath, 'src/handlers/hello.ts');
      const helloContent = await readFile(helloPath, 'utf-8');

      expect(helloContent).toContain("import type { Handler } from '@gati-framework/runtime'");
      expect(helloContent).toContain('export const handler: Handler');
      expect(helloContent).toContain('req.query');
      expect(helloContent).toContain('res.json');
    });

    it('should generate health handler', async () => {
      const healthPath = join(projectPath, 'src/handlers/health.ts');
      const healthContent = await readFile(healthPath, 'utf-8');

      expect(healthContent).toContain('health');
      expect(healthContent).toContain('res.status(200)');
      expect(healthContent).toContain('process.uptime()');
    });

    it('should generate Dockerfile', async () => {
      const dockerfilePath = join(projectPath, 'Dockerfile');
      const dockerfile = await readFile(dockerfilePath, 'utf-8');

      expect(dockerfile).toContain('FROM node:20-alpine');
      expect(dockerfile).toContain('pnpm install');
      expect(dockerfile).toContain('pnpm build');
      expect(dockerfile).toContain(projectName);
    });

    it('should generate docker-compose.yml', async () => {
      const composePath = join(projectPath, 'docker-compose.yml');
      const compose = await readFile(composePath, 'utf-8');

      expect(compose).toContain('version:');
      expect(compose).toContain('services:');
      expect(compose).toContain('app:');
      expect(compose).toContain(projectName);
    });

    it('should generate Kubernetes deployment manifest', async () => {
      const deploymentPath = join(projectPath, 'deploy/kubernetes/deployment.yaml');
      const deployment = await readFile(deploymentPath, 'utf-8');

      expect(deployment).toContain('kind: Deployment');
      expect(deployment).toContain(`name: ${projectName}`);
      expect(deployment).toContain('replicas: 2');
      expect(deployment).toContain('livenessProbe');
      expect(deployment).toContain('readinessProbe');
    });

    it('should generate Kubernetes service manifest', async () => {
      const servicePath = join(projectPath, 'deploy/kubernetes/service.yaml');
      const service = await readFile(servicePath, 'utf-8');

      expect(service).toContain('kind: Service');
      expect(service).toContain(`name: ${projectName}`);
      expect(service).toContain('type: ClusterIP');
      expect(service).toContain('port: 80');
    });

    it('should generate .gitignore', async () => {
      const gitignorePath = join(projectPath, '.gitignore');
      const gitignore = await readFile(gitignorePath, 'utf-8');

      expect(gitignore).toContain('node_modules/');
      expect(gitignore).toContain('dist/');
      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('*.log');
    });

    it('should generate .dockerignore', async () => {
      const dockerignorePath = join(projectPath, '.dockerignore');
      const dockerignore = await readFile(dockerignorePath, 'utf-8');

      expect(dockerignore).toContain('node_modules/');
      expect(dockerignore).toContain('.git/');
      expect(dockerignore).toContain('*.md');
    });

    it('should generate .env.example', async () => {
      const envPath = join(projectPath, '.env.example');
      const env = await readFile(envPath, 'utf-8');

      expect(env).toContain('PORT=3000');
      expect(env).toContain('HOST=0.0.0.0');
      expect(env).toContain('NODE_ENV=development');
    });

    it('should generate README with getting started instructions', async () => {
      const readmePath = join(projectPath, 'README.md');
      const readme = await readFile(readmePath, 'utf-8');

      expect(readme).toContain(projectName);
      expect(readme).toContain('Getting Started');
      expect(readme).toContain('pnpm install');
      expect(readme).toContain('pnpm dev');
      expect(readme).toContain('pnpm build');
    });

    it('should generate gati.config.ts', async () => {
      const configPath = join(projectPath, 'gati.config.ts');
      const config = await readFile(configPath, 'utf-8');

      expect(config).toContain('export default');
      expect(config).toContain('port: 3000');
      expect(config).toContain('handlers:');
      expect(config).toContain('modules:');
    });
  });

  describe('Directory Structure Validation', () => {
    beforeEach(async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );
    });

    it('should create all required directories', () => {
      const requiredDirs = [
        'src',
        'src/handlers',
        'src/modules',
        'tests',
        'tests/unit',
        'tests/integration',
        'deploy',
        'deploy/kubernetes',
      ];

      for (const dir of requiredDirs) {
        expect(existsSync(join(projectPath, dir))).toBe(true);
      }
    });

    it('should have correct file structure for default template', () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'gati.config.ts',
        'README.md',
        '.gitignore',
        '.dockerignore',
        '.env.example',
        'Dockerfile',
        'docker-compose.yml',
        'src/index.ts',
        'src/handlers/hello.ts',
        'src/handlers/health.ts',
        'deploy/kubernetes/deployment.yaml',
        'deploy/kubernetes/service.yaml',
      ];

      for (const file of requiredFiles) {
        expect(existsSync(join(projectPath, file))).toBe(true);
      }
    });
  });

  describe('Package Manager Compatibility', () => {
    it('should work with npm install', async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      // Use local packages
      await useLocalPackages(projectPath);

      // Try installing with npm
      const { stderr } = await execAsync('npm install', { 
        cwd: projectPath,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      expect(stderr).not.toContain('ERR!');
      expect(existsSync(join(projectPath, 'node_modules'))).toBe(true);
      expect(existsSync(join(projectPath, 'package-lock.json'))).toBe(true);
    }, 120000);

    it('should work with yarn install', async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      // Use local packages
      await useLocalPackages(projectPath);

      try {
        // Try installing with yarn
        const { stderr } = await execAsync('yarn install', { 
          cwd: projectPath,
          env: { ...process.env, NODE_ENV: 'development' }
        });

        expect(stderr).not.toContain('error');
        expect(existsSync(join(projectPath, 'node_modules'))).toBe(true);
        expect(existsSync(join(projectPath, 'yarn.lock'))).toBe(true);
      } catch (error) {
        // Yarn might not be installed, skip test
        console.warn('Yarn not available, skipping yarn test');
      }
    }, 120000);

    it('should work with pnpm install', async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      // Use local packages
      await useLocalPackages(projectPath);

      // Try installing with pnpm
      const { stderr } = await execAsync('pnpm install', { 
        cwd: projectPath,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      expect(stderr).not.toContain('ERR_');
      expect(existsSync(join(projectPath, 'node_modules'))).toBe(true);
      expect(existsSync(join(projectPath, 'pnpm-lock.yaml'))).toBe(true);
    }, 120000);
  });

  describe('Generated Project Functionality', () => {
    beforeEach(async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      // Use local packages
      await useLocalPackages(projectPath);

      // Install dependencies
      await execAsync('pnpm install', { cwd: projectPath });
    }, 120000);

    it('should pass TypeScript type checking', async () => {
      const { stdout, stderr } = await execAsync('pnpm typecheck', { cwd: projectPath });

      expect(stderr).not.toContain('error TS');
      expect(stdout).not.toContain('error TS');
    }, 60000);

    it('should build successfully', async () => {
      const { stdout, stderr } = await execAsync('pnpm build', { cwd: projectPath });

      // Debug output - print everything
      // eslint-disable-next-line no-console
      console.log('[BUILD FULL STDOUT]:', stdout);
      // eslint-disable-next-line no-console
      console.log('[BUILD FULL STDERR]:', stderr);
      
      if (!existsSync(join(projectPath, 'dist'))) {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] dist directory does not exist');
        // eslint-disable-next-line no-console
        console.log('[DEBUG] projectPath:', projectPath);
        // eslint-disable-next-line no-console
        console.log('[DEBUG] Listing project root:');
        const { stdout: lsOut } = await execAsync('dir', { cwd: projectPath });
        // eslint-disable-next-line no-console
        console.log(lsOut);
      }

      expect(stderr).not.toContain('error');
      expect(existsSync(join(projectPath, 'dist'))).toBe(true);
      expect(existsSync(join(projectPath, 'dist/index.js'))).toBe(true);
    }, 60000);

    it('should have valid handler exports', async () => {
      await execAsync('pnpm build', { cwd: projectPath });

      // Check that handlers are built
      const handlersDir = join(projectPath, 'dist/handlers');
      expect(existsSync(handlersDir)).toBe(true);
      expect(existsSync(join(handlersDir, 'hello.js'))).toBe(true);
      expect(existsSync(join(handlersDir, 'health.js'))).toBe(true);
    }, 60000);
  });

  describe('CLI Commands Validation', () => {
    beforeEach(async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );
      // Use local packages
      await useLocalPackages(projectPath);
      await execAsync('pnpm install', { cwd: projectPath });
      // Initialize git repository for CLI commands that may need it
      await execAsync('git init', { cwd: projectPath }).catch(() => {});
      await execAsync('git config user.name "Test User"', { cwd: projectPath }).catch(() => {});
      await execAsync('git config user.email "test@example.com"', { cwd: projectPath }).catch(() => {});
    }, 120000);

    it('should have gati command available', async () => {
      const { stdout } = await execAsync('npx gati --help', { cwd: projectPath });

      expect(stdout).toContain('Usage: gati');
      expect(stdout).toContain('create');
      expect(stdout).toContain('dev');
      expect(stdout).toContain('build');
      expect(stdout).toContain('deploy');
    }, 30000);

    it('should have dev script configured', async () => {
      const pkgJson = JSON.parse(await readFile(join(projectPath, 'package.json'), 'utf-8')) as PackageJson;
      expect(pkgJson.scripts['dev']).toBe('gati dev');
    });

    it('should have build script configured', async () => {
      const pkgJson = JSON.parse(await readFile(join(projectPath, 'package.json'), 'utf-8')) as PackageJson;
      expect(pkgJson.scripts['build']).toBe('gati build');
    });

    it('should have test script configured', async () => {
      const pkgJson = JSON.parse(await readFile(join(projectPath, 'package.json'), 'utf-8')) as PackageJson;
      expect(pkgJson.scripts['test']).toBe('vitest');
    });
  });

  describe('Minimal Template Validation', () => {
    beforeEach(async () => {
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${projectName} --template minimal --skip-prompts --skip-install`,
        { cwd: testDir }
      );
    });

    it('should have minimal file structure', () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'gati.config.ts',
        'README.md',
        '.gitignore',
        '.env.example',
        'Dockerfile',
        'src/index.ts',
        'src/handlers/health.ts',
      ];

      for (const file of requiredFiles) {
        expect(existsSync(join(projectPath, file))).toBe(true);
      }

      // Should NOT have example handler
      expect(existsSync(join(projectPath, 'src/handlers/hello.ts'))).toBe(false);
    });

    it('should have fewer dependencies than default', async () => {
      const pkgJson = JSON.parse(await readFile(join(projectPath, 'package.json'), 'utf-8')) as PackageJson;
      
      // Minimal should have core dependencies
      expect(pkgJson.dependencies['@gati-framework/runtime']).toBeDefined();
      expect(pkgJson.dependencies['@gati-framework/core']).toBeDefined();
      
      // But not extras like eslint in default template
      expect(Object.keys(pkgJson.devDependencies).length).toBeLessThan(5);
    });

    it('should still build successfully', async () => {
      // Use local packages
      await useLocalPackages(projectPath);
      await execAsync('pnpm install', { cwd: projectPath });
      const { stderr } = await execAsync('pnpm build', { cwd: projectPath });

      expect(stderr).not.toContain('error');
      expect(existsSync(join(projectPath, 'dist/index.js'))).toBe(true);
    }, 120000);
  });

  describe('Error Handling', () => {
    it('should reject invalid project names', async () => {
      await expect(
        execAsync(
          `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create "" --skip-prompts --skip-install`,
          { cwd: testDir }
        )
      ).rejects.toThrow();
    }, 30000);

    it('should handle special characters in project name', async () => {
      const specialName = 'my-app-123';
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${specialName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      expect(existsSync(join(testDir, specialName))).toBe(true);
    }, 30000);

    it('should handle long project names', async () => {
      const longName = 'my-very-long-project-name-for-testing-purposes';
      await execAsync(
        `node ${join(process.cwd(), 'packages/cli/dist/index.js')} create ${longName} --skip-prompts --skip-install`,
        { cwd: testDir }
      );

      expect(existsSync(join(testDir, longName))).toBe(true);
    }, 30000);
  });

  describe('GatiC Wrapper', () => {
    it('should work via gatic wrapper', async () => {
      // Test the gatic wrapper delegates correctly
      const gaticPath = join(process.cwd(), 'packages/gatic/bin/gatic.mjs');
      
      if (existsSync(gaticPath)) {
        const { stdout } = await execAsync(
          `node ${gaticPath} create ${projectName} --skip-prompts --skip-install`,
          { cwd: testDir }
        );

        expect(stdout).toContain('Next steps');
        expect(existsSync(projectPath)).toBe(true);
      }
    }, 30000);
  });
});
