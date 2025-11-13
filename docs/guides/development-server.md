# Development Server

The Gati development server provides a rich development experience with hot reloading, auto port detection, health checks, and comprehensive logging.

## Starting the Server

### Basic Usage
```bash
pnpm dev
```

### With Options
```bash
# Custom port
pnpm dev --port 4000

# Disable file watching
pnpm dev --no-watch

# Verbose logging
pnpm dev --verbose
```

## Server Features

### 🔥 Hot Reloading
- **File Changes**: Instant route updates (50-200ms)
- **New Files**: Auto-discovery and registration
- **Deleted Files**: Automatic cleanup
- **Config Changes**: Live configuration updates

### 🚀 Auto Port Detection
- **Smart Detection**: Finds available ports automatically
- **Port Persistence**: Remembers last used port
- **Conflict Resolution**: Handles port conflicts gracefully

### 📊 Health Monitoring
- **Startup Hooks**: Execute initialization logic
- **Health Checks**: Built-in health endpoints
- **Graceful Shutdown**: Clean resource cleanup

### 📝 Structured Logging
- **Request Tracking**: Unique request IDs
- **Performance Metrics**: Response times and memory usage
- **Error Context**: Detailed error information

## Server Lifecycle

### 1. Initialization
```plaintext
🚀 Starting development server...
🔧 Loading configuration from gati.config.ts
🔍 Scanning src/ for handlers and modules
📦 Initializing modules...
🌐 Starting HTTP server...
```

### 2. Ready State
```plaintext
✅ Server running at http://localhost:3000
✅ Loaded 5 handlers, 2 modules
👁️ Watching for file changes...
📝 Press Ctrl+C to stop
```

### 3. File Watching
```plaintext
📝 File changed: users/[id].ts
✅ Updated manifest: users_[id].json
🔄 Reloaded GET /users/:id
⚡ Ready in 156ms
```

### 4. Graceful Shutdown
```plaintext
🛑 Shutting down...
🛑 Executing shutdown hooks...
✅ Server stopped gracefully
```

## Configuration

### Basic Configuration
```typescript
// gati.config.ts
export default {
  server: {
    port: 3000,
    host: 'localhost'
  }
};
```

### Advanced Configuration
```typescript
// gati.config.ts
export default {
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: {
      origin: ['http://localhost:3000', 'https://myapp.com'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    }
  },
  
  // Development-specific settings
  dev: {
    hotReload: true,
    verbose: false,
    openBrowser: true
  }
};
```

## Port Management

### Auto Port Detection
The server automatically finds available ports:

```plaintext
🔍 Checking port 3000... ❌ In use
🔍 Checking port 3001... ✅ Available
🌐 Server running at http://localhost:3001
```

### Port Persistence
Last used port is saved in `.gati/last-port`:

```bash
# First run
pnpm dev  # Uses port 3001 (3000 was busy)

# Next run  
pnpm dev  # Tries 3001 first, then 3002, etc.
```

### Manual Port Override
```bash
pnpm dev --port 4000  # Force specific port
```

## Health Checks

### Built-in Health Endpoint
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "128.0 MB"
  },
  "routes": 12,
  "modules": 3
}
```

### Custom Health Checks
```typescript
// gati.config.ts
export default {
  health: {
    checks: [
      {
        name: 'database',
        check: async (gctx) => {
          const db = gctx.modules.database;
          await db.ping();
          return { status: 'connected' };
        }
      },
      {
        name: 'redis',
        check: async (gctx) => {
          const redis = gctx.modules.cache;
          await redis.ping();
          return { status: 'connected' };
        }
      }
    ]
  }
};
```

Enhanced health response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "connected" },
    "redis": { "status": "connected" }
  }
}
```

## Logging

### Request Logging
Every request is logged with context:

```plaintext
[2025-01-15 10:30:15] INFO: GET /api/users/123
  requestId: req_abc123
  duration: 45ms
  status: 200
  userAgent: curl/7.68.0
```

### Error Logging
Errors include full context:

```plaintext
[2025-01-15 10:30:20] ERROR: Handler error in GET /api/users/456
  requestId: req_def456
  error: User not found
  stack: HandlerError: User not found
    at getUserHandler (/src/handlers/users/[id].ts:15:11)
  context: { userId: "456" }
```

