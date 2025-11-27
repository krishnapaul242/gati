# Storage Backends

This directory contains storage backend implementations for the Gati manifest store.

## Architecture

Gati uses a **pluggable storage contract** that allows different storage backends to be used based on environment and requirements.

### Storage Contract

All storage backends implement the `StorageContract` interface:

```typescript
interface StorageContract {
  // Handler Manifests
  storeManifest(manifest: HandlerManifest): Promise<void>;
  getManifest(id: string, version?: string): Promise<HandlerManifest | undefined>;
  getAllManifestVersions(id: string): Promise<HandlerManifest[]>;
  
  // Hook Manifests
  storeHookManifest(manifest: HookManifest): Promise<void>;
  getHookManifest(handlerId: string): Promise<HookManifest | null>;
  listHookManifests(): Promise<HookManifest[]>;
  
  // GTypes, Transformers, Version Graphs, Timescape Metadata
  // ... (see types/storage-contract.ts for full interface)
  
  // Lifecycle
  clear(): Promise<void>;
  getStats(): StorageStats;
}
```

## Built-in Backends

### In-Memory Storage (Default)

**File**: `in-memory-storage.ts`

- ✅ Zero dependencies
- ✅ Fast operations
- ✅ Works everywhere
- ❌ No persistence (data lost on restart)

**Use Cases**: Development, testing, ephemeral environments

**Usage**:
```typescript
import { createManifestStore } from '@gati-framework/runtime';

// Uses in-memory storage by default
const store = createManifestStore();
```

## Custom Storage Backends

You can create custom storage backends by implementing the `StorageContract` interface.

### Example: Custom Storage

```typescript
import type { StorageContract } from '@gati-framework/runtime';

class MyCustomStorage implements StorageContract {
  async storeManifest(manifest) {
    // Your implementation
  }
  
  async getManifest(id, version) {
    // Your implementation
  }
  
  // ... implement all methods
}

// Use custom storage
import { createManifestStore } from '@gati-framework/runtime';

const customStorage = new MyCustomStorage();
const store = createManifestStore(customStorage);
```

## Future Storage Backends

### sql.js (Planned)

Pure JavaScript SQLite implementation with optional persistence.

**Package**: `@gati-framework/storage-sqljs`

- ✅ Zero build dependencies
- ✅ Persistent storage
- ✅ Full SQL support
- ⚠️ Slightly slower than native

### better-sqlite3 (Planned)

Native SQLite implementation for production use.

**Package**: `@gati-framework/storage-better-sqlite3`

- ✅ Fastest performance
- ✅ Persistent storage
- ❌ Requires native build tools

### PostgreSQL (Planned)

Production-grade storage for multi-instance deployments.

**Package**: `@gati-framework/storage-postgres`

- ✅ Production-ready
- ✅ Multi-instance support
- ✅ ACID transactions
- ⚠️ Requires PostgreSQL server

## Design Principles

1. **Zero Config** - Works out of box with in-memory storage
2. **Opt-In Persistence** - Users choose when they need it
3. **Environment Agnostic** - No build dependencies by default
4. **Extensible** - Easy to add new backends
5. **Backward Compatible** - Existing code continues to work
