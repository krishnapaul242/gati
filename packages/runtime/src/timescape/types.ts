
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

export type VersionStatus = 'hot' | 'warm' | 'cold';

export interface TimescapeArtifact {
    id: string;
    type: ArtifactType;
    version: TSV;
    hash: string; // Content hash for integrity
    metadata?: {
        dbSchema?: {
            version: string;
            migrations: string[];
            rollback: string[];
            compatibleWith?: string[];
        };
        [key: string]: any;
    };
}

export interface VersionInfo {
    tsv: TSV;
    timestamp: number;
    hash: string;
    status: VersionStatus;
    requestCount: number;
    lastAccessed: number;
    tags: string[];
    dbSchemaVersion?: string;
}

export interface VersionTimeline {
    handlerPath: string;
    versions: VersionInfo[];
}

export interface VersionTag {
    label: string;
    tsv: TSV;
    createdAt: number;
    createdBy: string;
}

// Re-export transformer types
export type { TransformerPair, TransformFunction, TransformResult, ChainOptions } from './transformer.js';

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
    handlers: Record<string, VersionTimeline>;
    tags: Record<string, VersionTag>;
    activeVersions: Set<TSV>;
    coldVersions: Set<TSV>;
}

export interface Snapshot {
    id: string;
    timestamp: number;
    type: 'light' | 'heavy';
    registryState: VersionRegistryState;
    artifacts?: Record<string, any>; // For heavy snapshots, store actual content
}
