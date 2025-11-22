/**
 * @module runtime/hook-orchestrator
 * @description Hook orchestration system for request lifecycle management
 * 
 * Implements Task 5: LCC Lifecycle Orchestration
 * - Executes hooks in correct order (global → route → local)
 * - Supports async hooks with timeout and retry
 * - Emits lifecycle events for observability
 * - Integrates request/response validation
 */

import type { LocalContext, GlobalContext } from './types/context.js';
import type { Request, Response } from './types/index.js';
import type { GType, ValidationResult } from './gtype/index.js';
import { validate, ValidationException } from './gtype/index.js';

/**
 * Hook function signature
 */
export type HookFunction = (
  lctx: LocalContext,
  gctx: GlobalContext
) => void | Promise<void>;

/**
 * Hook with metadata
 */
export interface Hook {
  /**
   * Unique hook identifier
   */
  id: string;
  
  /**
   * Hook function
   */
  fn: HookFunction;
  
  /**
   * Hook level (global, route, local)
   */
  level: 'global' | 'route' | 'local';
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Number of retries on failure
   */
  retries?: number;
  
  /**
   * Whether hook is async
   */
  async: boolean;
}

/**
 * Lifecycle event types
 */
export type LifecycleEventType =
  | 'hook:start'
  | 'hook:end'
  | 'hook:error'
  | 'hook:retry'
  | 'handler:start'
  | 'handler:end'
  | 'handler:error'
  | 'validation:start'
  | 'validation:end'
  | 'validation:error';

/**
 * Lifecycle event
 */
export interface LifecycleEvent {
  type: LifecycleEventType;
  timestamp: number;
  requestId: string;
  hookId?: string;
  error?: Error;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Hook orchestrator configuration
 */
export interface HookOrchestratorConfig {
  /**
   * Default timeout for hooks (ms)
   */
  defaultTimeout?: number;
  
  /**
   * Default number of retries
   */
  defaultRetries?: number;
  
  /**
   * Whether to emit lifecycle events
   */
  emitEvents?: boolean;
  
  /**
   * Event handler
   */
  onEvent?: (event: LifecycleEvent) => void;
}

/**
 * Hook orchestrator for managing request lifecycle
 */
export class HookOrchestrator {
  private beforeHooks: Hook[] = [];
  private afterHooks: Hook[] = [];
  private catchHooks: Hook[] = [];
  private config: Required<HookOrchestratorConfig>;
  
  constructor(config: HookOrchestratorConfig = {}) {
    this.config = {
      defaultTimeout: config.defaultTimeout ?? 5000,
      defaultRetries: config.defaultRetries ?? 0,
      emitEvents: config.emitEvents ?? true,
      onEvent: config.onEvent ?? (() => {}),
    };
  }
  
  /**
   * Register a before hook
   */
  registerBefore(hook: Omit<Hook, 'async'>): void {
    this.beforeHooks.push({
      ...hook,
      async: this.isAsync(hook.fn),
      timeout: hook.timeout ?? this.config.defaultTimeout,
      retries: hook.retries ?? this.config.defaultRetries,
    });
    
    // Sort by level: global → route → local
    this.sortHooks(this.beforeHooks);
  }
  
  /**
   * Register an after hook
   */
  registerAfter(hook: Omit<Hook, 'async'>): void {
    this.afterHooks.push({
      ...hook,
      async: this.isAsync(hook.fn),
      timeout: hook.timeout ?? this.config.defaultTimeout,
      retries: hook.retries ?? this.config.defaultRetries,
    });
    
    // Sort by level: local → route → global (reverse order)
    this.sortHooks(this.afterHooks, true);
  }
  
  /**
   * Register a catch hook
   */
  registerCatch(hook: Omit<Hook, 'async'>): void {
    this.catchHooks.push({
      ...hook,
      async: this.isAsync(hook.fn),
      timeout: hook.timeout ?? this.config.defaultTimeout,
      retries: hook.retries ?? this.config.defaultRetries,
    });
    
    // Sort by level: local → route → global (reverse order)
    this.sortHooks(this.catchHooks, true);
  }
  
  /**
   * Execute before hooks
   */
  async executeBefore(lctx: LocalContext, gctx: GlobalContext): Promise<void> {
    for (const hook of this.beforeHooks) {
      await this.executeHook(hook, lctx, gctx);
    }
  }
  
  /**
   * Execute after hooks
   */
  async executeAfter(lctx: LocalContext, gctx: GlobalContext): Promise<void> {
    for (const hook of this.afterHooks) {
      await this.executeHook(hook, lctx, gctx);
    }
  }
  
