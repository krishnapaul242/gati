# Gati Playground - Usage Guide

## Overview

The Gati Playground provides a visual, interactive interface for testing and debugging your Gati applications with real-time request flow visualization.

## Activation Methods

### Method 1: Via Configuration File

Add the `playground` option to your `gati.config.ts`:

```typescript
export default {
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  // Enable playground
  playground: true,  // Simple enable
  
  // OR with custom configuration
  playground: {
    enabled: true,
    port: 3001,        // Playground UI port
    wsPort: 8080,      // WebSocket port for events
    debugMode: true    // Enable breakpoint debugging
  }
}
```

### Method 2: Via CLI Command

Start your application with the playground enabled:

```bash
pnpm gati playground [options]

Options:
  -p, --port <port>              Server port (default: 3000)
  --playground-port <port>       Playground UI port (default: 3001)
  --ws-port <port>              WebSocket port (default: 8080)
  --debug                       Enable debug mode with breakpoints
```

Example:
```bash
# Start with default settings
pnpm gati playground

# Start with custom ports and debug mode
pnpm gati playground -p 4000 --ws-port 9000 --debug
```

### Method 3: Environment Variables

The CLI command sets these environment variables:

```bash
GATI_PLAYGROUND=true
GATI_PLAYGROUND_PORT=3001
GATI_PLAYGROUND_WS_PORT=8080
GATI_PLAYGROUND_DEBUG=false
```

You can set these manually when running your app:

```bash
GATI_PLAYGROUND=true npm start
```

## Playground Request Headers

All requests sent from the Playground automatically include these headers:

- **`x-gati-playground: true`** - Marks the request as coming from the playground
- **`x-gati-playground-id: <unique-id>`** - Unique identifier for the playground browser instance

These headers allow the backend to:
- Track which requests are from the playground
- Support multiple concurrent playground sessions
- Filter lifecycle events by playground instance

## Using the Playground UI

### 1. Access the UI

Once your application is running with playground enabled:

```
http://localhost:3000/playground
```

(Replace 3000 with your server port)

### 2. Interface Overview

The Playground UI consists of:

- **Left Sidebar**: Route Explorer
  - Browse all registered API routes
  - Search and filter routes
  - Select routes to test

- **Center Canvas**: 3D Visualization
  - Real-time visualization of request flow
  - Node representations (middleware, handlers, modules)
  - Animated request particles

- **Right Panel**: Request Builder
  - Configure HTTP method, path, headers, and body
  - Send test requests
  - View responses

- **Footer**: Statistics
  - Request count
  - Average response time
  - Active traces
  - WebSocket connection status

### 3. Sending Requests

1. Select a route from the left sidebar (or enter a custom path)
2. Choose the HTTP method (GET, POST, PUT, DELETE, PATCH)
3. Add headers in JSON format:
   ```json
   {
     "Content-Type": "application/json",
     "Authorization": "Bearer token123"
   }
   ```
4. For POST/PUT/PATCH, add request body:
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com"
   }
   ```
5. Click "🚀 Send Request"
6. Watch the 3D visualization animate the request flow
7. View the response in the panel

### 4. Execution Modes

#### Go Mode (⚡)
- **Default mode** for real-time monitoring
- Requests execute immediately
- Particles animate through the 3D scene
- No pausing or breakpoints
- Best for: Understanding flow, demos, performance testing

#### Debug Mode (🐛)
- **Advanced debugging** with breakpoints
- Click nodes in the 3D scene to set breakpoints
- Execution pauses at breakpoints
- Step through middleware/handlers one at a time
- Inspect request/response data at each step
- Best for: Debugging issues, understanding execution order

### 5. View Modes

#### Block View (🧊)
- Default 3D block visualization
- Nodes represented as colored cubes
- Spatial arrangement shows flow

#### Outline View (📋)
- Alternative simplified view
- List-based representation
- Easier to navigate for complex flows

## Multi-Instance Support

The playground supports multiple browser tabs/windows simultaneously:

- Each tab gets a unique `playgroundId`
- Events are filtered by playground instance
- Multiple developers can debug the same app
- No interference between sessions

## API Integration

### Initializing Playground in Your App

```typescript
import { createApp } from '@gati-framework/runtime';
import { 
  initPlayground, 
  getPortHandler,
  getRoutesHandler,
  getInstancesHandler,
  servePlaygroundUI 
} from '@gati-framework/playground';

