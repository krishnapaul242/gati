/**
 * @module cli/extractor/extraction-cache
 * @description File-level caching for incremental type extraction
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CacheEntry } from './types.js';

/**
 * Compute SHA-256 hash of file content
 */
function computeFileHash(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Cache manager for extracted types
 */
export class ExtractionCache {
  private cacheDir: string;
  private entries: Map<string, CacheEntry>;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
    this.entries = new Map();
    this.load();
  }

  /**
   * Load cache from disk
   */
  private load(): void {
    const cacheFile = join(this.cacheDir, 'extraction-cache.json');
    
    if (!existsSync(cacheFile)) {
      return;
    }

    try {
      const data = readFileSync(cacheFile, 'utf-8');
      const parsed = JSON.parse(data) as { entries: CacheEntry[] };
      
      for (const entry of parsed.entries) {
        const key = this.getCacheKey(entry.filePath, entry.typeName);
        this.entries.set(key, entry);
      }
    } catch (error) {
      // Ignore cache load errors (corrupted cache)
      console.warn('Failed to load extraction cache:', error);
    }
  }

  /**
   * Save cache to disk
   */
  private save(): void {
    const cacheFile = join(this.cacheDir, 'extraction-cache.json');
    
    // Ensure cache directory exists
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }

    try {
      const data = {
        version: '1.0',
        entries: Array.from(this.entries.values()),
      };
      
      writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save extraction cache:', error);
    }
  }

  /**
   * Get cache key for file and type
   */
  private getCacheKey(filePath: string, typeName: string): string {
    return `${filePath}::${typeName}`;
  }

  /**
   * Get cached entry if file hasn't changed
   */
  get(filePath: string, typeName: string): CacheEntry | null {
    const key = this.getCacheKey(filePath, typeName);
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    // Verify file hasn't changed
    const currentHash = computeFileHash(filePath);
    if (currentHash !== entry.contentHash) {
      // File changed, invalidate cache
      this.entries.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set cache entry
   */
  set(entry: CacheEntry): void {
    const key = this.getCacheKey(entry.filePath, entry.typeName);
    this.entries.set(key, entry);
    this.save();
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.entries.clear();
    this.save();
  }

  /**
   * Invalidate entries for a specific file
   */
  invalidateFile(filePath: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.entries) {
      if (entry.filePath === filePath) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.entries.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.save();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; sizeBytes: number } {
    let sizeBytes = 0;
    
    for (const entry of this.entries.values()) {
      sizeBytes += entry.metadata.sizeBytes;
    }

    return {
      total: this.entries.size,
      sizeBytes,
    };
  }
}
