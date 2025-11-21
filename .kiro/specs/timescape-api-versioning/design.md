# Timescape API Versioning - Design

## Architecture Overview

Timescape consists of 5 core components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Request Router                          │
│  (Extracts version from query/header, routes to handler)   │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│ Version Registry│    │  Diff Engine    │
│  (TSV → Handler)│    │ (Schema Compare)│
└────────┬────────┘    └────────┬────────┘
         │                       │
         │         ┌─────────────┴──────────┐
         │         │                        │
┌────────▼─────────▼──────┐    ┌───────────▼────────┐
│  Transformer Chain      │    │  Snapshot Manager  │
│ (Convert req/res data)  │    │ (Version metadata) │
└─────────────────────────┘    └────────────────────┘
```

## Component Design

### 1. Version Registry (CP-1)

**Purpose:** Maps timestamps to handler versions

**Data Structure:**
```typescript
interface VersionRegistry {
  handlers: Map<string, VersionTimeline>;
  activeVersions: Set<TSV>;
  coldVersions: Set<TSV>;
  tags: Map<string, TSV>;  // Semantic version labels
}

interface VersionTimeline {
  handlerPath: string;
  versions: Array<{
    tsv: TSV;
    timestamp: number;
    hash: string;
    status: 'hot' | 'warm' | 'cold';
    requestCount: number;
    lastAccessed: number;
    tags: string[];  // e.g., ["v1.2.0", "stable"]
    dbSchemaVersion?: string;  // Required DB schema
  }>;
}
```

**Key Operations:**
- `getVersionAt(handlerPath, timestamp)` → TSV
- `getVersionByTag(handlerPath, tag)` → TSV
- `registerVersion(handlerPath, tsv, metadata)` → void
- `tagVersion(tsv, label)` → void
- `markCold(tsv)` → void
- `getActiveVersions(handlerPath)` → TSV[]

**Properties:**
- P-1.1: Version lookup is O(log n) using binary search
- P-1.2: Registry is synchronized across instances via Consul
- P-1.3: Registry persists to disk for recovery

### 2. Diff Engine (CP-2)

**Purpose:** Compares schemas between versions to detect changes

**Algorithm:**
```typescript
function diffSchemas(oldSchema: TypeSchema, newSchema: TypeSchema): SchemaDiff {
  const diff: SchemaDiff = {
    breaking: [],
    nonBreaking: [],
    requiresTransformer: false
  };
  
  // Compare request schemas
  const reqDiff = compareObjects(oldSchema.request, newSchema.request);
  
  // Compare response schemas
  const resDiff = compareObjects(oldSchema.response, newSchema.response);
  
  // Classify changes
  for (const change of [...reqDiff, ...resDiff]) {
    if (isBreaking(change)) {
      diff.breaking.push(change);
      diff.requiresTransformer = true;
    } else {
      diff.nonBreaking.push(change);
    }
  }
  
  return diff;
}
```

**Breaking Change Detection:**
- Removed required field → BREAKING
- Changed field type → BREAKING
- Added required field → BREAKING
- Removed optional field → NON-BREAKING
- Added optional field → NON-BREAKING

**Properties:**
- P-2.1: Diff computation is deterministic
- P-2.2: Diff results are cached by schema hash
- P-2.3: Supports nested object comparison

### 3. Transformer Chain (CP-3)

**Purpose:** Converts data between versions

**Transformer Interface:**
```typescript
type TransformerPair = {
  fromVersion: TSV;
  toVersion: TSV;
  immutable: true;  // Cannot be modified once created
  
  // Forward: fromVersion → toVersion
  forward: {
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
  };
  
  // Backward: toVersion → fromVersion
  backward: {
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
  };
  
  createdAt: number;
  createdBy: string;
};
```

**Key Principles:**
- Only ONE transformer pair exists between adjacent versions
- Transformers are immutable after creation
- Developers only see current ↔ previous transformer
- Old transformers remain frozen in time

**Execution Flow (Linear Chain):**
```
Client Request (v1) 
  → Forward: v1→v2 
  → Forward: v2→v3 
  → Handler (v3)
  → Response (v3)
  → Backward: v3→v2
  → Backward: v2→v1
  → Client Response (v1)

