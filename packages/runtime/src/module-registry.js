import { ModuleError, ModuleNotFoundError, } from './types/module.js';
export class ModuleRegistry {
    modules = new Map();
    register(module) {
        if (this.modules.has(module.name)) {
            throw new ModuleError(`Module already registered: ${module.name}`, module.name);
        }
        const metadata = {
            module,
            state: 'uninitialized',
            registeredAt: new Date(),
            usageCount: 0,
        };
        this.modules.set(module.name, metadata);
    }
    unregister(name) {
        return this.modules.delete(name);
    }
    has(name) {
        return this.modules.has(name);
    }
    get(name) {
        const metadata = this.modules.get(name);
        if (!metadata) {
            throw new ModuleNotFoundError(name);
        }
        return metadata;
    }
    tryGet(name) {
        return this.modules.get(name);
    }
    updateState(name, state, error) {
        const metadata = this.get(name);
        metadata.state = state;
        if (state === 'initialized') {
            metadata.initializedAt = new Date();
        }
        if (error) {
            metadata.error = error;
        }
    }
    incrementUsage(name) {
        const metadata = this.get(name);
        metadata.usageCount++;
    }
    getModuleNames() {
        return Array.from(this.modules.keys());
    }
    getModulesByState(state) {
        return Array.from(this.modules.values()).filter((metadata) => metadata.state === state);
    }
    getAll() {
        return Array.from(this.modules.values());
    }
    size() {
        return this.modules.size;
    }
    clear() {
        this.modules.clear();
    }
    getStatistics() {
        const all = this.getAll();
        return {
            total: all.length,
            initialized: all.filter((m) => m.state === 'initialized').length,
            uninitialized: all.filter((m) => m.state === 'uninitialized').length,
            initializing: all.filter((m) => m.state === 'initializing').length,
            error: all.filter((m) => m.state === 'error').length,
            shutdown: all.filter((m) => m.state === 'shutdown').length,
            totalUsage: all.reduce((sum, m) => sum + m.usageCount, 0),
        };
    }
}
export function createModuleRegistry() {
    return new ModuleRegistry();
}
