# Migration Guide

## Migrating to @gati-framework/contracts

This guide helps you migrate from using runtime types directly to using the contracts package.

---

## Why Migrate?

The `@gati-framework/contracts` package provides:
- **Language-neutral contracts** - Use from any language via JSON Schema/Protobuf
- **Validation utilities** - Built-in validators for all contracts
- **Serialization support** - JSON, Protobuf, MessagePack
- **Better separation** - Contracts separate from implementation
- **Versioning** - Track contract versions independently

---

## Installation

```bash
npm install @gati-framework/contracts
# or
pnpm add @gati-framework/contracts
```

---

## Migration Examples

### Handler Types

**Before** (using runtime types):
```typescript
import { Handler } from '@gati-framework/runtime';

export const myHandler: Handler = async (req, res, gctx, lctx) => {
  // handler code
};
```

**After** (using contracts):
```typescript
import type { HandlerFunction } from '@gati-framework/contracts';

export const myHandler: HandlerFunction = async (req, res, gctx, lctx) => {
  // handler code
};
```

---

### Context Types

**Before**:
```typescript
import type { LocalContext, GlobalContext } from '@gati-framework/runtime';

function useContext(lctx: LocalContext, gctx: GlobalContext) {
  // context usage
}
```

**After**:
```typescript
import type { LocalContext, GlobalContext } from '@gati-framework/contracts';

function useContext(lctx: LocalContext, gctx: GlobalContext) {
  // context usage
}
```

---

### Module Manifests

**Before**:
```typescript
import type { ModuleManifest } from '@gati-framework/runtime';

const manifest: ModuleManifest = {
  name: 'my-module',
  version: '1.0.0',
  // ...
};
```

**After**:
```typescript
import type { ModuleManifest } from '@gati-framework/contracts';

const manifest: ModuleManifest = {
  name: 'my-module',
  id: 'mod-123',  // Now required
  version: '1.0.0',
  type: 'handler',  // Now required
};
```

---

### Validation

**New Feature** - Validate contracts at runtime:

```typescript
import { validateEnvelope, validateManifest } from '@gati-framework/contracts';

// Validate request envelope
const result = validateEnvelope(requestData);
if (!result.valid) {
  console.error('Invalid envelope:', result.errors);
}

// Validate module manifest
const manifestResult = validateManifest(manifest);
if (!manifestResult.valid) {
  console.error('Invalid manifest:', manifestResult.errors);
}
```

---

### Serialization

**New Feature** - Serialize to multiple formats:

```typescript
import {
  serializeJSON,
  serializeMessagePack,
  serializeProtobuf,
} from '@gati-framework/contracts';

// JSON serialization
const jsonResult = serializeJSON(data);
if (jsonResult.success) {
  console.log(jsonResult.data);
}

// MessagePack (binary, more compact)
const msgpackResult = serializeMessagePack(data);
if (msgpackResult.success) {
  // msgpackResult.data is a Buffer
  sendOverNetwork(msgpackResult.data);
}

// Protobuf (for RPC)
const protoResult = serializeProtobuf(
  data,
  'GatiRequestEnvelope',
  'envelope.proto'
);
```

---

## Breaking Changes

### Contract Structure Changes

1. **ModuleManifest** now requires `id` and `type` fields
2. **HandlerVersion** structure updated with new fields
3. **GType** system uses discriminated unions

### API Changes

None - contracts are additive, not replacing existing APIs.

---

## Compatibility Matrix

| Runtime Version | Contracts Version | Compatible |
|----------------|-------------------|------------|
| 2.0.x          | 1.1.x            | ✅ Yes     |
| 2.0.x          | 1.2.x            | ✅ Yes     |
| 2.1.x          | 1.2.x            | ✅ Yes     |

---

## Gradual Migration Strategy

You don't need to migrate everything at once:

### Phase 1: Add Contracts Package
```bash
pnpm add @gati-framework/contracts
```

### Phase 2: Migrate Type Imports
Replace runtime type imports with contract imports one file at a time.

### Phase 3: Add Validation
Add validation where needed for external data.

### Phase 4: Use Serialization
Adopt binary serialization for performance-critical paths.

---

## Common Issues

### Issue: Type Mismatch

**Problem**: Types from contracts don't match runtime types exactly.

**Solution**: Contracts are interfaces, runtime types are implementations. Use contracts for type definitions, runtime for execution.

```typescript
// Good: Use contract for type
import type { HandlerFunction } from '@gati-framework/contracts';

// Good: Use runtime for execution
import { createHandler } from '@gati-framework/runtime';

const handler: HandlerFunction = createHandler(async (req, res) => {
  // ...
});
```

### Issue: Missing Fields

**Problem**: Contract requires fields that weren't required before.

**Solution**: Update your data structures to include required fields.

```typescript
// Before
const manifest = {
  name: 'my-module',
  version: '1.0.0',
};

// After
const manifest = {
  name: 'my-module',
  id: 'mod-' + Date.now(),  // Add unique ID
  version: '1.0.0',
  type: 'handler',  // Add type
};
```

---

## Getting Help

- **Documentation**: [README.md](../README.md)
- **Examples**: [test/fixtures/](../test/fixtures/)
- **Issues**: [GitHub Issues](https://github.com/krishnapaul242/gati/issues)

---

## Next Steps

1. Install `@gati-framework/contracts`
2. Start with type imports
3. Add validation for external data
4. Explore serialization options
5. Read the [full documentation](../README.md)
