import type { TimescapeArtifact, TSV, VersionRegistryState } from './types.js';

export class VersionRegistry {
    private state: VersionRegistryState = {
        modules: {},
        schemas: {},
        config: null,
        routes: {},
        events: {},
        effects: {},
    };

    private history: Map<string, TSV[]> = new Map();

    constructor(initialState?: Partial<VersionRegistryState>) {
        if (initialState) {
            this.state = { ...this.state, ...initialState };
        }
    }

    public register(artifact: TimescapeArtifact): void {
        const { type, id, version } = artifact;

        switch (type) {
            case 'module':
                this.state.modules[id] = version;
                break;
            case 'schema':
                this.state.schemas[id] = version;
                break;
            case 'config':
                this.state.config = version;
                break;
            case 'route':
                this.state.routes[id] = version;
                break;
            case 'event_handler':
                this.state.events[id] = version;
                break;
            case 'effect':
                this.state.effects[id] = version;
                break;
            default:
                // For other types, we might just log or ignore for the main registry state
                // depending on if they need global tracking
                break;
        }

        this.addToHistory(type, id, version);
    }

    public get(type: 'module' | 'schema' | 'route' | 'event_handler' | 'effect', id: string): TSV | undefined {
        switch (type) {
            case 'module': return this.state.modules[id];
            case 'schema': return this.state.schemas[id];
            case 'route': return this.state.routes[id];
            case 'event_handler': return this.state.events[id];
            case 'effect': return this.state.effects[id];
        }
        return undefined;
    }

    public getConfigVersion(): TSV | null {
        return this.state.config;
    }

    public getAll(): VersionRegistryState {
        return { ...this.state };
    }

    private addToHistory(type: string, id: string, version: TSV) {
        const key = `${type}:${id}`;
        if (!this.history.has(key)) {
            this.history.set(key, []);
        }
        this.history.get(key)?.push(version);
    }

    public getHistory(type: string, id: string): TSV[] {
        return this.history.get(`${type}:${id}`) || [];
    }
}
