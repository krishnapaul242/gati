/**
 * @module runtime/playground/hook-playback.test
 * @description Unit tests for HookPlayback
 * 
 * Tests Property 37: Hook recording completeness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HookPlayback } from './hook-playback.js';

describe('HookPlayback', () => {
  let playback: HookPlayback;

  beforeEach(() => {
    playback = new HookPlayback();
  });

  describe('enable/disable', () => {
    it('should start disabled', () => {
      expect(playback.isEnabled()).toBe(false);
    });

    it('should enable recording', () => {
      playback.enable();
      expect(playback.isEnabled()).toBe(true);
    });

    it('should disable recording', () => {
      playback.enable();
      playback.disable();
      expect(playback.isEnabled()).toBe(false);
    });
  });

  describe('startRequest', () => {
    it('should not record when disabled', () => {
      playback.startRequest('req-1');
      expect(playback.getHookTrace('req-1')).toBeUndefined();
    });

    it('should record request when enabled', () => {
      playback.enable();
      playback.startRequest('req-1');
      const trace = playback.getHookTrace('req-1');
      expect(trace).toBeDefined();
      expect(trace?.requestId).toBe('req-1');
      expect(trace?.traces).toEqual([]);
    });
  });

  describe('recordHookExecution', () => {
    it('should not record when disabled', () => {
      playback.startRequest('req-1');
      playback.recordHookExecution('req-1', 'hook-1', 'before', 'global', 100, 150, true);
      expect(playback.getHookTrace('req-1')).toBeUndefined();
    });

    it('should record successful hook execution', () => {
      playback.enable();
      playback.startRequest('req-1');
      playback.recordHookExecution('req-1', 'hook-1', 'before', 'global', 100, 150, true);
      
      const trace = playback.getHookTrace('req-1');
      expect(trace?.traces).toHaveLength(1);
      expect(trace?.traces[0]).toMatchObject({
        hookId: 'hook-1',
        type: 'before',
        level: 'global',
        startTime: 100,
        endTime: 150,
        duration: 50,
        success: true,
        order: 0,
      });
    });

    it('should record failed hook execution', () => {
      playback.enable();
      playback.startRequest('req-1');
      const error = new Error('Hook failed');
      playback.recordHookExecution('req-1', 'hook-1', 'before', 'global', 100, 150, false, error);
      
      const trace = playback.getHookTrace('req-1');
      expect(trace?.traces[0]).toMatchObject({
        success: false,
        error,
      });
    });

    it('should record multiple hooks in order', () => {
      playback.enable();
      playback.startRequest('req-1');
      playback.recordHookExecution('req-1', 'hook-1', 'before', 'global', 100, 110, true);
      playback.recordHookExecution('req-1', 'hook-2', 'before', 'route', 110, 120, true);
      playback.recordHookExecution('req-1', 'hook-3', 'after', 'local', 120, 130, true);
      
      const trace = playback.getHookTrace('req-1');
      expect(trace?.traces).toHaveLength(3);
      expect(trace?.traces[0].order).toBe(0);
      expect(trace?.traces[1].order).toBe(1);
      expect(trace?.traces[2].order).toBe(2);
    });

    it('should isolate traces by request ID', () => {
      playback.enable();
      playback.startRequest('req-1');
      playback.startRequest('req-2');
      playback.recordHookExecution('req-1', 'hook-1', 'before', 'global', 100, 110, true);
      playback.recordHookExecution('req-2', 'hook-2', 'before', 'global', 200, 210, true);
      
      const trace1 = playback.getHookTrace('req-1');
      const trace2 = playback.getHookTrace('req-2');
      
      expect(trace1?.traces).toHaveLength(1);
      expect(trace2?.traces).toHaveLength(1);
      expect(trace1?.traces[0].hookId).toBe('hook-1');
      expect(trace2?.traces[0].hookId).toBe('hook-2');
    });
  });

  describe('endRequest', () => {
    it('should set end time', () => {
      playback.enable();
      playback.startRequest('req-1');
      expect(playback.getHookTrace('req-1')?.endTime).toBeUndefined();
      
      playback.endRequest('req-1');
      expect(playback.getHookTrace('req-1')?.endTime).toBeDefined();
    });
  });

  describe('getAllTraces', () => {
    it('should return all traces', () => {
      playback.enable();
      playback.startRequest('req-1');
      playback.startRequest('req-2');
      
      const traces = playback.getAllTraces();
      expect(traces).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all traces', () => {
      playback.enable();
      playback.startRequest('req-1');
      playback.startRequest('req-2');
      
      playback.clear();
      expect(playback.getAllTraces()).toHaveLength(0);
    });
  });

  describe('clearRequest', () => {
    it('should clear specific request trace', () => {
      playback.enable();
      playback.startRequest('req-1');
      playback.startRequest('req-2');
      
      playback.clearRequest('req-1');
      expect(playback.getHookTrace('req-1')).toBeUndefined();
      expect(playback.getHookTrace('req-2')).toBeDefined();
    });
  });
});

// Property 37: Hook recording completeness
describe('Property 37: Hook recording completeness', () => {
  it('should record all hooks with correct order and timing', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('before', 'after', 'catch'),
            level: fc.constantFrom('global', 'route', 'local'),
            success: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (hooks) => {
          const playback = new HookPlayback();
          playback.enable();
          const requestId = 'test-request';
          playback.startRequest(requestId);

          let currentTime = 1000;
          for (const hook of hooks) {
            const startTime = currentTime;
            const endTime = currentTime + 10;
            const error = hook.success ? undefined : new Error('Hook failed');
            
            playback.recordHookExecution(
              requestId,
              hook.id,
              hook.type as 'before' | 'after' | 'catch',
              hook.level as 'global' | 'route' | 'local',
              startTime,
              endTime,
              hook.success,
              error
            );
            
            currentTime = endTime;
          }

          playback.endRequest(requestId);
          const trace = playback.getHookTrace(requestId);

          // All hooks recorded
          expect(trace?.traces).toHaveLength(hooks.length);

          // Execution order preserved
          for (let i = 0; i < hooks.length; i++) {
            expect(trace?.traces[i].order).toBe(i);
            expect(trace?.traces[i].hookId).toBe(hooks[i].id);
            expect(trace?.traces[i].type).toBe(hooks[i].type);
            expect(trace?.traces[i].level).toBe(hooks[i].level);
            expect(trace?.traces[i].success).toBe(hooks[i].success);
          }

          // Timing accuracy
          for (let i = 0; i < hooks.length; i++) {
            const expectedStart = 1000 + i * 10;
            const expectedEnd = expectedStart + 10;
            expect(trace?.traces[i].startTime).toBe(expectedStart);
            expect(trace?.traces[i].endTime).toBe(expectedEnd);
            expect(trace?.traces[i].duration).toBe(10);
          }

          // Error recording
          for (let i = 0; i < hooks.length; i++) {
            if (!hooks[i].success) {
              expect(trace?.traces[i].error).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
