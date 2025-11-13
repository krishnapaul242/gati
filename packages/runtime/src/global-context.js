import { LifecyclePriority } from './types/context.js';
import { createModuleLoader } from './module-loader.js';
import { LifecycleManager } from './lifecycle-manager.js';
export function createGlobalContext(options = {}) {
    const moduleLoader = options.moduleLoader || createModuleLoader();
    const lifecycleManager = new LifecycleManager(options.coordinator);
    const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
    const lifecycleSymbol = Symbol.for('gati:lifecycle');
    const gctx = {
        instance: {
            id: options.instance?.id || 'unknown',
            region: options.instance?.region || 'unknown',
            zone: options.instance?.zone || 'unknown',
            startedAt: Date.now(),
        },
        modules: options.modules || {},
        services: options.services || {},
        config: options.config || {},
        lifecycle: {
            onStartup: (name, fn, priority) => {
                lifecycleManager.onStartup(name, fn, priority);
            },
            onHealthCheck: (name, fn) => {
                lifecycleManager.onHealthCheck(name, fn);
            },
            onShutdown: (name, fn, priority) => {
                lifecycleManager.onShutdown(name, fn, priority);
            },
            onPreShutdown: (name, fn) => {
                lifecycleManager.onPreShutdown(name, fn);
            },
            onConfigReload: (name, fn) => {
                lifecycleManager.onConfigReload(name, fn);
            },
            onMemoryPressure: (name, fn) => {
                lifecycleManager.onMemoryPressure(name, fn);
            },
            onCircuitBreakerChange: (name, fn) => {
                lifecycleManager.onCircuitBreakerChange(name, fn);
            },
            executeStartup: () => lifecycleManager.executeStartup(),
            executeHealthChecks: () => lifecycleManager.executeHealthChecks(),
            executeShutdown: () => lifecycleManager.executeShutdown(),
            isShuttingDown: () => lifecycleManager.isShuttingDown(),
            coordinator: options.coordinator,
        },
    };
    gctx[moduleLoaderSymbol] = moduleLoader;
    gctx[lifecycleSymbol] = lifecycleManager;
    return gctx;
}
export function registerModule(gctx, name, module) {
    if (name in gctx.modules) {
        throw new Error(`Module "${name}" is already registered`);
    }
    gctx.modules[name] = module;
}
export function getModule(gctx, name) {
    return gctx.modules[name];
}
export async function shutdownGlobalContext(gctx) {
    const isShuttingDown = true;
    gctx.lifecycle.isShuttingDown =
        () => isShuttingDown;
    const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
    const moduleLoader = gctx[moduleLoaderSymbol];
    if (moduleLoader) {
        await moduleLoader.shutdownAll();
    }
    const shutdownSymbol = Symbol.for('gati:shutdown');
    const fns = gctx[shutdownSymbol];
    if (fns && fns.length > 0) {
        await Promise.all(fns.map((fn) => Promise.resolve(fn())));
    }
}
export function getModuleLoader(gctx) {
    const moduleLoaderSymbol = Symbol.for('gati:moduleLoader');
    const moduleLoader = gctx[moduleLoaderSymbol];
    if (!moduleLoader) {
        throw new Error('Module loader not found in global context');
    }
    return moduleLoader;
}
