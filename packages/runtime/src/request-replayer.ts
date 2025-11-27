/**
 * @module runtime/request-replayer
 * @description Replays requests from snapshots
 */

import type { RequestTrace, ReplayOptions, ReplayResult, StageName } from './types/trace.js';
import type { TraceStorage } from './trace-storage.js';
import type { Request, Response } from './types/request.js';
import { computeDiff } from './diff-engine.js';

/**
 * Request replayer configuration
 */
export interface RequestReplayerConfig {
  /** Maximum replay duration (ms) */
  maxDuration: number;
  /** Enable comparison with original */
  enableComparison: boolean;
}

/**
 * Replays requests from stored traces
 */
export class RequestReplayer {
  constructor(
    private storage: TraceStorage,
    private config: Partial<RequestReplayerConfig> = {}
  ) {
    this.config = {
      maxDuration: config.maxDuration ?? 30000, // 30 seconds
      enableComparison: config.enableComparison ?? true,
    };
  }

  /**
   * Replay a request from a trace
   */
  async replay(options: ReplayOptions): Promise<ReplayResult> {
    const originalTrace = await this.storage.getTrace(options.traceId);
    if (!originalTrace) {
      throw new Error(`Trace not found: ${options.traceId}`);
    }

    const startTime = Date.now();
    const newTraceId = `${options.traceId}_replay_${startTime}`;

    try {
      // Get snapshot to replay from
      const snapshot = this.getSnapshotForStage(originalTrace, options.fromStage);
      if (!snapshot) {
        throw new Error(`No snapshot found for stage: ${options.fromStage || 'start'}`);
      }

      // Prepare request (with modifications if provided)
      const request = this.prepareRequest(originalTrace.request, options.modifiedRequest);

      // Execute replay (simplified - actual execution would go through pipeline)
      const response = await this.executeReplay(request, snapshot);

      // Compare with original if requested
      const diff = options.compare && this.config.enableComparison
        ? this.compareResults(originalTrace, response)
        : undefined;

      return {
        traceId: newTraceId,
        originalTraceId: options.traceId,
        timestamp: startTime,
        response,
        diff,
      };
    } catch (error) {
      return {
        traceId: newTraceId,
        originalTraceId: options.traceId,
        timestamp: startTime,
        error: {
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      };
    }
  }

  /**
   * Get snapshot for a specific stage
   */
  private getSnapshotForStage(trace: RequestTrace, stage?: StageName) {
    if (!stage) {
      // Return earliest snapshot
      const firstStage = trace.stages[0];
      return firstStage ? trace.snapshots[firstStage.snapshotId] : null;
    }

    // Find stage and return its snapshot
    const targetStage = this.findStage(trace.stages, stage);
    return targetStage ? trace.snapshots[targetStage.snapshotId] : null;
  }

  /**
   * Find stage by name (recursive)
   */
  private findStage(stages: RequestTrace['stages'], name: StageName): RequestTrace['stages'][0] | null {
    for (const stage of stages) {
      if (stage.name === name) return stage;
      if (stage.children) {
        const found = this.findStage(stage.children, name);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Prepare request with modifications
   */
  private prepareRequest(original: Request, modifications?: Partial<Request>): Request {
    if (!modifications) return original;

    return {
      ...original,
      ...modifications,
      headers: { ...original.headers, ...modifications.headers },
      query: { ...original.query, ...modifications.query },
    };
  }

  /**
   * Execute replay (simplified)
   */
  private async executeReplay(request: Request, snapshot: any): Promise<Response> {
    // In a real implementation, this would:
    // 1. Restore LocalContext from snapshot
    // 2. Re-execute handler with restored context
    // 3. Capture new response
    
    // For now, return a mock response
    return {
      statusCode: 200,
      headers: {},
      body: { replayed: true, timestamp: Date.now() },
    } as Response;
  }

  /**
   * Compare replay result with original
   */
  private compareResults(originalTrace: RequestTrace, replayResponse: Response) {
    if (!originalTrace.response) return undefined;

    // Create mock snapshots for comparison
    const originalSnapshot = {
      requestId: originalTrace.id,
      timestamp: originalTrace.timestamp,
      state: { response: originalTrace.response },
      outstandingPromises: [],
      lastHookIndex: 0,
      phase: 'completed' as any,
      traceId: originalTrace.id,
      clientId: 'original',
    };

    const replaySnapshot = {
      ...originalSnapshot,
      state: { response: replayResponse },
      clientId: 'replay',
    };

    return computeDiff(originalSnapshot, replaySnapshot);
  }

  /**
   * Validate replay is possible
   */
  async canReplay(traceId: string, fromStage?: StageName): Promise<boolean> {
    const trace = await this.storage.getTrace(traceId);
    if (!trace) return false;

    const snapshot = this.getSnapshotForStage(trace, fromStage);
    return snapshot !== null;
  }

  /**
   * Get available replay stages for a trace
   */
  async getReplayStages(traceId: string): Promise<StageName[]> {
    const trace = await this.storage.getTrace(traceId);
    if (!trace) return [];

    const stages: StageName[] = [];
    this.collectStageNames(trace.stages, stages);
    return stages;
  }

  /**
   * Collect stage names recursively
   */
  private collectStageNames(stages: RequestTrace['stages'], result: StageName[]): void {
    for (const stage of stages) {
      result.push(stage.name);
      if (stage.children) {
        this.collectStageNames(stage.children, result);
      }
    }
  }
}

/**
 * Create a request replayer instance
 */
export function createRequestReplayer(
  storage: TraceStorage,
  config?: Partial<RequestReplayerConfig>
): RequestReplayer {
  return new RequestReplayer(storage, config);
}
