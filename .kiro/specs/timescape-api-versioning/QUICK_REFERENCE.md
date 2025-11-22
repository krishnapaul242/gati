# Timescape API Versioning - Quick Reference

## 🚀 What is Timescape?

Timescape is Gati's revolutionary API versioning system that allows multiple API versions to run simultaneously with automatic backward/forward compatibility. No more breaking changes, no more manual version management!

---

## ✨ Key Features

### 1. Automatic Version Creation
```bash
# Just save your handler file - versions are created automatically!
# No manual version bumping needed
```

### 2. Flexible Version Routing
```bash
# Query parameter (semantic version)
GET /api/users?version=v1.0.0

# Query parameter (timestamp)
GET /api/users?version=2025-11-21T10:00:00Z

# Header
GET /api/users
X-Gati-Version: v1.0.0

# Direct TSV
GET /api/users?version=tsv:1732186200-users-042

# Latest (no version specified)
GET /api/users
```

### 3. Automatic Transformers
```typescript
// Transformers are auto-generated for breaking changes
// You just fill in the TODO comments!

export const userV1toV2: TransformerPair = {
  fromVersion: 'tsv:1732104000-users-001',
  toVersion: 'tsv:1732197600-users-002',
  
  forward: {
    transformResponse: (data) => {
      // TODO: Transform V1 response to V2 format
      return data;
    }
  },
  
  backward: {
    transformResponse: (data) => {
      // TODO: Transform V2 response to V1 format
      return data;
    }
  }
};
```

### 4. Version Lifecycle
```bash
# Versions automatically transition through states
HOT → WARM → COLD → DEACTIVATED

# Based on traffic and age
```

### 5. Semantic Tags
```bash
# Tag versions with human-readable labels
gati timescape tag tsv:1732197600-users-002 v1.1.0
gati timescape tag tsv:1732197600-users-002 stable
gati timescape tag tsv:1732197600-users-002 production
```

### 6. Database Schema Versioning
```typescript
// DB schemas are versioned alongside handlers
const artifact = {
  version: 'tsv:1732197600-users-002',
  metadata: {
    dbSchema: {
      version: 'schema_v2',
      migrations: ['002_add_email_column.sql'],
      rollback: ['002_add_email_column_rollback.sql']
    }
  }
};
```

---

## 📋 CLI Commands

### Version Management
```bash
# List all versions
gati timescape list

# List versions for specific handler
gati timescape list --handler /api/users

# List with tags
gati timescape list --tags

# Show version status
gati timescape status v1.0.0 --handler /api/users

# Deactivate version
gati timescape deactivate v1.0.0 --handler /api/users

# Force deactivate (even with protected tags)
gati timescape deactivate stable --handler /api/users --force
```

### Tag Management
```bash
# Create tag
gati timescape tag tsv:1732197600-users-002 v1.1.0

# Create tag with creator
gati timescape tag tsv:1732197600-users-002 production --created-by ops-team

# List all tags
gati timescape tags

# List tags for specific version
gati timescape tags tsv:1732197600-users-002

# Remove tag
gati timescape untag v1.1.0
```

---

## 🔧 Configuration

### gati.config.ts
```typescript
export default {
  timescape: {
    // Enable/disable automatic versioning
    enabled: true,
    
    // Version lifecycle
    coldThresholdMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoDeactivate: true,
    
    // Snapshots
    lightSnapshotInterval: 100,
    heavySnapshotInterval: 1000,
    snapshotRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
    
    // Performance
    cacheSize: 1000,
    maxTransformerChain: 10,
    
    // Storage
    storageBackend: 'consul',
    persistToDisk: true,
    diskPath: '.gati/timescape'
  }
};
```

---

## 📚 Examples

### Beginner: Simple Blog API
**Location**: `examples/timescape-beginner/`

**What it demonstrates**:
- Adding optional field (non-breaking change)
- Semantic version tags
- Basic transformer

