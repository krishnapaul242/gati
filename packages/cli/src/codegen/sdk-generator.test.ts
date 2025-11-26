/**
 * @module cli/codegen/sdk-generator.test
 * @description Tests for SDK client stub generator
 */

import { describe, it, expect } from 'vitest';
import { SDKGenerator } from './sdk-generator.js';
import type { HandlerManifest } from '../analyzer/manifest-generator.js';
import * as ts from 'typescript';

describe('SDKGenerator', () => {
  const generator = new SDKGenerator();

  const createManifest = (overrides: Partial<HandlerManifest> = {}): HandlerManifest => ({
    handlerId: 'test.handler',
    path: '/test',
    method: 'GET',
    gtypes: {
      request: 'any',
      response: 'any',
    },
    hooks: {
      before: [],
      after: [],
    },
    timescapeVersion: 'v1',
    policies: {},
    dependencies: {
      modules: [],
    },
    ...overrides,
  });

  describe('method name generation', () => {
    it('should generate GET method name', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async getUsers(');
    });

    it('should generate POST method name', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'POST',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async createUsers(');
    });

    it('should generate PUT method name', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'PUT',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async updateUsers(');
    });

    it('should generate DELETE method name', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'DELETE',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async deleteUsers(');
    });

    it('should generate PATCH method name', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'PATCH',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async patchUsers(');
    });
  });

  describe('path parameter extraction', () => {
    it('should extract single path parameter', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('id: string');
      expect(result.code).toContain('${id}');
    });

    it('should extract multiple path parameters', () => {
      const manifest = createManifest({
        path: '/users/:userId/posts/:postId',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('userId: string');
      expect(result.code).toContain('postId: string');
      expect(result.code).toContain('${userId}');
      expect(result.code).toContain('${postId}');
    });

    it('should handle paths without parameters', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async getUsers(');
      expect(result.code).toContain('query?: Record<string, string>');
    });
  });

  describe('request body handling', () => {
    it('should include body parameter for POST', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'POST',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('body: any');
      expect(result.code).toContain('body: JSON.stringify(body)');
    });

    it('should include body parameter for PUT', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'PUT',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('body: any');
      expect(result.code).toContain('body: JSON.stringify(body)');
    });

    it('should include body parameter for PATCH', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'PATCH',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('body: any');
    });

    it('should not include body parameter for GET', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).not.toContain('body: any');
      expect(result.code).not.toContain('JSON.stringify(body)');
    });

    it('should not include body parameter for DELETE', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'DELETE',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).not.toContain('body: any');
    });
  });

  describe('query parameters', () => {
    it('should include query parameter support', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('query?: Record<string, string>');
      expect(result.code).toContain('URLSearchParams');
    });
  });

  describe('HTTP method generation', () => {
    it('should generate correct HTTP method for GET', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain("method: 'GET'");
    });

    it('should generate correct HTTP method for POST', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'POST',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain("method: 'POST'");
    });

    it('should handle array of methods', () => {
      const manifest = createManifest({
        path: '/users',
        method: ['GET', 'POST'],
      });
      const result = generator.generate([manifest], { includeComments: false });

      // Should use first method
      expect(result.code).toContain("method: 'GET'");
    });
  });

  describe('error handling', () => {
    it('should include error handling', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('if (!response.ok)');
      expect(result.code).toContain('throw new Error');
      expect(result.code).toContain('response.status');
    });
  });

  describe('authentication', () => {
    it('should include auth header support when enabled', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { 
        includeComments: false,
        includeAuth: true,
      });

      expect(result.code).toContain('token?: string');
      expect(result.code).toContain('Authorization');
      expect(result.code).toContain('Bearer');
    });

    it('should not include auth when disabled', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { 
        includeComments: false,
        includeAuth: false,
      });

      expect(result.code).not.toContain('token?: string');
    });
  });

  describe('timeout support', () => {
    it('should include timeout support when enabled', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { 
        includeComments: false,
        includeTimeout: true,
      });

      expect(result.code).toContain('timeout?: number');
      expect(result.code).toContain('AbortSignal');
      expect(result.code).toContain('getAbortSignal');
    });

    it('should not include timeout when disabled', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { 
        includeComments: false,
        includeTimeout: false,
      });

      expect(result.code).not.toContain('timeout?: number');
      expect(result.code).not.toContain('AbortSignal');
    });
  });

  describe('client class generation', () => {
    it('should generate client class with default name', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('export class GatiClient');
      expect(result.className).toBe('GatiClient');
    });

    it('should generate client class with custom name', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { 
        includeComments: false,
        className: 'MyApiClient',
      });

      expect(result.code).toContain('export class MyApiClient');
      expect(result.className).toBe('MyApiClient');
    });

    it('should include constructor with baseUrl', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('constructor(');
      expect(result.code).toContain('private baseUrl: string');
      expect(result.code).toContain('private options?: ClientOptions');
    });
  });

  describe('comments and documentation', () => {
    it('should include JSDoc comments when enabled', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: true });

      expect(result.code).toContain('/**');
      expect(result.code).toContain('GET /users/:id');
      expect(result.code).toContain('@param id');
      expect(result.code).toContain('@returns');
    });

    it('should not include comments when disabled', () => {
      const manifest = createManifest({
        path: '/users/:id',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).not.toContain('/**');
      expect(result.code).not.toContain('@param');
    });

    it('should include header comment', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: true });

      expect(result.code).toContain('Auto-generated Gati API Client');
      expect(result.code).toContain('Generated:');
      expect(result.code).toContain('DO NOT EDIT');
    });
  });

  describe('multiple handlers', () => {
    it('should generate methods for multiple handlers', () => {
      const manifests = [
        createManifest({ path: '/users', method: 'GET' }),
        createManifest({ path: '/users/:id', method: 'GET' }),
        createManifest({ path: '/users', method: 'POST' }),
      ];
      const result = generator.generate(manifests, { includeComments: false });

      expect(result.code).toContain('async getUsers(');
      expect(result.code).toContain('async createUsers(');
    });
  });

  describe('TypeScript compilation', () => {
    it('should generate valid TypeScript for simple handler', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'GET',
      });
      const result = generator.generate([manifest]);

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          lib: ['ES2020', 'DOM'],
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });

    it('should generate valid TypeScript for handler with path params', () => {
      const manifest = createManifest({
        path: '/users/:userId/posts/:postId',
        method: 'GET',
      });
      const result = generator.generate([manifest]);

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          lib: ['ES2020', 'DOM'],
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });

    it('should generate valid TypeScript for POST handler', () => {
      const manifest = createManifest({
        path: '/users',
        method: 'POST',
      });
      const result = generator.generate([manifest]);

      const transpileResult = ts.transpileModule(result.code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          lib: ['ES2020', 'DOM'],
        },
      });

      expect(transpileResult.diagnostics).toHaveLength(0);
    });

    it('should generate valid TypeScript for multiple handlers', () => {
      const manifests = [
        createManifest({ path: '/users', method: 'GET' }),
        createManifest({ path: '/users/:id', method: 'GET' }),
        createManifest({ path: '/users', method: 'POST' }),
        createManifest({ path: '/users/:id', method: 'PUT' }),
        createManifest({ path: '/users/:id', method: 'DELETE' }),
      ];
      const result = generator.generate(manifests);

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

  describe('complex paths', () => {
    it('should handle nested resource paths', () => {
      const manifest = createManifest({
        path: '/organizations/:orgId/teams/:teamId/members/:memberId',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('orgId: string');
      expect(result.code).toContain('teamId: string');
      expect(result.code).toContain('memberId: string');
      expect(result.code).toContain('${orgId}');
      expect(result.code).toContain('${teamId}');
      expect(result.code).toContain('${memberId}');
    });

    it('should handle paths with hyphens', () => {
      const manifest = createManifest({
        path: '/user-profiles/:id',
        method: 'GET',
      });
      const result = generator.generate([manifest], { includeComments: false });

      expect(result.code).toContain('async getUserProfiles(');
    });
  });
});
