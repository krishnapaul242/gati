/**
 * @module @gati-framework/testing/module-mocks
 * @description Module mocking utilities
 */

/**
 * Create mock module with spy functions
 */
export function createMockModule<T extends Record<string, any>>(
  methods: (keyof T)[]
): T {
  const mock: any = {};
  
  for (const method of methods) {
    mock[method] = async (...args: any[]) => {
      // Store call for inspection
      if (!mock.__calls) mock.__calls = [];
      mock.__calls.push({ method, args });
      return undefined;
    };
  }
  
  return mock as T;
}

/**
 * Get calls made to a mock module method
 */
export function getModuleCalls(mock: any, method: string): any[][] {
  if (!mock.__calls) return [];
  return mock.__calls
    .filter((call: any) => call.method === method)
    .map((call: any) => call.args);
}

/**
 * Clear all calls from a mock module
 */
export function clearModuleCalls(mock: any): void {
  if (mock.__calls) {
    mock.__calls = [];
  }
}
