# Manifest System

Gati uses a sophisticated manifest system for fast, incremental route discovery and hot reloading. This system enables zero-configuration development with instant feedback.

## How It Works

The manifest system operates in three layers:

1. **File Analysis** - Extract route information from TypeScript files
2. **Individual Manifests** - Create JSON manifests for each file
3. **Application Manifest** - Aggregate all routes into a single manifest

```plaintext
src/handlers/hello.ts
    ↓ (analyze)
.gati/manifests/hello.json
    ↓ (aggregate)
.gati/manifests/_app.json
    ↓ (load)
Running Application
```

## Individual File Manifests

Each handler file gets its own manifest in `.gati/manifests/`:

### Example: `src/handlers/users/[id].ts`
```typescript
export const METHOD = 'GET';
export const ROUTE = '/users/:id';
export const handler: Handler = (req, res) => {
  res.json({ userId: req.params.id });
};
```

### Generated: `.gati/manifests/users_[id].json`
```json
{
  "filePath": "/project/src/handlers/users/[id].ts",
  "type": "handler",
  "data": {
    "filePath": "/project/src/handlers/users/[id].ts",
    "relativePath": "handlers/users/[id].ts",
    "route": "/users/:id",
    "method": "GET",
    "exportName": "handler",
    "exportType": "named"
  },
  "timestamp": 1699123456789
}
```

## Application Manifest

All individual manifests are aggregated into `_app.json`:

```json
{
  "handlers": [
    {
      "filePath": "/project/src/handlers/hello.ts",
      "route": "/hello",
      "method": "GET",
      "exportName": "handler"
    },
    {
      "filePath": "/project/src/handlers/users/[id].ts", 
      "route": "/users/:id",
      "method": "GET",
      "exportName": "handler"
    }
  ],
  "modules": [
    {
      "filePath": "/project/src/modules/database.ts",
      "exportName": "database",
      "methods": ["findById", "create", "update"]
    }
  ],
  "timestamp": 1699123456789
}
```

## File Watching Strategy

Gati uses **parallel watching** for optimal performance:

### 1. Source File Watcher
Monitors `src/**/*.{ts,js}` for changes:

```typescript
// When src/handlers/users.ts changes:
1. Analyze file → Extract METHOD, ROUTE, handler
2. Update users.json manifest
3. Trigger manifest watcher
```

### 2. Manifest Watcher  
Monitors `.gati/manifests/*.json` for changes:

```typescript
// When users.json changes:
1. Read all individual manifests
2. Aggregate into _app.json
3. Trigger application reload
```

This parallel approach ensures:
- ✅ **Fast Updates** - Only changed files are reprocessed
- ✅ **Incremental Builds** - No full project analysis needed
- ✅ **Reliable Sync** - Manifests always reflect current state

## Manifest Naming

Individual manifests use clean, readable names:

| File Path | Manifest Name |
|-----------|---------------|
| `src/handlers/hello.ts` | `hello.json` |
| `src/handlers/users/[id].ts` | `users_[id].json` |
| `src/handlers/posts/[id]/comments.ts` | `posts_[id]_comments.json` |
| `src/modules/database.ts` | `database.json` |

## Route Analysis

The analyzer extracts route information using regex patterns:

### METHOD Export
```typescript
export const METHOD = 'POST';
// Extracted: method = 'POST'
```

### ROUTE Export (Optional)
```typescript
export const ROUTE = '/custom/path';
// Extracted: route = '/custom/path'
```

### Handler Export
```typescript
export const handler: Handler = (req, res) => { /* ... */ };
// Extracted: exportName = 'handler', exportType = 'named'
```

### Auto-Generated Routes
If no `ROUTE` export, route is generated from file path:

```plaintext
handlers/users/[id].ts → /users/:id
handlers/posts/create.ts → /posts/create
handlers/hello.ts → /hello
```

## Development Workflow

### 1. Initial Scan
When starting `pnpm dev`:

```plaintext
🔍 Scanning src/ directory...
📄 Found 5 handlers, 2 modules
✅ Generated manifests in .gati/manifests/
🚀 Server ready at http://localhost:3000
```

### 2. File Changes
When you modify a file:

