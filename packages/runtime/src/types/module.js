export class ModuleError extends Error {
    moduleName;
    cause;
    constructor(message, moduleName, cause) {
        super(message);
        this.name = 'ModuleError';
        this.moduleName = moduleName;
        this.cause = cause;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ModuleError);
        }
    }
}
export class CircularDependencyError extends ModuleError {
    dependencyChain;
    constructor(dependencyChain) {
        super(`Circular dependency detected: ${dependencyChain.join(' -> ')}`, dependencyChain[0] || 'unknown');
        this.name = 'CircularDependencyError';
        this.dependencyChain = dependencyChain;
    }
}
export class ModuleNotFoundError extends ModuleError {
    constructor(moduleName) {
        super(`Module not found: ${moduleName}`, moduleName);
        this.name = 'ModuleNotFoundError';
    }
}
export class ModuleInitializationError extends ModuleError {
    constructor(moduleName, cause) {
        super(`Failed to initialize module: ${moduleName}`, moduleName, cause);
        this.name = 'ModuleInitializationError';
    }
}
