# Gati Playground Demo

This example demonstrates the **Gati Playground** - a visual API testing and debugging tool with 3D visualization.

## Features Demonstrated

- 🎯 **Route Discovery** - Automatically lists all registered API routes
- 🔍 **Visual Request Flow** - 3D visualization of requests moving through middleware, handlers, and modules
- ⚡ **Go Mode** - Real-time request visualization
- 🐛 **Debug Mode** - Set breakpoints and step through execution
- 📊 **Instance Management** - Switch between different service instances
- 🔧 **Request Builder** - Customize headers, body, and test different endpoints

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the demo server
pnpm dev
```

Then open: **http://localhost:3000/playground**

## Available Test Endpoints

- `GET /api/hello` - Simple hello world
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `GET /api/health` - Health check endpoint
- `GET /api/error` - Test error handling

## How to Use

### Go Mode (⚡)
1. Select an endpoint from the left sidebar
2. Customize the request in the right panel
3. Click "🚀 Send Request"
4. Watch the packet flow through the 3D visualization in real-time

### Debug Mode (🐛)
1. Switch to Debug Mode using the toggle
2. Click on any node (middleware/handler/module) to set breakpoints
3. Send a request
4. Execution will pause at breakpoints
5. Use step/resume controls to debug

## Integration Guide

To add the playground to your own Gati app:

```typescript
import { createApp } from '@gati-framework/runtime';
import { 
  initPlayground, 
  createInstrumentationMiddleware,
  createGlobalTraceMiddleware,
  // ... other imports
} from '@gati-framework/playground';

const app = createApp();

// Initialize playground
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production',
  debugMode: true,
}, app);

// Add middleware for instrumentation
app.use(createGlobalTraceMiddleware());
app.use(createInstrumentationMiddleware());

// Register playground routes and UI
// ... (see src/index.ts for complete example)
```

## Architecture

The playground consists of:

- **Backend Module** - Gati module that tracks lifecycle events
- **WebSocket Server** - Real-time event streaming
- **3D Frontend** - Three.js visualization with interactive controls
- **API Handlers** - REST endpoints for route introspection and debugging

## Security Note

⚠️ **Never enable the playground in production!** It exposes internal application structure and allows request inspection.

```typescript
await initPlayground(app.getGlobalContext(), {
  enabled: process.env.NODE_ENV !== 'production', // ✅ Safe
});
```