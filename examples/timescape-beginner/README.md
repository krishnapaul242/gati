# Timescape Beginner Example: Simple Blog API

> 🚧 **Status**: Planned for M3 (Q1 2026)  
> This example will be created once Timescape versioning is implemented.

## Overview

This example demonstrates Timescape's API versioning with a simple blog API, focusing on non-breaking changes like adding optional fields.

## What You'll Learn

- Creating versioned API handlers
- Adding optional fields without breaking existing clients
- Using Timescape CLI to manage versions
- Testing multiple API versions simultaneously
- Viewing version history and diffs

## Planned Structure

```
examples/timescape-beginner/
├── src/
│   ├── handlers/
│   │   ├── posts/
│   │   │   ├── index.ts          # GET /api/posts
│   │   │   ├── [id].ts           # GET /api/posts/:id
│   │   │   └── create.ts         # POST /api/posts
│   │   └── health.ts
│   └── index.ts
├── versions/
│   ├── v1-2024-01-01.json        # Initial version
│   └── v2-2024-01-15.json        # Added optional fields
├── package.json
├── gati.config.ts
└── README.md
```

## Example Scenario

### Version 1 (2024-01-01)

Initial blog API with basic post structure:

```typescript
// GET /api/posts/:id
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
```

### Version 2 (2024-01-15)

Added optional author and tags (non-breaking):

```typescript
// GET /api/posts/:id
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: string;      // New optional field
  tags?: string[];      // New optional field
}
```

## Planned Commands

```bash
# Create the example project
npx gatic create blog-api --template timescape-beginner

# Start development server
cd blog-api
pnpm dev

# Create a new version
gati version:create "Added author and tags"

# View version history
gati version:list

# Test specific version
curl http://localhost:3000/api/posts/1?version=2024-01-01
curl http://localhost:3000/api/posts/1?version=2024-01-15

# View version diff
gati version:diff v1 v2
```

## Key Concepts Demonstrated

### 1. Non-Breaking Changes

Adding optional fields that don't affect existing clients:

```typescript
// v1 clients still work with v2 API
const post = await fetch('/api/posts/1?version=2024-01-01');
// Returns: { id, title, content, createdAt }

// v2 clients get new fields
const post = await fetch('/api/posts/1?version=2024-01-15');
// Returns: { id, title, content, createdAt, author, tags }
```

### 2. Automatic Version Routing

Timescape automatically routes requests to the correct version:

```typescript
// No code changes needed in handlers
// Timescape handles version routing automatically
export const handler: Handler = async (req, res) => {
  const post = await db.posts.findById(req.params.id);
  res.json({ post });
};
```

### 3. Version Metadata

Each version includes metadata:

```json
{
  "version": "2024-01-15T10:00:00Z",
  "description": "Added author and tags",
  "breaking": false,
  "changes": [
    {
      "type": "field_added",
      "path": "Post.author",
      "optional": true
    },
    {
      "type": "field_added",
      "path": "Post.tags",
      "optional": true
    }
  ]
}
```

## Expected Learning Outcomes

After completing this example, you'll understand:

- ✅ How to create and manage API versions
- ✅ How Timescape handles non-breaking changes
- ✅ How to test multiple versions simultaneously
- ✅ How version routing works automatically
- ✅ How to view version history and diffs

## Prerequisites

- Node.js >= 18.0.0
- Basic TypeScript knowledge
- Understanding of REST APIs
- Gati CLI installed (`npm install -g @gati-framework/cli`)

## Estimated Time

**30 minutes** to complete the tutorial

## Related Examples

- [Intermediate Example](../timescape-intermediate/README.md) - E-commerce API with breaking changes
- [Advanced Example](../timescape-advanced/README.md) - Complex versioning scenarios

## Documentation

- [Timescape Architecture](../../docs/architecture/timescape.md)
- [Timescape CLI Guide](../../docs/guides/timescape-cli.md)
- [API Versioning Best Practices](../../docs/guides/versioning-best-practices.md)

## Contributing

Want to help create this example? Check out:

- [Contributing Guide](../../docs/contributing/README.md)
- [GitHub Issues](https://github.com/krishnapaul242/gati/issues)

---

**Status**: 🚧 Planned  
**Target Release**: M3 (Q1 2026)  
**Difficulty**: Beginner  
**Duration**: 30 minutes  
**Last Updated**: November 22, 2025
