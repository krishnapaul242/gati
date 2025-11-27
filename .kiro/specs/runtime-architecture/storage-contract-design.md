# Storage Contract Design - Pluggable Manifest Storage

**Status**: 📋 Design Proposal  
**Created**: 2025-01-XX  
**Effort**: 4-6 hours

---

## Overview

Create a **storage contract** that allows Gati to use any storage backend (in-memory, sql.js, better-sqlite3, PostgreSQL, etc.) via pluggable modules.

**Benefits**:
- ✅ Environment-agnostic (dev, prod, CI/CD)
- ✅ User choice (pick storage based on needs)
- ✅ Zero breaking changes (backward compatible)
- ✅ Leverages existing module system
- ✅ Minimal code (~200 lines)

---

## Architecture

### 1. Storage Contract Interface

```typescript
// packages/runtime/src/types/storage-contract.ts

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
  getTransformersForVersions(handlerId: string, from: string, to: string): Promise<Transformer[]>;
  
  // Version Graphs
  storeVersionGraph(graph: VersionGraph): Promise<void>;
  getVersionGraph(handlerId: string): Promise<VersionGraph | undefined>;
  
  // Timescape Metadata
  storeTimescapeMetadata(metadata: TimescapeMetadata): Promise<void>;
  getTimescapeMetadata(handlerId: string, version: string): Promise<TimescapeMetadata | undefined>;
  
  // Lifecycle
  clear(): Promise<void>;
  getStats(): StorageStats;
}

export interface StorageStats {
  manifestCount: number;
  gtypeCount: number;
  transformerCount: number;
  versionGraphCount: number;
  timescapeMetadataCount: number;
  hookManifestCount: number;
}
```

---

## 2. Storage Module Contract

```typescript
// packages/runtime/src/types/storage-module.ts

import type { Module } from './module.js';
import type { StorageContract } from './storage-contract.js';

/**
 * Storage module that provides manifest persistence
 */
export type StorageModule = Module<StorageContract>;
```

---

## 3. Built-in Implementations

### 3.1 In-Memory Storage (Default)

```typescript
// packages/runtime/src/storage/in-memory-storage.ts

export function createInMemoryStorage(): StorageModule {
  const manifests = new Map<string, Map<string, HandlerManifest>>();
  const hookManifests = new Map<string, HookManifest>();
  const gtypes = new Map<string, GType>();
  const transformers = new Map<string, Transformer>();
  const versionGraphs = new Map<string, VersionGraph>();
  const timescapeMetadata = new Map<string, TimescapeMetadata>();

  return {
    name: 'storage',
    version: '1.0.0',
    description: 'In-memory manifest storage (default)',
    
    exports: {
      async storeManifest(manifest) {
        if (!manifests.has(manifest.handlerId)) {
          manifests.set(manifest.handlerId, new Map());
        }
        manifests.get(manifest.handlerId)!.set(manifest.version, manifest);
      },
      
      async getManifest(id, version) {
        const versions = manifests.get(id);
        if (!versions) return undefined;
        if (version) return versions.get(version);
        return Array.from(versions.values()).sort((a, b) => b.createdAt - a.createdAt)[0];
      },
      
      // ... other methods (same as InMemoryManifestStore)
      
      async clear() {
        manifests.clear();
        hookManifests.clear();
        gtypes.clear();
        transformers.clear();
        versionGraphs.clear();
        timescapeMetadata.clear();
      },
      
      getStats() {
        let manifestCount = 0;
        for (const versions of manifests.values()) {
          manifestCount += versions.size;
        }
        return {
          manifestCount,
          gtypeCount: gtypes.size,
          transformerCount: transformers.size,
          versionGraphCount: versionGraphs.size,
          timescapeMetadataCount: timescapeMetadata.size,
          hookManifestCount: hookManifests.size,
        };
      },
    },
  };
}
```

### 3.2 sql.js Storage (Optional Package)

```typescript
// packages/storage-sqljs/src/index.ts (new package)

import initSqlJs from 'sql.js';

export function createSqlJsStorage(options?: { 
  filename?: string;
  autoSave?: boolean;
}): StorageModule {
  let db: Database | null = null;

  return {
    name: 'storage',
    version: '1.0.0',
    description: 'sql.js persistent storage',
    
    async init() {
      const SQL = await initSqlJs();
      
      // Load from file if exists
      if (options?.filename && fs.existsSync(options.filename)) {
        const buffer = fs.readFileSync(options.filename);
        db = new SQL.Database(buffer);
      } else {
        db = new SQL.Database();
      }
      
      // Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS manifests (
          handler_id TEXT,
          version TEXT,
          data TEXT,
          created_at INTEGER,
          PRIMARY KEY (handler_id, version)
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS hook_manifests (
          handler_id TEXT PRIMARY KEY,
          data TEXT,
          created_at INTEGER
        )
      `);
      
      // ... other tables
    },
    
    exports: {
      async storeManifest(manifest) {
        if (!db) throw new Error('Storage not initialized');
        
        db.run(
          'INSERT OR REPLACE INTO manifests VALUES (?, ?, ?, ?)',
          [manifest.handlerId, manifest.version, JSON.stringify(manifest), manifest.createdAt]
        );
        
        if (options?.autoSave && options.filename) {
          fs.writeFileSync(options.filename, db.export());
        }
      },
      
      async getManifest(id, version) {
        if (!db) throw new Error('Storage not initialized');
        
        const query = version
          ? 'SELECT data FROM manifests WHERE handler_id = ? AND version = ?'
          : 'SELECT data FROM manifests WHERE handler_id = ? ORDER BY created_at DESC LIMIT 1';
        
        const params = version ? [id, version] : [id];
        const result = db.exec(query, params);
        
        if (result.length === 0 || result[0].values.length === 0) {
          return undefined;
        }
        
        return JSON.parse(result[0].values[0][0] as string);
      },
      
      // ... other methods
    },
    
    async shutdown() {
      if (db && options?.filename) {
        fs.writeFileSync(options.filename, db.export());
      }
      db?.close();
      db = null;
    },
  };
}
```

---

## 4. Usage in Gati Config

### Default (In-Memory)

```typescript
// gati.config.ts

