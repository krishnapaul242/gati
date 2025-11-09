/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discoverHandlers, loadHandlers } from './loader';
import type { GatiApp } from './app-core';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('loader', () => {
  let testDir: string;
  let mockApp: GatiApp;

  beforeEach(() => {
    // Create temporary test directory
    testDir = join(tmpdir(), `gati-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create mock app with spy methods
    mockApp = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as GatiApp;

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test directory
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('discoverHandlers', () => {
    it('should discover TypeScript files in flat directory', async () => {
      // Arrange
      writeFileSync(join(testDir, 'hello.ts'), 'export const handler = () => {}');
      writeFileSync(join(testDir, 'world.ts'), 'export const handler = () => {}');
      writeFileSync(join(testDir, 'README.md'), '# Docs'); // Should be ignored

      // Act
      const handlers = await discoverHandlers(testDir);

      // Assert
      expect(handlers).toHaveLength(2);
      expect(handlers).toContain(join(testDir, 'hello.ts'));
      expect(handlers).toContain(join(testDir, 'world.ts'));
      expect(handlers).not.toContain(join(testDir, 'README.md'));
    });

    it('should discover handlers in nested directories', async () => {
      // Arrange
      const usersDir = join(testDir, 'users');
      const postsDir = join(testDir, 'posts');
      mkdirSync(usersDir);
      mkdirSync(postsDir);

      writeFileSync(join(testDir, 'hello.ts'), 'export const handler = () => {}');
      writeFileSync(join(usersDir, 'create.ts'), 'export const handler = () => {}');
      writeFileSync(join(usersDir, 'list.ts'), 'export const handler = () => {}');
      writeFileSync(join(postsDir, 'delete.ts'), 'export const handler = () => {}');

      // Act
      const handlers = await discoverHandlers(testDir);

      // Assert
      expect(handlers).toHaveLength(4);
      expect(handlers).toContain(join(testDir, 'hello.ts'));
      expect(handlers).toContain(join(usersDir, 'create.ts'));
      expect(handlers).toContain(join(usersDir, 'list.ts'));
      expect(handlers).toContain(join(postsDir, 'delete.ts'));
    });

    it('should handle empty directory', async () => {
      // Act
      const handlers = await discoverHandlers(testDir);

      // Assert
      expect(handlers).toHaveLength(0);
    });

    it('should handle nonexistent directory gracefully', async () => {
      // Arrange
      const nonexistent = join(testDir, 'does-not-exist');

      // Act
      const handlers = await discoverHandlers(nonexistent);

      // Assert
      expect(handlers).toHaveLength(0);
    });

    it('should discover JavaScript files', async () => {
      // Arrange
      writeFileSync(join(testDir, 'hello.js'), 'exports.handler = () => {}');
      writeFileSync(join(testDir, 'world.mjs'), 'export const handler = () => {}');

      // Act
      const handlers = await discoverHandlers(testDir);

      // Assert
      expect(handlers).toHaveLength(2);
      expect(handlers.some((h) => h.endsWith('.js'))).toBe(true);
      expect(handlers.some((h) => h.endsWith('.mjs'))).toBe(true);
    });
  });

  describe('loadHandlers', () => {
    it('should load and register GET handler by default', async () => {
      // Arrange
      const handlerContent = `
        export const handler = (req, res) => {
          res.json({ message: 'Hello' });
        };
      `;
      writeFileSync(join(testDir, 'hello.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      expect(mockApp.get).toHaveBeenCalledWith('/hello', expect.any(Function));
      expect(mockApp.post).not.toHaveBeenCalled();
    });

    it('should register handler with explicit metadata', async () => {
      // Arrange
      const handlerContent = `
        export const handler = (req, res) => {
          res.json({ message: 'Created' });
        };
        export const metadata = {
          method: 'POST',
          route: '/api/users'
        };
      `;
      writeFileSync(join(testDir, 'create-user.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      expect(mockApp.post).toHaveBeenCalledWith('/api/users', expect.any(Function));
      expect(mockApp.get).not.toHaveBeenCalled();
    });

    it('should infer route from nested file path', async () => {
      // Arrange
      const usersDir = join(testDir, 'users');
      mkdirSync(usersDir);

      const handlerContent = `
        export const handler = (req, res) => {
          res.json({ user: 'created' });
        };
      `;
      writeFileSync(join(usersDir, 'create.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      expect(mockApp.get).toHaveBeenCalledWith('/users/create', expect.any(Function));
    });

    it('should apply basePath option', async () => {
      // Arrange
      const handlerContent = `
        export const handler = (req, res) => {
          res.json({ message: 'Hello' });
        };
      `;
      writeFileSync(join(testDir, 'hello.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir, { basePath: '/api/v1' });

      // Assert
      expect(mockApp.get).toHaveBeenCalledWith('/api/v1/hello', expect.any(Function));
    });

    it('should handle all HTTP methods', async () => {
      // Arrange
      const methods = [
        { method: 'GET', file: 'get-handler.ts' },
        { method: 'POST', file: 'post-handler.ts' },
        { method: 'PUT', file: 'put-handler.ts' },
        { method: 'PATCH', file: 'patch-handler.ts' },
        { method: 'DELETE', file: 'delete-handler.ts' },
      ];

      for (const { method, file } of methods) {
        const content = `
          export const handler = (req, res) => res.json({ ok: true });
          export const metadata = { method: '${method}' };
        `;
        writeFileSync(join(testDir, file), content);
      }

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      expect(mockApp.get).toHaveBeenCalled();
      expect(mockApp.post).toHaveBeenCalled();
      expect(mockApp.put).toHaveBeenCalled();
      expect(mockApp.patch).toHaveBeenCalled();
      expect(mockApp.delete).toHaveBeenCalled();
    });

    it('should skip files without valid handler export', async () => {
      // Arrange
      const invalidContent = `
        export const notAHandler = 'just a string';
      `;
      writeFileSync(join(testDir, 'invalid.ts'), invalidContent);

      // Act & Assert - should not throw
      await expect(loadHandlers(mockApp, testDir)).resolves.not.toThrow();
      expect(mockApp.get).not.toHaveBeenCalled();
    });

    it('should handle default export with handler property', async () => {
      // Arrange
      const handlerContent = `
        export default {
          handler: (req, res) => res.json({ ok: true }),
          metadata: { method: 'POST', route: '/test' }
        };
      `;
      writeFileSync(join(testDir, 'default-export.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      expect(mockApp.post).toHaveBeenCalledWith('/test', expect.any(Function));
    });

    it('should handle default function export', async () => {
      // Arrange
      const handlerContent = `
        export default (req, res) => res.json({ ok: true });
      `;
      writeFileSync(join(testDir, 'default-fn.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      expect(mockApp.get).toHaveBeenCalledWith('/default-fn', expect.any(Function));
    });

    it('should normalize Windows path separators in routes', async () => {
      // Arrange
      const nestedDir = join(testDir, 'api', 'v1', 'users');
      mkdirSync(nestedDir, { recursive: true });

      const handlerContent = `
        export const handler = (req, res) => res.json({ ok: true });
      `;
      writeFileSync(join(nestedDir, 'list.ts'), handlerContent);

      // Act
      await loadHandlers(mockApp, testDir);

      // Assert
      // Should use forward slashes regardless of OS
      expect(mockApp.get).toHaveBeenCalledWith('/api/v1/users/list', expect.any(Function));
    });
  });
});
