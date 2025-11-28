/**
 * @module runtime/types/trace
 * @description Type definitions for request tracing and inspection
 */

import type { Request } from './request.js';
import type { Response } from './response.js';
import type { SnapshotToken } from './context.js';

/**
 * Pipeline stage names
 */
export type StageName = 'ingress' | 'route-manager' | 'lcc' | 'handler' | 'module';

/**
 * Trace status
 */
export type TraceStatus = 'pending' | 'success' | 'error';

/**
 * Debug gate status
 */
export type GateStatus = 'active' | 'triggered' | 'released';

/**
 * Individual pipeline stage in request trace
 */
export interface TraceStage {
  /** Stage name */
  name: StageName;
  /** Stage start time (ms since epoch) */
  startTime: number;
  /** Stage end time (ms since epoch) */
  endTime?: number;
  /** Snapshot ID for this stage */
  snapshotId: string;
  /** Stage-specific metadata */
  metadata: Record<string, unknown>;
  /** Child stages (e.g., module calls within handler) */
  children?: TraceStage[];
}

/**
 * Complete request trace through pipeline
 */
export interface RequestTrace {
  /** Unique trace ID */
  id: string;
  /** Trace creation timestamp */
  timestamp: number;
  /** Original request */
  request: Request;
  /** Response (if completed) */
  response?: Response;
  /** Pipeline stages */
  stages: TraceStage[];
  /** Snapshots by ID */
  snapshots: Record<string, SnapshotToken>;
  /** Total duration (ms) */
  duration: number;
  /** Trace status */
  status: TraceStatus;
  /** Error (if failed) */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Debug gate configuration
 */
export interface DebugGate {
  /** Gate ID */
  id: string;
  /** Trace ID this gate applies to */
  traceId: string;
  /** Stage to pause at */
  stage: StageName;
  /** Optional condition expression */
  condition?: string;
  /** Gate status */
  status: GateStatus;
  /** Creation timestamp */
  createdAt: number;
  /** Trigger timestamp */
  triggeredAt?: number;
}

/**
 * Snapshot difference operation
 */
export interface DiffOperation {
  /** Operation type */
  op: 'add' | 'remove' | 'replace';
  /** JSON path */
  path: string;
  /** Old value (for remove/replace) */
  oldValue?: unknown;
  /** New value (for add/replace) */
  newValue?: unknown;
}

/**
 * Snapshot diff result
 */
export interface SnapshotDiff {
  /** Source snapshot ID */
  fromId: string;
  /** Target snapshot ID */
  toId: string;
  /** Diff operations */
  operations: DiffOperation[];
  /** Computed at timestamp */
  timestamp: number;
}

/**
 * Trace filter options
 */
export interface TraceFilter {
  /** Filter by status */
  status?: TraceStatus;
  /** Filter by request path pattern */
  path?: string;
  /** Filter by time range (start) */
  startTime?: number;
  /** Filter by time range (end) */
  endTime?: number;
  /** Limit results */
  limit?: number;
}

/**
 * Replay options
 */
export interface ReplayOptions {
  /** Trace ID to replay */
  traceId: string;
  /** Stage to replay from */
  fromStage?: StageName;
  /** Modified request data */
  modifiedRequest?: Partial<Request>;
  /** Whether to compare with original */
  compare?: boolean;
}

/**
 * Replay result
 */
export interface ReplayResult {
  /** New trace ID */
  traceId: string;
  /** Original trace ID */
  originalTraceId: string;
  /** Replay timestamp */
  timestamp: number;
  /** New response */
  response?: Response;
  /** Comparison with original (if requested) */
  diff?: SnapshotDiff;
  /** Replay error */
  error?: {
    message: string;
    stack?: string;
  };
}
