/**
 * @module runtime/manifest-store
 * @description Manifest Store with pluggable storage backend
 * 
 * This implements Task 15 from the runtime architecture spec:
 * - Manifest persistence (handlers and modules)
 * - GType schema storage and retrieval
 * - Version graph storage
 * - Transformer stub storage
 * - Timescape metadata persistence
 * - Pluggable storage contract (Task 21 Phase 3)
 * 
 * Requirements: 11.5
 */

import type {
  ManifestStore,
  HandlerManifest,
  HookManifest,
  GType,
  Transformer,
  VersionGraph,
  TimescapeMetadata,
} from './types/manifest-store.js';
import type { StorageContract } from './types/storage-contract.js';
import { createInMemoryStorage } from './storage/in-memory-storage.js';

/**
 * Manifest Store implementation with pluggable storage backend
 * 
 * Delegates all storage operations to a StorageContract implementation.
 * Defaults to in-memory storage if no storage backend is provided.
 */
export class InMemoryManifestStore implements ManifestStore {
  private storage: StorageContract;

  constructor(storage?: StorageContract) {
    this.storage = storage ?? createInMemoryStorage();
  }

  /**
   * Store a handler or module manifest
   */
  async storeManifest(manifest: HandlerManifest): Promise<void> {
    return this.storage.storeManifest(manifest);
  }

  /**
   * Retrieve a manifest by ID and optional version
   */
  async getManifest(
    id: string,
    version?: string
  ): Promise<HandlerManifest | undefined> {
    return this.storage.getManifest(id, version);
  }

  /**
   * Get all versions of a manifest
   */
  async getAllManifestVersions(id: string): Promise<HandlerManifest[]> {
    return this.storage.getAllManifestVersions(id);
  }

  /**
   * Store a GType schema
   */
  async storeGType(gtype: GType): Promise<void> {
    return this.storage.storeGType(gtype);
  }

  /**
   * Retrieve a GType schema by reference
   */
  async getGType(ref: string): Promise<GType | undefined> {
    return this.storage.getGType(ref);
  }

  /**
   * Store a transformer stub
   */
  async storeTransformer(transformer: Transformer): Promise<void> {
    return this.storage.storeTransformer(transformer);
  }

  /**
   * Retrieve a transformer by ID
   */
  async getTransformer(id: string): Promise<Transformer | undefined> {
    return this.storage.getTransformer(id);
  }

  /**
   * Get transformers for a version pair
   */
  async getTransformersForVersions(
    handlerId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<Transformer[]> {
    return this.storage.getTransformersForVersions(handlerId, fromVersion, toVersion);
  }

  /**
   * Store or update a version graph
   */
  async storeVersionGraph(graph: VersionGraph): Promise<void> {
    return this.storage.storeVersionGraph(graph);
  }

  /**
   * Retrieve a version graph for a handler
   */
  async getVersionGraph(handlerId: string): Promise<VersionGraph | undefined> {
    return this.storage.getVersionGraph(handlerId);
  }

  /**
   * Store Timescape metadata
   */
  async storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void> {
    return this.storage.storeTimescapeMetadata(metadata);
  }

  /**
   * Retrieve Timescape metadata
   */
  async getTimescapeMetadata(
    handlerId: string,
    version: string
  ): Promise<TimescapeMetadata | undefined> {
    return this.storage.getTimescapeMetadata(handlerId, version);
  }

  /**
   * Store a hook manifest
   */
  async storeHookManifest(manifest: HookManifest): Promise<void> {
    return this.storage.storeHookManifest(manifest);
  }

  /**
   * Retrieve a hook manifest by handler ID
   */
  async getHookManifest(handlerId: string): Promise<HookManifest | null> {
    return this.storage.getHookManifest(handlerId);
  }

  /**
   * List all hook manifests
   */
  async listHookManifests(): Promise<HookManifest[]> {
    return this.storage.listHookManifests();
  }

  /**
   * Clear all stored data (for testing)
   */
  async clear(): Promise<void> {
    return this.storage.clear();
  }

  /**
   * Get store statistics
   */
  getStats() {
    return this.storage.getStats();
  }
}

/**
 * Create a new manifest store with optional storage backend
 * 
 * @param storage - Optional storage backend (defaults to in-memory)
 */
export function createManifestStore(storage?: StorageContract): ManifestStore {
  return new InMemoryManifestStore(storage);
}
