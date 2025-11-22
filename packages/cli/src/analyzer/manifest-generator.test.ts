/**
 * @file Tests for manifest generator
 * 
 * Feature: runtime-architecture, Property 2: Manifest generation completeness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ManifestGenerator } from './manifest-generator.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('ManifestGenerator', () => {
  let tempDir: string;
  let generator: ManifestGenerator;

  beforeEach(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gati-test-'));
    
    // Create minimal tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'node',
        strict: true,
      },
    };
    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    generator = new ManifestGenerator({
      projectRoot: tempDir,
      tsConfigPath: path.join(tempDir, 'tsconfig.json'),
    });
  });

  describe('generateHandlerManifest', () => {
    it('should generate manifest for valid handler', () => {
      // Create a simple handler file
      const handlerCode = `
/**
 * @path /users
 * @method POST
 * @roles admin,user
 */
export async function createUser(req: any, res: any, lctx: any, gctx: any) {
  const user = await gctx.modules.database.create(req.body);
  res.json(user);
}
`;
      const handlerPath = path.join(tempDir, 'create-user.ts');
      fs.writeFileSync(handlerPath, handlerCode);

      // Recreate generator with the new file
      generator = new ManifestGenerator({
        projectRoot: tempDir,
        tsConfigPath: path.join(tempDir, 'tsconfig.json'),
      });

      const manifest = generator.generateHandlerManifest(handlerPath);

      expect(manifest).toBeDefined();
      expect(manifest?.handlerId).toContain('createUser');
      expect(manifest?.path).toBe('/users');
      expect(manifest?.method).toBe('POST');
      expect(manifest?.policies.roles).toEqual(['admin', 'user']);
      expect(manifest?.dependencies.modules).toContain('database');
    });

    it('should return null for non-handler functions', () => {
      const code = `
export function notAHandler(x: number) {
  return x * 2;
}
`;
      const filePath = path.join(tempDir, 'not-handler.ts');
      fs.writeFileSync(filePath, code);

      generator = new ManifestGenerator({
        projectRoot: tempDir,
        tsConfigPath: path.join(tempDir, 'tsconfig.json'),
      });

      const manifest = generator.generateHandlerManifest(filePath);
      expect(manifest).toBeNull();
    });

    it('should extract multiple module dependencies', () => {
      const handlerCode = `
export async function complexHandler(req: any, res: any, lctx: any, gctx: any) {
  const user = await gctx.modules.database.findOne(req.params.id);
  await gctx.modules.cache.set('user', user);
  await gctx.modules.email.send(user.email, 'Welcome');
  res.json(user);
}
`;
      const handlerPath = path.join(tempDir, 'complex-handler.ts');
      fs.writeFileSync(handlerPath, handlerCode);

      generator = new ManifestGenerator({
        projectRoot: tempDir,
        tsConfigPath: path.join(tempDir, 'tsconfig.json'),
      });

      const manifest = generator.generateHandlerManifest(handlerPath);

      expect(manifest?.dependencies.modules).toContain('database');
      expect(manifest?.dependencies.modules).toContain('cache');
      expect(manifest?.dependencies.modules).toContain('email');
    });
  });

  describe('Property 2: Manifest generation completeness', () => {
    it('should contain all required fields (property test)', async () => {
      const fc = await import('fast-check');
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}`),
          async (method, path) => {
            const handlerCode = `
/**
 * @path ${path}
 * @method ${method}
 */
export async function testHandler(req: any, res: any, lctx: any, gctx: any) {
  res.json({ ok: true });
}
`;
            const handlerPath = path.join(tempDir, `handler-${Date.now()}.ts`);
            fs.writeFileSync(handlerPath, handlerCode);

            const gen = new ManifestGenerator({
              projectRoot: tempDir,
              tsConfigPath: path.join(tempDir, 'tsconfig.json'),
            });

            const manifest = gen.generateHandlerManifest(handlerPath);

            // Verify all required fields are present
            expect(manifest).toBeDefined();
            expect(manifest?.handlerId).toBeDefined();
            expect(manifest?.path).toBe(path);
            expect(manifest?.method).toBe(method);
            expect(manifest?.gtypes).toBeDefined();
            expect(manifest?.gtypes.request).toBeDefined();
            expect(manifest?.gtypes.response).toBeDefined();
            expect(manifest?.hooks).toBeDefined();
            expect(manifest?.timescapeVersion).toBeDefined();
            expect(manifest?.policies).toBeDefined();
            expect(manifest?.dependencies).toBeDefined();
            expect(manifest?.dependencies.modules).toBeInstanceOf(Array);
          }
        ),
        { numRuns: 20 } // Reduced runs for file I/O
      );
    });
  });
});
