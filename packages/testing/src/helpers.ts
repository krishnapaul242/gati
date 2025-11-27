/**
 * @module testing/helpers
 * @description Helper functions for handler testing
 */

import type { Handler, Request, Response } from '@gati-framework/core';
import { createTestHarness } from './test-harness.js';
import type { TestResult } from './test-harness.js';

/**
 * Create a test request with sensible defaults
 */
export function createTestRequest(options?: Partial<Request>): Request {
  return {
    method: 'GET',
    path: '/',
    params: {},
    query: {},
    body: undefined,
    ...options,
  };
}

/**
 * Create a test response
 */
export function createTestResponse(): Response & { statusCode: number; body: unknown } {
  let statusCode = 200;
  let body: unknown = undefined;
  
  const response: any = {
    statusCode,
    body,
    status: (code: number) => {
      statusCode = code;
      response.statusCode = code;
      return response;
    },
    json: (data: unknown) => {
      body = data;
      response.body = data;
    },
    send: (data: unknown) => {
      body = data;
      response.body = data;
    },
  };
  
  return response;
}

/**
 * Execute handler with minimal setup
 */
export async function testHandler(
  handler: Handler,
  request?: Partial<Request>,
  modules?: Record<string, unknown>
): Promise<TestResult> {
  const harness = createTestHarness({ modules });
  return harness.executeHandler(handler, { request });
}

/**
 * Assert response status
 */
export function assertStatus(response: Response & { statusCode?: number }, expected: number): void {
  if (response.statusCode !== expected) {
    throw new Error(`Expected status ${expected}, got ${response.statusCode}`);
  }
}

/**
 * Assert response body
 */
export function assertBody(response: Response & { body?: unknown }, expected: unknown): void {
  const actual = JSON.stringify(response.body);
  const exp = JSON.stringify(expected);
  
  if (actual !== exp) {
    throw new Error(`Expected body ${exp}, got ${actual}`);
  }
}
