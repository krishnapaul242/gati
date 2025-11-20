
export type TSV = `tsv:${number}-${string}-${number}`;

export type ArtifactType =
    | 'config'
    | 'schema'
    | 'module'
    | 'event_handler'
    | 'effect'
    | 'route'
    | 'data'
    | 'plugin';

export interface TimescapeArtifact {
    id: string;
    type: ArtifactType;
    version: TSV;
    hash: string; // Content hash for integrity
    metadata?: Record<string, any>;
}

export interface ChangeLogItem {
    id: TSV;
    timestamp: number;
    type: ArtifactType;
    actor: string; // e.g., "core", "plugin:aws", "user:krishna"
    payload: any;
    diff?: any;
    parents: TSV[];
}

export interface VersionRegistryState {
    modules: Record<string, TSV>;
    schemas: Record<string, TSV>;
    config: TSV | null;
    routes: Record<string, TSV>;
    events: Record<string, TSV>;
    effects: Record<string, TSV>;
}

export interface Snapshot {
    id: string;
    timestamp: number;
    type: 'light' | 'heavy';
    registryState: VersionRegistryState;
    artifacts?: Record<string, any>; // For heavy snapshots, store actual content
}
