/**
 * @module runtime/types/manifest-store
 * @description Manifest and Schema Store types for Gati framework
 * 
 * This implements Task 15 from the runtime architecture spec:
 * - Manifest Store interface
 * - Handler Manifest structure
 * - GType schema definitions
 * - Version Graph types
 * - Transformer stub types
 * - Timescape metadata types
 * 
 * Requirements: 11.5
 */

/**
 * Handler Manifest
 * 
 * Complete metadata describing a handler's interface, types, hooks, and policies.
 * Generated during handler analysis and stored in the Manifest Store.
 */
export interface HandlerManifest {
  /**
   * Unique handler identifier (e.g., 'user.create', 'order.process')
   */
  handlerId: string;

  /**
   * Handler version (semver format)
   */
  version: string;

  /**
   * Request path pattern (e.g., '/users', '/orders/:id')
   */
  path: string;

  /**
   * HTTP method(s) this handler accepts
   */
  method: string | string[];

  /**
   * GType references for request/response validation
   */
  gtypes: {
    /**
     * GType reference for request body validation
     */
    request: string;

    /**
     * GType reference for response body validation
     */
    response: string;

    /**
     * Optional GType reference for path parameters
     */
    params?: string;

    /**
     * Optional GType reference for headers
     */
    headers?: string;
  };

  /**
   * Lifecycle hooks configuration
   */
  hooks: {
    /**
     * Hook IDs to execute before handler
     */
    before: string[];

    /**
     * Hook IDs to execute after handler
     */
    after: string[];

    /**
     * Hook IDs to execute on error
     */
    catch?: string[];
  };

  /**
   * Timescape version fingerprint for compatibility checking
   */
  timescapeVersion: string;

  /**
   * Security and rate limiting policies
   */
  policies: {
    /**
     * Required roles for access
     */
    roles?: string[];

    /**
     * Rate limiting configuration
     */
    rateLimit?: {
      /**
       * Maximum requests allowed
       */
      limit: number;

      /**
       * Time window in milliseconds
       */
      window: number;
    };
  };

  /**
   * Module and plugin dependencies
   */
  dependencies: {
    /**
     * Required module IDs
     */
    modules: string[];

    /**
     * Optional plugin IDs
     */
    plugins?: string[];
  };

  /**
   * Manifest hash for integrity verification
   */
  hash: string;

  /**
   * Timestamp when manifest was created
   */
  createdAt: number;
}

/**
 * GType kind enumeration
 */
export type GTypeKind = 'object' | 'array' | 'primitive' | 'union' | 'intersection';

/**
 * Primitive type enumeration
 */
export type PrimitiveType = 'string' | 'number' | 'boolean' | 'null';

/**
 * Validator type enumeration
 */
export type ValidatorType = 'min' | 'max' | 'pattern' | 'enum' | 'custom';

/**
 * Validator definition
 */
export interface Validator {
  /**
   * Validator type
   */
  type: ValidatorType;

  /**
   * Validator value (e.g., min value, regex pattern, enum values)
   */
  value: any;

  /**
   * Optional error message
   */
  message?: string;
}

/**
 * GType Schema
 * 
 * Runtime type schema generated from TypeScript types for validation.
 */
export interface GType {
  /**
   * Unique reference identifier (e.g., 'CreateUserRequest', 'UserResponse')
   */
  ref: string;

  /**
   * Type kind
   */
  kind: GTypeKind;

  /**
   * Object properties (for kind='object')
   */
  properties?: Record<string, GTypeProperty>;

  /**
   * Array item type (for kind='array')
   */
  items?: GType;

  /**
   * Union/intersection types (for kind='union' or 'intersection')
   */
  types?: GType[];

  /**
   * Primitive type (for kind='primitive')
   */
  primitiveType?: PrimitiveType;

  /**
   * Required property names (for kind='object')
   */
  required?: string[];

  /**
   * Validators for this type
   */
  validators?: Validator[];

  /**
   * Optional description
   */
  description?: string;
}

/**
 * GType property definition
 */
export interface GTypeProperty {
  /**
   * Property type
   */
  type: GType;

  /**
   * Whether property is optional
   */
  optional: boolean;

