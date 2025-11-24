/**
 * @module runtime/secrets-manager
 * @description Secure secrets management with caching and audit logging
 */

import type {
  Secret,
  SecretProvider,
  SecretsManagerConfig,
  SecretAccessRequest,
  SecretAccessResult,
  SecretsManager as ISecretsManager,
  SecretAuditEntry,
} from './types/secrets-manager.js';
import { SecretsManagerError } from './types/secrets-manager.js';

/**
 * Cached secret entry
 */
interface CachedSecret {
  secret: Secret;
  expiresAt: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  maxTtl: 15 * 60 * 1000, // 15 minutes
  minTtl: 60 * 1000, // 1 minute
  auditLogging: true,
  keyPrefix: '',
  autoRefresh: false,
  refreshBuffer: 30 * 1000, // 30 seconds
};

/**
 * Secrets manager implementation
 */
export class SecretsManager implements ISecretsManager {
  private readonly config: Required<SecretsManagerConfig>;
  private readonly cache: Map<string, CachedSecret>;
  private readonly auditLog: SecretAuditEntry[];
  private readonly stats: CacheStats;

  constructor(config: SecretsManagerConfig) {
    if (!config.providers || config.providers.length === 0) {
      throw new Error('At least one secret provider is required');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      providers: config.providers,
    };

    this.cache = new Map();
    this.auditLog = [];
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get a single secret
   */
  async getSecret(request: SecretAccessRequest): Promise<SecretAccessResult> {
    const key = this.config.keyPrefix + request.key;
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!request.forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > now) {
        this.stats.hits++;
        this.logAccess({
          timestamp: now,
          key: request.key,
          requestId: request.requestId,
          handlerId: request.handlerId,
          success: true,
          provider: 'cache',
          fromCache: true,
        });

        return {
          value: cached.secret.value,
          fromCache: true,
          provider: 'cache',
          version: cached.secret.version,
          expiresAt: cached.expiresAt,
        };
      }

      // Remove expired entry
      if (cached) {
        this.cache.delete(key);
        this.stats.evictions++;
      }
    }

    // Cache miss - fetch from providers
    this.stats.misses++;

    try {
      const { value, provider, version } = await this.fetchFromProviders(key);

      // Calculate TTL
      const ttl = this.calculateTtl(request.ttl);
      const expiresAt = now + ttl;

      // Cache the secret
      const secret: Secret = {
        key: request.key,
        value,
        version,
        retrievedAt: now,
        expiresAt,
      };

      this.cache.set(key, { secret, expiresAt });
      this.stats.size = this.cache.size;

      this.logAccess({
        timestamp: now,
        key: request.key,
        requestId: request.requestId,
        handlerId: request.handlerId,
        success: true,
        provider,
        fromCache: false,
      });

      return {
        value,
        fromCache: false,
        provider,
        version,
        expiresAt,
      };
    } catch (error) {
      this.logAccess({
        timestamp: now,
        key: request.key,
        requestId: request.requestId,
        handlerId: request.handlerId,
        success: false,
        fromCache: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new SecretsManagerError(
        `Failed to retrieve secret: ${request.key}`,
        request.key,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get multiple secrets
   */
  async getSecrets(
    keys: string[],
    context?: {
      requestId?: string;
      handlerId?: string;
    }
  ): Promise<Map<string, SecretAccessResult>> {
    const results = new Map<string, SecretAccessResult>();

    // Fetch secrets in parallel
    await Promise.all(
      keys.map(async (key) => {
        try {
          const result = await this.getSecret({
            key,
            requestId: context?.requestId,
            handlerId: context?.handlerId,
          });
          results.set(key, result);
        } catch (error) {
          // Individual failures don't stop the batch
          // Error is already logged in getSecret
        }
      })
    );

    return results;
  }

  /**
   * Check if a secret exists
   */
  async hasSecret(key: string): Promise<boolean> {
    const fullKey = this.config.keyPrefix + key;

    // Check cache first
    const cached = this.cache.get(fullKey);
    if (cached && cached.expiresAt > Date.now()) {
      return true;
    }

    // Try to fetch from providers
    try {
      await this.fetchFromProviders(fullKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate cached secret
   */
  invalidate(key: string): void {
    const fullKey = this.config.keyPrefix + key;
    if (this.cache.delete(fullKey)) {
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Clear all cached secrets
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get audit log entries
   */
  getAuditLog(): SecretAuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Fetch secret from providers (fallback chain)
   */
  private async fetchFromProviders(
    key: string
  ): Promise<{ value: string; provider: string; version?: string }> {
    const errors: Error[] = [];

    for (const provider of this.config.providers) {
      try {
        // Check if provider is available
        const available = await provider.isAvailable();
        if (!available) {
          continue;
        }

        // Try to get secret
        const value = await provider.getSecret(key);
        return {
          value,
          provider: provider.name,
          version: undefined, // Version support depends on provider
        };
      } catch (error) {
        errors.push(
          error instanceof Error ? error : new Error(String(error))
        );
        // Continue to next provider
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed for key: ${key}. Errors: ${errors.map((e) => e.message).join(', ')}`
    );
  }

  /**
   * Calculate TTL with bounds checking
   */
  private calculateTtl(requestTtl?: number): number {
    const ttl = requestTtl ?? this.config.defaultTtl;

    // Enforce bounds
    if (ttl < this.config.minTtl) {
      return this.config.minTtl;
    }
    if (ttl > this.config.maxTtl) {
      return this.config.maxTtl;
    }

    return ttl;
  }

  /**
   * Log secret access for audit trail
   */
  private logAccess(entry: SecretAuditEntry): void {
    if (!this.config.auditLogging) {
      return;
    }

    this.auditLog.push(entry);

    // Limit audit log size (keep last 1000 entries)
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
  }
}
