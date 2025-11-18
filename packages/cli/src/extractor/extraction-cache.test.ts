/**
 * @file extraction-cache.test.ts
 * @description Tests for ExtractionCache with pattern-matched temp directory cleanup
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resolve } from 'path';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { ExtractionCache } from './extraction-cache';
import type { CacheEntry } from './types';

describe('ExtractionCache', () => {
  const cacheBaseDir = resolve(__dirname, '__fixtures__', '.cache-test');
  let cacheDir: string;
  let cache: ExtractionCache;

  beforeEach(() => {
    // Create unique temp directory for each test
    cacheDir = resolve(cacheBaseDir, `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(cacheDir, { recursive: true });
    cache = new ExtractionCache(cacheDir);
  });

  afterAll(async () => {
    // Pattern-matched cleanup: remove only temp-* directories
    const { glob } = await import('glob');
    const tempDirs = await glob('temp-*', { cwd: cacheBaseDir, absolute: true });
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('Cache Operations', () => {
    it('should return null for cache miss', { timeout: 5000 }, () => {
      const result = cache.get('nonexistent.ts', 'MyType');
      expect(result).toBeNull();
    });

    it('should return cached entry on cache hit', { timeout: 5000 }, () => {
      const testFile = resolve(cacheDir, 'test.ts');
      writeFileSync(testFile, 'export type Test = string;', 'utf-8');

      const entry: CacheEntry = {
        filePath: testFile,
        typeName: 'Test',
        contentHash: require('crypto').createHash('sha256').update('export type Test = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 100, extractedAt: Date.now() },
      };

      cache.set(entry);
      const result = cache.get(testFile, 'Test');

      expect(result).toEqual(entry);
    });

    it('should invalidate cache when file content changes', { timeout: 5000 }, () => {
      const testFile = resolve(cacheDir, 'test.ts');
      writeFileSync(testFile, 'export type Test = string;', 'utf-8');

      const entry: CacheEntry = {
        filePath: testFile,
        typeName: 'Test',
        contentHash: require('crypto').createHash('sha256').update('export type Test = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 100, extractedAt: Date.now() },
      };

      cache.set(entry);

      // Change file content
      writeFileSync(testFile, 'export type Test = number;', 'utf-8');

      const result = cache.get(testFile, 'Test');
      expect(result).toBeNull(); // Cache miss due to content change
    });

    it('should handle multiple cache entries', { timeout: 5000 }, () => {
      const file1 = resolve(cacheDir, 'file1.ts');
      const file2 = resolve(cacheDir, 'file2.ts');
      writeFileSync(file1, 'export type A = string;', 'utf-8');
      writeFileSync(file2, 'export type B = number;', 'utf-8');

      const entry1: CacheEntry = {
        filePath: file1,
        typeName: 'A',
        contentHash: require('crypto').createHash('sha256').update('export type A = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 50, extractedAt: Date.now() },
      };

      const entry2: CacheEntry = {
        filePath: file2,
        typeName: 'B',
        contentHash: require('crypto').createHash('sha256').update('export type B = number;').digest('hex'),
        schema: { version: '1.0', type: 'number' },
        metadata: { maxDepth: 0, sizeBytes: 50, extractedAt: Date.now() },
      };

      cache.set(entry1);
      cache.set(entry2);

      expect(cache.get(file1, 'A')).toEqual(entry1);
      expect(cache.get(file2, 'B')).toEqual(entry2);
    });
  });

  describe('Invalidation', () => {
    it('should invalidate entries for specific file', { timeout: 5000 }, () => {
      const file1 = resolve(cacheDir, 'file1.ts');
      writeFileSync(file1, 'export type A = string; export type B = number;', 'utf-8');

      const hash = require('crypto').createHash('sha256').update('export type A = string; export type B = number;').digest('hex');

      const entry1: CacheEntry = {
        filePath: file1,
        typeName: 'A',
        contentHash: hash,
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 50, extractedAt: Date.now() },
      };

      const entry2: CacheEntry = {
        filePath: file1,
        typeName: 'B',
        contentHash: hash,
        schema: { version: '1.0', type: 'number' },
        metadata: { maxDepth: 0, sizeBytes: 50, extractedAt: Date.now() },
      };

      cache.set(entry1);
      cache.set(entry2);

      cache.invalidateFile(file1);

      expect(cache.get(file1, 'A')).toBeNull();
      expect(cache.get(file1, 'B')).toBeNull();
    });

    it('should clear all cache entries', { timeout: 5000 }, () => {
      const file1 = resolve(cacheDir, 'file1.ts');
      const file2 = resolve(cacheDir, 'file2.ts');
      writeFileSync(file1, 'export type A = string;', 'utf-8');
      writeFileSync(file2, 'export type B = number;', 'utf-8');

      const entry1: CacheEntry = {
        filePath: file1,
        typeName: 'A',
        contentHash: require('crypto').createHash('sha256').update('export type A = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 50, extractedAt: Date.now() },
      };

      const entry2: CacheEntry = {
        filePath: file2,
        typeName: 'B',
        contentHash: require('crypto').createHash('sha256').update('export type B = number;').digest('hex'),
        schema: { version: '1.0', type: 'number' },
        metadata: { maxDepth: 0, sizeBytes: 50, extractedAt: Date.now() },
      };

      cache.set(entry1);
      cache.set(entry2);

      cache.clear();

      expect(cache.get(file1, 'A')).toBeNull();
      expect(cache.get(file2, 'B')).toBeNull();
    });
  });

  describe('Persistence', () => {
    it('should persist cache to disk and reload', { timeout: 5000 }, () => {
      const testFile = resolve(cacheDir, 'test.ts');
      writeFileSync(testFile, 'export type Test = string;', 'utf-8');

      const entry: CacheEntry = {
        filePath: testFile,
        typeName: 'Test',
        contentHash: require('crypto').createHash('sha256').update('export type Test = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 100, extractedAt: Date.now() },
      };

      cache.set(entry);

      // Create new cache instance (should load from disk)
      const newCache = new ExtractionCache(cacheDir);
      const result = newCache.get(testFile, 'Test');

      expect(result).toEqual(entry);
    });

    it('should handle missing cache file gracefully', { timeout: 5000 }, () => {
      const newCacheDir = resolve(cacheBaseDir, `temp-${Date.now()}-new`);
      const newCache = new ExtractionCache(newCacheDir);

      expect(newCache.get('any.ts', 'Any')).toBeNull();
    });

    it('should handle corrupted cache file gracefully', { timeout: 5000 }, () => {
      const corruptedCacheDir = resolve(cacheBaseDir, `temp-${Date.now()}-corrupted`);
      mkdirSync(corruptedCacheDir, { recursive: true });
      writeFileSync(resolve(corruptedCacheDir, 'extraction-cache.json'), 'invalid json{', 'utf-8');

      const newCache = new ExtractionCache(corruptedCacheDir);
      expect(newCache.get('any.ts', 'Any')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics for empty cache', { timeout: 5000 }, () => {
      const stats = cache.getStats();
      expect(stats.total).toBe(0);
      expect(stats.sizeBytes).toBe(0);
    });

    it('should return correct statistics for populated cache', { timeout: 5000 }, () => {
      const file1 = resolve(cacheDir, 'file1.ts');
      writeFileSync(file1, 'export type A = string;', 'utf-8');

      const entry: CacheEntry = {
        filePath: file1,
        typeName: 'A',
        contentHash: require('crypto').createHash('sha256').update('export type A = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 150, extractedAt: Date.now() },
      };

      cache.set(entry);

      const stats = cache.getStats();
      expect(stats.total).toBe(1);
      expect(stats.sizeBytes).toBe(150);
    });

    it('should update statistics after invalidation', { timeout: 5000 }, () => {
      const file1 = resolve(cacheDir, 'file1.ts');
      const file2 = resolve(cacheDir, 'file2.ts');
      writeFileSync(file1, 'export type A = string;', 'utf-8');
      writeFileSync(file2, 'export type B = number;', 'utf-8');

      const entry1: CacheEntry = {
        filePath: file1,
        typeName: 'A',
        contentHash: require('crypto').createHash('sha256').update('export type A = string;').digest('hex'),
        schema: { version: '1.0', type: 'string' },
        metadata: { maxDepth: 0, sizeBytes: 100, extractedAt: Date.now() },
      };

      const entry2: CacheEntry = {
        filePath: file2,
        typeName: 'B',
        contentHash: require('crypto').createHash('sha256').update('export type B = number;').digest('hex'),
        schema: { version: '1.0', type: 'number' },
        metadata: { maxDepth: 0, sizeBytes: 100, extractedAt: Date.now() },
      };

      cache.set(entry1);
      cache.set(entry2);

      let stats = cache.getStats();
      expect(stats.total).toBe(2);
      expect(stats.sizeBytes).toBe(200);

      cache.invalidateFile(file1);

      stats = cache.getStats();
      expect(stats.total).toBe(1);
      expect(stats.sizeBytes).toBe(100);
    });
  });
});
