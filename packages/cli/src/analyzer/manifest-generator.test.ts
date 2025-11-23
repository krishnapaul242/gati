/**
 * @module cli/analyzer/manifest-generator.test
 * @description Tests for manifest generator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ManifestGenerator, type HandlerManifest } from './manifest-generator.js';

describe('ManifestGenerator', () => {
  let tempDir: string;
  let generator: ManifestGenerator;

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gati-test-'));
    
    // Create tsconfig.json
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

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Basic Functionality', () => {
    it('should generate manifest for simple handler', () => {
      const handlerCode = `
        /**
         * @path /users
         * @method POST
         */
        export async function createUser(req: any, res: any, lctx: any, gctx: any) {
          const user = await gctx.modules.database.create(req.body);
          res.json(user);
        }
      `;

      const filePath = path.join(tempDir, 'create-user.ts');
      fs.writeFileSync(filePath, handlerCode);

      const manifest = generator.generateHandlerManifest(filePath);

      expect(manifest).toBeDefined();
      expect(manifest?.handlerId).toContain('createUser');
      expect(manifest?.path).toBe('/users');
      expect(manifest?.method).toBe('POST');
      expect(manifest?.dependencies.modules).toContain('database');
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

      const filePath = path.join(tempDir, 'complex-handler.ts');
      fs.writeFileSync(filePath, handlerCode);

      const manifest = generator.generateHandlerManifest(filePath);

      expect(manifest?.dependencies.modules).toContain('database');
      expect(manifest?.dependencies.modules).toContain('cache');
      expect(manifest?.dependencies.modules).toContain('email');
    });

    it('should extract security policies from JSDoc', () => {
      const handlerCode = `
        /**
         * @path /admin/users
         * @method DELETE
         * @roles admin,superuser
         * @rateLimit 10/60
         */
        export async function deleteUser(req: any, res: any, lctx: any, gctx: any) {
          await gctx.modules.database.delete(req.params.id);
          res.status(204).send();
        }
      `;

      const filePath = path.join(tempDir, 'delete-user.ts');
      fs.writeFileSync(filePath, handlerCode);

      const manifest = generator.generateHandlerManifest(filePath);

      expect(manifest?.policies.roles).toEqual(['admin', 'superuser']);
      expect(manifest?.policies.rateLimit).toEqual({ limit: 10, window: 60 });
    });
  });

  describe('Property Tests', () => {
    // Feature: runtime-architecture, Property 2: Manifest generation completeness
    it('Property 2: should generate complete manifests for all valid handlers', () => {
      fc.assert(
        fc.property(
          fc.record({
            functionName: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/),
            path: fc.stringMatching(/^\/[a-z0-9\-\/]*$/),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            modules: fc.array(fc.stringMatching(/^[a-z][a-z0-9]*$/), { minLength: 0, maxLength: 5 }),
            roles: fc.option(fc.array(fc.stringMatching(/^[a-z]+$/), { minLength: 1, maxLength: 3 }), { nil: undefined }),
          }),
          ({ functionName, path, method, modules, roles }) => {
            // Generate handler code
            const moduleUsage = modules.map(m => `gctx.modules.${m}.call()`).join(';\n  ');
            const rolesTag = roles ? `\n * @roles ${roles.join(',')}` : '';
            
            const handlerCode = `
              /**
               * @path ${path}
               * @method ${method}${rolesTag}
               */
              export async function ${functionName}(req: any, res: any, lctx: any, gctx: any) {
                ${moduleUsage}
                res.json({ success: true });
              }
            `;

            const filePath = path.join(tempDir, `${functionName}.ts`);
            fs.writeFileSync(filePath, handlerCode);

            const manifest = generator.generateHandlerManifest(filePath);

            // Verify manifest completeness
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
            expect(manifest?.dependencies.modules).toBeDefined();

            // Verify module dependencies
            for (const module of modules) {
              expect(manifest?.dependencies.modules).toContain(module);
            }

            // Verify roles if specified
            if (roles) {
              expect(manifest?.policies.roles).toEqual(roles);
            }

            // Clean up
            fs.unlinkSync(filePath);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property 2: should generate unique handler IDs for different files', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              fileName: fc.stringMatching(/^[a-z][a-z0-9\-]*$/),
              functionName: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (handlers) => {
            const manifests: HandlerManifest[] = [];

            for (const { fileName, functionName } of handlers) {
              const handlerCode = `
                export async function ${functionName}(req: any, res: any, lctx: any, gctx: any) {
                  res.json({ success: true });
                }
              `;

              const filePath = path.join(tempDir, `${fileName}.ts`);
              fs.writeFileSync(filePath, handlerCode);

              const manifest = generator.generateHandlerManifest(filePath);
              if (manifest) {
                manifests.push(manifest);
              }

              fs.unlinkSync(filePath);
            }

            // Verify all handler IDs are unique
            const handlerIds = manifests.map(m => m.handlerId);
            const uniqueIds = new Set(handlerIds);
            expect(uniqueIds.size).toBe(handlerIds.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('Property 2: should generate consistent Timescape versions for same content', () => {
      fc.assert(
        fc.property(
          fc.record({
            functionName: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/),
            bodyContent: fc.stringOf(fc.char(), { minLength: 10, maxLength: 100 }),
          }),
          ({ functionName, bodyContent }) => {
            const handlerCode = `
              export async function ${functionName}(req: any, res: any, lctx: any, gctx: any) {
                // ${bodyContent}
                res.json({ success: true });
              }
            `;

            const filePath = path.join(tempDir, `${functionName}.ts`);
            
            // Generate manifest twice with same content
            fs.writeFileSync(filePath, handlerCode);
            const manifest1 = generator.generateHandlerManifest(filePath);

            fs.unlinkSync(filePath);
            fs.writeFileSync(filePath, handlerCode);
            const manifest2 = generator.generateHandlerManifest(filePath);

            // Timescape versions should be different (includes timestamp)
            // but the hash portion should be the same
            expect(manifest1?.timescapeVersion).toBeDefined();
            expect(manifest2?.timescapeVersion).toBeDefined();
            
            const hash1 = manifest1?.timescapeVersion.split('-')[1];
            const hash2 = manifest2?.timescapeVersion.split('-')[1];
            expect(hash1).toBe(hash2);

            fs.unlinkSync(filePath);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('Property 2: should handle handlers with no module dependencies', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/),
          (functionName) => {
            const handlerCode = `
              export async function ${functionName}(req: any, res: any, lctx: any, gctx: any) {
                res.json({ message: 'Hello World' });
              }
            `;

            const filePath = path.join(tempDir, `${functionName}.ts`);
            fs.writeFileSync(filePath, handlerCode);

            const manifest = generator.generateHandlerManifest(filePath);

            expect(manifest).toBeDefined();
            expect(manifest?.dependencies.modules).toEqual([]);

            fs.unlinkSync(filePath);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