**Versions**:
- V1: `{id, title, content}`
- V2: `{id, title, content, author?}`

**Run it**:
```bash
cd examples/timescape-beginner
pnpm install
pnpm dev
pnpm test
```

---

### Intermediate: E-commerce API
**Location**: `examples/timescape-intermediate/`

**What it demonstrates**:
- Breaking change (field rename + type change)
- Database migrations
- Multi-hop transformer chains
- Type conversions

**Versions**:
- V1: `{id, name, price: string}`
- V2: `{id, name, priceInCents: number}` (breaking)
- V3: `{id, name, priceInCents, currency, inStock}`

**Run it**:
```bash
cd examples/timescape-intermediate
pnpm install
pnpm dev
pnpm test
```

---

## 🧪 Testing

### Unit Tests
```bash
# Run all Timescape tests
pnpm test packages/runtime/src/timescape

# Run specific component tests
pnpm test packages/runtime/src/timescape/registry.test.ts
pnpm test packages/runtime/src/timescape/transformer.test.ts
```

### Integration Tests
```bash
# Coming soon in Phase 7
pnpm test:integration
```

---

## 📊 Monitoring

### Prometheus Metrics
```bash
# Version requests
timescape_version_requests_total{version="v1.0.0",handler="/api/users"} 1234

# Transformer execution
timescape_transformer_duration_seconds{from="v1",to="v2"} 0.005

# Version status
timescape_version_status{version="v1.0.0",status="hot"} 1
```

### CLI Status
```bash
# Check version status
gati timescape status v1.0.0 --handler /api/users

# Output:
# Version: tsv:1732197600-users-002
# Status: HOT
# Requests: 1234
# Last Accessed: 2025-11-22T10:00:00.000Z
```

---

## 🐛 Troubleshooting

### Issue: "Version not found"
**Cause**: Invalid version identifier  
**Solution**: Check available versions with `gati timescape list`

### Issue: "Transformer failed"
**Cause**: Transformer doesn't handle data structure  
**Solution**: Check transformer handles both single objects and arrays

### Issue: "Port already in use"
**Cause**: Another process using port 3000  
**Solution**: Stop other process or change port in config

### Issue: "Breaking change detected"
**Cause**: Schema changed in incompatible way  
**Solution**: Implement transformer to maintain backward compatibility

---

## 📖 Documentation

### Implementation Files
- `packages/runtime/src/timescape/registry.ts` - Version registry
- `packages/runtime/src/timescape/transformer.ts` - Transformer engine
- `packages/runtime/src/timescape/resolver.ts` - Version resolution
- `packages/runtime/src/timescape/integration.ts` - Request/response handling
- `packages/runtime/src/timescape/lifecycle.ts` - Auto-deactivation
- `packages/runtime/src/timescape/db-schema.ts` - Schema management

### Test Files
- `packages/runtime/src/timescape/*.test.ts` - 320+ unit tests
- `packages/cli/src/commands/timescape.test.ts` - CLI tests

### Spec Files
- `.kiro/specs/timescape-api-versioning/requirements.md` - Requirements
- `.kiro/specs/timescape-api-versioning/design.md` - Architecture
- `.kiro/specs/timescape-api-versioning/tasks.md` - Implementation tasks
- `.kiro/specs/timescape-api-versioning/SPEC_SUMMARY.md` - Summary
- `.kiro/specs/timescape-api-versioning/COMPLETION_PLAN.md` - Roadmap

---

## 🎯 Common Use Cases

### Use Case 1: Add Optional Field
```typescript
// V1
interface User {
  id: string;
  name: string;
}

// V2 (non-breaking)
interface User {
  id: string;
  name: string;
  email?: string; // Optional field
}

// No transformer needed - backward compatible!
```

