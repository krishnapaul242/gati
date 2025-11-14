/**
 * @module runtime/lifecycle-manager
 * @description Comprehensive lifecycle management for distributed Gati applications
 */

import type { 
  LifecycleHook, 
  HealthStatus, 
  LifecycleCoordinator
} from './types/context.js';
import { LifecyclePriority, RequestPhase } from './types/context.js';

/**
 * Distributed lifecycle manager
 */
export class LifecycleManager {
  private startupHooks: LifecycleHook[] = [];
  private shutdownHooks: LifecycleHook[] = [];
  private preShutdownHooks: LifecycleHook[] = [];
  private healthChecks: Map<string, () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; }>> = new Map();
  private configReloadHooks: Map<string, (config: Record<string, unknown>) => void | Promise<void>> = new Map();
  private memoryPressureHooks: Map<string, (level: 'low' | 'medium' | 'high') => void | Promise<void>> = new Map();
  private circuitBreakerHooks: Map<string, (service: string, state: 'open' | 'closed' | 'half-open') => void> = new Map();
  
  private isShuttingDownFlag = false;
  private coordinator?: LifecycleCoordinator;

  constructor(coordinator?: LifecycleCoordinator) {
    this.coordinator = coordinator;
  }

  /**
   * Register startup hook
   */
  onStartup(nameOrFn: string | (() => void | Promise<void>), fnOrPriority?: (() => void | Promise<void>) | LifecyclePriority, maybePriority?: LifecyclePriority): void {
    // Support both onStartup(name, fn, priority) and onStartup(fn, priority) signatures
    if (typeof nameOrFn === 'function') {
      // onStartup(fn, priority?)
      const fn = nameOrFn;
      const priority = (typeof fnOrPriority === 'number' ? fnOrPriority : LifecyclePriority.NORMAL) as LifecyclePriority;
      this.startupHooks.push({ name: `startup-${this.startupHooks.length}`, fn, priority });
    } else {
      // onStartup(name, fn, priority?)
      const name = nameOrFn;
      const fn = fnOrPriority as () => void | Promise<void>;
      const priority = maybePriority || LifecyclePriority.NORMAL;
      this.startupHooks.push({ name, fn, priority });
    }
    this.startupHooks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Register health check
   */
  onHealthCheck(name: string, fn: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; }>): void {
    this.healthChecks.set(name, fn);
  }

  /**
   * Register shutdown hook
   */
  onShutdown(nameOrFn: string | (() => void | Promise<void>), fnOrPriority?: (() => void | Promise<void>) | LifecyclePriority, maybePriority?: LifecyclePriority): void {
    // Support both onShutdown(name, fn, priority) and onShutdown(fn, priority) signatures
    if (typeof nameOrFn === 'function') {
      // onShutdown(fn, priority?)
      const fn = nameOrFn;
      const priority = (typeof fnOrPriority === 'number' ? fnOrPriority : LifecyclePriority.NORMAL) as LifecyclePriority;
      this.shutdownHooks.push({ name: `shutdown-${this.shutdownHooks.length}`, fn, priority });
    } else {
      // onShutdown(name, fn, priority?)
      const name = nameOrFn;
      const fn = fnOrPriority as () => void | Promise<void>;
      const priority = maybePriority || LifecyclePriority.NORMAL;
      this.shutdownHooks.push({ name, fn, priority });
    }
    this.shutdownHooks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Register pre-shutdown hook
   */
  onPreShutdown(nameOrFn: string | (() => void | Promise<void>), maybeFn?: () => void | Promise<void>): void {
    // Support both onPreShutdown(name, fn) and onPreShutdown(fn) signatures
    if (typeof nameOrFn === 'function') {
      // onPreShutdown(fn)
      this.preShutdownHooks.push({ 
        name: `pre-shutdown-${this.preShutdownHooks.length}`, 
        fn: nameOrFn, 
        priority: LifecyclePriority.HIGH 
      });
    } else {
      // onPreShutdown(name, fn)
      this.preShutdownHooks.push({ 
        name: nameOrFn, 
        fn: maybeFn!, 
        priority: LifecyclePriority.HIGH 
      });
    }
  }

  /**
   * Register config reload hook
   */
  onConfigReload(name: string, fn: (newConfig: Record<string, unknown>) => void | Promise<void>): void {
    this.configReloadHooks.set(name, fn);
  }

  /**
   * Register memory pressure hook
   */
  onMemoryPressure(name: string, fn: (level: 'low' | 'medium' | 'high') => void | Promise<void>): void {
    this.memoryPressureHooks.set(name, fn);
  }

  /**
   * Register circuit breaker hook
   */
  onCircuitBreakerChange(name: string, fn: (service: string, state: 'open' | 'closed' | 'half-open') => void): void {
    this.circuitBreakerHooks.set(name, fn);
  }

  /**
   * Execute startup hooks
   */
  async executeStartup(): Promise<void> {
    console.log('🚀 Executing startup hooks...');
    
    // Register with service discovery if coordinator available
    if (this.coordinator) {
      await this.coordinator.register();
    }

    for (const hook of this.startupHooks) {
      try {
        console.log(`  ⚡ Starting: ${hook.name}`);
        await Promise.resolve(hook.fn());
        console.log(`  ✅ Started: ${hook.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to start: ${hook.name}`, error);
        throw error;
      }
    }
    
    console.log('✅ All startup hooks completed');
  }

  /**
   * Execute health checks
   */
  async executeHealthChecks(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name, checkFn] of this.healthChecks) {
      const start = Date.now();
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise<{ status: 'fail'; message: string }>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        checks[name] = {
          ...result,
          duration: Date.now() - start,
        };

        if (result.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        checks[name] = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - start,
        };
        overallStatus = 'unhealthy';
      }
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      checks,
      timestamp: Date.now(),
    };

    // Report to coordinator if available
    if (this.coordinator) {
      try {
        await this.coordinator.reportHealth(healthStatus);
      } catch (error) {
        console.warn('Failed to report health to coordinator:', error);
      }
    }

    return healthStatus;
  }

  /**
   * Execute shutdown hooks
   */
  async executeShutdown(): Promise<void> {
    this.isShuttingDownFlag = true;
    console.log('🛑 Executing shutdown sequence...');

    // Execute pre-shutdown hooks first
    console.log('  📋 Pre-shutdown phase...');
    for (const hook of this.preShutdownHooks) {
      try {
        console.log(`    ⏸️  Pre-shutdown: ${hook.name}`);
        await Promise.resolve(hook.fn());
      } catch (error) {
        console.error(`    ❌ Pre-shutdown failed: ${hook.name}`, error);
      }
    }

    // Execute main shutdown hooks
    console.log('  🔄 Main shutdown phase...');
    for (const hook of this.shutdownHooks) {
      try {
        console.log(`    🛑 Shutting down: ${hook.name}`);
        
        const timeout = hook.timeout || 10000;
        await Promise.race([
          Promise.resolve(hook.fn()),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Shutdown timeout: ${hook.name}`)), timeout)
          )
        ]);
        
        console.log(`    ✅ Shutdown complete: ${hook.name}`);
      } catch (error) {
        console.error(`    ❌ Shutdown failed: ${hook.name}`, error);
      }
    }

    // Deregister from service discovery
    if (this.coordinator) {
      try {
        await this.coordinator.deregister();
      } catch (error) {
        console.warn('Failed to deregister from coordinator:', error);
      }
    }

    console.log('✅ Shutdown sequence completed');
  }

  /**
   * Trigger config reload
   */
  async reloadConfig(newConfig: Record<string, unknown>): Promise<void> {
    console.log('🔄 Reloading configuration...');
    
    for (const [name, hookFn] of this.configReloadHooks) {
      try {
        console.log(`  🔄 Reloading config for: ${name}`);
        await Promise.resolve(hookFn(newConfig));
        console.log(`  ✅ Config reloaded: ${name}`);
      } catch (error) {
        console.error(`  ❌ Config reload failed: ${name}`, error);
      }
    }
  }

  /**
   * Trigger memory pressure handlers
   */
  async handleMemoryPressure(level: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`⚠️ Memory pressure detected: ${level}`);
    
    for (const [name, hookFn] of this.memoryPressureHooks) {
      try {
        await Promise.resolve(hookFn(level));
      } catch (error) {
        console.error(`Memory pressure handler failed: ${name}`, error);
      }
    }
  }

  /**
   * Trigger circuit breaker change handlers
   */
  handleCircuitBreakerChange(service: string, state: 'open' | 'closed' | 'half-open'): void {
    console.log(`🔌 Circuit breaker ${service}: ${state}`);
    
    for (const [name, hookFn] of this.circuitBreakerHooks) {
      try {
        hookFn(service, state);
      } catch (error) {
        console.error(`Circuit breaker handler failed: ${name}`, error);
      }
    }
  }

  /**
   * Check if shutting down
   */
  isShuttingDown(): boolean {
    return this.isShuttingDownFlag;
  }
}

/**
 * Request lifecycle manager for individual requests
 */
export class RequestLifecycleManager {
  private cleanupHooks: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  private timeoutHandlers: Array<() => void | Promise<void>> = [];
  private errorHandlers: Array<(error: Error) => void | Promise<void>> = [];
  private phaseChangeHandlers: Array<(phase: RequestPhase, previousPhase: RequestPhase) => void> = [];
  
  private currentPhase: RequestPhase = RequestPhase.RECEIVED;
  private isCleaningUpFlag = false;
  private isTimedOutFlag = false;
  private startTime: number;

  constructor(timeout?: number) {
    this.startTime = Date.now();
    
    if (timeout) {
      setTimeout(() => {
        this.isTimedOutFlag = true;
        this.executeTimeoutHandlers();
      }, timeout);
    }
  }

  /**
   * Register cleanup hook
   */
  onCleanup(nameOrFn: string | (() => void | Promise<void>), maybeFn?: () => void | Promise<void>): void {
    // Support both onCleanup(name, fn) and onCleanup(fn) signatures
    if (typeof nameOrFn === 'function') {
      // onCleanup(fn)
      this.cleanupHooks.push({ name: `cleanup-${this.cleanupHooks.length}`, fn: nameOrFn });
    } else {
      // onCleanup(name, fn)
      this.cleanupHooks.push({ name: nameOrFn, fn: maybeFn! });
    }
  }

  /**
   * Register timeout handler
   */
  onTimeout(fn: () => void | Promise<void>): void {
    this.timeoutHandlers.push(fn);
  }

  /**
   * Register error handler
   */
  onError(fn: (error: Error) => void | Promise<void>): void {
    this.errorHandlers.push(fn);
  }

  /**
   * Register phase change handler
   */
  onPhaseChange(fn: (phase: RequestPhase, previousPhase: RequestPhase) => void): void {
    this.phaseChangeHandlers.push(fn);
  }

  /**
   * Set current request phase
   */
  setPhase(phase: RequestPhase): void {
    const previousPhase = this.currentPhase;
    this.currentPhase = phase;
    
    for (const handler of this.phaseChangeHandlers) {
      try {
        handler(phase, previousPhase);
      } catch (error) {
        console.error('Phase change handler error:', error);
      }
    }
  }

  /**
   * Execute cleanup hooks
   */
  async executeCleanup(): Promise<void> {
    this.isCleaningUpFlag = true;
    
    for (const hook of this.cleanupHooks) {
      try {
        await Promise.resolve(hook.fn());
      } catch (error) {
        console.error(`Cleanup hook failed: ${hook.name}`, error);
      }
    }
  }

  /**
   * Execute timeout handlers
   */
  private async executeTimeoutHandlers(): Promise<void> {
    for (const handler of this.timeoutHandlers) {
      try {
        await Promise.resolve(handler());
      } catch (error) {
        console.error('Timeout handler error:', error);
      }
    }
  }

  /**
   * Execute error handlers
   */
  async executeErrorHandlers(error: Error): Promise<void> {
    for (const handler of this.errorHandlers) {
      try {
        await Promise.resolve(handler(error));
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }
  }

  /**
   * Check if cleaning up
   */
  isCleaningUp(): boolean {
    return this.isCleaningUpFlag;
  }

  /**
   * Check if timed out
   */
  isTimedOut(): boolean {
    return this.isTimedOutFlag;
  }

  /**
   * Get request duration
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }
}
