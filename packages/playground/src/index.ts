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