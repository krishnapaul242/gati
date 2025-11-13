# Hot Reloading

Gati provides lightning-fast hot reloading for instant development feedback. Make changes to your handlers, modules, or configuration and see results immediately without server restarts.

## How It Works

Hot reloading operates through the manifest system:

```plaintext
File Change → Manifest Update → Route Reload → Live Update
    ↓              ↓              ↓            ↓
  50ms           100ms          150ms       200ms
```

**Total reload time: ~200ms** ⚡

## What Gets Hot Reloaded

### ✅ Handlers
- Route logic changes
- New handlers added
- Handlers deleted
- Method/route changes

### ✅ Modules  
- Module logic updates
- New modules added
- Module exports changed

### ✅ Configuration
- `gati.config.ts` changes
- Route overrides
- Middleware updates

### ❌ Not Hot Reloaded
- Package.json changes (requires restart)
- TypeScript config changes (requires restart)
- Environment variables (requires restart)

## Development Workflow

### 1. Start Development Server
```bash
pnpm dev
```

Output:
```plaintext
🚀 Starting development server...
✅ Loaded 3 handlers, 1 module
🌐 Server running at http://localhost:3000
👁️ Watching for changes...
```

### 2. Make Changes
Edit any handler file:

```typescript
// src/handlers/hello.ts
export const handler: Handler = (req, res) => {
  res.json({ 
    message: 'Hello, Updated World!', // ← Change this
    timestamp: new Date().toISOString()
  });
};
```

### 3. See Instant Updates
```plaintext
📝 File changed: hello.ts
✅ Updated manifest: hello.json
🔄 Reloaded GET /hello
⚡ Ready in 180ms
```

Test immediately:
```bash
curl http://localhost:3000/api/hello
# {"message":"Hello, Updated World!","timestamp":"..."}
```

## Hot Reload Examples

### Adding New Handler

**Create:** `src/handlers/users/profile.ts`
```typescript
export const METHOD = 'GET';
export const handler: Handler = (req, res) => {
  res.json({ profile: 'User profile data' });
};
```

**Console Output:**
```plaintext
📄 File added: users/profile.ts
✅ Created manifest: users_profile.json
🆕 Registered GET /users/profile
⚡ Ready in 120ms
```

**Test Immediately:**
```bash
curl http://localhost:3000/api/users/profile
# {"profile":"User profile data"}
```

### Modifying Route Method

**Change:** `src/handlers/users/create.ts`
```typescript
// Before
export const METHOD = 'GET';

// After  
export const METHOD = 'POST'; // ← Changed method
```

**Console Output:**
```plaintext
📝 File changed: users/create.ts
❌ Unregistered GET /users/create
🆕 Registered POST /users/create
⚡ Ready in 150ms
```

### Deleting Handler

**Delete:** `src/handlers/old-endpoint.ts`

**Console Output:**
```plaintext
🗑️ File removed: old-endpoint.ts
🗑️ Removed manifest: old-endpoint.json
❌ Unregistered GET /old-endpoint
⚡ Ready in 90ms
```

### Updating Module

**Modify:** `src/modules/database.ts`
```typescript
export const database = {
  // Add new method
  findByEmail: (email: string) => { /* ... */ },
  
  // Existing methods...
  findById: (id: string) => { /* ... */ }
};
```

**Console Output:**
```plaintext
📝 File changed: database.ts
✅ Updated manifest: database.json
🔄 Module reloaded: database
⚡ Ready in 110ms
```

## Configuration Hot Reload

### Route Overrides

**Modify:** `gati.config.ts`
```typescript
export default {
  overrides: {
    // Add new override
    'GET /users/:id': {
      middleware: [authMiddleware],
      rateLimit: { requests: 100, window: '1m' }
    }
  }
};
```

**Console Output:**
```plaintext
📝 Config changed: gati.config.ts
🔄 Reloading configuration...
✅ Applied overrides to 1 route
⚡ Ready in 200ms
```

### Middleware Updates

**Add Global Middleware:**
```typescript
export default {
  middleware: [
    corsMiddleware,
    loggerMiddleware,
    newMiddleware // ← Added
  ]
};
```

**Console Output:**
```plaintext
📝 Config changed: gati.config.ts
🔄 Reloading middleware stack...
✅ Applied middleware to all routes
⚡ Ready in 180ms
```

## Performance Optimizations

### Incremental Updates
Only changed files are reprocessed:

```plaintext
✅ Fast: Single file change
src/handlers/users.ts → users.json → _app.json
Time: ~100ms

❌ Slow: Full rebuild (traditional)
Any change → Scan all files → Rebuild everything
Time: ~2-5 seconds
```

### Parallel Processing
File watching and manifest aggregation run in parallel:

```plaintext
Thread 1: Watch src/ files
Thread 2: Watch .gati/manifests/
Thread 3: HTTP server
Thread 4: Route management
```

