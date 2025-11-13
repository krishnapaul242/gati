import { ModuleError, ModuleInitializationError, CircularDependencyError, } from './types/module.js';
import { createModuleRegistry } from './module-registry.js';
import { logger } from './logger.js';
export class ModuleLoader {
    registry;
    config;
    initializingModules = new Set();
    constructor(config = {}) {
        this.registry = createModuleRegistry();
        this.config = {
            autoInit: config.autoInit ?? false,
            initTimeout: config.initTimeout ?? 30000,
            allowCircularDependencies: config.allowCircularDependencies ?? false,
            cache: config.cache ?? true,
        };
    }
    async register(module, gctx) {
        this.registry.register(module);
        if (this.config.autoInit && gctx) {
            await this.initialize(module.name, gctx);
        }
    }
    async initialize(name, gctx, dependencyChain = []) {
        const metadata = this.registry.get(name);
        if (metadata.state === 'initialized') {
            return;
        }
        if (this.initializingModules.has(name)) {
            const chain = [...dependencyChain, name];
            if (!this.config.allowCircularDependencies) {
                throw new CircularDependencyError(chain);
            }
            return;
        }
        this.initializingModules.add(name);
        this.registry.updateState(name, 'initializing');
        try {
            if (metadata.module.dependencies) {
                for (const dep of metadata.module.dependencies) {
                    if (!this.registry.has(dep)) {
                        throw new ModuleError(`Dependency not found: ${dep} (required by ${name})`, name);
                    }
                    await this.initialize(dep, gctx, [...dependencyChain, name]);
                }
            }
            if (metadata.module.init) {
                const initPromise = Promise.resolve(metadata.module.init(gctx));
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Module initialization timeout: ${name}`));
                    }, this.config.initTimeout);
                });
                await Promise.race([initPromise, timeoutPromise]);
            }
            this.registry.updateState(name, 'initialized');
            this.initializingModules.delete(name);
        }
        catch (error) {
            this.initializingModules.delete(name);
            const moduleError = error instanceof ModuleError
                ? error
                : new ModuleInitializationError(name, error);
            this.registry.updateState(name, 'error', moduleError);
            throw moduleError;
        }
    }
    async get(name, gctx) {
        const metadata = this.registry.get(name);
        if (metadata.state === 'uninitialized') {
            if (!gctx) {
                throw new ModuleError(`Module not initialized and no global context provided: ${name}`, name);
            }
            await this.initialize(name, gctx);
        }
        if (metadata.state === 'error') {
            throw new ModuleError(`Module is in error state: ${name}`, name, metadata.error);
        }
        if (metadata.state === 'shutdown') {
            throw new ModuleError(`Module has been shutdown: ${name}`, name);
        }
        this.registry.incrementUsage(name);
        return metadata.module.exports;
    }
    getSync(name) {
        const metadata = this.registry.get(name);
        if (metadata.state !== 'initialized') {
            throw new ModuleError(`Module not initialized: ${name} (state: ${metadata.state})`, name);
        }
        this.registry.incrementUsage(name);
        return metadata.module.exports;
    }
    async shutdown(name) {
        const metadata = this.registry.get(name);
        if (metadata.state === 'shutdown') {
            return;
        }
        try {
            if (metadata.module.shutdown) {
                await Promise.resolve(metadata.module.shutdown());
            }
            this.registry.updateState(name, 'shutdown');
        }
        catch (error) {
            throw new ModuleError(`Failed to shutdown module: ${name}`, name, error);
        }
    }
    async shutdownAll() {
        const initialized = this.registry
            .getModulesByState('initialized')
            .sort((a, b) => {
            const aTime = a.initializedAt?.getTime() ?? 0;
            const bTime = b.initializedAt?.getTime() ?? 0;
            return bTime - aTime;
        })
            .map((m) => m.module.name);
        for (const name of initialized) {
            try {
                await this.shutdown(name);
            }
            catch (error) {
                logger.error({ module: name, error }, 'Failed to shutdown module');
            }
        }
    }
    has(name) {
        return this.registry.has(name);
    }
    getModuleNames() {
        return this.registry.getModuleNames();
    }
    getStatistics() {
        return this.registry.getStatistics();
    }
    async healthCheck() {
        const results = new Map();
        const moduleNames = this.registry.getModuleNames();
        for (const name of moduleNames) {
            const metadata = this.registry.tryGet(name);
            if (!metadata || metadata.state !== 'initialized') {
                results.set(name, false);
                continue;
            }
            if (metadata.module.healthCheck) {
                try {
                    const healthy = await Promise.resolve(metadata.module.healthCheck());
                    results.set(name, healthy);
                }
                catch {
                    results.set(name, false);
                }
            }
            else {
                results.set(name, true);
            }
        }
        return results;
    }
}
export function createModuleLoader(config) {
    return new ModuleLoader(config);
}
