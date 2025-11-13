# Gati Playground Integration Guide

## Quick Integration

### 1. Install the Package

```bash
pnpm add @gati-framework/playground
```

### 2. Basic Setup

```typescript
import { createApp } from '@gati-framework/runtime';
import { 
  initPlayground, 
  createInstrumentationMiddleware,
  createGlobalTraceMiddleware,
  getRoutesHandler,
  servePlaygroundUI,
  playgroundHandlerMetadata as meta,
} from '@gati-framework/playground';

const app = createApp();

// Initialize playground module
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production',
  debugMode: true,
}, app);

// Add instrumentation middleware
app.use(createGlobalTraceMiddleware());
app.use(createInstrumentationMiddleware());

// Register playground endpoints
app.get('/playground/api/routes', getRoutesHandler);
app.get('/playground', servePlaygroundUI);

// Your API routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World!' });
});

await app.listen();
```

### 3. Access the Playground

Open `http://localhost:3000/playground` in your browser.

## Configuration Options

```typescript
interface PlaygroundConfig {
  enabled: boolean;           // Enable playground (default: false in prod)
  port: number;               // UI port (default: 3001)
  wsPort: number;             // WebSocket port (default: 3002)
  debugMode: boolean;         // Enable debug features (default: false)
  maxEventBuffer: number;     // Max events per trace (default: 10000)
  eventRetentionMs: number;   // Event retention time (default: 5 min)
}
```

## Complete Integration

For full functionality, register all playground endpoints:

```typescript
import {
  getRoutesHandler,
  getRouteHandler,
  getInstancesHandler,
  getEventsHandler,
  createDebugSessionHandler,
  setBreakpointHandler,
  removeBreakpointHandler,
  servePlaygroundUI,
  playgroundHandlerMetadata as meta,
} from '@gati-framework/playground';

// Register all endpoints
app.get(meta.getRoutes.route, getRoutesHandler);
app.get(meta.getRoute.route, getRouteHandler);
app.get(meta.getInstances.route, getInstancesHandler);
app.get(meta.getEvents.route, getEventsHandler);
app.post(meta.createDebugSession.route, createDebugSessionHandler);
app.post(meta.setBreakpoint.route, setBreakpointHandler);
app.delete(meta.removeBreakpoint.route, removeBreakpointHandler);
app.get('/playground', servePlaygroundUI);
```

## Module Instrumentation

To track module method calls in the visualization:

```typescript
import { createModuleTracker } from '@gati-framework/playground';

// In your module
const tracker = createModuleTracker('database');

export const databaseModule = {
  async findUser(id: string) {
    return tracker.track(async () => {
      // Your database logic
      return await db.users.findById(id);
    }, 'findUser')();
  },
  
  async createUser(data: any) {
    return tracker.track(async () => {
      // Your database logic
      return await db.users.create(data);
    }, 'createUser')();
  },
};
```

## Middleware Instrumentation

To instrument custom middleware:

```typescript
import { instrumentMiddleware } from '@gati-framework/playground';

const myMiddleware = instrumentMiddleware(
  async (req, res, gctx, lctx, next) => {
    // Your middleware logic
    await next();
  },
  'my-middleware'
);

app.use(myMiddleware);
```

## Handler Instrumentation

To instrument individual handlers:

```typescript
import { instrumentHandler } from '@gati-framework/playground';

const myHandler = instrumentHandler(
  async (req, res, gctx, lctx) => {
    res.json({ message: 'Hello' });
  },
  'my-handler'
);

app.get('/api/hello', myHandler);
```

## Security Considerations

⚠️ **Critical**: Never enable in production!

```typescript
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production', // ✅ Safe
});
```

The playground exposes:
- Internal route structure
- Middleware configuration  
- Handler logic flow
- Request/response data

## Troubleshooting

### WebSocket Connection Issues

If the WebSocket connection fails:

1. Check if port 3002 is available
2. Configure a different port:
   ```typescript
   await initPlayground(gctx, { wsPort: 3003 });
   ```
3. Check firewall settings

### Routes Not Appearing

If routes don't show in the sidebar:

1. Ensure you pass the app instance to `initPlayground`:
   ```typescript
   await initPlayground(gctx, config, app); // ✅ Pass app
   ```
2. Register routes before initializing playground
3. Check that `getRoutesHandler` is registered

### Events Not Streaming

If lifecycle events aren't visible:

1. Ensure instrumentation middleware is added:
   ```typescript
   app.use(createInstrumentationMiddleware()); // ✅ Required
   ```
2. Add global trace middleware for module tracking:
   ```typescript
   app.use(createGlobalTraceMiddleware()); // ✅ For modules
   ```

## Examples

See the complete example at `examples/playground-demo/` for a working implementation.

## API Reference

### Lifecycle Events

The playground tracks these event types:

- `request:start` - Request begins
- `request:end` - Request completes  
- `middleware:enter` - Middleware execution starts
- `middleware:exit` - Middleware execution ends
- `handler:enter` - Handler execution starts
- `handler:exit` - Handler execution ends
- `module:call` - Module method called
- `error:thrown` - Error occurred
- `breakpoint:hit` - Breakpoint encountered (debug mode)

### WebSocket Messages

Client-server communication uses these message types:

- `subscribe` - Subscribe to trace events
- `unsubscribe` - Unsubscribe from trace
- `event` - Lifecycle event broadcast
- `breakpoint:set` - Set breakpoint
- `breakpoint:remove` - Remove breakpoint
- `debug:step` - Step execution
- `debug:resume` - Resume execution