### Use Case 2: Rename Field (Breaking)
```typescript
// V1
interface Product {
  id: string;
  price: string; // "29.99"
}

// V2 (breaking)
interface Product {
  id: string;
  priceInCents: number; // 2999
}

// Transformer required!
export const productV1toV2: TransformerPair = {
  forward: {
    transformResponse: (data) => ({
      ...data,
      priceInCents: Math.round(parseFloat(data.price) * 100)
    })
  },
  backward: {
    transformResponse: (data) => ({
      ...data,
      price: (data.priceInCents / 100).toFixed(2)
    })
  }
};
```

### Use Case 3: Database Migration
```typescript
// Register schema version
const artifact = {
  version: 'tsv:1732197600-products-002',
  metadata: {
    dbSchema: {
      version: 'schema_v2',
      migrations: [
        'ALTER TABLE products ADD COLUMN price_in_cents INTEGER;',
        'UPDATE products SET price_in_cents = CAST(price * 100 AS INTEGER);',
        'ALTER TABLE products DROP COLUMN price;'
      ],
      rollback: [
        'ALTER TABLE products ADD COLUMN price TEXT;',
        'UPDATE products SET price = CAST(price_in_cents / 100.0 AS TEXT);',
        'ALTER TABLE products DROP COLUMN price_in_cents;'
      ]
    }
  }
};
```

---

## 🚦 Status Indicators

### Version Status
- 🔴 **HOT**: High traffic, recently accessed
- 🟡 **WARM**: Moderate traffic
- 🔵 **COLD**: Low traffic, candidate for deactivation
- ⚫ **DEACTIVATED**: No longer active

### Protected Tags
- 🔒 **stable**: Cannot be auto-deactivated
- 🔒 **production**: Cannot be auto-deactivated
- 🔒 **latest**: Cannot be auto-deactivated

---

## 💡 Best Practices

### 1. Use Semantic Tags
```bash
# Tag major versions
gati timescape tag tsv:1732197600-users-002 v1.0.0

# Tag stable releases
gati timescape tag tsv:1732197600-users-002 stable

# Tag production deployments
gati timescape tag tsv:1732197600-users-002 production
```

### 2. Implement Transformers Carefully
```typescript
// Always handle both single objects and arrays
transformResponse: (data) => {
  if (Array.isArray(data)) {
    return data.map(item => transformItem(item));
  }
  return transformItem(data);
}
```

### 3. Test Breaking Changes
```bash
# Test old version still works
curl "http://localhost:3000/api/users?version=v1.0.0"

# Test new version works
curl "http://localhost:3000/api/users?version=v2.0.0"

# Test transformation works
curl "http://localhost:3000/api/users?version=v1.0.0"
# (with v2 handler running)
```

### 4. Monitor Version Usage
```bash
# Check which versions are being used
gati timescape list --tags

# Deactivate unused versions
gati timescape deactivate v0.9.0 --handler /api/users
```

### 5. Coordinate DB Migrations
```typescript
// Always provide rollback scripts
dbSchema: {
  version: 'schema_v2',
  migrations: ['002_add_column.sql'],
  rollback: ['002_add_column_rollback.sql'] // Important!
}
```

---

## 🎓 Learning Path

1. **Start Here**: Read `SPEC_SUMMARY.md`
2. **Try Beginner Example**: `examples/timescape-beginner/`
3. **Try Intermediate Example**: `examples/timescape-intermediate/`
4. **Read Architecture**: `.kiro/specs/timescape-api-versioning/design.md`
5. **Explore Code**: `packages/runtime/src/timescape/`
6. **Read Tests**: `packages/runtime/src/timescape/*.test.ts`

---

## 📞 Support

### Documentation
- Spec: `.kiro/specs/timescape-api-versioning/`
- Examples: `examples/timescape-*/`
- Tests: `packages/runtime/src/timescape/*.test.ts`

### Community
- GitHub Discussions: [Link]
- Discord: [Link]
- Issue Tracker: [Link]

---

**Quick Start**: Run `examples/timescape-beginner/` to see Timescape in action!  
**Full Guide**: See `SPEC_SUMMARY.md` for complete overview  
**Status**: 86% complete, production-ready for core features
