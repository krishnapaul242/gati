# Manifest Store Implementation

## Overview

The Manifest Store provides persistence and retrieval for handler manifests, GType schemas, version graphs, transformer stubs, and Timescape metadata. This implementation validates **Requirement 11.5** from the runtime architecture specification.

## Architecture

### Components

1. **ManifestStore Interface** - Defines the contract for manifest persistence
2. **InMemoryManifestStore** - In-memory implementation for development/testing
3. **Type Definitions** - Complete type system for manifests, GTypes, and metadata

### Data Types

#### Handler Manifest
Complete metadata describing a handler's interface, types, hooks, and policies:
- Handler ID and version
- Request path and HTTP methods
- GType references for validation
- Lifecycle hooks configuration
- Security policies (roles, rate limiting)
- Module dependencies
- Timescape version fingerprint

#### GType Schema
Runtime type schema generated from TypeScript types:
- Supports object, array, primitive, union, and intersection types
- Property definitions with optional flags
- Validators for runtime validation
- Recursive type definitions

#### Version Graph
Complete version history and relationships for a handler:
- Version nodes with deployment metadata
- Parent-child relationships
- Breaking change indicators
- Transformer availability

#### Transformer Stub
Metadata about transformers for version compatibility:
- Source and target versions
- Transformation rules (rename, add, remove, transform)
- Direction (forward/backward)

#### Timescape Metadata
Timescape-specific metadata for version management:
- Compatibility matrix
- Deployment strategy and status
- Traffic metrics

## Usage

### Basic Operations

```typescript
import { createManifestStore } from '@gati-framework/runtime';

// Create store
const store = createManifestStore();

// Store a manifest
await store.storeManifest({
  handlerId: 'user.create',
  version: '1.0.0',
  path: '/users',
  method: 'POST',
  gtypes: {
    request: 'CreateUserRequest',
    response: 'UserResponse',
  },
  hooks: {
    before: ['auth', 'validate'],
    after: ['log'],
  },
  timescapeVersion: 'v1',
  policies: {
    roles: ['admin'],
    rateLimit: { limit: 100, window: 60000 },
  },
  dependencies: {
    modules: ['user-service'],
  },
  hash: 'abc123',
  createdAt: Date.now(),
});

// Retrieve manifest
const manifest = await store.getManifest('user.create', '1.0.0');

// Get latest version
const latest = await store.getManifest('user.create');

// Get all versions
const versions = await store.getAllManifestVersions('user.create');
```

### GType Storage

```typescript
// Store GType schema
await store.storeGType({
  ref: 'CreateUserRequest',
  kind: 'object',
  properties: {
    name: {
      type: { ref: 'string', kind: 'primitive', primitiveType: 'string' },
      optional: false,
    },
    email: {
      type: { ref: 'string', kind: 'primitive', primitiveType: 'string' },
      optional: false,
    },
  },
  required: ['name', 'email'],
});

// Retrieve GType
const gtype = await store.getGType('CreateUserRequest');
```

### Version Graph Management

```typescript
// Store version graph
await store.storeVersionGraph({
  handlerId: 'user.create',
  versions: [
    {
      version: '1.0.0',
      manifestHash: 'hash1',
      deployedAt: Date.now(),
      active: false,
      breaking: false,
    },
    {
      version: '2.0.0',
      manifestHash: 'hash2',
      deployedAt: Date.now(),
      active: true,
      parent: '1.0.0',
      breaking: true,
    },
  ],
  currentVersion: '2.0.0',
  latestVersion: '2.0.0',
});

// Retrieve version graph
const graph = await store.getVersionGraph('user.create');
```

### Transformer Storage

```typescript
// Store transformer
await store.storeTransformer({
  id: 'user.create:v1->v2',
  handlerId: 'user.create',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  direction: 'forward',
  transformations: [
    {
      path: 'user.email',
      type: 'rename',
      details: { newName: 'emailAddress' },
    },
  ],
  hash: 'trans123',
  createdAt: Date.now(),
});

// Get transformers for version pair
const transformers = await store.getTransformersForVersions(
  'user.create',
  '1.0.0',
  '2.0.0'
);
```

### Timescape Metadata

```typescript
// Store Timescape metadata
await store.storeTimescapeMetadata({
  handlerId: 'user.create',
  version: '2.0.0',
  fingerprint: 'fp_abc123',
  compatibility: {
    compatible: ['1.9.0'],
    incompatible: ['1.0.0'],
    transformable: ['1.0.0'],
  },
  deployment: {
    strategy: 'canary',
    rolloutPercentage: 25,
    status: 'active',
  },
  metrics: {
    requestCount: 15000,
    errorRate: 0.002,
    avgLatency: 45.5,
    lastUpdated: Date.now(),
  },
});

// Retrieve metadata
const metadata = await store.getTimescapeMetadata('user.create', '2.0.0');
```

## Testing

### Property-Based Testing

The implementation includes comprehensive property-based tests using fast-check:

