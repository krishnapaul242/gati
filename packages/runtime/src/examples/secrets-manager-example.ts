/**
 * @module runtime/examples/secrets-manager-example
 * @description Usage examples for secrets manager
 */

import { SecretsManager } from '../secrets-manager.js';
import { EnvProvider } from '../providers/env-provider.js';
import type { SecretProvider } from '../types/secrets-manager.js';

/**
 * Example 1: Basic secret retrieval
 */
async function basicExample() {
  console.log('=== Example 1: Basic Secret Retrieval ===\n');

  // Set up environment variables for testing
  process.env.APP_SECRET_API_KEY = 'my-api-key-12345';
  process.env.APP_SECRET_DATABASE_PASSWORD = 'super-secret-password';

  const secretsManager = new SecretsManager({
    providers: [
      new EnvProvider({ prefix: 'APP_SECRET_' }),
    ],
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    auditLogging: true,
  });

  // Get a single secret
  const apiKey = await secretsManager.getSecret({
    key: 'api-key',
    requestId: 'req-001',
    handlerId: 'example-handler',
  });

  console.log('API Key retrieved:');
  console.log(`  Value: ${apiKey.value}`);
  console.log(`  From cache: ${apiKey.fromCache}`);
  console.log(`  Provider: ${apiKey.provider}`);
  console.log(`  Expires at: ${new Date(apiKey.expiresAt).toISOString()}`);
  console.log();

  // Get the same secret again (should hit cache)
  const apiKey2 = await secretsManager.getSecret({
    key: 'api-key',
    requestId: 'req-002',
  });

  console.log('API Key retrieved again:');
  console.log(`  From cache: ${apiKey2.fromCache}`);
  console.log();
}

/**
 * Example 2: Multiple secrets
 */
async function multipleSecretsExample() {
  console.log('=== Example 2: Multiple Secrets ===\n');

  process.env.APP_SECRET_DB_HOST = 'localhost';
  process.env.APP_SECRET_DB_PORT = '5432';
  process.env.APP_SECRET_DB_USER = 'admin';
  process.env.APP_SECRET_DB_PASSWORD = 'password123';

  const secretsManager = new SecretsManager({
    providers: [new EnvProvider({ prefix: 'APP_SECRET_' })],
  });

  // Get multiple secrets at once
  const secrets = await secretsManager.getSecrets(
    ['db-host', 'db-port', 'db-user', 'db-password'],
    {
      requestId: 'req-003',
      handlerId: 'database-handler',
    }
  );

  console.log('Database configuration:');
  for (const [key, result] of secrets) {
    console.log(`  ${key}: ${result.value}`);
  }
  console.log();
}

/**
 * Example 3: Custom TTL and force refresh
 */
async function customTtlExample() {
  console.log('=== Example 3: Custom TTL and Force Refresh ===\n');

  process.env.APP_SECRET_SHORT_LIVED_TOKEN = 'token-12345';

  const secretsManager = new SecretsManager({
    providers: [new EnvProvider({ prefix: 'APP_SECRET_' })],
    defaultTtl: 5 * 60 * 1000,
    minTtl: 10 * 1000, // 10 seconds
  });

  // Get secret with custom short TTL
  const token1 = await secretsManager.getSecret({
    key: 'short-lived-token',
    ttl: 30 * 1000, // 30 seconds
  });

  console.log('Token with custom TTL:');
  console.log(`  Value: ${token1.value}`);
  console.log(`  TTL: 30 seconds`);
  console.log();

  // Force refresh (bypass cache)
  process.env.APP_SECRET_SHORT_LIVED_TOKEN = 'token-67890'; // Simulate rotation

  const token2 = await secretsManager.getSecret({
    key: 'short-lived-token',
    forceRefresh: true,
  });

  console.log('Token after force refresh:');
  console.log(`  Value: ${token2.value}`);
  console.log(`  From cache: ${token2.fromCache}`);
  console.log();
}

/**
 * Example 4: Cache management
 */
