/**
 * @module runtime/debug-gate-manager
 * @description Manages debug gates for pausing execution
 */

import type { DebugGate, StageName, GateStatus } from './types/trace.js';
import { EventEmitter } from 'events';

/**
 * Debug gate manager configuration
 */
export interface DebugGateManagerConfig {
  /** Enable debug gates */
  enabled: boolean;
  /** Default gate timeout (ms) */
  defaultTimeout: number;
}

/**
 * Gate trigger event
 */
export interface GateTriggerEvent {
  gateId: string;
  traceId: string;
  stage: StageName;
  timestamp: number;
}

/**
 * Manages debug gates for execution control
 */
export class DebugGateManager extends EventEmitter {
  private gates = new Map<string, DebugGate>();
  private pausedExecutions = new Map<string, { resolve: () => void; timeout?: NodeJS.Timeout }>();
  private config: DebugGateManagerConfig;

  constructor(config: Partial<DebugGateManagerConfig> = {}) {
    super();
    this.config = {
      enabled: config.enabled ?? false,
      defaultTimeout: config.defaultTimeout ?? 300000, // 5 minutes
    };
  }

  /**
   * Create a debug gate
   */
  createGate(traceId: string, stage: StageName, condition?: string): DebugGate {
    const gate: DebugGate = {
      id: `gate_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      traceId,
      stage,
      condition,
      status: 'active',
      createdAt: Date.now(),
    };

    this.gates.set(gate.id, gate);
    return gate;
  }

  /**
   * Check if execution should pause at gate
   */
  async checkGate(traceId: string, stage: StageName, context?: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) return;

    const gate = this.findActiveGate(traceId, stage);
    if (!gate) return;

    // Evaluate condition if present
    if (gate.condition && !this.evaluateCondition(gate.condition, context)) {
      return;
    }

    // Trigger gate
    gate.status = 'triggered';
    gate.triggeredAt = Date.now();

    this.emit('gate:triggered', {
      gateId: gate.id,
      traceId,
      stage,
      timestamp: Date.now(),
    } as GateTriggerEvent);

    // Pause execution
    await this.pauseExecution(gate.id);
  }

  /**
   * Release a gate and resume execution
   */
  releaseGate(gateId: string): boolean {
    const gate = this.gates.get(gateId);
    if (!gate) return false;

    gate.status = 'released';

    const paused = this.pausedExecutions.get(gateId);
    if (paused) {
      if (paused.timeout) clearTimeout(paused.timeout);
      paused.resolve();
      this.pausedExecutions.delete(gateId);
    }

    this.emit('gate:released', { gateId, timestamp: Date.now() });
    return true;
  }

  /**
   * Remove a gate
   */
  removeGate(gateId: string): boolean {
    const gate = this.gates.get(gateId);
    if (!gate) return false;

    // Release if triggered
    if (gate.status === 'triggered') {
      this.releaseGate(gateId);
    }

    return this.gates.delete(gateId);
  }

  /**
   * Get gate by ID
   */
  getGate(gateId: string): DebugGate | null {
    return this.gates.get(gateId) || null;
  }

  /**
   * List all gates for a trace
   */
  listGates(traceId?: string): DebugGate[] {
    const gates = Array.from(this.gates.values());
    return traceId ? gates.filter(g => g.traceId === traceId) : gates;
  }

  /**
   * Clear all gates
   */
  clear(): void {
    // Release all paused executions
    for (const gateId of this.pausedExecutions.keys()) {
      this.releaseGate(gateId);
    }
    this.gates.clear();
  }

  /**
   * Enable debug gates
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable debug gates
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
   * Find active gate for trace and stage
   */
  private findActiveGate(traceId: string, stage: StageName): DebugGate | null {
    for (const gate of this.gates.values()) {
      if (gate.traceId === traceId && gate.stage === stage && gate.status === 'active') {
        return gate;
      }
    }
    return null;
  }

  /**
   * Pause execution until gate is released
   */
  private pauseExecution(gateId: string): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.releaseGate(gateId);
      }, this.config.defaultTimeout);

      this.pausedExecutions.set(gateId, { resolve, timeout });
    });
  }

  /**
   * Evaluate gate condition
   */
  private evaluateCondition(condition: string, context?: Record<string, unknown>): boolean {
    if (!context) return true;

    try {
      // Simple condition evaluation (e.g., "userId === '123'")
      // In production, use a safe expression evaluator
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return func(context);
    } catch {
      return false;
    }
  }
}

/**
 * Create a debug gate manager instance
 */
export function createDebugGateManager(config?: Partial<DebugGateManagerConfig>): DebugGateManager {
  return new DebugGateManager(config);
}
