/**
 * @module runtime/trace-collector.test
 * @description Unit tests for TraceCollector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TraceCollector } from './trace-collector.js';
import { createLocalContext } from './local-context.js';
import type { Request } from './types/request.js';

describe('TraceCollector', () => {
  let collector: TraceCollector;

  beforeEach(() => {
    collector = new TraceCollector({ enabled: true, maxTraces: 10 });
  });

  describe('startTrace', () => {
    it('should create a new trace', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      collector.startTrace(request, 'trace-1');

      const trace = collector.getActiveTrace('trace-1');
      expect(trace).toBeDefined();
      expect(trace?.id).toBe('trace-1');
      expect(trace?.status).toBe('pending');
      expect(trace?.stages).toEqual([]);
    });

    it('should not create trace when disabled', () => {
      collector.disable();
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      collector.startTrace(request, 'trace-1');

      expect(collector.getActiveTrace('trace-1')).toBeNull();
    });
  });

  describe('captureStage', () => {
    it('should capture pipeline stage', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      collector.startTrace(request, 'trace-1');
      collector.captureStage('trace-1', 'ingress', { ip: '127.0.0.1' });

      const trace = collector.getActiveTrace('trace-1');
      expect(trace?.stages).toHaveLength(1);
      expect(trace?.stages[0].name).toBe('ingress');
      expect(trace?.stages[0].metadata.ip).toBe('127.0.0.1');
    });

    it('should nest child stages', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      collector.startTrace(request, 'trace-1');
      collector.captureStage('trace-1', 'handler');
      collector.captureStage('trace-1', 'module', { name: 'db' });

      const trace = collector.getActiveTrace('trace-1');
      expect(trace?.stages).toHaveLength(1);
      expect(trace?.stages[0].children).toHaveLength(1);
      expect(trace?.stages[0].children![0].name).toBe('module');
    });
  });

  describe('captureSnapshot', () => {
    it('should capture LocalContext snapshot', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      const lctx = createLocalContext();
      lctx.state.userId = '123';

      collector.startTrace(request, 'trace-1');
      collector.captureStage('trace-1', 'handler');
      collector.captureSnapshot('trace-1', lctx);

      const trace = collector.getActiveTrace('trace-1');
      const snapshotId = trace?.stages[0].snapshotId;
      expect(snapshotId).toBeDefined();
      expect(trace?.snapshots[snapshotId!]).toBeDefined();
      expect(trace?.snapshots[snapshotId!].state.userId).toBe('123');
    });
  });

  describe('completeStage', () => {
    it('should set endTime on stage', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      collector.startTrace(request, 'trace-1');
      collector.captureStage('trace-1', 'handler');
      collector.completeStage('trace-1');

      const trace = collector.getActiveTrace('trace-1');
      expect(trace?.stages[0].endTime).toBeDefined();
    });
  });

  describe('endTrace', () => {
    it('should complete trace successfully', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      const response = { statusCode: 200, body: 'OK' };

      collector.startTrace(request, 'trace-1');
      const trace = collector.endTrace('trace-1', response as any);

      expect(trace?.status).toBe('success');
      expect(trace?.response).toBe(response);
      expect(trace?.duration).toBeGreaterThanOrEqual(0);
      expect(collector.getActiveTrace('trace-1')).toBeNull();
    });

    it('should capture error in trace', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      const error = new Error('Test error');

      collector.startTrace(request, 'trace-1');
      const trace = collector.endTrace('trace-1', undefined, error);

      expect(trace?.status).toBe('error');
      expect(trace?.error?.message).toBe('Test error');
    });
  });

  describe('memory limits', () => {
    it('should enforce maxTraces limit', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;

      // Create 15 traces (limit is 10)
      for (let i = 0; i < 15; i++) {
        collector.startTrace(request, `trace-${i}`);
      }

      expect(collector.getActiveCount()).toBeLessThanOrEqual(10);
    });
  });

  describe('enable/disable', () => {
    it('should enable and disable collection', () => {
      expect(collector.isEnabled()).toBe(true);
      
      collector.disable();
      expect(collector.isEnabled()).toBe(false);
      
      collector.enable();
      expect(collector.isEnabled()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all active traces', () => {
      const request = { method: 'GET', path: '/', headers: {} } as Request;
      collector.startTrace(request, 'trace-1');
      collector.startTrace(request, 'trace-2');

      expect(collector.getActiveCount()).toBe(2);
      
      collector.clear();
      expect(collector.getActiveCount()).toBe(0);
    });
  });
});