async function cacheManagementExample() {
  console.log('=== Example 4: Cache Management ===\n');

  process.env.APP_SECRET_KEY1 = 'value1';
  process.env.APP_SECRET_KEY2 = 'value2';
  process.env.APP_SECRET_KEY3 = 'value3';

  const secretsManager = new SecretsManager({
    providers: [new EnvProvider({ prefix: 'APP_SECRET_' })],
  });

  // Cache some secrets
  await secretsManager.getSecret({ key: 'key1' });
  await secretsManager.getSecret({ key: 'key2' });
  await secretsManager.getSecret({ key: 'key3' });

  console.log('Initial cache stats:');
  let stats = secretsManager.getCacheStats();
  console.log(`  Size: ${stats.size}`);
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log();

  // Access cached secrets
  await secretsManager.getSecret({ key: 'key1' });
  await secretsManager.getSecret({ key: 'key2' });

  console.log('After cache hits:');
  stats = secretsManager.getCacheStats();
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Hit rate: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`);
  console.log();

  // Invalidate specific secret
  secretsManager.invalidate('key1');
  console.log('Invalidated key1');

  stats = secretsManager.getCacheStats();
  console.log(`  Cache size: ${stats.size}`);
  console.log();

  // Clear all cache
  secretsManager.clearCache();
  console.log('Cleared all cache');

  stats = secretsManager.getCacheStats();
  console.log(`  Cache size: ${stats.size}`);
  console.log();
}

/**
 * Example 5: Provider fallback
 */
async function providerFallbackExample() {
  console.log('=== Example 5: Provider Fallback ===\n');

  // Mock provider that fails
  class FailingProvider implements SecretProvider {
    public readonly name = 'failing';

    async getSecret(_key: string): Promise<string> {
      throw new Error('Provider unavailable');
    }

    async getSecrets(_keys: string[]): Promise<Map<string, string>> {
      throw new Error('Provider unavailable');
    }

    async isAvailable(): Promise<boolean> {
      return false; // Not available
    }
  }

  process.env.APP_SECRET_FALLBACK_KEY = 'fallback-value';

  const secretsManager = new SecretsManager({
    providers: [
      new FailingProvider(), // Primary (will fail)
      new EnvProvider({ prefix: 'APP_SECRET_' }), // Fallback
    ],
  });

  const result = await secretsManager.getSecret({ key: 'fallback-key' });

  console.log('Secret retrieved via fallback:');
  console.log(`  Value: ${result.value}`);
  console.log(`  Provider: ${result.provider}`);
  console.log();
}

/**
 * Example 6: Audit logging
 */
async function auditLoggingExample() {
  console.log('=== Example 6: Audit Logging ===\n');

  process.env.APP_SECRET_AUDIT_KEY = 'audit-value';

  const secretsManager = new SecretsManager({
    providers: [new EnvProvider({ prefix: 'APP_SECRET_' })],
    auditLogging: true,
  });

  // Successful access
  await secretsManager.getSecret({
    key: 'audit-key',
    requestId: 'req-100',
    handlerId: 'audit-handler',
  });

  // Cache hit
  await secretsManager.getSecret({
    key: 'audit-key',
    requestId: 'req-101',
    handlerId: 'audit-handler',
  });

  // Failed access
  try {
    await secretsManager.getSecret({
      key: 'missing-key',
      requestId: 'req-102',
      handlerId: 'audit-handler',
    });
  } catch {
    // Expected to fail
  }

  // Get audit log
  const auditLog = secretsManager.getAuditLog();

  console.log('Audit log entries:');
  for (const entry of auditLog) {
    console.log(`  [${new Date(entry.timestamp).toISOString()}]`);
    console.log(`    Key: ${entry.key}`);
    console.log(`    Request: ${entry.requestId}`);
    console.log(`    Handler: ${entry.handlerId}`);
    console.log(`    Success: ${entry.success}`);
    console.log(`    Provider: ${entry.provider || 'N/A'}`);
    console.log(`    From cache: ${entry.fromCache}`);
    if (entry.error) {
      console.log(`    Error: ${entry.error}`);
    }
    console.log();
  }
}

/**
 * Example 7: Integration with handler
 */
async function handlerIntegrationExample() {
  console.log('=== Example 7: Handler Integration ===\n');

  process.env.APP_SECRET_JWT_SECRET = 'my-jwt-secret';
  process.env.APP_SECRET_API_KEY = 'my-api-key';

  const secretsManager = new SecretsManager({
    providers: [new EnvProvider({ prefix: 'APP_SECRET_' })],
  });

  // Simulate handler function
  async function handler(req: any, res: any, lctx: any, gctx: any) {
    // Get secrets needed for this request
    const secrets = await gctx.secrets.getSecrets(
      ['jwt-secret', 'api-key'],
      {
        requestId: lctx.requestId,
        handlerId: 'auth-handler',
      }
    );

    const jwtSecret = secrets.get('jwt-secret')?.value;
    const apiKey = secrets.get('api-key')?.value;

    console.log('Handler received secrets:');
    console.log(`  JWT Secret: ${jwtSecret}`);
    console.log(`  API Key: ${apiKey}`);
    console.log();

    // Use secrets for authentication, etc.
    return { authenticated: true };
  }

  // Simulate request
  const mockGctx = { secrets: secretsManager };
  const mockLctx = { requestId: 'req-200' };

  await handler({}, {}, mockLctx, mockGctx);
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await basicExample();
    await multipleSecretsExample();
    await customTtlExample();
    await cacheManagementExample();
    await providerFallbackExample();
    await auditLoggingExample();
    await handlerIntegrationExample();

    console.log('=== All examples completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export {
  basicExample,
  multipleSecretsExample,
  customTtlExample,
  cacheManagementExample,
  providerFallbackExample,
  auditLoggingExample,
  handlerIntegrationExample,
};
