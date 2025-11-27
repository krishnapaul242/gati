/**
 * @module runtime/diff-engine.test
 * @description Unit tests for DiffEngine
 */

import { describe, it, expect } from 'vitest';
import { computeDiff, applyDiff } from './diff-engine.js';
import type { SnapshotToken } from './types/context.js';
import { RequestPhase } from './types/context.js';

describe('DiffEngine', () => {
  const createSnapshot = (state: Record<string, unknown>): SnapshotToken => ({
    requestId: 'req-1',
    timestamp: Date.now(),
    state,
    outstandingPromises: [],
    lastHookIndex: 0,
    phase: RequestPhase.PROCESSING,
    traceId: 'trace-1',
    clientId: 'client-1',
  });

  describe('computeDiff', () => {
    it('should detect added keys', () => {
      const from = createSnapshot({ a: 1 });
      const to = createSnapshot({ a: 1, b: 2 });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(1);
      expect(diff.operations[0]).toMatchObject({
        op: 'add',
        path: 'state.b',
        newValue: 2,
      });
    });

    it('should detect removed keys', () => {
      const from = createSnapshot({ a: 1, b: 2 });
      const to = createSnapshot({ a: 1 });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(1);
      expect(diff.operations[0]).toMatchObject({
        op: 'remove',
        path: 'state.b',
        oldValue: 2,
      });
    });

    it('should detect replaced values', () => {
      const from = createSnapshot({ a: 1 });
      const to = createSnapshot({ a: 2 });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(1);
      expect(diff.operations[0]).toMatchObject({
        op: 'replace',
        path: 'state.a',
        oldValue: 1,
        newValue: 2,
      });
    });

    it('should handle nested objects', () => {
      const from = createSnapshot({ user: { name: 'Alice', age: 30 } });
      const to = createSnapshot({ user: { name: 'Alice', age: 31 } });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(1);
      expect(diff.operations[0]).toMatchObject({
        op: 'replace',
        path: 'state.user.age',
        oldValue: 30,
        newValue: 31,
      });
    });

    it('should handle arrays', () => {
      const from = createSnapshot({ items: [1, 2, 3] });
      const to = createSnapshot({ items: [1, 2, 3, 4] });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(1);
      expect(diff.operations[0].op).toBe('replace');
      expect(diff.operations[0].path).toBe('state.items');
    });

    it('should return empty diff for identical snapshots', () => {
      const from = createSnapshot({ a: 1, b: 2 });
      const to = createSnapshot({ a: 1, b: 2 });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(0);
    });

    it('should handle complex nested structures', () => {
      const from = createSnapshot({
        user: { name: 'Alice', settings: { theme: 'dark' } },
        count: 5,
      });
      const to = createSnapshot({
        user: { name: 'Bob', settings: { theme: 'dark' } },
        count: 5,
      });

      const diff = computeDiff(from, to);

      expect(diff.operations).toHaveLength(1);
      expect(diff.operations[0]).toMatchObject({
        op: 'replace',
        path: 'state.user.name',
        oldValue: 'Alice',
        newValue: 'Bob',
      });
    });
  });

  describe('applyDiff', () => {
    it('should apply add operation', () => {
      const snapshot = createSnapshot({ a: 1 });
      const diff = computeDiff(snapshot, createSnapshot({ a: 1, b: 2 }));

      const result = applyDiff(snapshot, diff);

      expect(result.state).toEqual({ a: 1, b: 2 });
    });

    it('should apply remove operation', () => {
      const snapshot = createSnapshot({ a: 1, b: 2 });
      const diff = computeDiff(snapshot, createSnapshot({ a: 1 }));

      const result = applyDiff(snapshot, diff);

      expect(result.state).toEqual({ a: 1 });
    });

    it('should apply replace operation', () => {
      const snapshot = createSnapshot({ a: 1 });
      const diff = computeDiff(snapshot, createSnapshot({ a: 2 }));

      const result = applyDiff(snapshot, diff);

      expect(result.state).toEqual({ a: 2 });
    });

    it('should apply nested operations', () => {
      const snapshot = createSnapshot({ user: { name: 'Alice', age: 30 } });
      const target = createSnapshot({ user: { name: 'Alice', age: 31 } });
      const diff = computeDiff(snapshot, target);

      const result = applyDiff(snapshot, diff);

      expect(result.state).toEqual({ user: { name: 'Alice', age: 31 } });
    });

    it('should satisfy identity property', () => {
      const from = createSnapshot({ a: 1, b: { c: 2 }, d: [1, 2, 3] });
      const to = createSnapshot({ a: 2, b: { c: 3 }, e: 4 });

      const diff = computeDiff(from, to);
      const result = applyDiff(from, diff);

      expect(result.state).toEqual(to.state);
    });

    it('should not mutate original snapshot', () => {
      const snapshot = createSnapshot({ a: 1 });
      const diff = computeDiff(snapshot, createSnapshot({ a: 2 }));

      applyDiff(snapshot, diff);

      expect(snapshot.state).toEqual({ a: 1 });
    });
  });

  describe('performance', () => {
    it('should compute diff quickly for typical snapshots', () => {
      const from = createSnapshot({
        userId: '123',
        sessionId: 'abc',
        data: { count: 5, items: [1, 2, 3] },
      });
      const to = createSnapshot({
        userId: '123',
        sessionId: 'abc',
        data: { count: 6, items: [1, 2, 3, 4] },
      });

      const start = performance.now();
      computeDiff(from, to);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5); // Should be <5ms
    });
  });
});
