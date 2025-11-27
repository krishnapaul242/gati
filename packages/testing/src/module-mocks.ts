/**
 * @module testing/module-mocks
 * @description Module mocking utilities
 */

/**
 * Call record for a mocked method
 */
export interface CallRecord {
  args: unknown[];
  result?: unknown;
  error?: Error;
  timestamp: number;
}

/**
 * Mock module with call tracking
 */
export interface MockModule<T> {
  module: T;
  calls: Record<keyof T, CallRecord[]>;
  reset(): void;
}

/**
 * Create a mock module with call tracking
 */
export function createMockModule<T extends Record<string, (...args: any[]) => any>>(
  methods: T
): MockModule<T> {
  const calls: Record<string, CallRecord[]> = {};
  const module: any = {};

  for (const [name, fn] of Object.entries(methods)) {
    calls[name] = [];
    
    module[name] = async (...args: unknown[]) => {
      const record: CallRecord = {
        args,
        timestamp: Date.now(),
      };
      
      try {
        const result = await Promise.resolve(fn(...args));
        record.result = result;
        calls[name].push(record);
        return result;
      } catch (error) {
        record.error = error instanceof Error ? error : new Error(String(error));
        calls[name].push(record);
        throw error;
      }
    };
  }

  return {
    module: module as T,
    calls: calls as Record<keyof T, CallRecord[]>,
    reset() {
      for (const key of Object.keys(calls)) {
        calls[key] = [];
      }
    },
  };
}

/**
 * Create a stub module with predefined return values
 */
export function createStubModule<T extends Record<string, unknown>>(stubs: T): T {
  const module: any = {};

  for (const [name, value] of Object.entries(stubs)) {
    if (typeof value === 'function') {
      module[name] = value;
    } else {
      module[name] = () => value;
    }
  }

  return module as T;
}
