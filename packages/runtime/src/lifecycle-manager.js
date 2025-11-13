import { LifecyclePriority, RequestPhase } from './types/context.js';
export class LifecycleManager {
    startupHooks = [];
    shutdownHooks = [];
    preShutdownHooks = [];
    healthChecks = new Map();
    configReloadHooks = new Map();
    memoryPressureHooks = new Map();
    circuitBreakerHooks = new Map();
    isShuttingDownFlag = false;
    coordinator;
    constructor(coordinator) {
        this.coordinator = coordinator;
    }
    onStartup(name, fn, priority = LifecyclePriority.NORMAL) {
        this.startupHooks.push({ name, fn, priority });
        this.startupHooks.sort((a, b) => b.priority - a.priority);
    }
    onHealthCheck(name, fn) {
        this.healthChecks.set(name, fn);
    }
    onShutdown(name, fn, priority = LifecyclePriority.NORMAL) {
        this.shutdownHooks.push({ name, fn, priority });
        this.shutdownHooks.sort((a, b) => b.priority - a.priority);
    }
    onPreShutdown(name, fn) {
        this.preShutdownHooks.push({
            name,
            fn,
            priority: LifecyclePriority.HIGH
        });
    }
    onConfigReload(name, fn) {
        this.configReloadHooks.set(name, fn);
    }
    onMemoryPressure(name, fn) {
        this.memoryPressureHooks.set(name, fn);
    }
    onCircuitBreakerChange(name, fn) {
        this.circuitBreakerHooks.set(name, fn);
    }
    async executeStartup() {
        console.log('🚀 Executing startup hooks...');
        if (this.coordinator) {
            await this.coordinator.register();
        }
        for (const hook of this.startupHooks) {
            try {
                console.log(`  ⚡ Starting: ${hook.name}`);
                await Promise.resolve(hook.fn());
                console.log(`  ✅ Started: ${hook.name}`);
            }
            catch (error) {
                console.error(`  ❌ Failed to start: ${hook.name}`, error);
                throw error;
            }
        }
        console.log('✅ All startup hooks completed');
    }
    async executeHealthChecks() {
        const checks = {};
        let overallStatus = 'healthy';
        for (const [name, checkFn] of this.healthChecks) {
            const start = Date.now();
            try {
                const result = await Promise.race([
                    checkFn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
                ]);
                checks[name] = {
                    ...result,
                    duration: Date.now() - start,
                };
                if (result.status === 'fail') {
                    overallStatus = 'unhealthy';
                }
                else if (result.status === 'warn' && overallStatus === 'healthy') {
                    overallStatus = 'degraded';
                }
            }
            catch (error) {
                checks[name] = {
                    status: 'fail',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - start,
                };
                overallStatus = 'unhealthy';
            }
        }
        const healthStatus = {
            status: overallStatus,
            checks,
            timestamp: Date.now(),
        };
        if (this.coordinator) {
            try {
                await this.coordinator.reportHealth(healthStatus);
            }
            catch (error) {
                console.warn('Failed to report health to coordinator:', error);
            }
        }
        return healthStatus;
    }
    async executeShutdown() {
        this.isShuttingDownFlag = true;
        console.log('🛑 Executing shutdown sequence...');
        console.log('  📋 Pre-shutdown phase...');
        for (const hook of this.preShutdownHooks) {
            try {
                console.log(`    ⏸️  Pre-shutdown: ${hook.name}`);
                await Promise.resolve(hook.fn());
            }
            catch (error) {
                console.error(`    ❌ Pre-shutdown failed: ${hook.name}`, error);
            }
        }
        console.log('  🔄 Main shutdown phase...');
        for (const hook of this.shutdownHooks) {
            try {
                console.log(`    🛑 Shutting down: ${hook.name}`);
                const timeout = hook.timeout || 10000;
                await Promise.race([
                    Promise.resolve(hook.fn()),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Shutdown timeout: ${hook.name}`)), timeout))
                ]);
                console.log(`    ✅ Shutdown complete: ${hook.name}`);
            }
            catch (error) {
                console.error(`    ❌ Shutdown failed: ${hook.name}`, error);
            }
        }
        if (this.coordinator) {
            try {
                await this.coordinator.deregister();
            }
            catch (error) {
                console.warn('Failed to deregister from coordinator:', error);
            }
        }
        console.log('✅ Shutdown sequence completed');
    }
    async reloadConfig(newConfig) {
        console.log('🔄 Reloading configuration...');
        for (const [name, hookFn] of this.configReloadHooks) {
            try {
                console.log(`  🔄 Reloading config for: ${name}`);
                await Promise.resolve(hookFn(newConfig));
                console.log(`  ✅ Config reloaded: ${name}`);
            }
            catch (error) {
                console.error(`  ❌ Config reload failed: ${name}`, error);
            }
        }
    }
    async handleMemoryPressure(level) {
        console.log(`⚠️ Memory pressure detected: ${level}`);
        for (const [name, hookFn] of this.memoryPressureHooks) {
            try {
                await Promise.resolve(hookFn(level));
            }
            catch (error) {
                console.error(`Memory pressure handler failed: ${name}`, error);
            }
        }
    }
    handleCircuitBreakerChange(service, state) {
        console.log(`🔌 Circuit breaker ${service}: ${state}`);
        for (const [name, hookFn] of this.circuitBreakerHooks) {
            try {
                hookFn(service, state);
            }
            catch (error) {
                console.error(`Circuit breaker handler failed: ${name}`, error);
            }
        }
    }
    isShuttingDown() {
        return this.isShuttingDownFlag;
    }
}
export class RequestLifecycleManager {
    cleanupHooks = [];
    timeoutHandlers = [];
    errorHandlers = [];
    phaseChangeHandlers = [];
    currentPhase = RequestPhase.RECEIVED;
    isCleaningUpFlag = false;
    isTimedOutFlag = false;
    startTime;
    constructor(timeout) {
        this.startTime = Date.now();
        if (timeout) {
            setTimeout(() => {
                this.isTimedOutFlag = true;
                this.executeTimeoutHandlers();
            }, timeout);
        }
    }
    onCleanup(name, fn) {
        this.cleanupHooks.push({ name, fn });
    }
    onTimeout(fn) {
        this.timeoutHandlers.push(fn);
    }
    onError(fn) {
        this.errorHandlers.push(fn);
    }
    onPhaseChange(fn) {
        this.phaseChangeHandlers.push(fn);
    }
    setPhase(phase) {
        const previousPhase = this.currentPhase;
        this.currentPhase = phase;
        for (const handler of this.phaseChangeHandlers) {
            try {
                handler(phase, previousPhase);
            }
            catch (error) {
                console.error('Phase change handler error:', error);
            }
        }
    }
    async executeCleanup() {
        this.isCleaningUpFlag = true;
        for (const hook of this.cleanupHooks) {
            try {
                await Promise.resolve(hook.fn());
            }
            catch (error) {
                console.error(`Cleanup hook failed: ${hook.name}`, error);
            }
        }
    }
    async executeTimeoutHandlers() {
        for (const handler of this.timeoutHandlers) {
            try {
                await Promise.resolve(handler());
            }
            catch (error) {
                console.error('Timeout handler error:', error);
            }
        }
    }
    async executeErrorHandlers(error) {
        for (const handler of this.errorHandlers) {
            try {
                await Promise.resolve(handler(error));
            }
            catch (handlerError) {
                console.error('Error handler failed:', handlerError);
            }
        }
    }
    isCleaningUp() {
        return this.isCleaningUpFlag;
    }
    isTimedOut() {
        return this.isTimedOutFlag;
    }
    getDuration() {
        return Date.now() - this.startTime;
    }
}
