/**
 * @module runtime/trace-storage.test
 * @description Unit tests for TraceStorage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryTraceStorage } from './trace-storage.js';
import type { RequestTrace } from './types/trace.js';

describe('InMemoryTraceStorage', () => {
  let storage: InMemoryTraceStorage;

  beforeEach(() => {
    storage = new InMemoryTraceStorage({ ttlMs: 1000, maxTraces: 5 });
  });

  afterEach(() => {
    storage.destroy();
  });

  const createTrace = (id: string, status: 'pending' | 'success' | 'error' = 'success'): RequestTrace => ({
    id,
    timestamp: Date.now(),
    request: { method: 'GET', path: '/test', headers: {} } as any,
    stages: [],
    snapshots: {},
    duration: 100,
    status,
  });

  describe('storeTrace', () => {
    it('should store a trace', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const retrieved = await storage.getTrace('trace-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('trace-1');
    });

    it('should enforce maxTraces limit', async () => {
      for (let i = 0; i < 10; i++) {
        await storage.storeTrace(createTrace(`trace-${i}`));
      }

      const stats = storage.getStats();
      expect(stats.count).toBeLessThanOrEqual(5);
    });
  });

  describe('getTrace', () => {
    it('should retrieve stored trace', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const retrieved = await storage.getTrace('trace-1');
      expect(retrieved?.id).toBe('trace-1');
    });

    it('should return null for non-existent trace', async () => {
      const retrieved = await storage.getTrace('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired trace', async () => {
      vi.useFakeTimers();
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      vi.advanceTimersByTime(2000); // Advance past TTL

      const retrieved = await storage.getTrace('trace-1');
      expect(retrieved).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('listTraces', () => {
    it('should list all traces', async () => {
      await storage.storeTrace(createTrace('trace-1'));
      await storage.storeTrace(createTrace('trace-2'));

      const traces = await storage.listTraces();
      expect(traces).toHaveLength(2);
    });

    it('should filter by status', async () => {
      await storage.storeTrace(createTrace('trace-1', 'success'));
      await storage.storeTrace(createTrace('trace-2', 'error'));

      const traces = await storage.listTraces({ status: 'error' });
      expect(traces).toHaveLength(1);
      expect(traces[0].id).toBe('trace-2');
    });

    it('should filter by path', async () => {
      const trace1 = createTrace('trace-1');
      trace1.request.path = '/api/users';
      const trace2 = createTrace('trace-2');
      trace2.request.path = '/api/posts';

      await storage.storeTrace(trace1);
      await storage.storeTrace(trace2);

      const traces = await storage.listTraces({ path: 'users' });
      expect(traces).toHaveLength(1);
      expect(traces[0].id).toBe('trace-1');
    });

    it('should apply limit', async () => {
      for (let i = 0; i < 5; i++) {
        await storage.storeTrace(createTrace(`trace-${i}`));
      }

      const traces = await storage.listTraces({ limit: 2 });
      expect(traces).toHaveLength(2);
    });

    it('should exclude expired traces', async () => {
      vi.useFakeTimers();
      
      await storage.storeTrace(createTrace('trace-1'));
      vi.advanceTimersByTime(2000); // Expire trace-1
      await storage.storeTrace(createTrace('trace-2'));

      const traces = await storage.listTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0].id).toBe('trace-2');

      vi.useRealTimers();
    });
  });

  describe('deleteTrace', () => {
    it('should delete a trace', async () => {
      await storage.storeTrace(createTrace('trace-1'));
      
      const deleted = await storage.deleteTrace('trace-1');
      expect(deleted).toBe(true);

      const retrieved = await storage.getTrace('trace-1');
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent trace', async () => {
      const deleted = await storage.deleteTrace('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all traces', async () => {
      await storage.storeTrace(createTrace('trace-1'));
      await storage.storeTrace(createTrace('trace-2'));

      await storage.clear();

      const traces = await storage.listTraces();
      expect(traces).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return storage statistics', async () => {
      await storage.storeTrace(createTrace('trace-1'));
      await storage.storeTrace(createTrace('trace-2'));

      const stats = storage.getStats();
      expect(stats.count).toBe(2);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('compression', () => {
    it('should compress large response bodies', async () => {
      const trace = createTrace('trace-1');
      trace.response = {
        statusCode: 200,
        headers: {},
        body: 'x'.repeat(2000), // Large body
      } as any;

      await storage.storeTrace(trace);
      const retrieved = await storage.getTrace('trace-1');

      expect(retrieved?.response?.body).toContain('[truncated]');
    });
  });
});