export default {
  server: { port: 3000 },
  routes: [/* ... */],
  
  // No storage config = uses in-memory by default
};
```

### With sql.js

```typescript
// gati.config.ts
import { createSqlJsStorage } from '@gati-framework/storage-sqljs';

export default {
  server: { port: 3000 },
  routes: [/* ... */],
  
  modules: (gctx) => {
    // Register custom storage
    gctx.modules['storage'] = createSqlJsStorage({
      filename: '.gati/manifests.db',
      autoSave: true,
    }).exports;
  },
};
```

### With better-sqlite3 (Production)

```typescript
// gati.config.ts
import { createBetterSqliteStorage } from '@gati-framework/storage-better-sqlite3';

export default {
  server: { port: 3000 },
  routes: [/* ... */],
  
  modules: (gctx) => {
    gctx.modules['storage'] = createBetterSqliteStorage({
      filename: '/var/lib/gati/manifests.db',
    }).exports;
  },
};
```

---

## 5. Runtime Integration

### Update ManifestStore to Use Storage Module

```typescript
// packages/runtime/src/manifest-store.ts

export class InMemoryManifestStore implements ManifestStore {
  constructor(private storage: StorageContract) {}
  
  async storeManifest(manifest: HandlerManifest): Promise<void> {
    return this.storage.storeManifest(manifest);
  }
  
  async getManifest(id: string, version?: string): Promise<HandlerManifest | undefined> {
    return this.storage.getManifest(id, version);
  }
  
  // Delegate all methods to storage contract
}

export function createManifestStore(gctx?: GlobalContext): ManifestStore {
  // Use storage module if available, otherwise default to in-memory
  const storage = gctx?.modules['storage'] as StorageContract 
    ?? createInMemoryStorage().exports;
  
  return new InMemoryManifestStore(storage);
}
```

---

## 6. Implementation Plan

### Phase 1: Contract Definition (1 hour)
- [ ] Create `storage-contract.ts` interface
- [ ] Create `storage-module.ts` type
- [ ] Export from runtime package

### Phase 2: Refactor In-Memory (1 hour)
- [ ] Move InMemoryManifestStore logic to `in-memory-storage.ts`
- [ ] Implement as StorageModule
- [ ] Update ManifestStore to delegate to storage contract
- [ ] Ensure backward compatibility

### Phase 3: Testing (1 hour)
- [ ] Update existing tests
- [ ] Add storage contract tests
- [ ] Verify backward compatibility

### Phase 4: Documentation (1 hour)
- [ ] Document storage contract
- [ ] Add usage examples
- [ ] Update module guide

### Phase 5: Optional Packages (2 hours - separate)
- [ ] Create `@gati-framework/storage-sqljs` package
- [ ] Create `@gati-framework/storage-better-sqlite3` package
- [ ] Publish to npm

---

## 7. Benefits

### For Users
- ✅ **Choice**: Pick storage based on needs (dev vs prod)
- ✅ **Zero Config**: Works out of box with in-memory
- ✅ **Persistence**: Optional persistent storage when needed
- ✅ **No Build Issues**: Can use pure JS (sql.js) or native (better-sqlite3)

### For Gati
- ✅ **Extensible**: Easy to add new storage backends
- ✅ **Testable**: Mock storage in tests
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Backward Compatible**: No breaking changes

---

## 8. Storage Backend Comparison

| Backend | Package | Build Deps | Persistence | Performance | Use Case |
|---------|---------|------------|-------------|-------------|----------|
| In-Memory | Built-in | ✅ None | ❌ No | ⚡ Fastest | Dev, testing |
| sql.js | Optional | ✅ None | ✅ Yes | ⚠️ Good | Dev, CI/CD |
| better-sqlite3 | Optional | ❌ Native | ✅ Yes | ⚡ Fastest | Production |
| PostgreSQL | Optional | ✅ None | ✅ Yes | ⚡ Fast | Production, multi-instance |

---

## 9. Migration Path

### Current Code (No Changes Required)
```typescript
// Existing code continues to work
const store = createManifestStore();
await store.storeManifest(manifest);
```

### New Code (Opt-in)
```typescript
// Users can opt-in to custom storage
const storage = createSqlJsStorage({ filename: 'manifests.db' });
const store = createManifestStore(gctx);
```

---

## 10. Acceptance Criteria

- [ ] StorageContract interface defined
- [ ] In-memory storage refactored as module
- [ ] ManifestStore delegates to storage contract
- [ ] All existing tests pass (27/27)
- [ ] Backward compatible (no breaking changes)
- [ ] Documentation updated
- [ ] Example storage modules created (sql.js, better-sqlite3)

---

## Conclusion

**Feasibility**: ✅ Highly Feasible  
**Effort**: 4-6 hours (core), 2-4 hours per optional package  
**Risk**: Low (leverages existing module system)  
**Value**: High (flexibility, extensibility, user choice)

**Recommendation**: Implement storage contract in Task 21 Phase 3, create optional packages later.
