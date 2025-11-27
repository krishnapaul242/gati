/**
 * @module runtime/trace-collector
 * @description Collects request traces through the pipeline
 */

import type { Request, Response } from './types/request.js';
import type { LocalContext } from './types/context.js';
import type { RequestTrace, TraceStage, StageName, TraceStatus } from './types/trace.js';

/**
 * Trace collector configuration
 */
export interface TraceCollectorConfig {
  /** Enable trace collection */
  enabled: boolean;
  /** Maximum traces to keep in memory */
  maxTraces: number;
  /** Trace retention time (ms) */
  retentionMs: number;
}

/**
 * Active trace being collected
 */
interface ActiveTrace {
  trace: RequestTrace;
  stageStack: TraceStage[];
}

/**
 * Collects request traces through pipeline stages
 */
export class TraceCollector {
  private activeTraces = new Map<string, ActiveTrace>();
  private config: TraceCollectorConfig;

  constructor(config: Partial<TraceCollectorConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      maxTraces: config.maxTraces ?? 1000,
      retentionMs: config.retentionMs ?? 300000, // 5 minutes
    };
  }

  /**
   * Start collecting a trace for a request
   */
  startTrace(request: Request, traceId: string): void {
    if (!this.config.enabled) return;

    const trace: RequestTrace = {
      id: traceId,
      timestamp: Date.now(),
      request,
      stages: [],
      snapshots: {},
      duration: 0,
      status: 'pending',
    };

    this.activeTraces.set(traceId, {
      trace,
      stageStack: [],
    });

    this.enforceMemoryLimits();
  }

  /**
   * Capture a pipeline stage
   */
  captureStage(traceId: string, stage: StageName, metadata: Record<string, unknown> = {}): void {
    if (!this.config.enabled) return;

    const active = this.activeTraces.get(traceId);
    if (!active) return;

    const traceStage: TraceStage = {
      name: stage,
      startTime: Date.now(),
      snapshotId: `${traceId}_${stage}_${Date.now()}`,
      metadata,
    };

    // Add to parent stage if exists, otherwise to root
    const parent = active.stageStack[active.stageStack.length - 1];
    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(traceStage);
    } else {
      active.trace.stages.push(traceStage);
    }

    active.stageStack.push(traceStage);
  }

  /**
   * Capture a snapshot at current stage
   */
  captureSnapshot(traceId: string, lctx: LocalContext): void {
    if (!this.config.enabled) return;

    const active = this.activeTraces.get(traceId);
    if (!active) return;

    const currentStage = active.stageStack[active.stageStack.length - 1];
    if (!currentStage) return;

    const snapshot = lctx.snapshot.create();
    active.trace.snapshots[currentStage.snapshotId] = snapshot;
  }

  /**
   * Complete current stage
   */
  completeStage(traceId: string): void {
    if (!this.config.enabled) return;

    const active = this.activeTraces.get(traceId);
    if (!active || active.stageStack.length === 0) return;

    const stage = active.stageStack.pop()!;
    stage.endTime = Date.now();
  }

  /**
   * End trace collection
   */
  endTrace(traceId: string, response?: Response, error?: Error): RequestTrace | null {
    if (!this.config.enabled) return null;

    const active = this.activeTraces.get(traceId);
    if (!active) return null;

    const trace = active.trace;
    trace.duration = Date.now() - trace.timestamp;
    trace.response = response;
    trace.status = error ? 'error' : 'success';

    if (error) {
      trace.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    this.activeTraces.delete(traceId);
    return trace;
  }

  /**
   * Get active trace
   */
  getActiveTrace(traceId: string): RequestTrace | null {
    const active = this.activeTraces.get(traceId);
    return active ? active.trace : null;
  }

  /**
   * Enable trace collection
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable trace collection
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Clear all active traces
   */
  clear(): void {
    this.activeTraces.clear();
  }

  /**
   * Get active trace count
   */
  getActiveCount(): number {
    return this.activeTraces.size;
  }

  /**
   * Enforce memory limits
   */
  private enforceMemoryLimits(): void {
    if (this.activeTraces.size <= this.config.maxTraces) return;

    // Remove oldest traces
    const entries = Array.from(this.activeTraces.entries());
    const toRemove = entries
      .sort((a, b) => a[1].trace.timestamp - b[1].trace.timestamp)
      .slice(0, entries.length - this.config.maxTraces);

    toRemove.forEach(([id]) => this.activeTraces.delete(id));
  }
}

/**
 * Create a trace collector instance
 */
export function createTraceCollector(config?: Partial<TraceCollectorConfig>): TraceCollector {
  return new TraceCollector(config);
}
