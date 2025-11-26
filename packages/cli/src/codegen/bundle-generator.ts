/**
 * @module cli/codegen/bundle-generator
 * @description Generate deployment bundles containing all manifests and schemas
 */

import * as crypto from 'crypto';
import type { HandlerManifest, ModuleManifest } from '../analyzer/manifest-generator.js';
import type { GType } from '@gati-framework/runtime';

export interface ManifestBundle {
  version: string;
  generated: string;
  checksum: string;
  handlers: HandlerManifest[];
  modules: ModuleManifest[];
  schemas: Record<string, GType>;
  versionGraph: VersionGraph;
  transformers: TransformerMetadata[];
  metadata: BundleMetadata;
}

export interface VersionGraph {
  nodes: VersionNode[];
  edges: VersionEdge[];
}

export interface VersionNode {
  version: string;
  handlerId: string;
  timestamp: number;
}

export interface VersionEdge {
  from: string;
  to: string;
  breaking: boolean;
}

export interface TransformerMetadata {
  fromVersion: string;
  toVersion: string;
  path: string;
}

export interface BundleMetadata {
  projectName?: string;
  environment?: string;
  buildNumber?: string;
  gitCommit?: string;
  [key: string]: unknown;
}

export interface BundleGeneratorOptions {
  version?: string;
  projectName?: string;
  environment?: string;
  includeMetadata?: boolean;
}

/**
 * Generate deployment bundle from manifests and schemas
 */
export class BundleGenerator {
  generate(
    handlers: HandlerManifest[],
    modules: ModuleManifest[],
    schemas: Record<string, GType>,
    options: BundleGeneratorOptions = {}
  ): ManifestBundle {
    const opts = {
      version: '1.0.0',
      includeMetadata: true,
      ...options,
    };

    // Validate manifests
    this.validateManifests(handlers, modules);

    // Build version graph
    const versionGraph = this.buildVersionGraph(handlers);

    // Collect transformers
    const transformers = this.collectTransformers(handlers);

    // Build metadata
    const metadata = this.buildMetadata(opts);

    // Create bundle
    const bundle: ManifestBundle = {
      version: opts.version,
      generated: new Date().toISOString(),
      checksum: '',
      handlers,
      modules,
      schemas,
      versionGraph,
      transformers,
      metadata,
    };

    // Calculate checksum
    bundle.checksum = this.calculateChecksum(bundle);

    return bundle;
  }

  private validateManifests(handlers: HandlerManifest[], modules: ModuleManifest[]): void {
    // Validate handler dependencies
    const moduleIds = new Set(modules.map(m => m.moduleId));
    
    for (const handler of handlers) {
      for (const moduleDep of handler.dependencies.modules) {
        if (!moduleIds.has(moduleDep)) {
          throw new Error(
            `Handler "${handler.handlerId}" depends on module "${moduleDep}" which is not in the bundle`
          );
        }
      }
    }

    // Validate unique handler IDs
    const handlerIds = new Set<string>();
    for (const handler of handlers) {
      if (handlerIds.has(handler.handlerId)) {
        throw new Error(`Duplicate handler ID: ${handler.handlerId}`);
      }
      handlerIds.add(handler.handlerId);
    }

    // Validate unique module IDs
    const moduleIdSet = new Set<string>();
    for (const module of modules) {
      if (moduleIdSet.has(module.moduleId)) {
        throw new Error(`Duplicate module ID: ${module.moduleId}`);
      }
      moduleIdSet.add(module.moduleId);
    }
  }

  private buildVersionGraph(handlers: HandlerManifest[]): VersionGraph {
    const nodes: VersionNode[] = [];
    const edges: VersionEdge[] = [];

    // Group handlers by path
    const handlersByPath = new Map<string, HandlerManifest[]>();
    for (const handler of handlers) {
      const existing = handlersByPath.get(handler.path) || [];
      existing.push(handler);
      handlersByPath.set(handler.path, existing);
    }

    // Build nodes and edges
    for (const [path, pathHandlers] of handlersByPath) {
      // Sort by timestamp (extracted from timescapeVersion)
      const sorted = pathHandlers.sort((a, b) => {
        const tsA = this.extractTimestamp(a.timescapeVersion);
        const tsB = this.extractTimestamp(b.timescapeVersion);
        return tsA - tsB;
      });

      // Create nodes
      for (const handler of sorted) {
        nodes.push({
          version: handler.timescapeVersion,
          handlerId: handler.handlerId,
          timestamp: this.extractTimestamp(handler.timescapeVersion),
        });
      }

      // Create edges between consecutive versions
      for (let i = 0; i < sorted.length - 1; i++) {
        edges.push({
          from: sorted[i].timescapeVersion,
          to: sorted[i + 1].timescapeVersion,
          breaking: false, // TODO: Implement breaking change detection
        });
      }
    }

    return { nodes, edges };
  }