Note: Chain is always linear (no circular dependencies)
      v1 ← v2 ← v3 forms a timeline, not a cycle
```

**Properties:**
- P-3.1: Transformers are composable (chain multiple)
- P-3.2: Transformation errors trigger fallback to original version
- P-3.3: Transformers are hot-reloadable

### 4. Snapshot Manager (CP-4)

**Purpose:** Stores version metadata and enables time-travel

**Snapshot Types:**
- **Light Snapshot:** Registry state only (every 100 versions)
- **Heavy Snapshot:** Full artifacts (every 1000 versions)

**Storage:**
```typescript
interface Snapshot {
  id: string;
  timestamp: number;
  type: 'light' | 'heavy';
  registryState: VersionRegistryState;
  artifacts?: Record<string, any>; // Heavy only
}
```

**Properties:**
- P-4.1: Snapshots enable fast recovery
- P-4.2: Old snapshots are pruned after 90 days
- P-4.3: Snapshots are compressed with gzip

### 5. Request Router (CP-5)

**Purpose:** Routes requests to correct version

**Version Resolution:**
```typescript
function resolveVersion(req: Request, handlerPath: string): TSV {
  const versionParam = req.query.version || req.headers['x-gati-version'];
  
  if (!versionParam) {
    return registry.getLatestVersion(handlerPath);
  }
  
  // Try as semantic version tag first
  if (!versionParam.includes('T') && !versionParam.startsWith('tsv:')) {
    const tsv = registry.getVersionByTag(handlerPath, versionParam);
    if (tsv) return tsv;
  }
  
  // Try as timestamp
  if (versionParam.includes('T')) {
    return registry.getVersionAt(handlerPath, parseTimestamp(versionParam));
  }
  
  // Try as direct TSV
  if (versionParam.startsWith('tsv:')) {
    return versionParam as TSV;
  }
  
  throw new Error(`Invalid version format: ${versionParam}`);
}
```

**Properties:**
- P-5.1: Version resolution is cached per request
- P-5.2: Invalid versions return 400 Bad Request
- P-5.3: Supports semantic version tags (e.g., "v1.2.0", "stable")
- P-5.4: Tags are resolved to TSV before routing
- P-5.5: Multiple tags can point to same TSV

## Data Flow

### Version Creation Flow
```
1. Developer changes handler
2. CLI detects file change
3. Analyzer extracts new schema
4. Diff Engine compares with previous
5. If breaking: Generate transformer stub
6. New TSV created: tsv:1732186200-handler-name-001
7. Registry updated
8. Snapshot created (if threshold reached)
```

### Request Flow with Versioning
```
1. Request arrives: GET /api/users?version=2025-11-20T10:00:00Z
2. Router extracts version timestamp
3. Registry lookup: getVersionAt('/api/users', timestamp)
4. Returns: tsv:1732100400-users-042
5. Check if transformer needed (request version ≠ handler version)
6. Apply transformer chain: v042 → v045 → v048
7. Execute handler at v048
8. Apply reverse transformers: v048 → v045 → v042
9. Return response to client
```

## Configuration

```typescript
// gati.config.ts
export default {
  timescape: {
    enabled: true,
    
    // Version lifecycle
    coldThreshold: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoDeactivate: true,
    
    // Snapshots
    lightSnapshotInterval: 100,
    heavySnapshotInterval: 1000,
    snapshotRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
    
    // Performance
    cacheSize: 1000, // Cached version lookups
    maxTransformerChain: 10, // Max hops between versions
    
    // Storage
    storageBackend: 'consul', // or 'redis', 'postgres'
    persistToDisk: true,
    diskPath: '.gati/timescape'
  }
};
```

## Error Handling

### Transformer Errors
```typescript
try {
  const transformed = await transformer.transformRequest(data);
  return transformed;
} catch (error) {
  logger.error('Transformer failed', { error, from, to });
  
  // Fallback: Use original version handler
  return executeHandlerAtVersion(originalVersion, data);
}
```

### Version Not Found
```typescript
if (!version) {
  return res.status(400).json({
    error: 'Version not found',
    message: `No version exists at timestamp ${timestamp}`,
    availableVersions: registry.getVersions(handlerPath)
  });
}
```

## Testing Strategy

### Unit Tests
- Version registry operations
- Diff engine change detection
- Transformer composition
- Snapshot creation/restoration

### Integration Tests
- End-to-end version routing
- Multi-hop transformer chains
- Concurrent version access
- Version lifecycle transitions

### Performance Tests
- 10,000 req/s with 50 versions
- Transformer overhead measurement
- Registry lookup latency
- Snapshot creation time

## Migration Path

### Phase 1: Core Infrastructure (Week 1-2)
- Implement Version Registry
- Implement Diff Engine
- Basic snapshot system

### Phase 2: Transformer System (Week 3-4)
- Transformer interface
- Chain execution
- Auto-generation stubs

### Phase 3: Request Routing (Week 5)
- Version resolution
- Router integration
- Error handling

### Phase 4: Lifecycle Management (Week 6)
- Hot/warm/cold tracking
- Auto-deactivation
- Metrics collection

## Design Decisions

### 1. Transformer Versioning
**Decision:** Transformers are NOT versioned themselves.

**Rationale:**
- Developers see only ONE transformer at a time (current ↔ previous)
- Only backward and forward transformers are visible for adjacent versions
- Old transformers are immutable once created
- The API should evolve forward, not retrospectively change transformers

**Implementation:**
```typescript
interface TransformerPair {
  fromVersion: TSV;
  toVersion: TSV;
  backward: (data: any) => any;  // toVersion → fromVersion
  forward: (data: any) => any;   // fromVersion → toVersion
  immutable: true;
}
```

### 2. Transformer Chain Structure
**Decision:** Transformers form a linear chain, not circular.

**Rationale:**
- Chains only go backward (n-times to previous versions) OR forward (to future versions)
- No circular dependencies possible in a time-ordered sequence
- Simplifies reasoning about data flow

**Example:**
```
v1 ← v2 ← v3 ← v4 (current)
     ↓    ↓    ↓
   forward transformers

