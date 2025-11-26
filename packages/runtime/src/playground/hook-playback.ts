/**
 * @module runtime/playground/hook-playback
 * @description Hook execution recording and playback for Playground visualization
 * 
 * Implements Task 21 Phase 4: Hook Playback API
 * - Records hook execution traces with timing
 * - Captures errors and execution order
 * - Supports replay functionality for debugging
 */

/**
 * Hook execution trace entry
 */
export interface HookExecutionTrace {
  hookId: string;
  type: 'before' | 'after' | 'catch';
  level: 'global' | 'route' | 'local';
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: Error;
  order: number;
}

/**
 * Request trace containing all hook executions
 */
export interface RequestTrace {
  requestId: string;
  traces: HookExecutionTrace[];
  startTime: number;
  endTime?: number;
}

/**
 * Hook playback system for recording and replaying hook executions
 */
export class HookPlayback {
  private traces = new Map<string, RequestTrace>();
  private enabled = false;

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  startRequest(requestId: string): void {
    if (!this.enabled) return;
    this.traces.set(requestId, {
      requestId,
      traces: [],
      startTime: Date.now(),
    });
  }

  endRequest(requestId: string): void {
    if (!this.enabled) return;
    const trace = this.traces.get(requestId);
    if (trace) trace.endTime = Date.now();
  }

  recordHookExecution(
    requestId: string,
    hookId: string,
    type: 'before' | 'after' | 'catch',
    level: 'global' | 'route' | 'local',
    startTime: number,
    endTime: number,
    success: boolean,
    error?: Error
  ): void {
    if (!this.enabled) return;
    const trace = this.traces.get(requestId);
    if (!trace) return;

    trace.traces.push({
      hookId,
      type,
      level,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      error,
      order: trace.traces.length,
    });
  }

  getHookTrace(requestId: string): RequestTrace | undefined {
    return this.traces.get(requestId);
  }

  getAllTraces(): RequestTrace[] {
    return Array.from(this.traces.values());
  }

  clear(): void {
    this.traces.clear();
  }

  clearRequest(requestId: string): void {
    this.traces.delete(requestId);
  }
}
