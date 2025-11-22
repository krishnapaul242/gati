import { defineConfig } from '@gati-framework/runtime';

export default defineConfig({
  timescape: {
    enabled: true,
    
    // Version lifecycle
    coldThresholdMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoDeactivate: false, // Keep all versions for demo
    
    // Performance
    cacheSize: 100,
    maxTransformerChain: 10, // Allow longer chains for multi-hop demo
    
    // Storage
    persistToDisk: true,
    diskPath: '.gati/timescape',
    
    // Database schema versioning
    dbSchema: {
      enabled: true,
      migrationsPath: './migrations',
      timeoutMs: 30000
    }
  }
});