Request at v1 → forward chain → v4 handler → backward chain → v1 response
```

### 3. Semantic Version Labels
**Decision:** TSV versions can be tagged with semantic version labels.

**Rationale:**
- Timestamps are canonical, but humans prefer semantic versions
- Tags are aliases, not replacements
- Multiple tags can point to same TSV

**Implementation:**
```typescript
interface VersionTag {
  label: string;           // e.g., "v1.2.0", "stable", "beta"
  tsv: TSV;               // e.g., "tsv:1732186200-users-042"
  createdAt: number;
  createdBy: string;
}

// Usage
GET /api/users?version=v1.2.0  // Resolves to TSV
GET /api/users?version=stable  // Resolves to TSV
GET /api/users?version=2025-11-21T10:00:00Z  // Direct TSV lookup
```

### 4. Database Schema Versioning
**Decision:** DB schemas are maintained inside TSV alongside handler versions.

**Rationale:**
- DB is accessed via plugins and/or modules
- Schema changes must be coordinated with handler changes
- Each TSV includes its required DB schema version

**Implementation:**
```typescript
interface TimescapeArtifact {
  id: string;
  type: ArtifactType;  // includes 'schema', 'module', 'plugin'
  version: TSV;
  hash: string;
  metadata?: {
    dbSchema?: {
      version: string;
      migrations: string[];  // SQL/migration scripts
      rollback: string[];    // Rollback scripts
    };
  };
}
```

**Migration Strategy:**
- Each version declares its DB schema requirements
- Migrations run automatically when version is activated
- Rollbacks available if version is deactivated
- Multiple versions can share same DB schema (non-breaking changes)

## Alternatives Considered

### Alternative 1: URL-based versioning (/v1/users)
**Rejected:** Requires manual version management, doesn't support time-travel

### Alternative 2: Git-based versioning
**Rejected:** Too coupled to source control, doesn't work with dynamic changes

### Alternative 3: Semantic versioning (1.2.3)
**Rejected:** Requires manual bumping, doesn't capture exact deployment time