### Custom Logging
```typescript
// In handlers
export const handler: Handler = (req, res, gctx, lctx) => {
  const logger = gctx.logger;
  
  logger.info('Processing user request', {
    userId: req.params.id,
    requestId: lctx.requestId
  });
  
  // ... handler logic
};
```

### Log Levels
```bash
# Set log level via environment
LOG_LEVEL=debug pnpm dev  # debug, info, warn, error
```

## Development Workflow

### 1. Start Development
```bash
pnpm dev
```

### 2. Make Changes
Edit any file in `src/`:

```typescript
// src/handlers/hello.ts
export const handler: Handler = (req, res) => {
  res.json({ message: 'Hello, World!' });
};
```

### 3. Test Immediately
```bash
curl http://localhost:3000/api/hello
```

### 4. View Logs
```plaintext
[10:30:15] INFO: GET /api/hello
  requestId: req_abc123
  duration: 12ms
  status: 200
```

### 5. Debug Issues
```bash
# Enable verbose logging
pnpm dev --verbose

# Check health
curl http://localhost:3000/health

# View manifests
cat .gati/manifests/_app.json | jq
```

## Performance Monitoring

### Built-in Metrics
The server tracks performance automatically:

```plaintext
📊 Performance Summary (last 1 minute):
  Requests: 45
  Avg Response Time: 23ms
  Memory Usage: 67.2 MB
  CPU Usage: 12%
```

### Request Timing
Each request shows timing breakdown:

```plaintext
[10:30:15] INFO: GET /api/users/123
  parsing: 2ms
  handler: 18ms
  response: 3ms
  total: 23ms
```

### Memory Monitoring
Automatic memory leak detection:

```plaintext
⚠️ Memory usage increased by 50MB in last 5 minutes
💡 Consider checking for memory leaks in handlers
```

## Error Handling

### Startup Errors
```plaintext
❌ Failed to start server: Port 3000 already in use
💡 Try: pnpm dev --port 3001
```

### Runtime Errors
```plaintext
❌ Handler error in GET /api/users/123
  Error: Database connection failed
  RequestId: req_abc123
💡 Check database connection in modules/database.ts
```

### Configuration Errors
```plaintext
❌ Invalid gati.config.ts: Missing server.port
💡 Add: server: { port: 3000 }
```

## CLI Commands

### Development Server
```bash
# Basic start
pnpm dev

# With options
pnpm dev --port 4000 --no-watch --verbose

# Environment-specific
NODE_ENV=development pnpm dev
LOG_LEVEL=debug pnpm dev
```

### Server Information
```bash
# Check server status
curl http://localhost:3000/health

# View loaded routes
curl http://localhost:3000/_routes

# Server metrics
curl http://localhost:3000/_metrics
```

## Debugging

### Enable Debug Mode
```bash
DEBUG=gati:* pnpm dev
```

Output:
```plaintext
gati:server Starting server on port 3000
gati:routes Loading routes from manifests
gati:watcher Watching src/ for changes
gati:manifest Processing hello.ts
```

### Inspect Manifests
```bash
# List all manifests
ls .gati/manifests/

# View specific manifest
cat .gati/manifests/users_[id].json | jq

# Watch manifest changes
watch -n 1 'ls -la .gati/manifests/'
```

### Network Debugging
```bash
# Check port usage
netstat -tulpn | grep :3000

# Test connectivity
curl -v http://localhost:3000/api/hello

# Check DNS resolution
nslookup localhost
```

## Production Considerations

### Environment Variables
```bash
# Production settings
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
HOST=0.0.0.0
```

### Security Headers
```typescript
// gati.config.ts
export default {
  server: {
    security: {
      helmet: true,
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(','),
        credentials: true
      }
    }
  }
};
```

### Performance Tuning
```typescript
// gati.config.ts
export default {
  server: {
    performance: {
      compression: true,
      etag: true,
      keepAlive: true,
      timeout: 30000
    }
  }
};
```

## Next Steps

- [Hot Reloading](./hot-reloading.md) - Development workflow
- [Configuration](./configuration.md) - Advanced server configuration
- [Deployment](./deployment.md) - Production deployment