import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness } from './test-harness';
import type { Handler } from '@gati-framework/core';

describe('createTestHarness', () => {
  it('creates harness with defaults', () => {
    const harness = createTestHarness();
    expect(harness).toBeDefined();
    expect(harness.getLocalContext()).toBeDefined();
    expect(harness.getGlobalContext()).toBeDefined();
  });

  it('executes handler successfully', async () => {
    const harness = createTestHarness();
    const handler: Handler = (req, res) => {
      res.json({ message: 'success' });
    };

    const result = await harness.executeHandler(handler);
    expect(result.response.statusCode).toBe(200);
    expect(result.error).toBeUndefined();
  });

  it('captures lifecycle events', async () => {
    const harness = createTestHarness();
    const handler: Handler = (req, res) => {
      res.json({ ok: true });
    };

    const result = await harness.executeHandler(handler);
    expect(result.events).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
  });

  it('provides access to contexts', async () => {
    const harness = createTestHarness();
    const handler: Handler = (req, res, gctx, lctx) => {
      expect(gctx).toBe(harness.getGlobalContext());
      expect(lctx).toBe(harness.getLocalContext());
      res.json({ ok: true });
    };

    await harness.executeHandler(handler);
  });

  it('handles handler errors', async () => {
    const harness = createTestHarness();
    const handler: Handler = () => {
      throw new Error('test error');
    };

    const result = await harness.executeHandler(handler);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('test error');
  });

  it('supports custom request', async () => {
    const harness = createTestHarness();
    const handler: Handler = (req, res) => {
      res.json({ path: req.path });
    };

    const result = await harness.executeHandler(handler, {
      request: { path: '/test' }
    });
    expect(result.response.statusCode).toBe(200);
  });

  it('supports custom modules', async () => {
    const mockDb = { query: () => 'result' };
    const harness = createTestHarness();
    const handler: Handler = (req, res, gctx) => {
      const result = gctx.modules['db'].query();
      res.json({ result });
    };

    const result = await harness.executeHandler(handler, {
      modules: { db: mockDb }
    });
    expect(result.response.statusCode).toBe(200);
  });

  it('isolates test executions', async () => {
    const harness = createTestHarness();
    const handler: Handler = (req, res, gctx, lctx) => {
      lctx.state.counter = (lctx.state.counter || 0) + 1;
      res.json({ counter: lctx.state.counter });
    };

    await harness.executeHandler(handler);
    const result2 = await harness.executeHandler(handler);
    
    // Each execution should have fresh context
    expect(result2.lctx.state.counter).toBe(1);
  });

  it('cleans up resources', async () => {
    const harness = createTestHarness();
    await expect(harness.cleanup()).resolves.not.toThrow();
  });
});
