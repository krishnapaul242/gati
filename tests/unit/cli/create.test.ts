/**
 * @module tests/unit/cli/create.test
 * @description Tests for CLI create command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { generateProject } from '@gati/cli/utils/file-generator';

interface PackageJson {
  name: string;
  description: string;
  author: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
}

interface TsConfig {
  compilerOptions: Record<string, unknown>;
  include: string[];
}

describe('CLI Create Command', () => {
  const testProjectPath = join(process.cwd(), 'test-cli-project');

  beforeEach(async () => {
    // Clean up any existing test project
    if (existsSync(testProjectPath)) {
      await rm(testProjectPath, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up test project
    if (existsSync(testProjectPath)) {
      await rm(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('generateProject', () => {
    it('should create project with default template', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test project',
        author: 'Test Author',
        template: 'default',
        skipInstall: true,
      });

      // Check directory structure
      expect(existsSync(testProjectPath)).toBe(true);
      expect(existsSync(join(testProjectPath, 'src'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'src/handlers'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'src/modules'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'tests'))).toBe(true);

      // Check generated files
      expect(existsSync(join(testProjectPath, 'package.json'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'tsconfig.json'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'gati.config.ts'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'README.md'))).toBe(true);
      expect(existsSync(join(testProjectPath, '.gitignore'))).toBe(true);

      // Check example handler
      expect(
        existsSync(join(testProjectPath, 'src/handlers/hello.ts'))
      ).toBe(true);
    });

    it('should create project with minimal template', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test project',
        author: 'Test Author',
        template: 'minimal',
        skipInstall: true,
      });

      // Check basic structure exists
      expect(existsSync(testProjectPath)).toBe(true);
      expect(existsSync(join(testProjectPath, 'package.json'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'tsconfig.json'))).toBe(true);

      // Minimal template should not have example files
      expect(
        existsSync(join(testProjectPath, 'src/handlers/hello.ts'))
      ).toBe(false);
    });

    it('should generate valid package.json', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'my-app',
        description: 'My Test App',
        author: 'John Doe',
        template: 'default',
        skipInstall: true,
      });

      const pkgJsonPath = join(testProjectPath, 'package.json');
      expect(existsSync(pkgJsonPath)).toBe(true);

      const pkgJson = JSON.parse(
        await import('fs/promises').then((fs) =>
          fs.readFile(pkgJsonPath, 'utf-8')
        )
      ) as PackageJson;

      expect(pkgJson['name']).toBe('my-app');
      expect(pkgJson['description']).toBe('My Test App');
      expect(pkgJson['author']).toBe('John Doe');
      expect(pkgJson['scripts']).toBeDefined();
      expect(pkgJson['dependencies']).toBeDefined();
    });

    it('should generate valid TypeScript config', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

      const tsconfigPath = join(testProjectPath, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(
        await import('fs/promises').then((fs) =>
          fs.readFile(tsconfigPath, 'utf-8')
        )
      ) as TsConfig;

      expect(tsconfig['compilerOptions']).toBeDefined();
      expect(tsconfig['include']).toBeDefined();
    });

    it('should generate README with project name', async () => {
      const projectName = 'awesome-app';

      await generateProject({
        projectPath: testProjectPath,
        projectName,
        description: 'An awesome app',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

      const readmePath = join(testProjectPath, 'README.md');
      const readme = await import('fs/promises').then((fs) =>
        fs.readFile(readmePath, 'utf-8')
      );

      expect(readme).toContain(projectName);
      expect(readme).toContain('An awesome app');
    });

    it('should create all required directories', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

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
        expect(existsSync(join(testProjectPath, dir))).toBe(true);
      }
    });

    it('should generate deployment configuration files', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

      // Check deployment files
      expect(existsSync(join(testProjectPath, 'Dockerfile'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'docker-compose.yml'))).toBe(true);
      expect(existsSync(join(testProjectPath, '.dockerignore'))).toBe(true);
      expect(existsSync(join(testProjectPath, '.env.example'))).toBe(true);

      // Check Kubernetes manifests
      expect(existsSync(join(testProjectPath, 'deploy/kubernetes/deployment.yaml'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'deploy/kubernetes/service.yaml'))).toBe(true);
    });

    it('should generate health check handler', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

      const healthHandlerPath = join(testProjectPath, 'src/handlers/health.ts');
      expect(existsSync(healthHandlerPath)).toBe(true);

      const healthHandler = await import('fs/promises').then((fs) =>
        fs.readFile(healthHandlerPath, 'utf-8')
      );

      expect(healthHandler).toContain('health');
      expect(healthHandler).toContain('Handler');
    });

    it('should generate entry point with graceful shutdown', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

      const indexPath = join(testProjectPath, 'src/index.ts');
      const indexContent = await import('fs/promises').then((fs) =>
        fs.readFile(indexPath, 'utf-8')
      );

      expect(indexContent).toContain('SIGTERM');
      expect(indexContent).toContain('SIGINT');
      expect(indexContent).toContain('shutdown');
      expect(indexContent).toContain('process.env');
    });

    it('should generate minimal template with deployment files', async () => {
      await generateProject({
        projectPath: testProjectPath,
        projectName: 'test-cli-project',
        description: 'Test',
        author: 'Test',
        template: 'minimal',
        skipInstall: true,
      });

      // Minimal should also have deployment files
      expect(existsSync(join(testProjectPath, 'Dockerfile'))).toBe(true);
      expect(existsSync(join(testProjectPath, '.env.example'))).toBe(true);
      expect(existsSync(join(testProjectPath, 'src/handlers/health.ts'))).toBe(true);
    });

    it('should include project name in Dockerfile', async () => {
      const projectName = 'my-awesome-api';

      await generateProject({
        projectPath: testProjectPath,
        projectName,
        description: 'Test',
        author: 'Test',
        template: 'default',
        skipInstall: true,
      });

      const dockerfilePath = join(testProjectPath, 'Dockerfile');
      const dockerfile = await import('fs/promises').then((fs) =>
        fs.readFile(dockerfilePath, 'utf-8')
      );

      expect(dockerfile).toContain(projectName);
    });
  });
});