  /**
   * Optional property description
   */
  description?: string;
}

/**
 * Version Graph Node
 * 
 * Represents a single version in the version graph.
 */
export interface VersionNode {
  /**
   * Version identifier (semver)
   */
  version: string;

  /**
   * Manifest hash for this version
   */
  manifestHash: string;

  /**
   * Timestamp when version was deployed
   */
  deployedAt: number;

  /**
   * Whether this version is currently active
   */
  active: boolean;

  /**
   * Parent version (if any)
   */
  parent?: string;

  /**
   * Whether this version introduces breaking changes
   */
  breaking: boolean;

  /**
   * Transformers available from this version
   */
  transformers?: {
    /**
     * Target version
     */
    to: string;

    /**
     * Transformer ID
     */
    transformerId: string;
  }[];
}

/**
 * Version Graph
 * 
 * Complete version history and relationships for a handler.
 */
export interface VersionGraph {
  /**
   * Handler ID
   */
  handlerId: string;

  /**
   * All versions in the graph
   */
  versions: VersionNode[];

  /**
   * Current active version
   */
  currentVersion: string;

  /**
   * Latest deployed version
   */
  latestVersion: string;
}

/**
 * Transformer Stub
 * 
 * Metadata about a transformer for version compatibility.
 */
export interface Transformer {
  /**
   * Unique transformer ID
   */
  id: string;

  /**
   * Handler ID this transformer applies to
   */
  handlerId: string;

  /**
   * Source version
   */
  fromVersion: string;

  /**
   * Target version
   */
  toVersion: string;

  /**
   * Transformer direction
   */
  direction: 'forward' | 'backward';

  /**
   * GType transformations
   */
  transformations: {
    /**
     * Field path (e.g., 'user.email', 'items[].price')
     */
    path: string;

    /**
     * Transformation type
     */
    type: 'rename' | 'remove' | 'add' | 'transform';

    /**
     * Transformation details
     */
    details: any;
  }[];

  /**
   * Transformer hash for integrity
   */
  hash: string;

  /**
   * Timestamp when transformer was created
   */
  createdAt: number;
}

/**
 * Timescape Metadata
 * 
 * Timescape-specific metadata for version management.
 */
export interface TimescapeMetadata {
  /**
   * Handler ID
   */
  handlerId: string;

  /**
   * Version
   */
  version: string;

  /**
   * Timescape fingerprint for compatibility checking
   */
  fingerprint: string;

  /**
   * GType compatibility matrix
   */
  compatibility: {
    /**
     * Compatible versions (non-breaking)
     */
    compatible: string[];

    /**
     * Incompatible versions (breaking changes)
     */
    incompatible: string[];

    /**
     * Versions with transformers available
     */
    transformable: string[];
  };

  /**
   * Deployment metadata
   */
  deployment: {
    /**
     * Deployment strategy used
     */
    strategy: 'blue-green' | 'canary' | 'rolling';

    /**
     * Rollout percentage (for canary)
     */
    rolloutPercentage?: number;

    /**
     * Deployment status
     */
    status: 'pending' | 'active' | 'draining' | 'decommissioned';
  };

  /**
   * Traffic metrics
   */
  metrics?: {
    /**
     * Request count
     */
    requestCount: number;

    /**
     * Error rate
     */
    errorRate: number;

    /**
     * Average latency (ms)
     */
    avgLatency: number;

    /**
     * Last updated timestamp
     */
    lastUpdated: number;
  };
}

/**
 * Hook Definition
 * 
 * Metadata about a single hook extracted from handler code.
 * Used for manifest recording and Playground playback.
 */
export interface HookDefinition {
  /**
   * Unique hook identifier
   */
  id: string;

  /**
   * Hook type (lifecycle phase)
   */
  type: 'before' | 'after' | 'catch';

  /**
   * Hook execution level
   */
  level: 'global' | 'handler' | 'request';

  /**
   * Whether hook function is async
   */
  isAsync: boolean;

  /**
   * Optional timeout in milliseconds
   */
  timeout?: number;

  /**
   * Optional retry count
   */
  retries?: number;