**Property 39: Manifest store persistence**
- Validates that any manifest, GType, version graph, transformer stub, or Timescape metadata can be persisted and retrieved
- Tests with 100+ iterations per property
- Validates data integrity after round-trip
- Tests concurrent operations
- Validates Requirements 11.5

### Test Coverage

- ✅ Basic CRUD operations for all data types
- ✅ Multi-version manifest management
- ✅ Concurrent reads and writes
- ✅ Data integrity across operations
- ✅ Update operations
- ✅ Empty result handling
- ✅ Statistics tracking

## Implementation Details

### In-Memory Storage

The `InMemoryManifestStore` uses Map-based storage for fast lookups:

```typescript
private manifests: Map<string, Map<string, HandlerManifest>>
private gtypes: Map<string, GType>
private transformers: Map<string, Transformer>
private versionGraphs: Map<string, VersionGraph>
private timescapeMetadata: Map<string, TimescapeMetadata>
```

### Performance Characteristics

- **Manifest Storage**: O(1) insert, O(1) lookup by ID+version
- **GType Storage**: O(1) insert, O(1) lookup by reference
- **Transformer Storage**: O(1) insert, O(n) lookup by version pair
- **Version Graph Storage**: O(1) insert, O(1) lookup by handler ID
- **Timescape Metadata**: O(1) insert, O(1) lookup by handler ID+version

### Production Considerations

The in-memory implementation is suitable for:
- Development and testing
- Single-instance deployments
- Prototyping and demos

For production deployments, consider:
- **PostgreSQL** - Relational storage with ACID guarantees
- **etcd** - Distributed key-value store with strong consistency
- **Redis** - High-performance caching layer
- **MongoDB** - Document storage for flexible schemas

## Integration with Runtime Components

### Route Manager
- Caches manifests for fast version resolution
- Queries GType schemas for compatibility checking
- Uses version graphs for routing decisions

### Local Context Controller
- Retrieves GType schemas for request/response validation
- Uses hook definitions from manifests
- Accesses Timescape metadata for lifecycle management

### Operator
- Stores manifests during handler deployment
- Updates version graphs on new deployments
- Manages Timescape metadata for rollouts

### Playground
- Queries version graphs for visualization
- Retrieves transformers for version comparison
- Accesses metrics from Timescape metadata

## API Reference

### ManifestStore Interface

```typescript
interface ManifestStore {
  // Manifest operations
  storeManifest(manifest: HandlerManifest): Promise<void>;
  getManifest(id: string, version?: string): Promise<HandlerManifest | undefined>;
  getAllManifestVersions(id: string): Promise<HandlerManifest[]>;

  // GType operations
  storeGType(gtype: GType): Promise<void>;
  getGType(ref: string): Promise<GType | undefined>;

  // Transformer operations
  storeTransformer(transformer: Transformer): Promise<void>;
  getTransformer(id: string): Promise<Transformer | undefined>;
  getTransformersForVersions(
    handlerId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<Transformer[]>;

  // Version graph operations
  storeVersionGraph(graph: VersionGraph): Promise<void>;
  getVersionGraph(handlerId: string): Promise<VersionGraph | undefined>;

  // Timescape metadata operations
  storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void>;
  getTimescapeMetadata(
    handlerId: string,
    version: string
  ): Promise<TimescapeMetadata | undefined>;

  // Utility operations
  clear(): Promise<void>;
  getStats(): {
    manifestCount: number;
    gtypeCount: number;
    transformerCount: number;
    versionGraphCount: number;
    timescapeMetadataCount: number;
  };
}
```

## Examples

See `examples/manifest-store-example.ts` for complete usage examples including:
- Basic manifest storage and retrieval
- GType schema management
- Version graph operations
- Transformer storage
- Timescape metadata management
- Multi-version handler management
- Statistics tracking

## Related Components

- **Route Manager** - Uses manifests for version resolution
- **Local Context Controller** - Uses GTypes for validation
- **Timescape** - Manages version compatibility
- **Operator** - Deploys handlers and updates manifests
- **Playground** - Visualizes version graphs and metrics

## Future Enhancements

1. **Persistent Storage Adapters**
   - PostgreSQL adapter
   - etcd adapter
   - Redis adapter

2. **Query Capabilities**
   - Search manifests by path pattern
   - Filter by deployment status
   - Query by compatibility

3. **Caching Layer**
   - LRU cache for frequently accessed manifests
   - Cache invalidation strategies
   - Distributed cache support

4. **Backup and Recovery**
   - Snapshot creation
   - Point-in-time recovery
   - Cross-region replication

5. **Metrics and Monitoring**
   - Access patterns tracking
   - Performance metrics
   - Storage utilization

## References

- **Design Document**: `.kiro/specs/runtime-architecture/design.md`
- **Requirements**: `.kiro/specs/runtime-architecture/requirements.md` (Requirement 11.5)
- **Property Tests**: `src/manifest-store.test.ts` (Property 39)
- **Type Definitions**: `src/types/manifest-store.ts`
