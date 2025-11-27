# Task 20.1 Findings: Existing Playground Structure

## Directory Structure

```
packages/playground/
├── public/              # Frontend UI assets
│   ├── app.js          # Three.js 3D visualization
│   └── index.html      # UI entry point
├── src/                # Backend implementation
│   ├── handlers.ts     # API endpoint handlers
│   ├── index.ts        # Main exports
│   ├── instrumentation.ts
│   ├── logger.ts
│   ├── manifest-loader.ts
│   ├── module.ts       # Module initialization
│   ├── playground-engine.ts  # Core engine
│   ├── runtime-integration.ts
│   ├── static.ts
│   ├── types.ts        # Type definitions
│   ├── ui-server.ts    # Static UI serving
│   ├── websocket-server.ts  # WebSocket server
│   └── websocket.ts    # WebSocket utilities
└── package.json
```

## Existing Components

### 1. Core Engine (`playground-engine.ts`)
- **PlaygroundEngine** class with EventEmitter
- Block registration (handlers, modules, middleware)
- Request wrapping with enter/exit/error events
- Playground request detection via headers
- Event emission for visualization

### 2. WebSocket Server (`websocket-server.ts`)
- **PlaygroundWebSocketServer** class
- Real-time event broadcasting to connected clients
- Client connection management
- Sends blocks on connection

### 3. Type Definitions (`types.ts`)
**Existing types:**
- `RouteInfo` - Route metadata
- `MiddlewareInfo` - Middleware chain info
- `InstanceInfo` - Active instance data
- `LifecycleEvent` - Request lifecycle events
- `ExecutionMode` - 'go' | 'debug'
- `Breakpoint` - Debug breakpoint config
- `DebugSession` - Debug session state
- `CallFrame` - Call stack frame
- `WSMessage` - WebSocket message format

### 4. API Handlers (`handlers.ts`)
**Existing endpoints:**
- `getRoutesHandler` - List all routes
- `getRouteHandler` - Get route details
- `getInstancesHandler` - List instances
- `getEventsHandler` - Get lifecycle events
- `createDebugSessionHandler` - Create debug session
- `setBreakpointHandler` - Set breakpoint
- `removeBreakpointHandler` - Remove breakpoint

### 5. Frontend (`public/`)
- Three.js 3D visualization
- Real-time request flow animation
- Route sidebar and request builder
- Control panel for Go/Debug modes

## Integration Points with Runtime

### Current Integration
1. **PlaygroundEngine** wraps handlers to emit events
2. **WebSocket** broadcasts events to frontend
3. **Headers** identify playground requests:
   - `x-gati-playground: true`
   - `x-gati-playground-id: <id>`

### Missing for Task 20
1. **No trace storage** - Events are ephemeral, not persisted
2. **No snapshot capture** - LocalContext state not captured
3. **No request replay** - Cannot replay past requests
4. **No diff engine** - Cannot compare snapshots
5. **No trace visualization** - No pipeline stage tracking
6. **Limited debug gates** - Breakpoints exist but no pause/resume

## Gaps Analysis

### What Exists ✅
- WebSocket infrastructure
- Event emission framework
- Debug session concept
- Breakpoint types
- Frontend visualization (3D)
- API endpoint structure

### What's Missing ❌
- **TraceCollector** - Capture full pipeline traces
- **TraceStorage** - Persist traces with TTL
- **RequestReplayer** - Replay from snapshots
- **DiffEngine** - Compare snapshots
- **DebugGateManager** - Pause/resume execution
- **Snapshot integration** - Use LocalContext snapshots
- **Pipeline stage tracking** - ingress → RM → LCC → handler → modules
- **Trace API endpoints** - CRUD for traces
- **UI components** - RequestFlowDiagram, SnapshotViewer, SnapshotDiff

## Recommendations

### Reuse Existing
1. **WebSocket server** - Extend for debug gate notifications
2. **Type definitions** - Add trace types alongside existing
3. **API handler pattern** - Follow existing handler structure
4. **Event emission** - Integrate TraceCollector with PlaygroundEngine

### New Components Needed
1. **Runtime package** - TraceCollector, TraceStorage, DiffEngine, RequestReplayer, DebugGateManager
2. **Playground API** - New trace endpoints
3. **Playground UI** - New React components for trace inspection
4. **Integration** - Wire TraceCollector into pipeline stages

### Architecture Decision
- Keep existing 3D visualization for real-time flow
- Add new trace inspection UI alongside existing UI
- Extend WebSocket for debug gate commands
- Store traces separately from ephemeral events
