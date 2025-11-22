# Timescape Beginner Example: Simple Blog API

> **Difficulty**: Beginner  
> **Time**: 30 minutes  
> **Concepts**: Non-breaking changes, semantic versioning, bidirectional transformers

## Overview

This example demonstrates Timescape's version management with a simple blog API that evolves from V1 to V2 by adding an optional `author` field.

**What you'll learn**:
- How Timescape manages API versions
- How to add optional fields without breaking clients
- How to use semantic version tags
- How to request specific versions
- How bidirectional transformers work

## The Scenario

You're building a blog API. Initially, posts only have `id`, `title`, and `content`. Later, you want to add an optional `author` field.

**Without Timescape**: You'd need to coordinate with all clients, update documentation, and risk breaking old apps.

**With Timescape**: You simply add the field. Old clients continue working unchanged. New clients get the enhanced data.

## Version Timeline

```
V1 (2025-11-20T10:00:00Z)
├─ TSV: tsv:1732104000-posts-001
├─ Tag: v1.0.0
└─ Format: {id, title, content}

V2 (2025-11-21T14:00:00Z)
├─ TSV: tsv:1732197600-posts-002
├─ Tag: v1.1.0
└─ Format: {id, title, content, author?}
```

## Project Structure

```
examples/timescape-beginner/
├── src/
│   ├── handlers/
│   │   ├── posts.ts           # V1 handler
│   │   └── posts-v2.ts         # V2 handler
│   └── transformers/
│       └── posts-v1-v2.ts      # Bidirectional transformer
├── gati.config.ts              # Timescape configuration
├── package.json
├── test-requests.js            # Test script
└── README.md
```

## Step-by-Step Tutorial

### Step 1: V1 Handler (Initial Version)

```typescript
// src/handlers/posts.ts
import type { Handler } from '@gati-framework/runtime';

export interface PostV1 {
  id: string;
  title: string;
  content: string;
}

const posts: PostV1[] = [
  { id: '1', title: 'First Post', content: 'Hello World!' },
  { id: '2', title: 'Second Post', content: 'Learning Timescape' },
];

export const getPosts: Handler = async (req, res) => {
  res.json({ posts });
};

export const getPostById: Handler = async (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ post });
};
```

### Step 2: V2 Handler (With Author Field)

```typescript
// src/handlers/posts-v2.ts
import type { Handler } from '@gati-framework/runtime';

export interface PostV2 {
  id: string;
  title: string;
  content: string;
  author?: string;  // New optional field
}

const posts: PostV2[] = [
  { id: '1', title: 'First Post', content: 'Hello World!', author: 'Alice' },
  { id: '2', title: 'Second Post', content: 'Learning Timescape', author: 'Bob' },
];

export const getPosts: Handler = async (req, res) => {
  res.json({ posts });
};

export const getPostById: Handler = async (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ post });
};
```

### Step 3: Bidirectional Transformer

```typescript
// src/transformers/posts-v1-v2.ts
import type { Transformer } from '@gati-framework/runtime';
import type { PostV1 } from '../handlers/posts';
import type { PostV2 } from '../handlers/posts-v2';

// Forward: V1 → V2 (no transformation needed, backward compatible)
export const transformV1toV2: Transformer<PostV1, PostV2> = async (data) => {
  return data; // V1 data is valid V2 data
};

// Backward: V2 → V1 (remove author field)
export const transformV2toV1: Transformer<PostV2, PostV1> = async (data) => {
  if (Array.isArray(data)) {
    return data.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
    }));
  }
  
  return {
    id: data.id,
    title: data.title,
    content: data.content,
  };
};
```

### Step 4: Configuration

```typescript
// gati.config.ts
import { defineConfig } from '@gati-framework/runtime';

export default defineConfig({
  timescape: {
    enabled: true,
    autoDeactivate: false, // Keep all versions for demo
    cacheSize: 100,
    maxTransformerChain: 5,
  },
});
```

