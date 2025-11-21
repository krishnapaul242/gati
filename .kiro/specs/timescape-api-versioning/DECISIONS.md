# Timescape Design Decisions

This document captures the key architectural decisions for the Timescape API versioning system.

---

## Decision 1: Transformer Versioning

**Question:** Should transformers be versioned themselves?

**Decision:** ❌ NO - Transformers are NOT versioned

**Rationale:**
- Developers see only ONE transformer at a time (current ↔ previous)
- Only backward and forward transformers are visible for adjacent versions
- Old transformers are **immutable** once created
- The API should evolve forward, not retrospectively change transformers
- Changing old transformers would break the time-travel guarantee

**Implementation:**
```typescript
interface TransformerPair {
  fromVersion: TSV;
  toVersion: TSV;
  immutable: true;  // Cannot be modified after creation
  
  forward: {
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
  };
  
  backward: {
    transformRequest?: (data: any) => any;
    transformResponse?: (data: any) => any;
  };
}
```

**Developer Experience:**
- When working on version N, developer only sees transformer N ↔ N-1
- Cannot modify transformers for older versions
- CLI prevents editing immutable transformers

---

## Decision 2: Transformer Chain Structure

**Question:** How to handle circular dependencies in transformer chains?

**Decision:** ✅ Linear chains only - NO circular dependencies

**Rationale:**
- Transformers form a timeline, not a graph
- Chains only go backward (to previous versions) OR forward (to future versions)
- Time-ordered sequence prevents circular dependencies by design
- Simplifies reasoning about data flow

**Implementation:**
```
Timeline: v1 ← v2 ← v3 ← v4 (current)

Request at v1:
  v1 → forward(v1→v2) → forward(v2→v3) → forward(v3→v4) → handler(v4)
  
Response from v4:
  v4 → backward(v4→v3) → backward(v3→v2) → backward(v2→v1) → client

No cycles possible: versions are strictly ordered by timestamp
```

**Chain Execution:**
- Maximum chain length configurable (default: 10 hops)
- Each hop adds ~5-10ms latency
- Chains are cached per request

---

## Decision 3: Semantic Versioning Support

**Question:** Should we support semantic versioning alongside timestamps?

**Decision:** ⚠️ Partial - TSV is canonical, but can be tagged with semantic labels

**Rationale:**
- Timestamps (TSV) are the source of truth
- Humans prefer semantic versions (v1.2.0)
- Tags are aliases that resolve to TSV
- Multiple tags can point to same TSV

**Implementation:**
```typescript
interface VersionTag {
  label: string;           // e.g., "v1.2.0", "stable", "beta"
  tsv: TSV;               // e.g., "tsv:1732186200-users-042"
  createdAt: number;
  createdBy: string;
}

// Registry maintains tag → TSV mapping
registry.tagVersion('tsv:1732186200-users-042', 'v1.2.0');
registry.tagVersion('tsv:1732186200-users-042', 'stable');

// Resolution order:
// 1. Try as semantic tag → resolve to TSV
// 2. Try as timestamp → find TSV at that time
// 3. Try as direct TSV
```

**API Usage:**
```bash
# All three resolve to the same handler:
GET /api/users?version=v1.2.0
GET /api/users?version=stable
GET /api/users?version=2025-11-21T10:30:00Z
GET /api/users?version=tsv:1732186200-users-042
```

**CLI Commands:**
```bash
gati timescape tag tsv:1732186200-users-042 v1.2.0
gati timescape tag tsv:1732186200-users-042 stable
gati timescape list --tags
gati timescape untag v1.2.0
```

---

## Decision 4: Database Schema Versioning

**Question:** How to handle database schema changes across versions?

**Decision:** ✅ DB schemas are maintained inside TSV

**Rationale:**
- DB is accessed via plugins and/or modules
- Schema changes must be coordinated with handler changes
- Each TSV includes its required DB schema version
- Multiple API versions can share same DB schema (non-breaking changes)

**Implementation:**
```typescript
interface TimescapeArtifact {
  id: string;
  type: ArtifactType;  // 'handler' | 'module' | 'plugin' | 'schema'
  version: TSV;
  hash: string;
  metadata?: {
    dbSchema?: {
      version: string;              // e.g., "schema_v42"
      migrations: string[];         // SQL/migration scripts
      rollback: string[];           // Rollback scripts
      compatibleWith: string[];     // Other schema versions this works with
    };
  };
}
```

**Version Registry Enhancement:**
```typescript
interface VersionTimeline {
  handlerPath: string;
  versions: Array<{
    tsv: TSV;
    timestamp: number;
    hash: string;
    status: 'hot' | 'warm' | 'cold';
    requestCount: number;
    lastAccessed: number;
    tags: string[];
    dbSchemaVersion?: string;  // Required DB schema
  }>;
}
```

**Migration Strategy:**

1. **Version Activation:**
   ```typescript
   async function activateVersion(tsv: TSV) {
     const artifact = await registry.getArtifact(tsv);
     const requiredSchema = artifact.metadata?.dbSchema?.version;
     
     if (requiredSchema && !isSchemaActive(requiredSchema)) {
       await runMigrations(artifact.metadata.dbSchema.migrations);
     }
   }
   ```

2. **Version Deactivation:**
   ```typescript
   async function deactivateVersion(tsv: TSV) {
     const artifact = await registry.getArtifact(tsv);
     const schema = artifact.metadata?.dbSchema;
     
     // Only rollback if no other versions use this schema
     if (schema && !isSchemaUsedByOthers(schema.version)) {
       await runRollbacks(schema.rollback);
     }
   }
   ```

3. **Shared Schemas:**
   ```typescript
   // v1 and v2 can share same DB schema if changes are non-breaking
   const v1 = {
     tsv: 'tsv:1732186200-users-042',
     dbSchemaVersion: 'schema_v10'
   };
   
   const v2 = {
     tsv: 'tsv:1732186300-users-043',
     dbSchemaVersion: 'schema_v10'  // Same schema, no migration needed
   };
   ```

**Module/Plugin Integration:**
```typescript
// Database module declares schema requirements
export const databaseModule: Module = {
  name: 'db',
  schemaVersion: 'schema_v10',
  
  async init(gctx) {
    const schema = await gctx.timescape.getActiveSchema('db');
    const client = await connectToDatabase(schema);
    
    return {
      users: {
        findById: (id: string) => client.query('SELECT * FROM users WHERE id = $1', [id]),
      }
    };
  }
};
```

---

## Summary of Decisions

| Question | Decision | Impact |
|----------|----------|--------|
| Transformer versioning? | ❌ No | Transformers are immutable, simpler mental model |
| Circular dependencies? | ❌ No | Linear chains only, prevents complexity |
| Semantic versioning? | ⚠️ Partial | Tags supported as aliases to TSV |
| DB schema versioning? | ✅ Yes | Schemas tracked in TSV metadata |

---

## Implementation Checklist

- [x] Design decisions documented
- [ ] Update `packages/runtime/src/timescape/types.ts` with schema metadata
- [ ] Implement tag system in registry
- [ ] Implement linear chain executor
- [ ] Implement DB schema migration runner
- [ ] Add immutability enforcement for transformers
- [ ] Add CLI commands for tagging
- [ ] Write tests for all decisions
- [ ] Update documentation

---

## Related Files

- `requirements.md` - Updated with AC-6 (tagging) and AC-7 (DB schemas)
- `design.md` - Updated with design decisions section
- `tasks.md` - Updated with new tasks for tagging and DB schemas

---

**Last Updated:** 2025-11-21  
**Status:** ✅ All design questions resolved
