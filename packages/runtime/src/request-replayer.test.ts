/**
 * @module runtime/request-replayer.test
 * @description Unit tests for RequestReplayer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RequestReplayer } from './request-replayer.js';
import { InMemoryTraceStorage } from './trace-storage.js';
import type { RequestTrace } from './types/trace.js';
import { RequestPhase } from './types/context.js';

describe('RequestReplayer', () => {
  let storage: InMemoryTraceStorage;
  let replayer: RequestReplayer;

  beforeEach(() => {
    storage = new InMemoryTraceStorage();
    replayer = new RequestReplayer(storage);
  });

  const createTrace = (id: string): RequestTrace => ({
    id,
    timestamp: Date.now(),
    request: {
      method: 'GET',
      path: '/test',
      headers: {},
      query: {},
      params: {},
    } as any,
    response: {
      statusCode: 200,
      headers: {},
      body: { success: true },
    } as any,
    stages: [
      {
        name: 'ingress',
        startTime: Date.now(),
        endTime: Date.now() + 10,
        snapshotId: 'snap-ingress',
        metadata: {},
      },
      {
        name: 'handler',
        startTime: Date.now() + 10,
        endTime: Date.now() + 20,
        snapshotId: 'snap-handler',
        metadata: {},
      },
    ],
    snapshots: {
      'snap-ingress': {
        requestId: id,
        timestamp: Date.now(),
        state: { step: 'ingress' },
        outstandingPromises: [],
        lastHookIndex: 0,
        phase: RequestPhase.RECEIVED,
        traceId: id,
        clientId: 'client-1',
      },
      'snap-handler': {
        requestId: id,
        timestamp: Date.now(),
        state: { step: 'handler' },
        outstandingPromises: [],
        lastHookIndex: 0,
        phase: RequestPhase.PROCESSING,
        traceId: id,
        clientId: 'client-1',
      },
    },
    duration: 20,
    status: 'success',
  });

  describe('replay', () => {
    it('should replay a request', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const result = await replayer.replay({ traceId: 'trace-1' });

      expect(result.originalTraceId).toBe('trace-1');
      expect(result.traceId).toContain('trace-1_replay_');
      expect(result.response).toBeDefined();
    });

    it('should replay from specific stage', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const result = await replayer.replay({
        traceId: 'trace-1',
        fromStage: 'handler',
      });

      expect(result.response).toBeDefined();
    });

    it('should apply request modifications', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const result = await replayer.replay({
        traceId: 'trace-1',
        modifiedRequest: {
          query: { modified: 'true' },
        },
      });

      expect(result.response).toBeDefined();
    });

    it('should compare with original when requested', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const result = await replayer.replay({
        traceId: 'trace-1',
        compare: true,
      });

      expect(result.diff).toBeDefined();
    });

    it('should handle non-existent trace', async () => {
      await expect(replayer.replay({ traceId: 'non-existent' })).rejects.toThrow('not found');
    });

    it('should handle invalid stage', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const result = await replayer.replay({
        traceId: 'trace-1',
        fromStage: 'invalid' as any,
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('No snapshot found');
    });

    it('should produce consistent results', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const result1 = await replayer.replay({ traceId: 'trace-1' });
      const result2 = await replayer.replay({ traceId: 'trace-1' });

      expect(result1.response?.statusCode).toBe(result2.response?.statusCode);
    });
  });

  describe('canReplay', () => {
    it('should return true for valid trace', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const canReplay = await replayer.canReplay('trace-1');
      expect(canReplay).toBe(true);
    });

    it('should return false for non-existent trace', async () => {
      const canReplay = await replayer.canReplay('non-existent');
      expect(canReplay).toBe(false);
    });

    it('should validate stage exists', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const canReplay = await replayer.canReplay('trace-1', 'handler');
      expect(canReplay).toBe(true);
    });
  });

  describe('getReplayStages', () => {
    it('should return available stages', async () => {
      const trace = createTrace('trace-1');
      await storage.storeTrace(trace);

      const stages = await replayer.getReplayStages('trace-1');
      expect(stages).toContain('ingress');
      expect(stages).toContain('handler');
    });

    it('should return empty array for non-existent trace', async () => {
      const stages = await replayer.getReplayStages('non-existent');
      expect(stages).toEqual([]);
    });

    it('should handle nested stages', async () => {
      const trace = createTrace('trace-1');
      trace.stages[1].children = [
        {
          name: 'module',
          startTime: Date.now(),
          snapshotId: 'snap-module',
          metadata: {},
        },
      ];
      await storage.storeTrace(trace);

      const stages = await replayer.getReplayStages('trace-1');
      expect(stages).toContain('module');
    });
  });
});