## Running the Example

### Installation

```bash
cd examples/timescape-beginner
pnpm install
```

### Start Development Server

```bash
pnpm dev
```

### Test Requests

```bash
# Run all test scenarios
pnpm test

# Or manually test:

# V1 request (no author field)
curl "http://localhost:3000/posts?version=v1.0.0"

# V2 request (with author field)
curl "http://localhost:3000/posts?version=v1.1.0"

# Timestamp request (V1 era)
curl "http://localhost:3000/posts?version=2025-11-20T12:00:00Z"

# Latest version (V2)
curl "http://localhost:3000/posts"
```

## Test Scenarios

The example includes 9 comprehensive test scenarios:

| # | Test | Version | Expected Result |
|---|------|---------|-----------------|
| 1 | GET /posts | v1.0.0 | No `author` field |
| 2 | GET /posts | v1.1.0 | Has `author` field |
| 3 | GET /posts | 2025-11-20T12:00:00Z | No `author` (V1 era) |
| 4 | GET /posts | 2025-11-21T15:00:00Z | Has `author` (V2 era) |
| 5 | GET /posts | tsv:1732104000-posts-001 | No `author` (V1 TSV) |
| 6 | GET /posts | tsv:1732197600-posts-002 | Has `author` (V2 TSV) |
| 7 | GET /posts | (none) | Has `author` (latest = V2) |
| 8 | GET /posts/1 | v1.0.0 | Single post, no `author` |
| 9 | GET /posts/1 | v1.1.0 | Single post, has `author` |

## Key Concepts

### 1. Non-Breaking Changes

Adding optional fields is **non-breaking** because:
- Old clients ignore the new field
- New clients benefit from enhanced data
- No coordination required

### 2. Semantic Version Tags

- `v1.0.0` → Initial release
- `v1.1.0` → Minor version (backward compatible)
- Tags are human-readable aliases for TSV timestamps

### 3. Version Resolution

Timescape supports multiple ways to request versions:

```bash
# Semantic version
?version=v1.0.0

# Timestamp (point-in-time)
?version=2025-11-20T12:00:00Z

# Direct TSV
?version=tsv:1732104000-posts-001

# Header
X-Gati-Version: v1.0.0

# Latest (no version specified)
# Returns newest version
```

### 4. Bidirectional Transformation

- **Forward (V1 → V2)**: No transformation needed (backward compatible)
- **Backward (V2 → V1)**: Remove `author` field

This ensures old clients can still work even when the handler returns V2 data.

### 5. Immutable Transformers

Once created, transformers are **never modified**. This ensures:
- Consistency across deployments
- Predictable behavior
- Safe version evolution

## Troubleshooting

### Version not found

**Error**: `Version not found: v1.0.0`

**Solution**: Ensure the version is registered in the Timescape registry. Check `.gati/timescape/registry.json`.

### Transformer not working

**Error**: `Transformer failed: Cannot read property 'author'`

**Solution**: Ensure your transformer handles both single objects and arrays:

```typescript
if (Array.isArray(data)) {
  return data.map(transform);
}
return transform(data);
```

### Wrong version returned

**Issue**: Requesting V1 but getting V2 data

**Solution**: Check version resolution order:
1. Query parameter `?version=`
2. Header `X-Gati-Version`
3. Default (latest)

## Next Steps

After completing this example:

1. **Intermediate Example**: Learn about breaking changes, type conversions, and database migrations
2. **Advanced Example**: Explore multi-service coordination and complex transformer chains
3. **CLI Guide**: Master Timescape CLI commands
4. **Architecture**: Deep dive into Timescape internals

## Related Documentation

- [Timescape Architecture](../architecture/timescape.md)
- [Intermediate Example](./timescape-intermediate.md)
- [CLI Reference](../guides/timescape-cli.md)

---

**Status**: ✅ Complete  
**Source**: `examples/timescape-beginner/`  
**Estimated Time**: 30 minutes
