/**
 * @module runtime/manifest-store
 * @description In-memory Manifest Store implementation for Gati framework
 * 
 * This implements Task 15 from the runtime architecture spec:
 * - Manifest persistence (handlers and modules)
 * - GType schema storage and retrieval
 * - Version graph storage
 * - Transformer stub storage
 * - Timescape metadata persistence
 * 
 * Requirements: 11.5
 */

import type {
  ManifestStore,
  HandlerManifest,
  GType,
  Transformer,
  VersionGraph,
  TimescapeMetadata,
} from './types/manifest-store.js';

/**
 * In-memory implementation of ManifestStore
 * 
 * Provides fast lookup with caching for development and testing.
 * Production deployments should use a persistent store (PostgreSQL, etcd, etc.)
 */
export class InMemoryManifestStore implements ManifestStore {
  private manifests: Map<string, Map<string, HandlerManifest>> = new Map();
  private gtypes: Map<string, GType> = new Map();
  private transformers: Map<string, Transformer> = new Map();
  private versionGraphs: Map<string, VersionGraph> = new Map();
  private timescapeMetadata: Map<string, TimescapeMetadata> = new Map();

  /**
   * Store a handler or module manifest
   */
  async storeManifest(manifest: HandlerManifest): Promise<void> {
    const { handlerId, version } = manifest;

    if (!this.manifests.has(handlerId)) {
      this.manifests.set(handlerId, new Map());
    }

    this.manifests.get(handlerId)!.set(version, manifest);
  }

  /**
   * Retrieve a manifest by ID and optional version
   */
  async getManifest(
    id: string,
    version?: string
  ): Promise<HandlerManifest | undefined> {
    const versions = this.manifests.get(id);
    if (!versions) {
      return undefined;
    }

    if (version) {
      return versions.get(version);
    }

    // Return latest version if no version specified
    const allVersions = Array.from(versions.values());
    if (allVersions.length === 0) {
      return undefined;
    }

    // Sort by createdAt descending to get latest
    return allVersions.sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  /**
   * Get all versions of a manifest
   */
  async getAllManifestVersions(id: string): Promise<HandlerManifest[]> {
    const versions = this.manifests.get(id);
    if (!versions) {
      return [];
    }

    return Array.from(versions.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Store a GType schema
   */
  async storeGType(gtype: GType): Promise<void> {
    this.gtypes.set(gtype.ref, gtype);
  }

  /**
   * Retrieve a GType schema by reference
   */
  async getGType(ref: string): Promise<GType | undefined> {
    return this.gtypes.get(ref);
  }

  /**
   * Store a transformer stub
   */
  async storeTransformer(transformer: Transformer): Promise<void> {
    this.transformers.set(transformer.id, transformer);
  }

  /**
   * Retrieve a transformer by ID
   */
  async getTransformer(id: string): Promise<Transformer | undefined> {
    return this.transformers.get(id);
  }

  /**
   * Get transformers for a version pair
   */
  async getTransformersForVersions(
    handlerId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<Transformer[]> {
    const results: Transformer[] = [];

    for (const transformer of this.transformers.values()) {
      if (
        transformer.handlerId === handlerId &&
        transformer.fromVersion === fromVersion &&
        transformer.toVersion === toVersion
      ) {
        results.push(transformer);
      }
    }

    return results;
  }

  /**
   * Store or update a version graph
   */
  async storeVersionGraph(graph: VersionGraph): Promise<void> {
    this.versionGraphs.set(graph.handlerId, graph);
  }

  /**
   * Retrieve a version graph for a handler
   */
  async getVersionGraph(handlerId: string): Promise<VersionGraph | undefined> {
    return this.versionGraphs.get(handlerId);
  }

  /**
   * Store Timescape metadata
   */
  async storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void> {
    const key = `${metadata.handlerId}:${metadata.version}`;
    this.timescapeMetadata.set(key, metadata);
  }

  /**
   * Retrieve Timescape metadata
   */
  async getTimescapeMetadata(
    handlerId: string,
    version: string
  ): Promise<TimescapeMetadata | undefined> {
    const key = `${handlerId}:${version}`;
    return this.timescapeMetadata.get(key);
  }

  /**
   * Clear all stored data (for testing)
   */
  async clear(): Promise<void> {
    this.manifests.clear();
    this.gtypes.clear();
    this.transformers.clear();
    this.versionGraphs.clear();
    this.timescapeMetadata.clear();
  }

  /**
   * Get store statistics
   */
  getStats() {
    let manifestCount = 0;
    for (const versions of this.manifests.values()) {
      manifestCount += versions.size;
    }

    return {
      manifestCount,
      gtypeCount: this.gtypes.size,
      transformerCount: this.transformers.size,
      versionGraphCount: this.versionGraphs.size,
      timescapeMetadataCount: this.timescapeMetadata.size,
    };
  }
}

/**
 * Create a new in-memory manifest store
 */
export function createManifestStore(): ManifestStore {
  return new InMemoryManifestStore();
}
