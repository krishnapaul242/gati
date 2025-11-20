import type { TSV, VersionRegistryState } from './types.js';
import { VersionRegistry } from './registry.js';

export interface ResolutionContext {
    requestId: string;
    requestedVersion?: TSV; // Explicit version request
    actor?: string;
    timestamp?: number; // Time-travel timestamp
}

export class ExecutionContextResolver {
    private registry: VersionRegistry;

    constructor(registry: VersionRegistry) {
        this.registry = registry;
    }

    /**
     * Resolves the complete version state for a given context.
     * If a timestamp is provided, it should ideally query the TimelineStore (not implemented here yet).
     * For now, it returns the current stable state or a specific version if requested.
     */
    public resolve(context: ResolutionContext): VersionRegistryState {
        // TODO: Implement time-travel logic using TimelineStore if context.timestamp is present.

        const currentState = this.registry.getAll();

        // If a specific version of the *entire system* is requested (e.g. a snapshot ID or global TSV),
        // we would need to load that. For now, we assume 'requestedVersion' might refer to a specific
        // config or module version, but usually we resolve the *set* of versions.

        // In a real implementation, we would overlay the requested versions on top of the default state.
        // For Phase 3, we return the current registry state as the "resolved" context.

        return currentState;
    }

    /**
     * Resolves a specific artifact version for the current context.
     */
    public resolveArtifact(type: 'module' | 'schema' | 'route', id: string, context: ResolutionContext): TSV | undefined {
        // TODO: Check if context overrides this specific artifact
        return this.registry.get(type, id);
    }
}