### Memory Efficiency
- Individual manifests: ~1KB each
- Application manifest: ~10KB for 100 routes
- Total memory overhead: <5MB

## Development Tips

### 1. Use TypeScript Watch Mode
For even faster feedback:

```bash
# Terminal 1: TypeScript compiler
pnpm tsc --watch

# Terminal 2: Gati dev server  
pnpm dev
```

### 2. Organize Files for Fast Reloads
```plaintext
✅ Good: Focused files
src/handlers/
├── users/
│   ├── list.ts      # Single responsibility
│   ├── create.ts    # Single responsibility
│   └── [id].ts      # Single responsibility

❌ Avoid: Monolithic files
src/handlers/
└── users.ts         # All user logic (slow reloads)
```

### 3. Use Module Hot Reload
Extract shared logic to modules for faster iteration:

```typescript
// src/modules/validation.ts
export const validation = {
  validateEmail: (email: string) => { /* ... */ },
  validateUser: (user: any) => { /* ... */ }
};

// src/handlers/users/create.ts
export const handler: Handler = (req, res, gctx) => {
  const isValid = gctx.modules.validation.validateUser(req.body);
  // ...
};
```

When you update validation logic, all handlers using it get the updates instantly.

### 4. Test Changes Immediately
Keep a terminal open for quick testing:

```bash
# Watch for changes and test
watch -n 1 'curl -s http://localhost:3000/api/hello | jq'
```

## Debugging Hot Reload

### Enable Verbose Logging
```bash
pnpm dev --verbose
```

Output:
```plaintext
🔍 Watching: src/**/*.{ts,js}
🔍 Watching: .gati/manifests/*.json
📝 File event: change → src/handlers/hello.ts
🔄 Processing: hello.ts
✅ Manifest updated: hello.json
🔄 Aggregating manifests...
✅ App manifest updated: _app.json
🔄 Reloading routes...
✅ Route reloaded: GET /hello
⚡ Total time: 156ms
```

### Check Manifest Contents
```bash
# View individual manifest
cat .gati/manifests/hello.json | jq

# View application manifest
cat .gati/manifests/_app.json | jq '.handlers'
```

### Monitor File Events
```bash
# Watch file system events
fswatch src/ | while read file; do
  echo "Changed: $file"
done
```

## Troubleshooting

### Hot Reload Not Working

**Check 1: File Watching Enabled**
```bash
pnpm dev --watch  # Ensure --no-watch is not set
```

**Check 2: Valid TypeScript**
```bash
pnpm tsc --noEmit  # Check for syntax errors
```

**Check 3: Proper Exports**
```typescript
// ✅ Correct
export const handler: Handler = (req, res) => { /* ... */ };

// ❌ Missing export
const handler: Handler = (req, res) => { /* ... */ };
```

### Slow Hot Reload

**Check 1: File Count**
```bash
find src/ -name "*.ts" | wc -l
# If >1000 files, consider excluding some
```

**Check 2: Disable Unnecessary Watching**
```typescript
// gati.config.ts
export default {
  ignore: [
    'src/**/*.test.ts',
    'src/**/*.spec.ts',
    'src/temp/**'
  ]
};
```

**Check 3: System Resources**
```bash
# Check CPU/memory usage
top -p $(pgrep -f "gati dev")
```

### Routes Not Updating

**Check 1: Manifest Generation**
```bash
ls -la .gati/manifests/
# Should see .json files for each handler
```

**Check 2: Route Conflicts**
Look for warnings in console:
```plaintext
⚠️ Route conflict: GET /users
  - handlers/users.ts (using this)
  - handlers/users/index.ts
```

**Check 3: Configuration Overrides**
```typescript
// Check if route is disabled in config
export default {
  overrides: {
    'GET /users': false  // ← This disables the route
  }
};
```

## Advanced Configuration

### Custom Watch Patterns
```typescript
// gati.config.ts
export default {
  watch: {
    patterns: [
      'src/**/*.ts',
      'lib/**/*.js',
      'config/*.json'
    ],
    ignore: [
      '**/*.test.ts',
      '**/node_modules/**'
    ]
  }
};
```

### Hot Reload Hooks
```typescript
// gati.config.ts
export default {
  hooks: {
    beforeReload: (changedFiles) => {
      console.log('Reloading:', changedFiles);
    },
    afterReload: (loadedRoutes) => {
      console.log('Loaded routes:', loadedRoutes.length);
    }
  }
};
```

### Conditional Hot Reload
```typescript
// gati.config.ts
export default {
  hotReload: {
    enabled: process.env.NODE_ENV === 'development',
    debounce: 100, // ms
    batchUpdates: true
  }
};
```

## Next Steps

- [Development Server](./development-server.md) - Server features and configuration
- [Manifest System](./manifest-system.md) - How hot reload works internally
- [Configuration](./configuration.md) - Advanced configuration options