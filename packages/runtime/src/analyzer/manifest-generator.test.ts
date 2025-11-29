import { describe, it, expect } from 'vitest';
import { generateManifestFromSource } from './manifest-generator.js';

describe('ManifestGenerator', () => {
  it('should generate manifest from simple module', () => {
    const source = `
      export function getUserById(id: string): Promise<User> {
        return db.users.findById(id);
      }
      
      export function createUser(data: UserInput): Promise<User> {
        return db.users.create(data);
      }
    `;

    const manifest = generateManifestFromSource(source, 'test.ts', {
      moduleId: 'user-service',
      version: '1.0.0',
      runtime: 'node'
    });

    expect(manifest.moduleId).toBe('user-service');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.runtime).toBe('node');
    expect(manifest.methods).toHaveLength(2);
    expect(manifest.methods[0].name).toBe('getUserById');
    expect(manifest.methods[1].name).toBe('createUser');
    expect(manifest.hash).toBeTruthy();
  });

  it('should extract JSDoc comments', () => {
    const source = `
      /**
       * Get user by ID
       */
      export function getUserById(id: string): Promise<User> {
        return db.users.findById(id);
      }
    `;

    const manifest = generateManifestFromSource(source, 'test.ts');
    expect(manifest.methods[0].description).toContain('Get user by ID');
  });

  it('should handle modules with no exports', () => {
    const source = `
      function privateFunction() {
        return 'private';
      }
    `;

    const manifest = generateManifestFromSource(source, 'test.ts');
    expect(manifest.methods).toHaveLength(0);
  });

  it('should generate consistent hash', () => {
    const source = `export function test() {}`;
    const manifest1 = generateManifestFromSource(source, 'test.ts', { moduleId: 'test', version: '1.0.0' });
    const manifest2 = generateManifestFromSource(source, 'test.ts', { moduleId: 'test', version: '1.0.0' });
    expect(manifest1.hash).toBe(manifest2.hash);
  });
});