  /**
   * Source code location
   */
  sourceLocation?: {
    /**
     * File path
     */
    file: string;

    /**
     * Line number
     */
    line: number;

    /**
     * Column number
     */
    column: number;
  };
}

/**
 * Hook Manifest
 * 
 * Complete collection of hooks for a handler.
 * Generated during handler analysis and used for Playground playback.
 */
export interface HookManifest {
  /**
   * Handler ID this manifest belongs to
   */
  handlerId: string;

  /**
   * Array of hook definitions
   */
  hooks: HookDefinition[];

  /**
   * Timestamp when manifest was created
   */
  createdAt: number;

  /**
   * Handler version
   */
  version: string;
}

/**
 * Manifest Store Interface
 * 
 * Provides persistence and retrieval for manifests, GTypes, version graphs,
 * transformers, and Timescape metadata.
 */
export interface ManifestStore {
  /**
   * Store a handler or module manifest
   * 
   * @param manifest - Handler or module manifest to store
   */
  storeManifest(manifest: HandlerManifest): Promise<void>;

  /**
   * Retrieve a manifest by ID and optional version
   * 
   * @param id - Handler or module ID
   * @param version - Optional version (defaults to latest)
   * @returns Manifest or undefined if not found
   */
  getManifest(id: string, version?: string): Promise<HandlerManifest | undefined>;

  /**
   * Get all versions of a manifest
   * 
   * @param id - Handler or module ID
   * @returns Array of all manifest versions
   */
  getAllManifestVersions(id: string): Promise<HandlerManifest[]>;

  /**
   * Store a GType schema
   * 
   * @param gtype - GType schema to store
   */
  storeGType(gtype: GType): Promise<void>;

  /**
   * Retrieve a GType schema by reference
   * 
   * @param ref - GType reference identifier
   * @returns GType schema or undefined if not found
   */
  getGType(ref: string): Promise<GType | undefined>;

  /**
   * Store a transformer stub
   * 
   * @param transformer - Transformer to store
   */
  storeTransformer(transformer: Transformer): Promise<void>;

  /**
   * Retrieve a transformer by ID
   * 
   * @param id - Transformer ID
   * @returns Transformer or undefined if not found
   */
  getTransformer(id: string): Promise<Transformer | undefined>;

  /**
   * Get transformers for a version pair
   * 
   * @param handlerId - Handler ID
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Array of applicable transformers
   */
  getTransformersForVersions(
    handlerId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<Transformer[]>;

  /**
   * Store or update a version graph
   * 
   * @param graph - Version graph to store
   */
  storeVersionGraph(graph: VersionGraph): Promise<void>;

  /**
   * Retrieve a version graph for a handler
   * 
   * @param handlerId - Handler ID
   * @returns Version graph or undefined if not found
   */
  getVersionGraph(handlerId: string): Promise<VersionGraph | undefined>;

  /**
   * Store Timescape metadata
   * 
   * @param metadata - Timescape metadata to store
   */
  storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void>;

  /**
   * Retrieve Timescape metadata
   * 
   * @param handlerId - Handler ID
   * @param version - Version
   * @returns Timescape metadata or undefined if not found
   */
  getTimescapeMetadata(
    handlerId: string,
    version: string
  ): Promise<TimescapeMetadata | undefined>;

  /**
   * Store a hook manifest
   * 
   * @param manifest - Hook manifest to store
   */
  storeHookManifest(manifest: HookManifest): Promise<void>;

  /**
   * Retrieve a hook manifest by handler ID
   * 
   * @param handlerId - Handler ID
   * @returns Hook manifest or null if not found
   */
  getHookManifest(handlerId: string): Promise<HookManifest | null>;

  /**
   * List all hook manifests
   * 
   * @returns Array of all hook manifests
   */
  listHookManifests(): Promise<HookManifest[]>;

  /**
   * Clear all stored data (for testing)
   */
  clear(): Promise<void>;

  /**
   * Get store statistics
   */
  getStats(): {
    manifestCount: number;
    gtypeCount: number;
    transformerCount: number;
    versionGraphCount: number;
    timescapeMetadataCount: number;
    hookManifestCount: number;
  };
}
