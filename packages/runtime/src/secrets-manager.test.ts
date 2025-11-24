/**
 * @module runtime/secrets-manager.test
 * @description Tests for secrets manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecretsManager } from './secrets-manager.js';
import type { SecretProvider } from './types/secrets-manager.js';
import { SecretsManagerError } from './types/secrets-manager.js';

/**
 * Mock secret provider for testing
 */
class MockProvider implements SecretProvider {
  public readonly name: string;
  public callCount = 0;
  private secrets: Map<string, string>;
  private available: boolean;

  constructor(name: string, secrets: Record<string, string> = {}, available = true) {
    this.name = name;
    this.secrets = new Map(Object.entries(secrets));
    this.available = available;
  }

  async getSecret(key: string): Promise<string> {
    this.callCount++;
    const value = this.secrets.get(key);
    if (value === undefined) {
      throw new Error(`Secret not found: ${key}`);
    }
    return value;
  }

  async getSecrets(keys: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    for (const key of keys) {
      try {
        const value = await this.getSecret(key);
        results.set(key, value);
      } catch {
        // Skip missing secrets
      }
    }
    return results;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
  }
}

/**
 * Sleep helper for testing TTL
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SecretsManager', () => {
  describe('Construction', () => {
    it('should create manager with valid config', () => {
      const provider = new MockProvider('test');
      const manager = new SecretsManager({
        providers: [provider],
      });

      expect(manager).toBeDefined();
      expect(manager.getCacheStats().size).toBe(0);
    });

    it('should throw error without providers', () => {
      expect(() => {
        new SecretsManager({ providers: [] });
      }).toThrow('At least one secret provider is required');
    });

    it('should use default configuration', () => {
      const provider = new MockProvider('test');
      const manager = new SecretsManager({
        providers: [provider],
      });

      const stats = manager.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Secret Retrieval', () => {
    it('should retrieve secret from provider', async () => {
      const provider = new MockProvider('test', {
        'api-key': 'secret-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
      });

      const result = await manager.getSecret({ key: 'api-key' });

      expect(result.value).toBe('secret-value');
      expect(result.fromCache).toBe(false);
      expect(result.provider).toBe('test');
      expect(provider.callCount).toBe(1);
    });

    it('should throw error for missing secret', async () => {
      const provider = new MockProvider('test', {});
      const manager = new SecretsManager({
        providers: [provider],
      });

      await expect(manager.getSecret({ key: 'missing' })).rejects.toThrow(
        SecretsManagerError
      );
    });

    it('should retrieve multiple secrets', async () => {
      const provider = new MockProvider('test', {
        'key1': 'value1',
        'key2': 'value2',
        'key3': 'value3',
      });
      const manager = new SecretsManager({
        providers: [provider],
      });

      const results = await manager.getSecrets(['key1', 'key2', 'key3']);

      expect(results.size).toBe(3);
      expect(results.get('key1')?.value).toBe('value1');
      expect(results.get('key2')?.value).toBe('value2');
      expect(results.get('key3')?.value).toBe('value3');
    });

    it('should handle partial failures in batch retrieval', async () => {
      const provider = new MockProvider('test', {
        'key1': 'value1',
        'key3': 'value3',
      });
      const manager = new SecretsManager({
        providers: [provider],
      });

      const results = await manager.getSecrets(['key1', 'key2', 'key3']);

      expect(results.size).toBe(2);
      expect(results.get('key1')?.value).toBe('value1');
      expect(results.get('key2')).toBeUndefined();
      expect(results.get('key3')?.value).toBe('value3');
    });
  });

  describe('Property 29: Secrets Caching', () => {
    it('should cache secrets with TTL', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 1000,
      });

      // First retrieval - should hit provider
      const result1 = await manager.getSecret({ key: 'test-key' });
      expect(result1.fromCache).toBe(false);
      expect(provider.callCount).toBe(1);

      // Second retrieval within TTL - should hit cache
      const result2 = await manager.getSecret({ key: 'test-key' });
      expect(result2.fromCache).toBe(true);
      expect(result2.value).toBe('test-value');
      expect(provider.callCount).toBe(1);

      // Verify cache stats
      const stats = manager.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
    });

    it('should refresh secret after TTL expires', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 100,
        minTtl: 50, // Lower minTtl to allow short TTL
      });

      // First retrieval
      await manager.getSecret({ key: 'test-key' });
      expect(provider.callCount).toBe(1);

      // Wait for TTL to expire
      await sleep(150);

      // Should fetch from provider again
      const result = await manager.getSecret({ key: 'test-key' });
      expect(result.fromCache).toBe(false);
      expect(provider.callCount).toBe(2);
    });

    it('should respect custom TTL per request', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 5000,
        minTtl: 50, // Lower minTtl to allow short TTL
      });

      // Retrieve with custom short TTL
      await manager.getSecret({ key: 'test-key', ttl: 100 });

      // Should be cached
      const result1 = await manager.getSecret({ key: 'test-key' });
      expect(result1.fromCache).toBe(true);

      // Wait for custom TTL to expire
      await sleep(150);

      // Should fetch from provider
      const result2 = await manager.getSecret({ key: 'test-key' });
      expect(result2.fromCache).toBe(false);
    });

    it('should enforce minimum TTL', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        minTtl: 1000,
        defaultTtl: 5000,
      });

      const result = await manager.getSecret({ key: 'test-key', ttl: 100 });

      // Should use minTtl instead of requested 100ms
      const expiresIn = result.expiresAt - Date.now();
      expect(expiresIn).toBeGreaterThanOrEqual(900); // Allow some timing variance
    });

    it('should enforce maximum TTL', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        maxTtl: 1000,
        defaultTtl: 500,
        minTtl: 100,
      });

      const result = await manager.getSecret({ key: 'test-key', ttl: 5000 });

      // Should use maxTtl instead of requested 5000ms
      const expiresIn = result.expiresAt - Date.now();
      expect(expiresIn).toBeLessThanOrEqual(1050); // Allow some timing variance
      expect(expiresIn).toBeGreaterThanOrEqual(900); // Should be close to 1000ms
    });

    it('should force refresh when requested', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 5000,
      });

      // First retrieval
      await manager.getSecret({ key: 'test-key' });
      expect(provider.callCount).toBe(1);

      // Force refresh
      const result = await manager.getSecret({
        key: 'test-key',
        forceRefresh: true,
      });
      expect(result.fromCache).toBe(false);
      expect(provider.callCount).toBe(2);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate specific secret', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 5000,
      });

      // Cache the secret
      await manager.getSecret({ key: 'test-key' });
      expect(provider.callCount).toBe(1);

      // Invalidate
      manager.invalidate('test-key');

      // Should fetch from provider again
      const result = await manager.getSecret({ key: 'test-key' });
      expect(result.fromCache).toBe(false);
      expect(provider.callCount).toBe(2);
    });

    it('should clear all cached secrets', async () => {
      const provider = new MockProvider('test', {
        'key1': 'value1',
        'key2': 'value2',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 5000,
      });

      // Cache multiple secrets
      await manager.getSecret({ key: 'key1' });
      await manager.getSecret({ key: 'key2' });
      expect(manager.getCacheStats().size).toBe(2);

      // Clear cache
      manager.clearCache();
      expect(manager.getCacheStats().size).toBe(0);

      // Should fetch from provider again
      const result = await manager.getSecret({ key: 'key1' });
      expect(result.fromCache).toBe(false);
    });

    it('should track cache statistics', async () => {
      const provider = new MockProvider('test', {
        'key1': 'value1',
        'key2': 'value2',
      });
      const manager = new SecretsManager({
        providers: [provider],
        defaultTtl: 5000,
      });

      // Initial stats
      let stats = manager.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);

      // First retrieval - miss
      await manager.getSecret({ key: 'key1' });
      stats = manager.getCacheStats();
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);

      // Second retrieval - hit
      await manager.getSecret({ key: 'key1' });
      stats = manager.getCacheStats();
      expect(stats.hits).toBe(1);

      // Different key - miss
      await manager.getSecret({ key: 'key2' });
      stats = manager.getCacheStats();
      expect(stats.misses).toBe(2);
      expect(stats.size).toBe(2);
    });
  });

  describe('Provider Fallback', () => {
    it('should fallback to next provider on failure', async () => {
      const provider1 = new MockProvider('provider1', {});
      const provider2 = new MockProvider('provider2', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider1, provider2],
      });

      const result = await manager.getSecret({ key: 'test-key' });

      expect(result.value).toBe('test-value');
      expect(result.provider).toBe('provider2');
      expect(provider1.callCount).toBe(1);
      expect(provider2.callCount).toBe(1);
    });

    it('should skip unavailable providers', async () => {
      const provider1 = new MockProvider('provider1', {
        'test-key': 'value1',
      });
      provider1.setAvailable(false);

      const provider2 = new MockProvider('provider2', {
        'test-key': 'value2',
      });

      const manager = new SecretsManager({
        providers: [provider1, provider2],
      });

      const result = await manager.getSecret({ key: 'test-key' });

      expect(result.value).toBe('value2');
      expect(result.provider).toBe('provider2');
      expect(provider1.callCount).toBe(0);
      expect(provider2.callCount).toBe(1);
    });

    it('should throw error when all providers fail', async () => {
      const provider1 = new MockProvider('provider1', {});
      const provider2 = new MockProvider('provider2', {});
      const manager = new SecretsManager({
        providers: [provider1, provider2],
      });

      await expect(manager.getSecret({ key: 'missing' })).rejects.toThrow(
        SecretsManagerError
      );
    });
  });

  describe('Property 41: Secrets Manager Access Control', () => {
    it('should only allow access via manager interface', () => {
      const provider = new MockProvider('test');
      const manager = new SecretsManager({
        providers: [provider],
      });

      // Should expose public interface methods
      expect(typeof manager.getSecret).toBe('function');
      expect(typeof manager.getSecrets).toBe('function');
      expect(typeof manager.hasSecret).toBe('function');
      expect(typeof manager.invalidate).toBe('function');
      expect(typeof manager.clearCache).toBe('function');
      expect(typeof manager.getCacheStats).toBe('function');
      expect(typeof manager.getAuditLog).toBe('function');
      
      // Internal cache exists but is private
      expect((manager as any).cache).toBeDefined();
    });

    it('should audit all secret access attempts', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        auditLogging: true,
      });

      await manager.getSecret({
        key: 'test-key',
        requestId: 'req-123',
        handlerId: 'handler-456',
      });

      const auditLog = manager.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0]).toMatchObject({
        key: 'test-key',
        requestId: 'req-123',
        handlerId: 'handler-456',
        success: true,
        fromCache: false,
        provider: 'test',
      });
    });

    it('should audit cache hits', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        auditLogging: true,
      });

      // First access
      await manager.getSecret({ key: 'test-key' });

      // Second access (cache hit)
      await manager.getSecret({ key: 'test-key', requestId: 'req-456' });

      const auditLog = manager.getAuditLog();
      expect(auditLog).toHaveLength(2);
      expect(auditLog[1]).toMatchObject({
        key: 'test-key',
        requestId: 'req-456',
        success: true,
        fromCache: true,
        provider: 'cache',
      });
    });

    it('should audit failed access attempts', async () => {
      const provider = new MockProvider('test', {});
      const manager = new SecretsManager({
        providers: [provider],
        auditLogging: true,
      });

      await expect(
        manager.getSecret({ key: 'missing', requestId: 'req-789' })
      ).rejects.toThrow();

      const auditLog = manager.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0]).toMatchObject({
        key: 'missing',
        requestId: 'req-789',
        success: false,
        fromCache: false,
      });
      expect(auditLog[0].error).toBeDefined();
    });

    it('should prevent direct secret value exposure in logs', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'super-secret-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        auditLogging: true,
      });

      await manager.getSecret({ key: 'test-key' });

      const auditLog = manager.getAuditLog();
      const logEntry = auditLog[0];

      // Should not contain the actual secret value
      expect(JSON.stringify(logEntry)).not.toContain('super-secret-value');
      expect(logEntry).not.toHaveProperty('value');
    });

    it('should limit audit log size', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        auditLogging: true,
      });

      // Generate more than 1000 log entries
      for (let i = 0; i < 1100; i++) {
        manager.invalidate('test-key'); // Force cache miss
        await manager.getSecret({ key: 'test-key' });
      }

      const auditLog = manager.getAuditLog();
      expect(auditLog.length).toBeLessThanOrEqual(1000);
    });

    it('should disable audit logging when configured', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        auditLogging: false,
      });

      await manager.getSecret({ key: 'test-key' });

      const auditLog = manager.getAuditLog();
      expect(auditLog).toHaveLength(0);
    });
  });

  describe('hasSecret', () => {
    it('should return true for cached secret', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
      });

      await manager.getSecret({ key: 'test-key' });

      const exists = await manager.hasSecret('test-key');
      expect(exists).toBe(true);
    });

    it('should return true for secret in provider', async () => {
      const provider = new MockProvider('test', {
        'test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
      });

      const exists = await manager.hasSecret('test-key');
      expect(exists).toBe(true);
    });

    it('should return false for missing secret', async () => {
      const provider = new MockProvider('test', {});
      const manager = new SecretsManager({
        providers: [provider],
      });

      const exists = await manager.hasSecret('missing');
      expect(exists).toBe(false);
    });
  });

  describe('Key Prefix', () => {
    it('should apply key prefix to all operations', async () => {
      const provider = new MockProvider('test', {
        'app_test-key': 'test-value',
      });
      const manager = new SecretsManager({
        providers: [provider],
        keyPrefix: 'app_',
      });

      const result = await manager.getSecret({ key: 'test-key' });
      expect(result.value).toBe('test-value');
    });
  });
});
