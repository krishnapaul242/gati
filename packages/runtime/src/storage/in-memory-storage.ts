/**
 * @module runtime/storage/in-memory-storage
 * @description In-memory storage implementation (default)
 * 
 * Fast, zero-dependency storage for development and testing.
 * No persistence - data is lost on restart.
 */

import type {
  HandlerManifest,
  HookManifest,
  GType,
  Transformer,
  VersionGraph,
  TimescapeMetadata,
} from '../types/manifest-store.js';
import type { StorageContract } from '../types/storage-contract.js';

/**
 * In-memory storage implementation
 */
export class InMemoryStorage implements StorageContract {
  private manifests = new Map<string, Map<string, HandlerManifest>>();
  private hookManifests = new Map<string, HookManifest>();
  private gtypes = new Map<string, GType>();
  private transformers = new Map<string, Transformer>();
  private versionGraphs = new Map<string, VersionGraph>();
  private timescapeMetadata = new Map<string, TimescapeMetadata>();

  async storeManifest(manifest: HandlerManifest): Promise<void> {
    if (!this.manifests.has(manifest.handlerId)) {
      this.manifests.set(manifest.handlerId, new Map());
    }
    this.manifests.get(manifest.handlerId)!.set(manifest.version, manifest);
  }

  async getManifest(id: string, version?: string): Promise<HandlerManifest | undefined> {
    const versions = this.manifests.get(id);
    if (!versions) return undefined;
    
    if (version) return versions.get(version);
    
    const allVersions = Array.from(versions.values());
    if (allVersions.length === 0) return undefined;
    
    return allVersions.sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  async getAllManifestVersions(id: string): Promise<HandlerManifest[]> {
    const versions = this.manifests.get(id);
    if (!versions) return [];
    return Array.from(versions.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  async storeHookManifest(manifest: HookManifest): Promise<void> {
    this.hookManifests.set(manifest.handlerId, manifest);
  }

  async getHookManifest(handlerId: string): Promise<HookManifest | null> {
    return this.hookManifests.get(handlerId) || null;
  }

  async listHookManifests(): Promise<HookManifest[]> {
    return Array.from(this.hookManifests.values());
  }

  async storeGType(gtype: GType): Promise<void> {
    this.gtypes.set(gtype.ref, gtype);
  }

  async getGType(ref: string): Promise<GType | undefined> {
    return this.gtypes.get(ref);
  }

  async storeTransformer(transformer: Transformer): Promise<void> {
    this.transformers.set(transformer.id, transformer);
  }

  async getTransformer(id: string): Promise<Transformer | undefined> {
    return this.transformers.get(id);
  }

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

  async storeVersionGraph(graph: VersionGraph): Promise<void> {
    this.versionGraphs.set(graph.handlerId, graph);
  }

  async getVersionGraph(handlerId: string): Promise<VersionGraph | undefined> {
    return this.versionGraphs.get(handlerId);
  }

  async storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void> {
    const key = `${metadata.handlerId}:${metadata.version}`;
    this.timescapeMetadata.set(key, metadata);
  }

  async getTimescapeMetadata(
    handlerId: string,
    version: string
  ): Promise<TimescapeMetadata | undefined> {
    const key = `${handlerId}:${version}`;
    return this.timescapeMetadata.get(key);
  }

  async clear(): Promise<void> {
    this.manifests.clear();
    this.hookManifests.clear();
    this.gtypes.clear();
    this.transformers.clear();
    this.versionGraphs.clear();
    this.timescapeMetadata.clear();
  }

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
      hookManifestCount: this.hookManifests.size,
    };
  }
}

/**
 * Create in-memory storage instance
 */
export function createInMemoryStorage(): StorageContract {
  return new InMemoryStorage();
}
