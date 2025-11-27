/**
 * @module runtime/trace-storage
 * @description Storage for request traces with TTL-based expiration
 */

import type { RequestTrace, TraceFilter } from './types/trace.js';

/**
 * Trace storage configuration
 */
export interface TraceStorageConfig {
  /** Maximum traces to store */
  maxTraces: number;
  /** Default TTL in milliseconds */
  ttlMs: number;
  /** Enable compression */
  compression: boolean;
}

/**
 * Stored trace with metadata
 */
interface StoredTrace {
  trace: RequestTrace;
  expiresAt: number;
  compressed: boolean;
}

/**
 * Storage interface for traces
 */
export interface TraceStorage {
  storeTrace(trace: RequestTrace): Promise<void>;
  getTrace(traceId: string): Promise<RequestTrace | null>;
  listTraces(filter?: TraceFilter): Promise<RequestTrace[]>;
  deleteTrace(traceId: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): { count: number; size: number };
}

/**
 * In-memory trace storage with TTL
 */
export class InMemoryTraceStorage implements TraceStorage {
  private traces = new Map<string, StoredTrace>();
  private config: TraceStorageConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<TraceStorageConfig> = {}) {
    this.config = {
      maxTraces: config.maxTraces ?? 1000,
      ttlMs: config.ttlMs ?? 300000, // 5 minutes
      compression: config.compression ?? true,
    };

    this.startCleanup();
  }

  async storeTrace(trace: RequestTrace): Promise<void> {
    const stored: StoredTrace = {
      trace: this.config.compression ? this.compress(trace) : trace,
      expiresAt: Date.now() + this.config.ttlMs,
      compressed: this.config.compression,
    };

    this.traces.set(trace.id, stored);
    this.enforceLimit();
  }

  async getTrace(traceId: string): Promise<RequestTrace | null> {
    const stored = this.traces.get(traceId);
    if (!stored) return null;

    if (Date.now() > stored.expiresAt) {
      this.traces.delete(traceId);
      return null;
    }

    return stored.compressed ? this.decompress(stored.trace) : stored.trace;
  }

  async listTraces(filter?: TraceFilter): Promise<RequestTrace[]> {
    const now = Date.now();
    const traces: RequestTrace[] = [];

    for (const [id, stored] of this.traces.entries()) {
      if (now > stored.expiresAt) {
        this.traces.delete(id);
        continue;
      }

      const trace = stored.compressed ? this.decompress(stored.trace) : stored.trace;

      if (this.matchesFilter(trace, filter)) {
        traces.push(trace);
      }
    }

    // Apply limit
    if (filter?.limit) {
      return traces.slice(0, filter.limit);
    }

    return traces;
  }

  async deleteTrace(traceId: string): Promise<boolean> {
    return this.traces.delete(traceId);
  }

  async clear(): Promise<void> {
    this.traces.clear();
  }

  getStats(): { count: number; size: number } {
    let size = 0;
    for (const stored of this.traces.values()) {
      size += JSON.stringify(stored.trace).length;
    }
    return { count: this.traces.size, size };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.traces.clear();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, stored] of this.traces.entries()) {
        if (now > stored.expiresAt) {
          this.traces.delete(id);
        }
      }
    }, 60000); // Every minute

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private enforceLimit(): void {
    if (this.traces.size <= this.config.maxTraces) return;

    const entries = Array.from(this.traces.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

    const toRemove = entries.slice(0, entries.length - this.config.maxTraces);
    toRemove.forEach(([id]) => this.traces.delete(id));
  }

  private matchesFilter(trace: RequestTrace, filter?: TraceFilter): boolean {
    if (!filter) return true;

    if (filter.status && trace.status !== filter.status) return false;
    if (filter.path && !trace.request.path.includes(filter.path)) return false;
    if (filter.startTime && trace.timestamp < filter.startTime) return false;
    if (filter.endTime && trace.timestamp > filter.endTime) return false;

    return true;
  }

  private compress(trace: RequestTrace): RequestTrace {
    // Simple compression: remove large response bodies
    const compressed = { ...trace };
    if (compressed.response?.body && typeof compressed.response.body === 'string') {
      if (compressed.response.body.length > 1000) {
        compressed.response = {
          ...compressed.response,
          body: compressed.response.body.slice(0, 1000) + '... [truncated]',
        };
      }
    }
    return compressed;
  }

  private decompress(trace: RequestTrace): RequestTrace {
    // No actual decompression needed for our simple compression
    return trace;
  }
}

/**
 * Create a trace storage instance
 */
export function createTraceStorage(config?: Partial<TraceStorageConfig>): TraceStorage {
  return new InMemoryTraceStorage(config);
}
