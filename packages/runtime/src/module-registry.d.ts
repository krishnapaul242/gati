import type { Module, ModuleMetadata, ModuleState } from './types/module.js';
export declare class ModuleRegistry {
    private modules;
    register<T>(module: Module<T>): void;
    unregister(name: string): boolean;
    has(name: string): boolean;
    get<T = unknown>(name: string): ModuleMetadata<T>;
    tryGet<T = unknown>(name: string): ModuleMetadata<T> | undefined;
    updateState(name: string, state: ModuleState, error?: Error): void;
    incrementUsage(name: string): void;
    getModuleNames(): string[];
    getModulesByState(state: ModuleState): ModuleMetadata[];
    getAll(): ModuleMetadata[];
    size(): number;
    clear(): void;
    getStatistics(): {
        total: number;
        initialized: number;
        uninitialized: number;
        initializing: number;
        error: number;
        shutdown: number;
        totalUsage: number;
    };
}
export declare function createModuleRegistry(): ModuleRegistry;