const app = createApp({ port: 3000 });

// Initialize playground module
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production',
  wsPort: 8080,
  debugMode: true
});

// Register playground API routes
app.get('/playground/api/port', getPortHandler);
app.get('/playground/api/routes', getRoutesHandler);
app.get('/playground/api/instances', getInstancesHandler);

// Serve playground UI
app.get('/playground', servePlaygroundUI);
app.get('/playground/index.html', servePlaygroundUI);
app.get('/playground/app.js', servePlaygroundUI);

await app.listen();
```

### Checking for Playground Requests in Handlers

```typescript
import { PLAYGROUND_HEADERS } from '@gati-framework/playground';
import type { Handler } from '@gati-framework/runtime';

const myHandler: Handler = async (req, res, gctx, lctx) => {
  // Check if this is a playground request
  const isPlayground = req.headers[PLAYGROUND_HEADERS.PLAYGROUND_REQUEST] === 'true';
  const playgroundId = req.headers[PLAYGROUND_HEADERS.PLAYGROUND_ID];
  
  if (isPlayground) {
    console.log(`Playground request from instance: ${playgroundId}`);
    // Add extra logging, debugging, or behavior for playground requests
  }
  
  res.json({ message: 'Hello!' });
};
```

## Security Considerations

⚠️ **NEVER enable playground in production!**

The playground:
- Exposes your application's internal structure
- Shows all registered routes and handlers
- Allows arbitrary request testing
- May reveal sensitive implementation details

Always use:

```typescript
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production'
});
```

Or restrict by environment variable:

```typescript
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.GATI_PLAYGROUND === 'true'
});
```

## Troubleshooting

### Playground UI not loading

1. Verify playground is enabled in config
2. Check server is running on expected port
3. Ensure `/playground` route is registered
4. Check browser console for errors

### WebSocket connection failed

1. Verify WebSocket port (default 8080)
2. Check firewall/network settings
3. Ensure WebSocket server started (check logs)
4. Try a different port with `--ws-port`

### Requests not appearing in visualization

1. Check headers include `x-gati-playground: true`
2. Verify playground module is initialized
3. Check WebSocket connection status in footer
4. Look for errors in browser console

### 3D visualization not rendering

1. Ensure browser supports WebGL
2. Check for JavaScript errors
3. Try refreshing the page
4. Test in a different browser

## Advanced Features

### Custom Lifecycle Event Emission

```typescript
import type { PlaygroundModule } from '@gati-framework/playground';

const playground = gctx.modules['playground'] as PlaygroundModule;

if (playground) {
  playground.emitEvent({
    type: 'module:call',
    timestamp: Date.now(),
    traceId: lctx.traceId,
    nodeId: 'my-module',
    nodeType: 'module',
    data: { operation: 'database-query' }
  });
}
```

### Accessing Event Streams

```typescript
const events = playground.getEventStream(traceId);
console.log(`Request had ${events.length} lifecycle events`);
```

### Debug Session Management

```typescript
// Create debug session
const session = playground.createDebugSession(traceId);

// Set breakpoint
playground.setBreakpoint({
  id: 'bp-1',
  nodeId: 'auth-middleware',
  nodeType: 'middleware',
  enabled: true,
  condition: 'req.user === undefined' // Optional
});

// Step through execution
playground.stepNext(session.id);

// Resume execution
playground.resume(session.id);
```

## Performance Impact

- **Disabled**: 0% overhead
- **Enabled (Go Mode)**: <5% overhead (event emission)
- **Enabled (Debug Mode)**: 10-15% overhead (breakpoint checks)

Events are automatically cleaned up after 5 minutes to prevent memory leaks.

## Examples

See the complete example application:

```bash
cd examples/hello-world
pnpm install
pnpm dev

# Then open: http://localhost:3000/playground
```

## References

- [Playground API Documentation](./packages/playground/README.md)
- [Implementation Details](./packages/playground/IMPLEMENTATION.md)
- [Feature Complete Guide](./packages/playground/FEATURE_COMPLETE.md)
