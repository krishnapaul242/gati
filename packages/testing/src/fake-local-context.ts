/**
 * @module testing/fake-local-context
 * @description Fake LocalContext builder for testing
 */

import type { LocalContext } from '@gati-framework/runtime';

/**
 * Options for creating a fake LocalContext
 */
export interface FakeLocalContextOptions {
  requestId?: string;
  traceId?: string;
  clientId?: string;
  state?: Record<string, unknown>;
  meta?: Partial<LocalContext['meta']>;
}

/**
 * Builder for creating fake LocalContext instances
 */
export class FakeLocalContextBuilder {
  private options: FakeLocalContextOptions = {};

  withRequestId(id: string): this {
    this.options.requestId = id;
    return this;
  }

  withTraceId(id: string): this {
    this.options.traceId = id;
    return this;
  }

  withClientId(id: string): this {
    this.options.clientId = id;
    return this;
  }

  withState(state: Record<string, unknown>): this {
    this.options.state = state;
    return this;
  }

  withMetadata(meta: Partial<LocalContext['meta']>): this {
    this.options.meta = meta;
    return this;
  }

  build(): LocalContext {
    return createFakeLocalContext(this.options);
  }
}

/**
 * Create a fake LocalContext with sensible test defaults
 */
export function createFakeLocalContext(options: FakeLocalContextOptions = {}): LocalContext {
  const reqId = options.requestId || `test-req-${Date.now()}`;
  
  return {
    requestId: reqId,
    timestamp: Date.now(),
    traceId: options.traceId || `test-trace-${reqId}`,
    clientId: options.clientId || `test-client-${reqId}`,
    refs: {},
    client: {
      ip: 'test-ip',
      userAgent: 'test-agent',
      region: 'test-region',
    },
    meta: {
      timestamp: Date.now(),
      instanceId: 'test-instance',
      region: 'test-region',
      method: 'GET',
      path: '/',
      phase: 0 as any,
      startTime: Date.now(),
      ...options.meta,
    },
    state: options.state || {},
    websocket: {
      waitForEvent: async () => ({ type: '', requestId: reqId, timestamp: 0 }),
      emitEvent: () => {},
    },
    lifecycle: {
      onCleanup: () => {},
      onTimeout: () => {},
      onError: () => {},
      onPhaseChange: () => {},
      setPhase: () => {},
      executeCleanup: async () => {},
      isCleaningUp: () => false,
      isTimedOut: () => false,
    },
    timescape: {
      resolver: {} as any,
      resolvedState: undefined,
    },
    snapshot: {
      create: () => ({
        requestId: reqId,
        timestamp: Date.now(),
        state: {},
        outstandingPromises: [],
        lastHookIndex: 0,
        handlerVersion: undefined,
        phase: 0 as any,
        traceId: options.traceId || `test-trace-${reqId}`,
        clientId: options.clientId || `test-client-${reqId}`,
      }),
      restore: () => {},
    },
  };
}
