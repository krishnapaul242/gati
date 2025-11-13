import type { GlobalContext } from './context.js';
export type ModuleState = 'uninitialized' | 'initializing' | 'initialized' | 'error' | 'shutdown';
export interface Module<T = unknown> {
    name: string;
    version: string;
    description?: string;
    dependencies?: string[];
    exports: T;
    init?(gctx: GlobalContext): Promise<void> | void;
    shutdown?(): Promise<void> | void;
    healthCheck?(): Promise<boolean> | boolean;
}
export interface ModuleMetadata<T = unknown> {
    module: Module<T>;
    state: ModuleState;
    registeredAt: Date;
    initializedAt?: Date;
    error?: Error;
    usageCount: number;
}
export interface ModuleLoaderConfig {
    autoInit?: boolean;
    initTimeout?: number;
    allowCircularDependencies?: boolean;
    cache?: boolean;
}
export declare class ModuleError extends Error {
    readonly moduleName: string;
    readonly cause?: Error;
    constructor(message: string, moduleName: string, cause?: Error);
}
export declare class CircularDependencyError extends ModuleError {
    readonly dependencyChain: string[];
    constructor(dependencyChain: string[]);
}
export declare class ModuleNotFoundError extends ModuleError {
    constructor(moduleName: string);
}
export declare class ModuleInitializationError extends ModuleError {
    constructor(moduleName: string, cause: Error);
}
