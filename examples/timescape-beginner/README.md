# Timescape Beginner Example: Simple Blog API

This example demonstrates the basics of Timescape API versioning with a simple blog API that evolves from V1 to V2.

## What You'll Learn

- How Timescape automatically manages API versions
- How to add optional fields without breaking old clients
- How to use semantic version tags (v1.0.0, v1.1.0)
- How to request specific versions using timestamps or tags
- How transformers convert data between versions

## The Scenario

You're building a blog API. Initially, posts have just `id`, `title`, and `content`. Later, you want to add an `author` field.

**Without Timescape:** You'd need to:
- Create a new endpoint like `/v2/posts`
- Maintain both endpoints
- Manually handle backward compatibility
- Risk breaking old clients

**With Timescape:** You just:
- Add the `author` field to your handler
- Timescape automatically creates a new version
- Old clients continue to work without changes
- New clients get the enhanced data

## Project Structure

```
timescape-beginner/
├── src/
│   ├── handlers/
│   │   ├── posts.ts          # V1: Basic post structure
│   │   └── posts-v2.ts        # V2: Added author field
│   └── transformers/
│       └── posts-v1-v2.ts     # Transforms between V1 ↔ V2
├── gati.config.ts             # Timescape configuration
├── package.json
├── test-requests.js           # Test script
└── README.md                  # This file
```

## Version Timeline

```
2025-11-20T10:00:00Z  →  V1 Created (tsv:1732104000-posts-001)
                         Tagged as: v1.0.0
                         Fields: id, title, content

2025-11-21T14:00:00Z  →  V2 Created (tsv:1732197600-posts-002)
                         Tagged as: v1.1.0
                         Fields: id, title, content, author (optional)
```

## Step-by-Step Tutorial

### Step 1: Understanding V1 (Initial Version)

**File:** `src/handlers/posts.ts`

```typescript
export interface PostV1 {
  id: string;
  title: string;
  content: string;
}
```

This is your initial API. Simple and straightforward.

### Step 2: Adding the Author Field (V2)

**File:** `src/handlers/posts-v2.ts`

```typescript
export interface PostV2 {
  id: string;
  title: string;
  content: string;
  author?: string;  // NEW: Optional field
}
```

Notice the `author` field is **optional** (`?`). This makes it a non-breaking change.

### Step 3: The Transformer

**File:** `src/transformers/posts-v1-v2.ts`

The transformer handles conversion between versions:

**Forward (V1 → V2):**
- No transformation needed (V2 is backward compatible)

**Backward (V2 → V1):**
- Remove the `author` field from responses
- This ensures old clients don't see unexpected fields

```typescript
backward: {
  transformResponse: (data: PostV2 | PostV2[]) => {
    // Remove 'author' field for V1 clients
    if (Array.isArray(data)) {
      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content
        // author is omitted
      }));
    }
    // ... same for single post
  }
}
```

### Step 4: Requesting Different Versions

Clients can request specific versions in multiple ways:

#### Option 1: Semantic Version Tags
```bash
# V1 (no author field)
GET /posts?version=v1.0.0

# V2 (with author field)
GET /posts?version=v1.1.0
```

#### Option 2: Timestamps
```bash
# Request as it was on Nov 20, 2025
GET /posts?version=2025-11-20T12:00:00Z

# Request as it is on Nov 21, 2025
GET /posts?version=2025-11-21T15:00:00Z
```

#### Option 3: Direct TSV
```bash
# V1 using TSV
GET /posts?version=tsv:1732104000-posts-001

# V2 using TSV
GET /posts?version=tsv:1732197600-posts-002
```

#### Option 4: Headers
```bash
# Using X-Gati-Version header
curl -H "X-Gati-Version: v1.0.0" http://localhost:3000/posts
```

#### Option 5: No Version (Latest)
```bash
# Always gets the latest version (V2)
GET /posts
```

## Running the Example

### 1. Install Dependencies

```bash
cd examples/timescape-beginner
pnpm install
```

### 2. Start the Dev Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

### 3. Run Test Requests

In another terminal:

```bash
pnpm test
```

This will run a series of test requests demonstrating different versioning scenarios.

### 4. Manual Testing

You can also test manually with curl:

```bash
# Get all posts with V1 (no author)
curl "http://localhost:3000/posts?version=v1.0.0"

# Get all posts with V2 (with author)
curl "http://localhost:3000/posts?version=v1.1.0"

# Get specific post with V1
curl "http://localhost:3000/posts/1?version=v1.0.0"

# Get specific post with V2
curl "http://localhost:3000/posts/1?version=v1.1.0"
```

## Expected Output

### V1 Response (no author):
```json
[
  {
    "id": "1",
    "title": "Introduction to Timescape",
    "content": "Timescape is a revolutionary API versioning system..."
  },
  {
    "id": "2",
    "title": "Getting Started with Gati",
    "content": "Gati is a modern TypeScript framework..."
  }
]
```

### V2 Response (with author):
```json
[
  {
    "id": "1",
    "title": "Introduction to Timescape",
    "content": "Timescape is a revolutionary API versioning system...",
    "author": "Alice Johnson"
  },
  {
    "id": "2",
    "title": "Getting Started with Gati",
    "content": "Gati is a modern TypeScript framework...",
    "author": "Bob Smith"
  }
]
```

## Key Concepts Demonstrated

### 1. Automatic Version Creation
- Timescape detects when you change your handler
- Creates a new version with a timestamp identifier (TSV)
- Old version remains accessible

### 2. Semantic Version Tags
- Human-readable labels (v1.0.0, v1.1.0)
- Map to internal TSV identifiers
- Multiple tags can point to same version

### 3. Backward Compatibility
- Old clients continue to work without changes
- Transformers handle data conversion automatically
- Optional fields don't break existing clients

### 4. Time-Travel Queries
- Request API as it was at any point in time
- Useful for debugging and auditing
- Consistent behavior across time

### 5. Immutable Transformers
- Once created, transformers cannot be modified
- Ensures consistency and reliability
- API evolution is forward-only

## What's Next?

This example showed a simple, non-breaking change (adding an optional field). For more complex scenarios, check out:

- **Intermediate Example:** Breaking changes, type conversions, database migrations
- **Advanced Example:** Multi-service coordination, complex transformer chains

## Troubleshooting

### Issue: "Version not found"
**Solution:** Make sure you're using the correct version identifier. Check available versions with:
```bash
gati timescape list
```

### Issue: "Transformer failed"
**Solution:** Check the transformer implementation in `src/transformers/posts-v1-v2.ts`. Ensure it handles both single objects and arrays.

### Issue: "Port already in use"
**Solution:** Stop any other processes using port 3000, or change the port in `gati.config.ts`.

## Learn More

- [Timescape Documentation](../../docs/guides/timescape.md)
- [API Reference](../../docs/api-reference/timescape.md)
- [Intermediate Example](../timescape-intermediate/README.md)
- [Advanced Example](../timescape-advanced/README.md)

## Summary

This beginner example demonstrates:
- ✅ Adding optional fields without breaking changes
- ✅ Using semantic version tags
- ✅ Requesting specific versions
- ✅ Automatic data transformation
- ✅ Time-travel queries

**Key Takeaway:** With Timescape, you can evolve your API confidently without breaking existing clients. The system handles versioning automatically, so you can focus on building features.
