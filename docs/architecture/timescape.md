# Timescape: Gati's Version Management System

> **Status**: Core Priority - Not Yet Implemented (Planned for M2+)

## Overview

**Timescape** is Gati's revolutionary version management system that enables APIs to evolve without breaking existing clients. It achieves this through parallel version execution, automatic schema diffing, and AI-generated data transformers.

## Vision

Traditional APIs force developers to choose between:
- **Breaking changes** (frustrate users, require coordination)
- **Stagnation** (accumulate technical debt, miss improvements)

Timescape eliminates this trade-off by allowing **multiple API versions to coexist** and transparently bridging data between them.

## Core Principles

### 1. Version-First Architecture

Every handler is designed for isolation:

```typescript
// ✅ Stateless handler - Timescape compatible
export const getUserV2: Handler = async (req, res, gctx, lctx) => {
  const user = await gctx.modules['database']?.findUser(req.params.id);
  res.json({ user });
};

// ❌ Shared state - breaks version isolation
let cache = {}; // V1 and V2 will conflict
export const handler = (req, res) => {
  cache[req.params.id] = data;
};
```

**Why**: Stateless handlers can run in parallel without interference.

### 2. Automatic Version Detection

Timescape tracks handler changes and creates versions automatically:

```typescript
// Version 1 (2024-11-01)
type User = {
  name: string;
  email: string;
};

export const getUser: Handler = async (req, res, gctx, lctx) => {
  const user = await fetchUser(req.params.id);
  res.json({ user });
};

// Developer edits code...

// Version 2 (2024-11-15) - Timescape auto-detects breaking change
type User = {
  firstName: string;  // name split into two fields
  lastName: string;
  email: string;
};

export const getUser: Handler = async (req, res, gctx, lctx) => {
  const user = await fetchUser(req.params.id);
  res.json({ user }); // Different shape
};
```

**What happens**:
1. Analyzer detects schema change (name → firstName + lastName)
2. Creates new version entry in Timescape registry
3. Marks change as **breaking**
4. Generates transformer stub for AI completion

### 3. Schema Diff Engine

Built on the branded types system to detect:

- **Non-breaking changes**: Added optional fields, loosened constraints
- **Breaking changes**: Removed fields, tightened constraints, type changes
- **Shape changes**: Field renames, nested structure modifications

```typescript
// Non-breaking: Added optional field
type UserV1 = { name: string; email: string };
type UserV2 = { name: string; email: string; avatar?: string };

// Breaking: Removed required field
type UserV1 = { name: string; email: string; age: number };
type UserV2 = { name: string; email: string }; // age removed

// Breaking: Shape change
type UserV1 = { name: string };
type UserV2 = { firstName: string; lastName: string };
```

### 4. Transformer Chains

Transformers bridge data between versions:

```typescript
// Auto-generated transformer stub (AI-assisted)
export const transformV1toV2 = (v1User: UserV1): UserV2 => ({
  firstName: v1User.name.split(' ')[0],
  lastName: v1User.name.split(' ')[1] || '',
  email: v1User.email,
});

export const transformV2toV1 = (v2User: UserV2): UserV1 => ({
  name: `${v2User.firstName} ${v2User.lastName}`,
  email: v2User.email,
});
```

**Transformer chain for V1 → V4**:
```
V1 → [T1→2] → V2 → [T2→3] → V3 → [T3→4] → V4
```

Timescape composes transformers automatically.

## Implementation Architecture

### Version Registry

```typescript
// .gati/timescape/registry.json
{
  "handlers": {
    "/users/:id": {
      "versions": [
        {
          "id": "v1",
          "timestamp": "2024-11-01T10:00:00Z",
          "sha": "abc123",
          "schema": { /* GType schema */ },
          "breaking": false
        },
        {
          "id": "v2",
          "timestamp": "2024-11-15T14:30:00Z",
          "sha": "def456",
          "schema": { /* Updated GType schema */ },
          "breaking": true,
          "diff": {
            "removed": ["name"],
            "added": ["firstName", "lastName"],
            "transformers": {
              "v1_to_v2": "./transformers/users-v1-to-v2.ts",
              "v2_to_v1": "./transformers/users-v2-to-v1.ts"
            }
          }
        }
      ],
      "activeVersions": ["v1", "v2"], // Both running
      "defaultVersion": "v2"
    }
  }
}
```

### Request Routing

```
Client request → Gati router
  │
  ├─ Has version header? (X-API-Version: v1)
  │  └─ Route to specific version
  │
  ├─ No version header
  │  └─ Route to default version (latest)
  │
  └─ Version negotiation
     └─ Client accepts: v1, v2 → Route to v2 (highest supported)
```

### Parallel Execution

```typescript
// Runtime can run multiple versions simultaneously
const v1Handler = await loadHandler('/users/:id', 'v1');
const v2Handler = await loadHandler('/users/:id', 'v2');

// Different clients get different versions
if (req.headers['x-api-version'] === 'v1') {
  await v1Handler(req, res, gctx, lctx);
} else {
  await v2Handler(req, res, gctx, lctx);
}
```

### Data Transformation

