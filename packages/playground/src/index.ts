/**
 * @module playground
 * @description Gati Playground - Visual request flow debugging
 */

// Core playground engine
export { PlaygroundEngine, playgroundEngine, PLAYGROUND_HEADERS } from './playground-engine.js';
export { PlaygroundWebSocketServer } from './websocket-server.js';
export { PlaygroundIntegration, createPlaygroundIntegration } from './runtime-integration.js';

// Module initialization
export { createPlaygroundModule, initPlayground } from './module.js';

// Handlers
export { 
  getPortHandler,
  getRoutesHandler, 
  getRouteHandler,
  getInstancesHandler,
  getEventsHandler,
  createDebugSessionHandler,
  setBreakpointHandler,
  removeBreakpointHandler,
  metadata as playgroundHandlerMetadata
} from './handlers.js';

// Trace API endpoints
export {
  listTracesHandler,
  getTraceHandler,
  getSnapshotsHandler,
  getStageSnapshotHandler,
  replayTraceHandler,
  createGateHandler,
  listGatesHandler,
  removeGateHandler,
  releaseGateHandler,
  deleteTraceHandler,
  metadata as traceHandlerMetadata,
  type TraceModule
} from './api/trace-endpoints.js';

// Debug gate WebSocket
export {
  DebugGateWebSocketServer,
  createDebugGateWebSocket
} from './api/debug-gate-websocket.js';

// UI Components
export {
  RequestFlowDiagram,
  createRequestFlowDiagram,
  type DiagramConfig
} from './components/RequestFlowDiagram.js';

export {
  SnapshotViewer,
  createSnapshotViewer,
  type ViewerConfig
} from './components/SnapshotViewer.js';

export {
  SnapshotDiff,
  createSnapshotDiff,
  type DiffConfig,
  type DiffViewMode
} from './components/SnapshotDiff.js';

export {
  DebugGateControls,
  createDebugGateControls,
  type GateEvent,
  type GateEventCallback
} from './components/DebugGateControls.js';

// Static UI serving
export { servePlaygroundUI } from './ui-server.js';

// Manifest utilities
export { createBlocksFromManifest, generateHumanReadableName } from './manifest-loader.js';

// WebSocket utilities
export { createPlaygroundWS } from './websocket.js';

// Type exports
export type { 
  PlaygroundBlock, 
  PlaygroundEvent 
} from './playground-engine.js';

export type { 
  PlaygroundConfig 
} from './runtime-integration.js';

export type { 
  AppManifest, 
  ManifestEntry 
} from './manifest-loader.js';

export type {
  PlaygroundModule,
  RouteInfo,
  MiddlewareInfo,
  InstanceInfo,
  LifecycleEvent,
  LifecycleEventType,
  ExecutionMode,
  Breakpoint,
  DebugSession,
  CallFrame,
  WSMessage,
  WSMessageType,
} from './types.js';