  private extractTimestamp(timescapeVersion: string): number {
    // Extract timestamp from version string like "v1732186200-users-001"
    const match = timescapeVersion.match(/v?(\d+)/);
    return match ? parseInt(match[1], 10) : Date.now();
  }

  private collectTransformers(handlers: HandlerManifest[]): TransformerMetadata[] {
    const transformers: TransformerMetadata[] = [];

    // Group handlers by path
    const handlersByPath = new Map<string, HandlerManifest[]>();
    for (const handler of handlers) {
      const existing = handlersByPath.get(handler.path) || [];
      existing.push(handler);
      handlersByPath.set(handler.path, existing);
    }

    // Collect transformers between versions
    for (const [path, pathHandlers] of handlersByPath) {
      const sorted = pathHandlers.sort((a, b) => {
        const tsA = this.extractTimestamp(a.timescapeVersion);
        const tsB = this.extractTimestamp(b.timescapeVersion);
        return tsA - tsB;
      });

      for (let i = 0; i < sorted.length - 1; i++) {
        const fromVersion = sorted[i].timescapeVersion;
        const toVersion = sorted[i + 1].timescapeVersion;
        
        transformers.push({
          fromVersion,
          toVersion,
          path: `transformers/${fromVersion}-to-${toVersion}.ts`,
        });
      }
    }

    return transformers;
  }

  private buildMetadata(options: BundleGeneratorOptions): BundleMetadata {
    const metadata: BundleMetadata = {};

    if (options.includeMetadata) {
      if (options.projectName) {
        metadata.projectName = options.projectName;
      }
      if (options.environment) {
        metadata.environment = options.environment;
      }
    }

    return metadata;
  }

  private calculateChecksum(bundle: Partial<ManifestBundle>): string {
    // Create deterministic JSON string
    const { checksum, ...bundleWithoutChecksum } = bundle as ManifestBundle;
    const content = JSON.stringify(bundleWithoutChecksum, null, 0);
    
    // Calculate SHA-256 hash
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return `sha256:${hash}`;
  }

  /**
   * Create manifest index for fast lookup
   */
  createIndex(bundle: ManifestBundle): ManifestIndex {
    const handlerIndex = new Map<string, HandlerManifest>();
    const moduleIndex = new Map<string, ModuleManifest>();
    const pathIndex = new Map<string, HandlerManifest[]>();

    // Index handlers
    for (const handler of bundle.handlers) {
      handlerIndex.set(handler.handlerId, handler);
      
      const pathHandlers = pathIndex.get(handler.path) || [];
      pathHandlers.push(handler);
      pathIndex.set(handler.path, pathHandlers);
    }

    // Index modules
    for (const module of bundle.modules) {
      moduleIndex.set(module.moduleId, module);
    }

    return {
      handlers: handlerIndex,
      modules: moduleIndex,
      paths: pathIndex,
    };
  }

  /**
   * Validate bundle integrity
   */
  validateBundle(bundle: ManifestBundle): ValidationResult {
    const errors: string[] = [];

    // Verify checksum
    const expectedChecksum = this.calculateChecksum({
      ...bundle,
      checksum: '',
    });

    if (bundle.checksum !== expectedChecksum) {
      errors.push(`Checksum mismatch: expected ${expectedChecksum}, got ${bundle.checksum}`);
    }

    // Validate handler references
    for (const handler of bundle.handlers) {
      // Check schema references
      if (handler.gtypes.request && handler.gtypes.request !== 'any' && !bundle.schemas[handler.gtypes.request]) {
        errors.push(`Handler "${handler.handlerId}" references missing schema: ${handler.gtypes.request}`);
      }
      if (handler.gtypes.response && handler.gtypes.response !== 'any' && !bundle.schemas[handler.gtypes.response]) {
        errors.push(`Handler "${handler.handlerId}" references missing schema: ${handler.gtypes.response}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export interface ManifestIndex {
  handlers: Map<string, HandlerManifest>;
  modules: Map<string, ModuleManifest>;
  paths: Map<string, HandlerManifest[]>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Create bundle generator instance
 */
export function createBundleGenerator(): BundleGenerator {
  return new BundleGenerator();
}
