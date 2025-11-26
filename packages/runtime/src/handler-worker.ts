/**
 * @module runtime/handler-worker
 * @description Handler Worker execution engine for stateless handler invocation
 */

import type { Handler } from './types/handler.js';
import type { Request } from './types/request.js';
import type { Response } from './types/response.js';
import type { GlobalContext, HealthStatus } from './types/context.js';
import { HookOrchestrator, type HookOrchestratorConfig } from './hook-orchestrator.js';
import { createLocalContext, cleanupLocalContext } from './local-context.js';

/**
 * Handler Worker configuration
 */
export interface HandlerWorkerConfig {
  /**
   * Default timeout for handler execution (milliseconds)
   * @default 30000
   */
  defaultTimeout?: number;

  /**
   * Enable metrics tracking
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Enable health check
   * @default true
   */
  enableHealthCheck?: boolean;

  /**
   * Hook orchestrator configuration
   */
  orchestratorConfig?: HookOrchestratorConfig;
}

/**
 * Handler Worker - Stateless execution engine for handlers
 * 
 * @example
 * ```typescript
 * const worker = new HandlerWorker(gctx);
 * 
 * worker.registerHandler('getUser', async (req, res, gctx, lctx) => {
 *   const user = await gctx.modules['db'].users.findById(req.params.id);
 *   res.json({ user });
 * });
 * 
 * await worker.executeHandler('getUser', req, res);
 * ```
 */
export class HandlerWorker {
  private handlers = new Map<string, Handler>();
  private orchestrator: HookOrchestrator;
  private gctx: GlobalContext;
  private config: Required<HandlerWorkerConfig>;
  private startTime: number;
  private requestCount = 0;
  private errorCount = 0;

  constructor(gctx: GlobalContext, config: HandlerWorkerConfig = {}) {
    this.gctx = gctx;
    this.config = {
      defaultTimeout: config.defaultTimeout ?? 30000,
      enableMetrics: config.enableMetrics ?? true,
      enableHealthCheck: config.enableHealthCheck ?? true,
      orchestratorConfig: config.orchestratorConfig ?? {},
    };
    this.orchestrator = new HookOrchestrator(this.config.orchestratorConfig);
    this.startTime = Date.now();
  }

  /**
   * Register a handler
   * 
   * @param id - Unique handler identifier
   * @param handler - Handler function with signature (req, res, gctx, lctx)
   * @throws {Error} If handler ID is invalid, handler is not a function, or has wrong parameter count
   * 
   * @example
   * ```typescript
   * worker.registerHandler('getUser', (req, res, gctx, lctx) => {
   *   res.json({ id: req.params.id });
   * });
   * ```
   */
  registerHandler(id: string, handler: Handler): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Handler ID must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    if (handler.length !== 4) {
      throw new Error('Handler must accept exactly 4 parameters (req, res, gctx, lctx)');
    }
    if (this.handlers.has(id)) {
      throw new Error(`Handler with ID "${id}" already registered`);
    }
    this.handlers.set(id, handler);
  }

  /**
   * Unregister a handler
   * 
   * @param id - Handler identifier
   * @returns true if handler was removed, false if not found
   */
  unregisterHandler(id: string): boolean {
    return this.handlers.delete(id);
  }

  /**
   * Get number of registered handlers
   * 
   * @returns Handler count
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }

  /**
   * Execute a handler with stateless execution
   * 
   * @param handlerId - Handler identifier
   * @param req - Request object
   * @param res - Response object
   * @throws {Error} If handler not found or execution fails
   * 
   * @example
   * ```typescript
   * await worker.executeHandler('getUser', req, res);
   * ```
   */
  async executeHandler(
    handlerId: string,
    req: Request,
    res: Response
  ): Promise<void> {
    const handler = this.handlers.get(handlerId);
    if (!handler) {
      throw new Error(`Handler "${handlerId}" not found`);
    }

    if (this.config.enableMetrics) {
      this.requestCount++;
    }

    const lctx = createLocalContext({
      meta: {
        timestamp: Date.now(),
        instanceId: this.gctx.instance.id,
        region: this.gctx.instance.region,
        method: req.method,
        path: req.path,
      },
    });

    try {
      await this.orchestrator.executeBefore(lctx, this.gctx);
      await Promise.resolve(handler(req, res, this.gctx, lctx));
      await this.orchestrator.executeAfter(lctx, this.gctx);
    } catch (error) {
      if (this.config.enableMetrics) {
        this.errorCount++;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      await this.orchestrator.executeCatch(err, lctx, this.gctx);
      throw error;
    } finally {
      await cleanupLocalContext(lctx);
    }
  }

  /**
   * Get health status
   * 
   * @returns Health status with checks
   * 
   * @example
   * ```typescript
   * const status = worker.getHealthStatus();
   * console.log(status.status); // 'healthy' | 'degraded' | 'unhealthy'
   * ```
   */
  getHealthStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 
      ? (this.errorCount / this.requestCount) * 100 
      : 0;

    const checks: HealthStatus['checks'] = {
      handlers: {
        status: this.handlers.size > 0 ? 'pass' : 'fail',
        message: `${this.handlers.size} handler(s) registered`,
      },
      globalContext: {
        status: 'pass',
        message: 'Global context available',
      },
      uptime: {
        status: 'pass',
        message: `${uptime}ms`,
        duration: uptime,
      },
      requests: {
        status: 'pass',
        message: `${this.requestCount} requests processed`,
      },
      errors: {
        status: errorRate > 50 ? 'fail' : errorRate > 10 ? 'warn' : 'pass',
        message: `${this.errorCount} errors (${errorRate.toFixed(2)}% error rate)`,
      },
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (this.handlers.size === 0 || errorRate > 50) {
      status = 'unhealthy';
    } else if (errorRate > 10) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      timestamp: Date.now(),
    };
  }
}
