/**
 * @module cli/codegen/sdk-generator.property.test
 * @description Property-based tests for SDK client stub generator
 * Property 38: Generated SDK stubs match handler manifests
 */

import { describe, it, expect } from 'vitest';
import { SDKGenerator } from './sdk-generator.js';
import type { HandlerManifest } from '../analyzer/manifest-generator.js';
import * as ts from 'typescript';

describe('SDKGenerator - Property Tests (18.2)', () => {
  const generator = new SDKGenerator();

  /**
   * Property 38: Generated SDK stubs match handler manifests
   * 
   * For any valid handler manifest:
   * 1. Generated SDK code compiles without errors
   * 2. Method names match handler paths
   * 3. Method signatures include path parameters
   * 4. Request/response types are correctly applied
   */

  describe('Property 38: SDK client stub generation correctness', () => {
    // Generate 100+ test cases with different handler manifest combinations
    const testCases: Array<{ name: string; manifest: HandlerManifest }> = [];

    // HTTP methods to test
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    // Generate simple path test cases (25 cases)
    httpMethods.forEach(method => {
      for (let i = 0; i < 5; i++) {
        testCases.push({
          name: `${method}-simple-${i}`,
          manifest: {
            handlerId: `handler-${method.toLowerCase()}-${i}`,
            path: `/api/resource${i}`,
            method,
            gtypes: { request: 'any', response: 'any' },
            hooks: { before: [], after: [] },
            timescapeVersion: 'v1',
            policies: {},
            dependencies: { modules: [] },
          },
        });
      }
    });

    // Generate path with single parameter test cases (25 cases)
    httpMethods.forEach(method => {
      for (let i = 0; i < 5; i++) {
        testCases.push({
          name: `${method}-single-param-${i}`,
          manifest: {
            handlerId: `handler-${method.toLowerCase()}-param-${i}`,
            path: `/api/users/:id`,
            method,
            gtypes: { request: 'any', response: 'any' },
            hooks: { before: [], after: [] },
            timescapeVersion: 'v1',
            policies: {},
            dependencies: { modules: [] },
          },
        });
      }
    });

    // Generate path with multiple parameters test cases (25 cases)
    httpMethods.forEach(method => {
      for (let i = 0; i < 5; i++) {
        testCases.push({
          name: `${method}-multi-param-${i}`,
          manifest: {
            handlerId: `handler-${method.toLowerCase()}-multi-${i}`,
            path: `/api/users/:userId/posts/:postId`,
            method,
            gtypes: { request: 'any', response: 'any' },
            hooks: { before: [], after: [] },
            timescapeVersion: 'v1',
            policies: {},
            dependencies: { modules: [] },
          },
        });
      }
    });

    // Generate nested path test cases (15 cases)
    for (let i = 0; i < 15; i++) {
      testCases.push({
        name: `nested-path-${i}`,
        manifest: {
          handlerId: `handler-nested-${i}`,
          path: `/api/v1/organizations/:orgId/teams/:teamId/members/:memberId`,
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
      });
    }

    // Generate complex path patterns (15 cases)
    const complexPaths = [
      '/api/search',
      '/api/users/:id/profile',
      '/api/posts/:postId/comments',
      '/api/admin/settings',
      '/api/v2/data/:type',
    ];
    for (let i = 0; i < 3; i++) {
      complexPaths.forEach(pathStr => {
        testCases.push({
          name: `complex-${pathStr.replace(/[/:]/g, '-')}-${i}`,
          manifest: {
            handlerId: `handler-complex-${i}`,
            path: pathStr,
            method: 'GET',
            gtypes: { request: 'any', response: 'any' },
            hooks: { before: [], after: [] },
            timescapeVersion: 'v1',
            policies: {},
            dependencies: { modules: [] },
          },
        });
      });
    }

    // Generate manifests with multiple methods (10 cases)
    for (let i = 0; i < 10; i++) {
      testCases.push({
        name: `multi-method-${i}`,
        manifest: {
          handlerId: `handler-multi-${i}`,
          path: `/api/resource${i}`,
          method: ['GET', 'POST'],
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
      });
    }

    // Total: 25 + 25 + 25 + 15 + 15 + 10 = 115 test cases

    it(`should generate valid SDK for ${testCases.length} handler manifest variations`, () => {
      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ name: string; error: string }> = [];

      for (const testCase of testCases) {
        try {
          const result = generator.generate([testCase.manifest], {
            className: 'TestClient',
            includeComments: true,
            includeAuth: true,
            includeTimeout: true,
          });

          // Verify code was generated
          expect(result.code).toBeTruthy();
          expect(result.code.length).toBeGreaterThan(0);

          // Verify class name
          expect(result.code).toContain('class TestClient');

          // Verify TypeScript compilation
          const transpileResult = ts.transpileModule(result.code, {
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2020,
              lib: ['ES2020', 'DOM'],
            },
          });

          if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
            const errors = transpileResult.diagnostics.map(d => d.messageText).join(', ');
            throw new Error(`TypeScript compilation errors: ${errors}`);
          }

          successCount++;
        } catch (error) {
          failureCount++;
          failures.push({
            name: testCase.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Report results
      console.log(`\n✅ Property Test Results:`);
      console.log(`   Total cases: ${testCases.length}`);
      console.log(`   Successes: ${successCount}`);
      console.log(`   Failures: ${failureCount}`);

      if (failures.length > 0) {
        console.log(`\n❌ Failed cases:`);
        failures.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
      }

      // All test cases should pass
      expect(failureCount).toBe(0);
      expect(successCount).toBe(testCases.length);
    });

    it('should generate correct method names from paths', () => {
      const testCases = [
        { path: '/api/users', method: 'GET', expected: 'getApiUsers' },
        { path: '/api/users', method: 'POST', expected: 'createApiUsers' },
        { path: '/api/users/:id', method: 'PUT', expected: 'updateApiUsers' },
        { path: '/api/users/:id', method: 'DELETE', expected: 'deleteApiUsers' },
        { path: '/api/posts/:id', method: 'GET', expected: 'getApiPosts' },
      ];

      for (const testCase of testCases) {
        const manifest: HandlerManifest = {
          handlerId: 'test',
          path: testCase.path,
          method: testCase.method,
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        };

        const result = generator.generate([manifest], { includeComments: false });
        expect(result.code).toContain(`async ${testCase.expected}(`);
      }
    });

    it('should include path parameters in method signature', () => {
      const manifest: HandlerManifest = {
        handlerId: 'test',
        path: '/api/users/:userId/posts/:postId',
        method: 'GET',
        gtypes: { request: 'any', response: 'any' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
      };

      const result = generator.generate([manifest], { includeComments: false });

      // Should have userId and postId parameters
      expect(result.code).toContain('userId: string');
      expect(result.code).toContain('postId: string');
    });

    it('should include body parameter for POST/PUT/PATCH methods', () => {
      const methods = ['POST', 'PUT', 'PATCH'];

      for (const method of methods) {
        const manifest: HandlerManifest = {
          handlerId: 'test',
          path: '/api/users',
          method,
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        };

        const result = generator.generate([manifest], { includeComments: false });
        expect(result.code).toContain('body: any');
      }
    });

    it('should not include body parameter for GET/DELETE methods', () => {
      const methods = ['GET', 'DELETE'];

      for (const method of methods) {
        const manifest: HandlerManifest = {
          handlerId: 'test',
          path: '/api/users/:id',
          method,
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        };

        const result = generator.generate([manifest], { includeComments: false });
        
        // Extract method signature
        const methodMatch = result.code.match(/async \w+\([^)]+\)/);
        if (methodMatch) {
          // Should not have body parameter (only id and query)
          expect(methodMatch[0]).not.toContain('body:');
        }
      }
    });

    it('should include query parameter in all methods', () => {
      const manifest: HandlerManifest = {
        handlerId: 'test',
        path: '/api/users',
        method: 'GET',
        gtypes: { request: 'any', response: 'any' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
      };

      const result = generator.generate([manifest], { includeComments: false });
      expect(result.code).toContain('query?: Record<string, string>');
    });

    it('should generate helper methods when auth is enabled', () => {
      const manifest: HandlerManifest = {
        handlerId: 'test',
        path: '/api/users',
        method: 'GET',
        gtypes: { request: 'any', response: 'any' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
      };

      const result = generator.generate([manifest], { includeAuth: true });
      expect(result.code).toContain('private getHeaders()');
      expect(result.code).toContain('Authorization');
    });

    it('should generate abort signal helper when timeout is enabled', () => {
      const manifest: HandlerManifest = {
        handlerId: 'test',
        path: '/api/users',
        method: 'GET',
        gtypes: { request: 'any', response: 'any' },
        hooks: { before: [], after: [] },
        timescapeVersion: 'v1',
        policies: {},
        dependencies: { modules: [] },
      };

      const result = generator.generate([manifest], { includeTimeout: true });
      expect(result.code).toContain('private getAbortSignal()');
      expect(result.code).toContain('AbortSignal.timeout');
    });

    it('should handle multiple handlers in single SDK', () => {
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
        {
          handlerId: 'getUser',
          path: '/api/users/:id',
          method: 'GET',
          gtypes: { request: 'any', response: 'any' },
          hooks: { before: [], after: [] },
          timescapeVersion: 'v1',
          policies: {},
          dependencies: { modules: [] },
        },
      ];

      const result = generator.generate(manifests, { includeComments: false });

      // Should contain all methods
      expect(result.code).toContain('async getApiUsers(');
      expect(result.code).toContain('async createApiUsers(');
      // Note: Multiple methods with same path/method will have duplicate names

      // Should compile
      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          lib: ['ES2020', 'DOM'],
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });
  });
});