```plaintext
📝 File changed: users/[id].ts
✅ Updated manifest: users_[id].json
🔄 Reloaded GET /users/:id
```

### 3. New Files
When you add a file:

```plaintext
📄 File added: posts/create.ts
✅ Created manifest: posts_create.json
🆕 Registered POST /posts/create
```

### 4. Deleted Files
When you delete a file:

```plaintext
🗑️ File removed: old-handler.ts
🗑️ Removed manifest: old-handler.json
❌ Unregistered GET /old-handler
```

## Performance Benefits

### Traditional Approach
```plaintext
File Change → Full Project Scan → Rebuild All Routes → Restart Server
Time: ~2-5 seconds
```

### Gati Manifest System
```plaintext
File Change → Update Single Manifest → Reload Changed Route
Time: ~50-200ms
```

### Benchmarks
- **Cold Start**: 500ms for 100 handlers
- **Hot Reload**: 50ms per file change
- **Memory Usage**: ~1MB for 1000 handlers

## Manifest Structure

### Handler Manifest
```typescript
interface HandlerManifest {
  filePath: string;           // Absolute file path
  type: 'handler';           // Manifest type
  data: {
    filePath: string;        // Same as above
    relativePath: string;    // Relative to src/
    route: string;           // API route (e.g., '/users/:id')
    method: string;          // HTTP method
    exportName: string;      // Handler function name
    exportType: 'named';     // Export type
  };
  timestamp: number;         // Last modified time
}
```

### Module Manifest
```typescript
interface ModuleManifest {
  filePath: string;          // Absolute file path
  type: 'module';           // Manifest type
  data: {
    filePath: string;        // Same as above
    exportName: string;      // Module name
    exportType: 'named';     // Export type
    methods: string[];       // Available methods
  };
  timestamp: number;         // Last modified time
}
```

## Error Handling

### Invalid Syntax
```plaintext
❌ Failed to process users.ts: SyntaxError
⚠️ Skipping invalid file
```

### Missing Exports
```plaintext
⚠️ No handler export found in users.ts
⚠️ Skipping file without handler
```

### Route Conflicts
```plaintext
⚠️ Route conflict: GET /users
  - handlers/users.ts
  - handlers/users/index.ts
✅ Using handlers/users.ts (higher priority)
```

## Configuration

### Disable File Watching
```bash
pnpm dev --no-watch
```

### Custom Manifest Directory
```typescript
// gati.config.ts
export default {
  manifestDir: '.custom-manifests'
};
```

### Ignore Patterns
```typescript
// gati.config.ts
export default {
  ignore: [
    'src/handlers/internal/**',
    'src/handlers/*.test.ts'
  ]
};
```

## Debugging Manifests

### View Individual Manifest
```bash
cat .gati/manifests/users_[id].json
```

### View Application Manifest
```bash
cat .gati/manifests/_app.json | jq '.handlers'
```

### Watch Manifest Changes
```bash
# Terminal 1: Watch manifests
watch -n 1 'ls -la .gati/manifests/'

# Terminal 2: Make changes
echo "// comment" >> src/handlers/hello.ts
```

## Troubleshooting

### Manifests Not Updating
1. Check file permissions on `.gati/` directory
2. Ensure TypeScript syntax is valid
3. Verify exports are present

### Routes Not Loading
1. Check `_app.json` contains your route
2. Verify handler export name matches manifest
3. Check for route conflicts in logs

### Performance Issues
1. Reduce file watching scope
2. Use `.gitignore` patterns to exclude files
3. Check for circular dependencies

## Advanced Usage

### Custom Analyzer
```typescript
// gati.config.ts
export default {
  analyzer: {
    // Custom route extraction logic
    extractRoute: (content: string, filePath: string) => {
      // Your custom logic
    }
  }
};
```

### Manifest Hooks
```typescript
// gati.config.ts
export default {
  hooks: {
    onManifestUpdate: (manifest) => {
      console.log('Routes updated:', manifest.handlers.length);
    }
  }
};
```

## Next Steps

- [Hot Reloading](./hot-reloading.md) - Development workflow
- [File-Based Routing](./file-based-routing.md) - Route conventions
- [Development Server](./development-server.md) - Server features