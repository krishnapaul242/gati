/**
 * @module runtime/providers/env-provider
 * @description Environment variable secret provider
 */

import type { SecretProvider } from '../types/secrets-manager.js';

/**
 * Environment variable provider configuration
 */
export interface EnvProviderConfig {
  /** Prefix for environment variable keys */
  prefix?: string;

  /** Transform key to uppercase */
  uppercase?: boolean;

  /** Allow missing secrets */
  allowMissing?: boolean;
}

/**
 * Environment variable secret provider
 */
export class EnvProvider implements SecretProvider {
  public readonly name = 'env';
  private readonly config: Required<EnvProviderConfig>;

  constructor(config: EnvProviderConfig = {}) {
    this.config = {
      prefix: config.prefix ?? '',
      uppercase: config.uppercase ?? true,
      allowMissing: config.allowMissing ?? false,
    };
  }

  /**
   * Get a single secret from environment variables
   */
  async getSecret(key: string): Promise<string> {
    const envKey = this.transformKey(key);
    const value = process.env[envKey];

    if (value === undefined) {
      if (this.config.allowMissing) {
        return '';
      }
      throw new Error(`Secret not found: ${key} (env: ${envKey})`);
    }

    return value;
  }

  /**
   * Get multiple secrets from environment variables
   */
  async getSecrets(keys: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const key of keys) {
      try {
        const value = await this.getSecret(key);
        results.set(key, value);
      } catch (error) {
        if (!this.config.allowMissing) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Check if provider is available (always true for env vars)
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Transform key to environment variable name
   */
  private transformKey(key: string): string {
    let envKey = this.config.prefix + key;
    if (this.config.uppercase) {
      envKey = envKey.toUpperCase();
    }
    return envKey;
  }
}
