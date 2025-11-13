# @gati-framework/playground

**Visual API Playground and Debugger for Gati Applications**

A native Gati module that provides an interactive 3D visualization of API request lifecycles, enabling real-time testing and debugging with visual flow representation.

## Features

- 🎮 **Interactive 3D Visualization** - Watch requests flow through your application in real-time using Three.js
- 🔍 **Route Introspection** - Explore all registered routes, handlers, and middleware
- 🐛 **Debug Mode** - Set breakpoints, step through execution, inspect variables
- ⚡ **Real-time Events** - WebSocket-based event streaming for live updates
- 🎯 **Request Builder** - Test APIs like Postman, but with visual feedback
- 🏗️ **Gati-Native** - Built entirely as a Gati module using Gati handlers

## Installation

```bash
pnpm add @gati-framework/playground
```

## Quick Start

### 1. Initialize Playground Module

```typescript
import { createApp } from '@gati-framework/runtime';
import { initPlayground } from '@gati-framework/playground';

const app = createApp();

// Initialize playground module
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production',
  port: 3001,
  debugMode: true,
});

await app.listen();
```

### 2. Register Playground Handlers

```typescript
import {
  getRoutesHandler,
  getRouteHandler,
  getInstancesHandler,
  playgroundHandlerMetadata,
} from '@gati-framework/playground';

// Auto-register all playground handlers
app.get(playgroundHandlerMetadata.getRoutes.route, getRoutesHandler);
app.get(playgroundHandlerMetadata.getRoute.route, getRouteHandler);
app.get(playgroundHandlerMetadata.getInstances.route, getInstancesHandler);
```

### 3. Access the Playground

Open your browser to `http://localhost:3001/playground` to access the 3D visualization interface.

## Configuration

```typescript
interface PlaygroundConfig {
  /** Enable playground (default: false in production) */
  enabled: boolean;
  
  /** Port for playground UI (default: 3001) */
  port: number;
  
  /** WebSocket port for event streaming (default: 3002) */
  wsPort: number;
  
  /** Enable debug mode with breakpoints (default: false) */
  debugMode: boolean;
  
  /** Maximum event buffer size (default: 10000) */
  maxEventBuffer: number;
  
  /** Event retention time in ms (default: 5 minutes) */
  eventRetentionMs: number;
}
```

## API Endpoints

The playground module exposes the following Gati handlers:

- `GET /playground/api/routes` - List all registered routes
- `GET /playground/api/routes/:id` - Get specific route details
- `GET /playground/api/instances` - List active instances
- `GET /playground/api/events/:traceId` - Get lifecycle events for a trace
- `POST /playground/api/debug/session` - Create debug session
- `POST /playground/api/debug/breakpoint` - Set breakpoint
- `DELETE /playground/api/debug/breakpoint/:id` - Remove breakpoint

## Visualization Modes

### Go Mode (Real-time)

Watch requests flow through your application in real-time:
- Request packets animate through the 3D scene
- Middleware nodes light up as they execute
- Handler nodes pulse during execution
- Module calls are visualized as connections

### Debug Mode (Step-through)

Set breakpoints and step through execution:
- Click on any node to set a breakpoint
- Execution pauses at breakpoints
- Step through middleware and handler execution
- Inspect request/response data at each step

## Example: Complete Setup

```typescript
import { createApp } from '@gati-framework/runtime';
import {
  initPlayground,
  getRoutesHandler,
  getRouteHandler,
  getInstancesHandler,
  getEventsHandler,
  createDebugSessionHandler,
  setBreakpointHandler,
  removeBreakpointHandler,
  playgroundHandlerMetadata as meta,
} from '@gati-framework/playground';

async function main() {
  const app = createApp({ port: 3000 });

  // Initialize playground
  await initPlayground(app.getGlobalContext(), {
    enabled: true,
    port: 3001,
    debugMode: true,
  });

  // Register playground API handlers
  app.get(meta.getRoutes.route, getRoutesHandler);
  app.get(meta.getRoute.route, getRouteHandler);
  app.get(meta.getInstances.route, getInstancesHandler);
  app.get(meta.getEvents.route, getEventsHandler);
  app.post(meta.createDebugSession.route, createDebugSessionHandler);
  app.post(meta.setBreakpoint.route, setBreakpointHandler);
  app.delete(meta.removeBreakpoint.route, removeBreakpointHandler);

  // Your application routes
  app.get('/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
  });

  await app.listen();
  console.log('App running on :3000, Playground on :3001');
}

main();
```

## Frontend (Three.js Visualization)

The playground frontend is served from the `public/` directory and includes:

- **3D Scene**: Visualizes request flow through your application
- **Route Sidebar**: Browse and filter registered routes
- **Request Builder**: Configure and send test requests
- **Control Panel**: Toggle between Go and Debug modes
- **Event Timeline**: View real-time lifecycle events

## Architecture

```
┌─────────────────────────────────────────┐
│         Playground Module               │
│  (Gati Module - @gati-framework/...)    │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │   Handlers   │   │  WebSocket    │  │
│  │  (Gati API)  │   │   Server      │  │
│  └──────────────┘   └───────────────┘  │
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │ Introspection│   │    Event      │  │
│  │    Engine    │   │   Emitter     │  │
│  └──────────────┘   └───────────────┘  │
│                                         │
└─────────────────────────────────────────┘
              ▲
              │  Uses
              │
┌─────────────┴───────────────────────────┐
│      Gati Runtime                       │
│  (Middleware, Handlers, Context)        │
└─────────────────────────────────────────┘
```

## Development

```bash
# Build the module
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## Security Notes

⚠️ **Never enable the playground in production!**

The playground exposes internal application structure and allows inspection of runtime behavior. Always ensure:

```typescript
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production',
});
```

## License

MIT © Krishna Paul
