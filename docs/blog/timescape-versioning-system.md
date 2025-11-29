---
title: "Timescape: API Versioning Without Breaking Changes"
date: 2025-11-22
author: Krishna Paul
tags: [timescape, versioning, api-design]
---

# Timescape: API Versioning Without Breaking Changes

How Gati's Timescape system enables fearless API evolution.

## The Problem

Traditional API versioning forces a choice:

- **Break clients** - Fast iteration, angry users
- **Never change** - Technical debt accumulates

Timescape eliminates this trade-off.

## How It Works

### Automatic Version Detection

```typescript
// Version 1 (2025-01-01)
type User = {
  name: string;
  email: string;
};

// Version 2 (2025-02-01) - Breaking change detected
type User = {
  firstName: string;
  lastName: string;
  email: string;
};
```

Timescape automatically:
1. Detects schema change
2. Creates new version
3. Generates transformer stub

### Bidirectional Transformers

```typescript
// Auto-generated
export const transformV1toV2 = (v1: UserV1): UserV2 => ({
  firstName: v1.name.split(' ')[0],
  lastName: v1.name.split(' ')[1] || '',
  email: v1.email
});

export const transformV2toV1 = (v2: UserV2): UserV1 => ({
  name: `${v2.firstName} ${v2.lastName}`,
  email: v2.email
});
```

### Request Routing

```
Client (v1) → Timescape → Transform → Handler (v2) → Transform → Client (v1)
```

## Version Lifecycle

### Hot/Warm/Cold Classification

- **Hot**: >100 req/day, accessed recently
- **Warm**: 10-100 req/day
- **Cold**: <10 req/day, >30 days old

### Auto-Deactivation

```typescript
// Configure lifecycle
const lifecycle = createLifecycleManager({
  coldThresholdMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  minRequestCount: 10,
  protectedTags: ['stable', 'production']
});
```

## CLI Commands

```bash
# List versions
gati timescape list --handler /users/:id

# Tag version
gati timescape tag 2025-02-01T10:00:00Z stable

# Deactivate old version
gati timescape deactivate v1 --handler /users/:id
```

## Benefits

1. **No breaking changes** - Old clients keep working
2. **Fearless iteration** - Ship changes confidently
3. **Automatic cleanup** - Cold versions deactivate
4. **Full history** - Time-travel debugging

## Real-World Example

```typescript
// Client from 2024 still works
const response = await fetch('/users/123', {
  headers: { 'X-API-Version': '2024-01-01' }
});

// Gets data in 2024 format, even though
// handler uses 2025 schema internally
```

## Status

- ✅ Core system: 100% complete
- ✅ CLI commands: 100% complete
- ✅ Lifecycle management: 100% complete
- 🚧 Dev server integration: 50% complete

## Related

- [Timescape Architecture](/architecture/timescape)
- [Type System](/architecture/type-system)
- [Timescape CLI](/guides/timescape-cli)
