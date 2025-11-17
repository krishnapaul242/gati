# Playground Guide

> **Status**: ✅ Stable (v1.0.0) — Visual API testing and debugging tool

The **Gati Playground** is a native Gati module providing interactive 3D visualization of API request lifecycles, enabling real-time testing and debugging with visual flow representation.

## Overview

Playground offers three distinct visualization modes:

- 🟦 **API Mode** — Postman-like API testing with stress testing built-in
- 🟧 **Network Mode** — 2D map of distributed backend with real-time request flow
- 🟪 **Tracking Mode** — 3D visualization of handler → middleware → module execution

## Quick Start

### Installation

```bash
pnpm add @gati-framework/playground
```

### Setup

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

### Access

Open your browser to `http://localhost:3001/playground` to access the visual interface.

## Configuration

```typescript
interface PlaygroundConfig {
  enabled: boolean;          // Enable playground (default: false in production)
  port: number;              // Port for playground UI (default: 3001)
  wsPort: number;            // WebSocket port for event streaming (default: 3002)
  debugMode: boolean;        // Enable debug mode with breakpoints (default: false)
  maxEventBuffer: number;    // Maximum event buffer size (default: 10000)
  eventRetentionMs: number;  // Event retention time in ms (default: 5 minutes)
}
```

## Features

### API Mode (Postman Alternative)

- **Request builder** with auto-complete from manifests
- **Stress/load testing** built-in
- **Mock datasets** and environments
- **Version switching** (future: test against v1, v2, v3 simultaneously)

**Example: Test an endpoint**

1. Open Playground → API Mode
2. Select route from dropdown (auto-populated from manifests)
3. Fill request body using auto-complete
4. Click "Send" or "Stress Test"
5. View response with timing information

### Network Mode (2D Visualization)

- **Real-time map** of distributed backend
- **Particle flow** showing request paths through handlers/modules
- **Component health** (latency, memory, CPU)
- **Module/handler dependency graph**

**What you see:**
- Handlers as nodes
- Modules as connected services
- Requests as animated particles flowing through the graph
- Health indicators (green/yellow/red) based on latency

### Tracking Mode (3D Request Lifecycle)

- **Visualize execution** handler → middleware → module → plugin
- **Debug gates** - pause execution mid-request
- **Data inspection** at each step
- **Time-travel replay** for debugging (planned)

**Debug workflow:**
1. Set breakpoint on any node (handler, middleware, module call)
2. Send request via API Mode
3. Execution pauses at breakpoint
4. Inspect `req`, `res`, `gctx`, `lctx` data
5. Step through execution or continue

## API Endpoints

Playground exposes these Gati handlers:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/playground/api/routes` | GET | List all registered routes |
| `/playground/api/routes/:id` | GET | Get specific route details |
| `/playground/api/instances` | GET | List active instances |
| `/playground/api/events/:traceId` | GET | Get lifecycle events for a trace |
| `/playground/api/debug/session` | POST | Create debug session |
| `/playground/api/debug/breakpoint` | POST | Set breakpoint |
| `/playground/api/debug/breakpoint/:id` | DELETE | Remove breakpoint |

## Visualization Modes

### Go Mode (Real-time)

Watch requests flow through your application in real-time:
- Request packets animate through the 3D scene
- Middleware nodes light up as they execute
- Handler nodes pulse during execution
- Module calls visualized as connections

### Debug Mode (Step-through)

Set breakpoints and step through execution:
- Click on any node to set a breakpoint
- Execution pauses at breakpoints
- Step through middleware and handler execution
- Inspect request/response data at each step

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

## Security Notes

⚠️ **Never enable the playground in production!**

The playground exposes internal application structure and allows inspection of runtime behavior. Always ensure:

```typescript
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production', // Auto-disable in prod
});
```

## Example: Complete Setup

```typescript
import { createApp } from '@gati-framework/runtime';
import {
  initPlayground,
  getRoutesHandler,
  getRouteHandler,
  getInstancesHandler,
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

  // Your application routes
  app.get('/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
  });

  await app.listen();
  console.log('App running on :3000, Playground on :3001');
}

main();
```

## Advanced Usage

### Custom Event Tracking

```typescript
// In your handler
export const myHandler: Handler = async (req, res, gctx, lctx) => {
  // Emit custom event for playground visualization
  lctx.lifecycle.onPhaseChange((phase, prev) => {
    console.log(`Phase changed: ${prev} → ${phase}`);
    // Playground subscribes to these events
  });

  // Your logic
  const data = await processRequest(req);
  res.json({ data });
};
```

### Debug Gates

```typescript
// Set programmatic breakpoint
export const debugHandler: Handler = async (req, res, gctx, lctx) => {
  const result = await someComplexOperation();

  // Pause execution if debug mode enabled
  if (lctx.debugMode) {
    await lctx.lifecycle.waitForDebugRelease();
  }

  res.json({ result });
};
```

## Troubleshooting

### Playground not loading

- Ensure port 3001 is not in use
- Check `enabled: true` in config
- Verify WebSocket connection (port 3002)

### Events not showing in Network Mode

- Check that handlers are using `lctx.lifecycle` hooks
- Verify WebSocket connection is active
- Ensure event retention hasn't expired

### Debug mode not pausing

- Confirm `debugMode: true` in config
- Verify breakpoints are set correctly
- Check that `lctx.debugMode` is true in handler

## Next Steps

- 📖 [Middleware Guide](/guides/middleware) — Add custom middleware
- 🏗️ [Module Guide](/guides/modules) — Create custom modules
- 🐛 [Error Handling](/guides/error-handling) — Handle errors gracefully

---

*For technical implementation details, see the [Playground source code](https://github.com/krishnapaul242/gati/tree/main/packages/playground) in the repository.*
