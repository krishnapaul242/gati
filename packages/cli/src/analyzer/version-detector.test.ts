/**
 * @module cli/analyzer/version-detector.test
 * @description Tests for automatic version detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmdirSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { VersionDetector } from './version-detector';

describe('VersionDetector', () => {
  const testDir = resolve(__dirname, '.test-version-detector');
  let detector: VersionDetector;

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    detector = new VersionDetector(testDir, true);
  });

  afterEach(() => {
    // Clean up
    const registryPath = resolve(testDir, '.gati', 'timescape', 'registry.json');
    if (existsSync(registryPath)) {
      unlinkSync(registryPath);
    }
    
    const timescapeDir = resolve(testDir, '.gati', 'timescape');
    if (existsSync(timescapeDir)) {
      rmdirSync(timescapeDir);
    }
    
    const gatiDir = resolve(testDir, '.gati');
    if (existsSync(gatiDir)) {
      rmdirSync(gatiDir);
    }
    
    if (existsSync(testDir)) {
      rmdirSync(testDir);
    }
  });

  describe('Version Detection', () => {
    it('should create initial version for new handler', async () => {
      const handlerCode = `
        export interface UserRequest {
          id: string;
          name: string;
        }

        export interface UserResponse {
          id: string;
          name: string;
          email: string;
        }

        export async function getUser(req: UserRequest): Promise<UserResponse> {
          return { id: req.id, name: req.name, email: 'test@example.com' };
        }
      `;

      const change = await detector.detectChange('/api/users', handlerCode);

      expect(change).toBeDefined();
      expect(change?.handlerPath).toBe('/api/users');
      expect(change?.oldVersion).toBeUndefined();
      expect(change?.newVersion).toMatch(/^tsv:\d+-api-users-001$/);
      expect(change?.breaking).toBe(false);
      expect(change?.changes).toContain('Initial version created');
    });

    it('should not create version if schema unchanged', async () => {
      const handlerCode = `
        export interface UserRequest {
          id: string;
        }

        export interface UserResponse {
          name: string;
        }
      `;

      // First change
      const change1 = await detector.detectChange('/api/users', handlerCode);
      expect(change1).toBeDefined();

      // Same code again
      const change2 = await detector.detectChange('/api/users', handlerCode);
      expect(change2).toBeNull();
    });

    it('should detect non-breaking change (added optional field)', async () => {
      const handlerCodeV1 = `
        export interface UserResponse {
          id: string;
          name: string;
        }
      `;

      const handlerCodeV2 = `
        export interface UserResponse {
          id: string;
          name: string;
          email?: string;
        }
      `;

      // Create V1
      const change1 = await detector.detectChange('/api/users', handlerCodeV1);
      expect(change1).toBeDefined();

      // Create V2
      const change2 = await detector.detectChange('/api/users', handlerCodeV2);
      expect(change2).toBeDefined();
      expect(change2?.breaking).toBe(false);
      expect(change2?.oldVersion).toBe(change1?.newVersion);
    });

    it('should detect breaking change (removed field)', async () => {
      const handlerCodeV1 = `
        export interface UserResponse {
          id: string;
          name: string;
          email: string;
        }
      `;

      const handlerCodeV2 = `
        export interface UserResponse {
          id: string;
          name: string;
        }
      `;

      // Create V1
      const change1 = await detector.detectChange('/api/users', handlerCodeV1);
      expect(change1).toBeDefined();

      // Create V2 (breaking)
      const change2 = await detector.detectChange('/api/users', handlerCodeV2);
      expect(change2).toBeDefined();
      expect(change2?.breaking).toBe(true);
      expect(change2?.changes.some(c => c.includes('BREAKING'))).toBe(true);
    });

    it('should detect breaking change (type changed)', async () => {
      const handlerCodeV1 = `
        export interface ProductResponse {
          id: string;
          price: string;
        }
      `;

      const handlerCodeV2 = `
        export interface ProductResponse {
          id: string;
          price: number;
        }
      `;

      // Create V1
      const change1 = await detector.detectChange('/api/products', handlerCodeV1);
      expect(change1).toBeDefined();

      // Create V2 (breaking - type changed)
      const change2 = await detector.detectChange('/api/products', handlerCodeV2);
      expect(change2).toBeDefined();
      expect(change2?.breaking).toBe(true);
    });

    it('should handle multiple handlers independently', async () => {
      const usersCode = `
        export interface UserResponse {
          id: string;
          name: string;
        }
      `;

      const productsCode = `
        export interface ProductResponse {
          id: string;
          name: string;
          price: number;
        }
      `;

      const change1 = await detector.detectChange('/api/users', usersCode);
      const change2 = await detector.detectChange('/api/products', productsCode);

      expect(change1).toBeDefined();
      expect(change2).toBeDefined();
      expect(change1?.handlerPath).toBe('/api/users');
      expect(change2?.handlerPath).toBe('/api/products');
      expect(change1?.newVersion).not.toBe(change2?.newVersion);
    });

    it('should increment version numbers correctly', async () => {
      const codeV1 = `export interface Response { id: string; }`;
      const codeV2 = `export interface Response { id: string; name: string; }`;
      const codeV3 = `export interface Response { id: string; name: string; email: string; }`;

      const change1 = await detector.detectChange('/api/test', codeV1);
      const change2 = await detector.detectChange('/api/test', codeV2);
      const change3 = await detector.detectChange('/api/test', codeV3);

      expect(change1?.newVersion).toMatch(/-001$/);
      expect(change2?.newVersion).toMatch(/-002$/);
      expect(change3?.newVersion).toMatch(/-003$/);
    });
  });

  describe('Schema Extraction', () => {
    it('should extract request and response schemas', async () => {
      const handlerCode = `
        export interface CreateUserRequest {
          name: string;
          email: string;
        }

        export interface CreateUserResponse {
          id: string;
          name: string;
          email: string;
          createdAt: string;
        }
      `;

      const change = await detector.detectChange('/api/users', handlerCode);
      expect(change).toBeDefined();
      
      const registry = detector.getRegistry();
      const versions = registry.getVersions('/api/users');
      expect(versions).toHaveLength(1);
      expect(versions[0].schema).toBeDefined();
      expect(versions[0].schema?.request).toBeDefined();
      expect(versions[0].schema?.response).toBeDefined();
    });

    it('should handle handlers without interfaces', async () => {
      const handlerCode = `
        export async function getUser(id: string) {
          return { id, name: 'Test' };
        }
      `;

      const change = await detector.detectChange('/api/users', handlerCode);
      expect(change).toBeNull(); // No schema found
    });

    it('should handle optional fields correctly', async () => {
      const handlerCode = `
        export interface UserResponse {
          id: string;
          name: string;
          email?: string;
          phone?: string;
        }
      `;

      const change = await detector.detectChange('/api/users', handlerCode);
      expect(change).toBeDefined();
      
      const registry = detector.getRegistry();
      const versions = registry.getVersions('/api/users');
      const schema = versions[0].schema;
      
      expect(schema?.response.email.required).toBe(false);
      expect(schema?.response.phone.required).toBe(false);
      expect(schema?.response.id.required).toBe(true);
      expect(schema?.response.name.required).toBe(true);
    });
  });

  describe('Registry Integration', () => {
    it('should persist registry to disk', async () => {
      const handlerCode = `
        export interface UserResponse {
          id: string;
          name: string;
        }
      `;

      await detector.detectChange('/api/users', handlerCode);

      const registryPath = resolve(testDir, '.gati', 'timescape', 'registry.json');
      expect(existsSync(registryPath)).toBe(true);
    });

    it('should load existing registry on initialization', async () => {
      const handlerCode = `
        export interface UserResponse {
          id: string;
          name: string;
        }
      `;

      // Create version with first detector
      await detector.detectChange('/api/users', handlerCode);

      // Create new detector (should load existing registry)
      const detector2 = new VersionDetector(testDir, true);
      const registry = detector2.getRegistry();
      const versions = registry.getVersions('/api/users');

      expect(versions).toHaveLength(1);
    });
  });

  describe('Disabled Versioning', () => {
    it('should not create versions when disabled', async () => {
      const disabledDetector = new VersionDetector(testDir, false);
      
      const handlerCode = `
        export interface UserResponse {
          id: string;
          name: string;
        }
      `;

      const change = await disabledDetector.detectChange('/api/users', handlerCode);
      expect(change).toBeNull();
    });

    it('should report disabled status', () => {
      const disabledDetector = new VersionDetector(testDir, false);
      expect(disabledDetector.isEnabled()).toBe(false);
      
      expect(detector.isEnabled()).toBe(true);
    });
  });
});
