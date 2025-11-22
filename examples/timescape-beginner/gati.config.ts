import { defineConfig } from '@gati-framework/runtime';

export default defineConfig({
  timescape: {
    enabled: true,
    
    // Version lifecycle
    coldThresholdMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoDeactivate: false, // Keep all versions for demo
    
    // Performance
    cacheSize: 100,
    maxTransformerChain: 5,
    
    // Storage
    persistToDisk: true,
    diskPath: '.gati/timescape'
  }
});
