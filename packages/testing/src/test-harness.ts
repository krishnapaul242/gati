/**
 * @module testing/test-harness
 * @description Core test harness for handler testing
 */

import type { Handler, Request, Response } from '@gati-framework/core';
import type { LocalContext, GlobalContext, LifecycleEvent } from '@gati-framework/runtime';
import { createGlobalContext, HookOrchestrator } from '@gati-framework/runtime';

/**
 * Options for executing a handler
 */
export interface ExecuteOptions {
  request?: Partial<Request>;
  modules?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

/**
 * Result of handler execution
 */
export interface TestResult {
  response: Response;
  lctx: LocalContext;
  error?: Error;
  events: LifecycleEvent[];
}

/**
 * Test harness for handler testing
 */
export interface TestHarness {
  executeHandler(handler: Handler, options?: ExecuteOptions): Promise<TestResult>;
  getLocalContext(): LocalContext;
  getGlobalContext(): GlobalContext;
  cleanup(): Promise<void>;
}

/**
 * Create a test harness for handler testing
 */
export function createTestHarness(options: {
  modules?: Record<string, unknown>;
  config?: Record<string, unknown>;
} = {}): TestHarness {
  const gctx = createGlobalContext({
    modules: options.modules || {},
    config: options.config || {},
  });
  
  let lctx: LocalContext = {
    requestId: 'test-req',
    timestamp: Date.now(),
    traceId: 'test-trace',
    clientId: 'test-client',
    refs: {},
    client: { ip: 'test', userAgent: 'test', region: 'test' },
    meta: {
      timestamp: Date.now(),
      instanceId: 'test',
      region: 'test',
      method: 'GET',
      path: '/',
      phase: 0 as any,
      startTime: Date.now(),
    },
    state: {},
    websocket: {
      waitForEvent: async () => ({ type: '', requestId: '', timestamp: 0 }),
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
      create: () => ({} as any),
      restore: () => {},
    },
  };
  const events: LifecycleEvent[] = [];
  
  const orchestrator = new HookOrchestrator({
    emitEvents: true,
    onEvent: (event) => events.push(event),
  });
  
  return {
    async executeHandler(handler: Handler, execOptions: ExecuteOptions = {}): Promise<TestResult> {
      // Create fresh context for this execution
      const reqId = `test-${Date.now()}`;
      lctx = {
        requestId: reqId,
        timestamp: Date.now(),
        traceId: `trace-${reqId}`,
        clientId: `client-${reqId}`,
        refs: {},
        client: { ip: 'test', userAgent: 'test', region: 'test' },
        meta: {
          timestamp: Date.now(),
          instanceId: 'test',
          region: 'test',
          method: execOptions.request?.method || 'GET',
          path: execOptions.request?.path || '/',
          phase: 0 as any,
          startTime: Date.now(),
        },
        state: {},
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
          create: () => ({} as any),
          restore: () => {},
        },
      };
      events.length = 0;
      orchestrator.clear();
      
      // Merge modules if provided
      const testGctx = execOptions.modules
        ? createGlobalContext({
            modules: { ...gctx.modules, ...execOptions.modules },
            config: { ...gctx.config, ...(execOptions.config || {}) },
          })
        : gctx;
      
      // Create request
      const req: Request = {
        method: 'GET',
        path: '/',
        params: {},
        query: {},
        body: undefined,
        ...execOptions.request,
      };
      
      // Create response with mutable state
      let statusCode = 200;
      let responseBody: unknown = undefined;
      const responseHeaders: Record<string, string> = {};
      
      const res: Response = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: unknown) => {
          responseBody = data;
          responseHeaders['content-type'] = 'application/json';
        },
        send: (data: unknown) => {
          responseBody = data;
        },
      };
      
      let error: Error | undefined;
      
      try {
        // Execute before hooks
        await orchestrator.executeBefore(lctx, testGctx);
        
        // Execute handler
        await Promise.resolve(handler(req, res, testGctx as any, lctx));
        
        // Execute after hooks
        await orchestrator.executeAfter(lctx, testGctx);
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
        
        // Execute catch hooks
        await orchestrator.executeCatch(error, lctx, testGctx);
        
        // Set error response if not already set
        if (statusCode === 200) {
          statusCode = 500;
        }
      }
      
      return {
        response: {
          ...res,
          statusCode,
          body: responseBody,
          headers: responseHeaders,
        } as Response & { statusCode: number; body: unknown; headers: Record<string, string> },
        lctx,
        error,
        events: [...events],
      };
    },
    
    getLocalContext(): LocalContext {
      return lctx;
    },
    
    getGlobalContext(): GlobalContext {
      return gctx;
    },
    
    async cleanup(): Promise<void> {
      orchestrator.clear();
      events.length = 0;
    },
  };
}
