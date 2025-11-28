/**
 * @module contracts/types/local-context
 * @description Local context contract for request-scoped state and hooks
 */

import type { GatiRequestEnvelope, GatiResponseEnvelope } from './envelope.js';
import type { GlobalContext } from './global-context.js';

/**
 * LocalContext - Request-scoped state management and lifecycle hooks
 * 
 * Provides key-value storage, hook registration, state snapshots,
 * and event/logging capabilities scoped to a single request.
 */
export interface LocalContext {
  /** Unique request identifier */
  requestId: string;
  
  /** Request metadata */
  meta: Record<string, any>;
  
  /**
   * Get value from request-scoped storage
   * 
   * @param k - Key to retrieve
   * @returns Value or undefined if not found
   */
  get<T = any>(k: string): T | undefined;
  
  /**
   * Set value in request-scoped storage
   * 
   * @param k - Key to store
   * @param v - Value to store
   */
  set<T = any>(k: string, v: T): void;
  
  /**
   * Delete value from request-scoped storage
   * 
   * @param k - Key to delete
   */
  delete(k: string): void;
  
  /**
   * Clear all request-scoped storage
   */
  clean(): void;
  
  /**
   * Register hook to run before handler execution
   * 
   * @param fn - Hook function
   * @returns Hook ID for deregistration
   */
  before(fn: (env: GatiRequestEnvelope, gctx: GlobalContext) => Promise<void> | void): string;
  
  /**
   * Register hook to run after handler execution
   * 
   * @param fn - Hook function
   * @returns Hook ID for deregistration
   */
  after(fn: (env: GatiRequestEnvelope, res: GatiResponseEnvelope, gctx: GlobalContext) => Promise<void> | void): string;
  
  /**
   * Register hook to run on error
   * 
   * @param fn - Hook function
   * @returns Hook ID for deregistration
   */
  catch(fn: (err: any, env: GatiRequestEnvelope, gctx: GlobalContext) => Promise<void> | void): string;
  
  /**
   * Create snapshot of current context state
   * 
   * @returns Snapshot token for restoration
   */
  snapshot(): unknown;
  
  /**
   * Restore context from snapshot
   * 
   * @param snapshot - Snapshot token from previous snapshot()
   */
  restore(snapshot: unknown): void;
  
  /**
   * Publish event to request-scoped event bus
   * 
   * @param topic - Event topic
   * @param payload - Event payload
   * @returns Promise resolving when event is published
   */
  publishLocal(topic: string, payload: any): Promise<void>;
  
  /**
   * Log message with request correlation
   * 
   * @param message - Log message
   * @param level - Log level
   */
  log(message: string, level?: 'debug' | 'info' | 'warn' | 'error'): void;
}
