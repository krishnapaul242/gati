/**
 * @module runtime/types/secrets-manager
 * @description Type definitions for secrets management system
 */

/**
 * Secret value with metadata
 */
export interface Secret {
  /** Secret key/name */
  key: string;
  /** Secret value (never logged) */
  value: string;
  /** Secret version/revision */
  version?: string;
  /** When the secret was retrieved */
  retrievedAt: number;
  /** When the secret expires from cache */
  expiresAt: number;
  /** Metadata about the secret */
  metadata?: Record<string, unknown>;
}

/**
 * Secret provider interface
 */
export interface SecretProvider {
  /** Provider name (e.g., 'aws', 'azure', 'env') */
  name: string;

  /** Retrieve a secret by key */
  getSecret(key: string): Promise<string>;

  /** Retrieve multiple secrets by keys */
  getSecrets(keys: string[]): Promise<Map<string, string>>;

  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}

/**
 * Secrets manager configuration
 */
export interface SecretsManagerConfig {
  /** Default TTL for cached secrets (ms) */
  defaultTtl?: number;

  /** Maximum TTL for cached secrets (ms) */
  maxTtl?: number;

  /** Minimum TTL for cached secrets (ms) */
  minTtl?: number;

  /** Secret providers in priority order */
  providers: SecretProvider[];

  /** Enable audit logging */
  auditLogging?: boolean;

  /** Prefix for secret keys */
  keyPrefix?: string;

  /** Enable automatic refresh before expiry */
  autoRefresh?: boolean;

  /** Refresh buffer time before expiry (ms) */
  refreshBuffer?: number;
}

/**
 * Secret access request
 */
export interface SecretAccessRequest {
  /** Secret key */
  key: string;

  /** Request ID for audit trail */
  requestId?: string;

  /** Handler ID requesting the secret */
  handlerId?: string;

  /** Override TTL for this request */
  ttl?: number;

  /** Force refresh from provider */
  forceRefresh?: boolean;
}

/**
 * Secret access result
 */
export interface SecretAccessResult {
  /** Secret value */
  value: string;

  /** Whether value came from cache */
  fromCache: boolean;

  /** Provider that supplied the secret */
  provider: string;

  /** Secret version */
  version?: string;

  /** When the secret expires */
  expiresAt: number;
}

/**
 * Secrets manager interface
 */
export interface SecretsManager {
  /**
   * Get a single secret
   */
  getSecret(request: SecretAccessRequest): Promise<SecretAccessResult>;

  /**
   * Get multiple secrets
   */
  getSecrets(
    keys: string[],
    context?: {
      requestId?: string;
      handlerId?: string;
    }
  ): Promise<Map<string, SecretAccessResult>>;

  /**
   * Check if a secret exists
   */
  hasSecret(key: string): Promise<boolean>;

  /**
   * Invalidate cached secret
   */
  invalidate(key: string): void;

  /**
   * Clear all cached secrets
   */
  clearCache(): void;

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    evictions: number;
  };

  /**
   * Get audit log entries
   */
  getAuditLog(): SecretAuditEntry[];
}

/**
 * Audit log entry for secret access
 */
export interface SecretAuditEntry {
  /** Timestamp of access */
  timestamp: number;

  /** Secret key accessed */
  key: string;

  /** Request ID */
  requestId?: string;

  /** Handler ID */
  handlerId?: string;

  /** Whether access was successful */
  success: boolean;

  /** Provider used */
  provider?: string;

  /** Whether value came from cache */
  fromCache: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Secrets manager error
 */
export class SecretsManagerError extends Error {
  constructor(
    message: string,
    public readonly key: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SecretsManagerError';
  }
}
