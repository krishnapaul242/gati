/**
 * @module runtime/diff-engine
 * @description Computes differences between snapshots
 */

import type { SnapshotToken } from './types/context.js';
import type { DiffOperation, SnapshotDiff } from './types/trace.js';

/**
 * Compute difference between two snapshots
 */
export function computeDiff(from: SnapshotToken, to: SnapshotToken): SnapshotDiff {
  const operations: DiffOperation[] = [];

  // Compare state objects
  compareObjects(from.state, to.state, 'state', operations);

  return {
    fromId: `${from.requestId}_${from.timestamp}`,
    toId: `${to.requestId}_${to.timestamp}`,
    operations,
    timestamp: Date.now(),
  };
}

/**
 * Apply diff operations to a snapshot
 */
export function applyDiff(snapshot: SnapshotToken, diff: SnapshotDiff): SnapshotToken {
  const result = { ...snapshot, state: { ...snapshot.state } };

  for (const op of diff.operations) {
    const path = op.path.split('.').slice(1); // Remove 'state' prefix
    
    if (op.op === 'add' || op.op === 'replace') {
      setPath(result.state, path, op.newValue);
    } else if (op.op === 'remove') {
      deletePath(result.state, path);
    }
  }

  return result;
}

/**
 * Compare two objects and generate diff operations
 */
function compareObjects(
  from: Record<string, unknown>,
  to: Record<string, unknown>,
  path: string,
  operations: DiffOperation[]
): void {
  const fromKeys = new Set(Object.keys(from));
  const toKeys = new Set(Object.keys(to));

  // Check for removed keys
  for (const key of fromKeys) {
    if (!toKeys.has(key)) {
      operations.push({
        op: 'remove',
        path: `${path}.${key}`,
        oldValue: from[key],
      });
    }
  }

  // Check for added or modified keys
  for (const key of toKeys) {
    const fromValue = from[key];
    const toValue = to[key];
    const keyPath = `${path}.${key}`;

    if (!fromKeys.has(key)) {
      // Added
      operations.push({
        op: 'add',
        path: keyPath,
        newValue: toValue,
      });
    } else if (!deepEqual(fromValue, toValue)) {
      // Modified
      if (isObject(fromValue) && isObject(toValue)) {
        compareObjects(
          fromValue as Record<string, unknown>,
          toValue as Record<string, unknown>,
          keyPath,
          operations
        );
      } else if (Array.isArray(fromValue) && Array.isArray(toValue)) {
        compareArrays(fromValue, toValue, keyPath, operations);
      } else {
        operations.push({
          op: 'replace',
          path: keyPath,
          oldValue: fromValue,
          newValue: toValue,
        });
      }
    }
  }
}

/**
 * Compare two arrays and generate diff operations
 */
function compareArrays(
  from: unknown[],
  to: unknown[],
  path: string,
  operations: DiffOperation[]
): void {
  if (from.length !== to.length || !deepEqual(from, to)) {
    operations.push({
      op: 'replace',
      path,
      oldValue: from,
      newValue: to,
    });
  }
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (isObject(a) && isObject(b)) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Check if value is a plain object
 */
function isObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Set value at path in object
 */
function setPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
  if (path.length === 0) return;

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!isObject(current[key])) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = value;
}

/**
 * Delete value at path in object
 */
function deletePath(obj: Record<string, unknown>, path: string[]): void {
  if (path.length === 0) return;

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!isObject(current[key])) return;
    current = current[key] as Record<string, unknown>;
  }

  delete current[path[path.length - 1]];
}
