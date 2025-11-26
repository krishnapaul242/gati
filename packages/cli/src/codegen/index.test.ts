/**
 * @module cli/codegen/index.test
 * @description Tests for codegen orchestrator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateValidators, generateTypes, generateSDK, generateBundle, generateAll } from './index.js';
import { primitive, object, array } from '../../../runtime/src/gtype/schema.js';
import type { HandlerManifest, ModuleManifest } from '../analyzer/manifest-generator.js';

describe('Codegen Orchestrator', () => {
  const testDir = path.join(process.cwd(), 'test-output-codegen');

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('generateValidators', () => {
    it('should generate validator files for schemas', async () => {
      const schemas = {
        User: object({
          name: primitive('string'),
          age: primitive('number'),
        }),
        Post: object({
          title: primitive('string'),
          content: primitive('string'),
        }),
      };

      const result = await generateValidators(schemas, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated.length).toBeGreaterThan(0);

      // Verify files exist
      const validatorsDir = path.join(testDir, 'generated', 'validators');
      const files = await fs.readdir(validatorsDir);
      expect(files).toContain('User.ts');
      expect(files).toContain('Post.ts');
      expect(files).toContain('index.ts');
    });

    it('should handle empty schemas', async () => {
      const result = await generateValidators({}, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.filesGenerated.length).toBeGreaterThan(0); // Should still create index
    });
  });

  describe('generateTypes', () => {
    it('should generate TypeScript type definitions', async () => {
      const schemas = {
        User: object({
          name: primitive('string'),
          email: primitive('string'),
        }),
        Post: object({
          title: primitive('string'),
          authorId: primitive('string'),
        }),
      };

      const result = await generateTypes(schemas, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated.length).toBeGreaterThan(0);

      // Verify file exists
      const typesFile = path.join(testDir, 'generated', 'types', 'index.ts');
      const content = await fs.readFile(typesFile, 'utf-8');
      expect(content).toContain('User');
      expect(content).toContain('Post');
      expect(content).toContain('name');
      expect(content).toContain('email');
    });

    it('should handle complex nested types', async () => {
      const schemas = {
        ComplexType: object({
          user: object({
            profile: object({
              name: primitive('string'),
            }),
          }),
          tags: array(primitive('string')),
        }),
      };

      const result = await generateTypes(schemas, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.filesGenerated.length).toBeGreaterThan(0);
    });
  });

  describe('generateSDK', () => {
    it('should generate SDK client from manifests', async () => {
      const manifests: HandlerManifest[] = [
        {
          handlerId: 'getUsers',
          path: '/api/users',
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
        {
          handlerId: 'createUser',
          path: '/api/users',
          method: 'POST',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
      ];

      const result = await generateSDK(manifests, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated.length).toBeGreaterThan(0);

      // Verify files exist
      const sdkDir = path.join(testDir, 'generated', 'sdk');
      const files = await fs.readdir(sdkDir);
      expect(files).toContain('client.ts');
      expect(files).toContain('index.ts');

      // Verify content
      const clientFile = path.join(sdkDir, 'client.ts');
      const content = await fs.readFile(clientFile, 'utf-8');
      expect(content).toContain('class GatiClient');
      expect(content).toContain('getApiUsers');
      expect(content).toContain('createApiUsers');
    });

    it('should handle empty manifests', async () => {
      const result = await generateSDK([], {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.filesGenerated.length).toBeGreaterThan(0);
    });
  });

  describe('generateBundle', () => {
    it('should generate manifest bundle', async () => {
      const handlers: HandlerManifest[] = [
        {
          handlerId: 'getUsers',
          path: '/api/users',
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
      ];

      const modules: ModuleManifest[] = [];

      const schemas = {
        User: object({
          name: primitive('string'),
        }),
      };

      const result = await generateBundle(handlers, modules, schemas, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated.length).toBeGreaterThan(0);

      // Verify files exist
      const bundleDir = path.join(testDir, 'generated', 'bundle');
      const files = await fs.readdir(bundleDir);
      expect(files).toContain('manifest-bundle.json');
      expect(files).toContain('manifest-index.json');

      // Verify bundle content
      const bundleFile = path.join(bundleDir, 'manifest-bundle.json');
      const content = await fs.readFile(bundleFile, 'utf-8');
      const bundle = JSON.parse(content);
      expect(bundle.handlers).toHaveLength(1);
      expect(bundle.schemas).toHaveProperty('User');
      expect(bundle.checksum).toBeTruthy();
    });

    it('should validate bundle integrity', async () => {
      const handlers: HandlerManifest[] = [
        {
          handlerId: 'test',
          path: '/api/test',
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: ['nonexistent'] }, // Invalid dependency
        },
      ];

      const result = await generateBundle(handlers, [], {}, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      // Should fail validation
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('generateAll', () => {
    it('should generate all artifacts', async () => {
      const handlers: HandlerManifest[] = [
        {
          handlerId: 'getUsers',
          path: '/api/users',
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
      ];

      const modules: ModuleManifest[] = [];

      const schemas = {
        User: object({
          name: primitive('string'),
          email: primitive('string'),
        }),
      };

      const result = await generateAll(handlers, modules, schemas, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.filesGenerated.length).toBeGreaterThan(0);

      // Verify all directories were created
      const generatedDir = path.join(testDir, 'generated');
      const subdirs = await fs.readdir(generatedDir);
      expect(subdirs).toContain('validators');
      expect(subdirs).toContain('types');
      expect(subdirs).toContain('sdk');
      expect(subdirs).toContain('bundle');
    });

    it('should report errors from individual generators', async () => {
      const handlers: HandlerManifest[] = [
        {
          handlerId: 'test',
          path: '/api/test',
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: ['invalid'] },
        },
      ];

      const result = await generateAll(handlers, [], {}, {
        projectRoot: testDir,
        outputDir: testDir,
      });

      // Should have errors from bundle validation
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