```typescript
// Client requests V1, but database has V2 data
const v2Data = await database.getUser(userId);
const v1Data = await transformV2toV1(v2Data);
res.json(v1Data); // Client receives V1 format
```

## Developer Workflow

### Automatic Version Creation

```bash
# Developer edits handler
$ vim src/handlers/users/[id].ts

# On save, analyzer detects change
$ gati dev
[Timescape] Detected schema change in /users/:id
[Timescape] Breaking change: name → firstName + lastName
[Timescape] Creating version v2 (timestamp: 2024-11-15T14:30:00Z)
[Timescape] Generating transformer stubs...
[Timescape] Created: .gati/timescape/transformers/users-v1-to-v2.ts

# Developer completes transformer (AI-assisted)
$ vim .gati/timescape/transformers/users-v1-to-v2.ts

# Deploy with both versions
$ gati deploy production
[Timescape] Deploying versions: v1, v2
[Timescape] Both versions will be accessible
[Timescape] Default version: v2
```

### Manual Version Control

```typescript
// Force version creation
export const metadata = {
  version: '2024-11-15', // Manual version tag
  input: UserInputV2,
  output: UserOutputV2,
};
```

### Version Deprecation

```bash
# Mark version as deprecated
$ gati timescape deprecate /users/:id v1 --sunset 2025-01-01

# After sunset date, version is disabled
[Timescape] Version v1 of /users/:id is deprecated
[Timescape] Sunset: 2025-01-01
[Timescape] All requests auto-upgraded to v2
```

## AI-Augmented Transformers

Timescape generates transformer stubs and uses AI to complete them:

```typescript
// Auto-generated stub with AI hints
export const transformV1toV2 = (v1User: UserV1): UserV2 => {
  // AI Hint: Split 'name' into 'firstName' and 'lastName'
  // AI Hint: Handle single-word names gracefully
  
  return {
    firstName: v1User.name.split(' ')[0],
    lastName: v1User.name.split(' ')[1] || '',
    email: v1User.email,
  };
};
```

**AI completion sources**:
- Code patterns from existing transformers
- Database migration examples
- Type signature analysis
- Unit tests for edge cases

## Testing Version Compatibility

```typescript
// Timescape test harness
import { testVersionCompatibility } from '@gati-framework/testing';

describe('User API version compatibility', () => {
  it('transforms V1 data to V2', async () => {
    const v1Data = { name: 'John Doe', email: 'john@example.com' };
    const v2Data = await transformV1toV2(v1Data);
    
    expect(v2Data).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
  });
  
  it('handles round-trip transformation', async () => {
    const original = { name: 'Jane Smith', email: 'jane@example.com' };
    const roundTrip = await transformV2toV1(await transformV1toV2(original));
    
    expect(roundTrip).toEqual(original);
  });
});
```

## Deployment Strategy

### Gradual Rollout

```bash
# Deploy V2 alongside V1
$ gati deploy production --timescape

# Monitor traffic
V1: 80% traffic (legacy clients)
V2: 20% traffic (new clients)

# Gradually shift traffic
$ gati timescape traffic /users/:id --v2-percentage 50

# Full migration
$ gati timescape traffic /users/:id --v2-percentage 100

# Deprecate V1
$ gati timescape deprecate /users/:id v1 --sunset 2025-01-01
```

### Canary Testing

```bash
# Route 10% of V1 traffic to V2 with transformation
$ gati timescape canary /users/:id --from v1 --to v2 --percentage 10

# Monitor error rates, latency
# If successful, increase percentage
```

## Performance Considerations

### Version Loading

- **Lazy loading**: Load version code only when requested
- **Pre-warming**: Keep active versions in memory
- **Code splitting**: Bundle versions separately

### Transformer Optimization

- **Caching**: Memoize expensive transformations
- **Batch processing**: Transform multiple items at once
- **Parallel execution**: Run transformers concurrently

### Resource Isolation

```typescript
// Each version gets isolated resources
const v1Context = createGlobalContext(v1Config);
const v2Context = createGlobalContext(v2Config);

// Prevents resource contention
```

## Future Enhancements

### M3+: Multi-Dimensional Versioning

```
Version dimensions:
- API version (URL structure, handler signatures)
- Data version (schema, types)
- Business logic version (algorithms, rules)

Client can specify: v2-api + v3-data + v1-logic
```

### M4+: Visual Version Explorer (Playground)

- Timeline visualization of version history
- Interactive diff viewer
- Live transformer testing
- Traffic distribution graphs

### M5+: Machine Learning Version Optimization

- Predict breaking changes before deployment
- Suggest transformer implementations
- Auto-generate migration guides
- Optimize version bundle sizes

## References

- [Type System Architecture](./type-system.md) - Branded types for schema diffing
- [Manifest System](../guides/manifest-system.md) - How versions are tracked
- [Playground Guide](../guides/playground.md) - Visual debugging and request tracking

---

**Implementation Status**: Planned for M2+  
**Priority**: P0 (Core differentiator)  
**Dependencies**: Type system, analyzer, codegen  
**Related Issues**: #156, #157, #158
