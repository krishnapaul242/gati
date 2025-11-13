import type { HealthStatus, LifecycleCoordinator } from './types/context.js';
import { LifecyclePriority, RequestPhase } from './types/context.js';
export declare class LifecycleManager {
    private startupHooks;
    private shutdownHooks;
    private preShutdownHooks;
    private healthChecks;
    private configReloadHooks;
    private memoryPressureHooks;
    private circuitBreakerHooks;
    private isShuttingDownFlag;
    private coordinator?;
    constructor(coordinator?: LifecycleCoordinator);
    onStartup(name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority): void;
    onHealthCheck(name: string, fn: () => Promise<{
        status: 'pass' | 'fail' | 'warn';
        message?: string;
    }>): void;
    onShutdown(name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority): void;
    onPreShutdown(name: string, fn: () => void | Promise<void>): void;
    onConfigReload(name: string, fn: (newConfig: Record<string, unknown>) => void | Promise<void>): void;
    onMemoryPressure(name: string, fn: (level: 'low' | 'medium' | 'high') => void | Promise<void>): void;
    onCircuitBreakerChange(name: string, fn: (service: string, state: 'open' | 'closed' | 'half-open') => void): void;
    executeStartup(): Promise<void>;
    executeHealthChecks(): Promise<HealthStatus>;
    executeShutdown(): Promise<void>;
    reloadConfig(newConfig: Record<string, unknown>): Promise<void>;
    handleMemoryPressure(level: 'low' | 'medium' | 'high'): Promise<void>;
    handleCircuitBreakerChange(service: string, state: 'open' | 'closed' | 'half-open'): void;
    isShuttingDown(): boolean;
}
export declare class RequestLifecycleManager {
    private cleanupHooks;
    private timeoutHandlers;
    private errorHandlers;
    private phaseChangeHandlers;
    private currentPhase;
    private isCleaningUpFlag;
    private isTimedOutFlag;
    private startTime;
    constructor(timeout?: number);
    onCleanup(name: string, fn: () => void | Promise<void>): void;
    onTimeout(fn: () => void | Promise<void>): void;
    onError(fn: (error: Error) => void | Promise<void>): void;
    onPhaseChange(fn: (phase: RequestPhase, previousPhase: RequestPhase) => void): void;
    setPhase(phase: RequestPhase): void;
    executeCleanup(): Promise<void>;
    private executeTimeoutHandlers;
    executeErrorHandlers(error: Error): Promise<void>;
    isCleaningUp(): boolean;
    isTimedOut(): boolean;
    getDuration(): number;
}