  /**
   * Execute catch hooks
   */
  async executeCatch(
    error: Error,
    lctx: LocalContext,
    gctx: GlobalContext
  ): Promise<void> {
    for (const hook of this.catchHooks) {
      try {
        await this.executeHook(hook, lctx, gctx);
      } catch (hookError) {
        // Log but don't throw - catch hooks should not fail the request
        console.error(`Catch hook ${hook.id} failed:`, hookError);
      }
    }
  }
  
  /**
   * Validate request against schema
   */
  async validateRequest(
    req: Request,
    schema: GType,
    lctx: LocalContext
  ): Promise<void> {
    this.emitEvent({
      type: 'validation:start',
      timestamp: Date.now(),
      requestId: lctx.requestId,
      metadata: { phase: 'request' },
    });
    
    const start = Date.now();
    const result = validate(req.body, schema);
    const duration = Date.now() - start;
    
    if (!result.valid) {
      this.emitEvent({
        type: 'validation:error',
        timestamp: Date.now(),
        requestId: lctx.requestId,
        duration,
        metadata: { phase: 'request', errors: result.errors },
      });
      
      throw new ValidationException(result.errors, 'Request validation failed');
    }
    
    this.emitEvent({
      type: 'validation:end',
      timestamp: Date.now(),
      requestId: lctx.requestId,
      duration,
      metadata: { phase: 'request' },
    });
  }
  
  /**
   * Validate response against schema
   */
  async validateResponse(
    data: unknown,
    schema: GType,
    lctx: LocalContext
  ): Promise<void> {
    this.emitEvent({
      type: 'validation:start',
      timestamp: Date.now(),
      requestId: lctx.requestId,
      metadata: { phase: 'response' },
    });
    
    const start = Date.now();
    const result = validate(data, schema);
    const duration = Date.now() - start;
    
    if (!result.valid) {
      this.emitEvent({
        type: 'validation:error',
        timestamp: Date.now(),
        requestId: lctx.requestId,
        duration,
        metadata: { phase: 'response', errors: result.errors },
      });
      
      throw new ValidationException(result.errors, 'Response validation failed');
    }
    
    this.emitEvent({
      type: 'validation:end',
      timestamp: Date.now(),
      requestId: lctx.requestId,
      duration,
      metadata: { phase: 'response' },
    });
  }
  
  /**
   * Execute a single hook with timeout and retry
   */
  private async executeHook(
    hook: Hook,
    lctx: LocalContext,
    gctx: GlobalContext
  ): Promise<void> {
    let lastError: Error | undefined;
    const maxAttempts = (hook.retries ?? 0) + 1;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        this.emitEvent({
          type: 'hook:retry',
          timestamp: Date.now(),
          requestId: lctx.requestId,
          hookId: hook.id,
          metadata: { attempt, maxAttempts },
        });
      }
      
      this.emitEvent({
        type: 'hook:start',
        timestamp: Date.now(),
        requestId: lctx.requestId,
        hookId: hook.id,
        metadata: { level: hook.level, attempt },
      });
      
      const start = Date.now();
      
      try {
        await this.executeWithTimeout(
          () => hook.fn(lctx, gctx),
          hook.timeout!
        );
        
        const duration = Date.now() - start;
        
        this.emitEvent({
          type: 'hook:end',
          timestamp: Date.now(),
          requestId: lctx.requestId,
          hookId: hook.id,
          duration,
          metadata: { level: hook.level },
        });
        
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const duration = Date.now() - start;
        
        this.emitEvent({
          type: 'hook:error',
          timestamp: Date.now(),
          requestId: lctx.requestId,
          hookId: hook.id,
          error: lastError,
          duration,
          metadata: { level: hook.level, attempt },
        });
        
        // If this was the last attempt, throw
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Hook timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }
  
  /**
   * Check if function is async
   */
  private isAsync(fn: HookFunction): boolean {
    return fn.constructor.name === 'AsyncFunction';
  }
  
  /**
   * Sort hooks by level
   */
  private sortHooks(hooks: Hook[], reverse = false): void {
    const levelOrder = { global: 0, route: 1, local: 2 };
    
    hooks.sort((a, b) => {
      const orderA = levelOrder[a.level];
      const orderB = levelOrder[b.level];
      return reverse ? orderB - orderA : orderA - orderB;
    });
  }
  
  /**
   * Emit lifecycle event
   */
  private emitEvent(event: LifecycleEvent): void {
    if (this.config.emitEvents) {
      this.config.onEvent(event);
    }
  }
  
  /**
   * Get all registered hooks
   */
  getHooks(): {
    before: Hook[];
    after: Hook[];
    catch: Hook[];
  } {
    return {
      before: [...this.beforeHooks],
      after: [...this.afterHooks],
      catch: [...this.catchHooks],
    };
  }
  
  /**
   * Clear all hooks
   */
  clear(): void {
    this.beforeHooks = [];
    this.afterHooks = [];
    this.catchHooks = [];
  }
}
