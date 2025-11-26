/**
 * @module runtime/types/storage-contract
 * @description Storage contract interface for pluggable manifest storage backends
 * 
 * Allows Gati to use any storage implementation (in-memory, SQLite, PostgreSQL, etc.)
 * via the module system.
 */

import type {
  HandlerManifest,
  HookManifest,
  GType,
  Transformer,
  VersionGraph,
  TimescapeMetadata,
} from './manifest-store.js';

/**
 * Storage statistics
 */
export interface StorageStats {
  manifestCount: number;
  gtypeCount: number;
  transformerCount: number;
  versionGraphCount: number;
  timescapeMetadataCount: number;
  hookManifestCount: number;
}

/**
 * Storage Contract
 * 
 * Interface that all storage backends must implement.
 * Provides persistence for manifests, GTypes, transformers, and metadata.
 */
export interface StorageContract {
  // Handler Manifests
  storeManifest(manifest: HandlerManifest): Promise<void>;
  getManifest(id: string, version?: string): Promise<HandlerManifest | undefined>;
  getAllManifestVersions(id: string): Promise<HandlerManifest[]>;
  
  // Hook Manifests
  storeHookManifest(manifest: HookManifest): Promise<void>;
  getHookManifest(handlerId: string): Promise<HookManifest | null>;
  listHookManifests(): Promise<HookManifest[]>;
  
  // GTypes
  storeGType(gtype: GType): Promise<void>;
  getGType(ref: string): Promise<GType | undefined>;
  
  // Transformers
  storeTransformer(transformer: Transformer): Promise<void>;
  getTransformer(id: string): Promise<Transformer | undefined>;
  getTransformersForVersions(
    handlerId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<Transformer[]>;
  
  // Version Graphs
  storeVersionGraph(graph: VersionGraph): Promise<void>;
  getVersionGraph(handlerId: string): Promise<VersionGraph | undefined>;
  
  // Timescape Metadata
  storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void>;
  getTimescapeMetadata(
    handlerId: string,
    version: string
  ): Promise<TimescapeMetadata | undefined>;
  
  // Lifecycle
  clear(): Promise<void>;
  getStats(): StorageStats;
}
