/**
 * @module @gati-framework/testing/fake-global-context
 * @description Fake GlobalContext for testing
 */

import type { GlobalContext } from '@gati-framework/runtime';

export interface FakeGlobalContextOptions {
  modules?: Record<string, any>;
  config?: Record<string, any>;
  secrets?: Record<string, string>;
}

/**
 * Create fake GlobalContext for testing
 */
export function createFakeGlobalContext(options: FakeGlobalContextOptions = {}): GlobalContext {
  return {
    modules: options.modules || {},
    config: options.config || {},
    
    getSecret(key: string): string | undefined {
      return options.secrets?.[key];
    },
    
    getConfig(key: string): any {
      return options.config?.[key];
    }
  } as GlobalContext;
}
