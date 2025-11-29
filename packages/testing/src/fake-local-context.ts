/**
 * @module @gati-framework/testing/fake-local-context
 * @description Fake LocalContext for testing
 */

import type { LocalContext } from '@gati-framework/runtime';

export interface FakeLocalContextOptions {
  requestId?: string;
  startTime?: number;
  logger?: any;
  state?: Map<string, any>;
}

/**
 * Create fake LocalContext for testing
 */
export function createFakeLocalContext(options: FakeLocalContextOptions = {}): LocalContext {
  const state = options.state || new Map<string, any>();
  
  const logger = options.logger || {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
  };

  return {
    requestId: options.requestId || `test-req-${Date.now()}`,
    startTime: options.startTime || Date.now(),
    logger,
    
    get(key: string) {
      return state.get(key);
    },
    
    set(key: string, value: any) {
      state.set(key, value);
    },
    
    delete(key: string) {
      state.delete(key);
    },
    
    has(key: string) {
      return state.has(key);
    },
    
    snapshot() {
      return new Map(state);
    },
    
    restore(snapshot: Map<string, any>) {
      state.clear();
      snapshot.forEach((value, key) => state.set(key, value));
    }
  } as LocalContext;
}
