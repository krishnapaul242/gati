/**
 * Integration tests for trace collection across the entire pipeline
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTraceCollector } from '../../trace-collector.js';
import { createTraceStorage } from '../../trace-storage.js';
import { createRequestReplayer } from '../../request-replayer.js';
import { createDebugGateManager } from '../../debug-gate-manager.js';
import type { Request, Response } from '@gati-framework/core';

// Note: These are integration tests that verify component interactions.
// Full E2E tests with actual handlers are in the playground package.

describe('Trace Integration', () => {
  let collector: ReturnType<typeof createTraceCollector>;
  let storage: ReturnType<typeof createTraceStorage>;
  let replayer: ReturnType<typeof createRequestReplayer>;
  let gateManager: ReturnType<typeof createDebugGateManager>;

  beforeEach(() => {
    collector = createTraceCollector({ enabled: true });
    storage = createTraceStorage();
    replayer = createRequestReplayer(storage);
    gateManager = createDebugGateManager({ enabled: true });
  });

  afterEach(() => {
    gateManager.clear();
    collector.clear();
    storage.clear();
  });

  it('captures full pipeline trace', () => {
    const request = {
      method: 'GET',
      url: '/api/users/123',
      headers: {},
      params: { id: '123' },
      query: {},
      body: null,
    } as Request;

    const traceId = 'trace_123';
    collector.startTrace(request, traceId);

    const mockLctx = { snapshot: { create: () => ({ data: {} }) } } as any;

    collector.captureStage(traceId, 'ingress', { ip: '127.0.0.1' });
    collector.captureSnapshot(traceId, mockLctx);
    collector.completeStage(traceId);

    collector.captureStage(traceId, 'route-manager', { route: '/api/users/:id' });
    collector.captureSnapshot(traceId, mockLctx);
    collector.completeStage(traceId);

    collector.captureStage(traceId, 'lcc', { hooks: 2 });
    collector.captureSnapshot(traceId, mockLctx);
    collector.completeStage(traceId);

    collector.captureStage(traceId, 'handler', { handlerPath: '/api/users/[id]' });
    collector.captureSnapshot(traceId, mockLctx);
    collector.completeStage(traceId);

    const response = { status: 200, body: { user: { id: '123' } } } as Response;
    const trace = collector.endTrace(traceId, response);

    expect(trace).toBeDefined();
    expect(trace?.stages).toHaveLength(4);
    expect(trace?.status).toBe('success');
    expect(trace?.response).toEqual(response);
  });

  it('stores and retrieves traces', async () => {
    const request = { method: 'POST', url: '/api/data', headers: {}, body: { test: true } } as Request;
    const traceId = 'trace_456';
    const mockLctx = { snapshot: { create: () => ({ data: {} }) } } as any;
    
    collector.startTrace(request, traceId);
    collector.captureStage(traceId, 'ingress', {});
    collector.captureSnapshot(traceId, mockLctx);
    collector.completeStage(traceId);
    
    const trace = collector.endTrace(traceId, { status: 201 } as Response);
    await storage.storeTrace(trace!);

    const retrieved = await storage.getTrace(traceId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(traceId);
    expect(retrieved?.request.method).toBe('POST');
  });

  it('integrates replayer with storage', async () => {
    const request = { method: 'GET', url: '/test', headers: {}, query: { foo: 'bar' } } as Request;
    const traceId = 'trace_789';
    const mockLctx = { snapshot: { create: () => ({ data: { original: true } }) } } as any;
    
    collector.startTrace(request, traceId);
    collector.captureStage(traceId, 'handler', {});
    collector.captureSnapshot(traceId, mockLctx);
    collector.completeStage(traceId);
    
    const trace = collector.endTrace(traceId, { status: 200, body: { result: 'ok' } } as Response);
    await storage.storeTrace(trace!);

    // Verify replayer can access stored trace
    const canReplay = replayer.canReplay(traceId);
    expect(canReplay).resolves.toBe(true);
    
    const stages = await replayer.getReplayStages(traceId);
    expect(stages).toContain('handler');
  });

  it('handles debug gates during execution', async () => {
    const traceId = 'trace_debug';
    const gate = gateManager.createGate(traceId, 'handler');
    
    let triggered = false;
    gateManager.on('gate:triggered', () => { triggered = true; });

    const checkPromise = gateManager.checkGate(traceId, 'handler', {});
    setTimeout(() => gateManager.releaseGate(gate.id), 10);
    
    await checkPromise;
    expect(triggered).toBe(true);
  });

  it('handles errors in pipeline', () => {
    const request = { method: 'GET', url: '/error', headers: {} } as Request;
    const traceId = 'trace_error';
    
    collector.startTrace(request, traceId);
    collector.captureStage(traceId, 'handler', {});
    
    const error = new Error('Handler failed');
    const trace = collector.endTrace(traceId, undefined, error);

    expect(trace?.status).toBe('error');
    expect(trace?.error).toBeDefined();
    expect(trace?.error?.message).toBe('Handler failed');
  });

  it('has zero overhead when disabled', () => {
    const disabledCollector = createTraceCollector({ enabled: false });
    const request = { method: 'GET', url: '/test', headers: {} } as Request;
    const traceId = 'trace_disabled';

    const start = performance.now();
    disabledCollector.startTrace(request, traceId);
    disabledCollector.captureStage(traceId, 'handler', {});
    const trace = disabledCollector.endTrace(traceId, { status: 200 } as Response);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1);
    expect(trace).toBeNull();
  });
});
