/**
 * @module playground/types
 * @description Type definitions for Gati Playground module
 */

import type { Handler, Middleware } from '@gati-framework/runtime';

/**
 * Route information extracted from Gati app
 */
export interface RouteInfo {
  /** Unique route identifier */
  id: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Route path pattern */
  path: string;
  /** Handler function name (if available) */
  handlerName?: string;
  /** Middleware chain for this route */
  middleware: MiddlewareInfo[];
  /** Modules used by this handler */
  modules: string[];
  /** Metadata from handler */
  metadata?: Record<string, unknown>;
}

/**
 * Middleware information
 */
export interface MiddlewareInfo {
  /** Middleware identifier */
  id: string;
  /** Middleware name */
  name: string;
  /** Order in chain */
  order: number;
  /** Whether it's an error middleware */
  isErrorHandler: boolean;
}

/**
 * Active instance information
 */
export interface InstanceInfo {
  /** Instance ID */
  id: string;
  /** Instance region */
  region: string;
  /** Instance zone */
  zone: string;
  /** Base URL for this instance */
  baseUrl: string;
  /** Health status */
  health: 'healthy' | 'degraded' | 'unhealthy';
  /** Uptime in milliseconds */
  uptime: number;
  /** Active connections */
  activeConnections: number;
}

/**
 * Request lifecycle event types
 */
export type LifecycleEventType =
  | 'request:start'
  | 'request:end'
  | 'middleware:enter'
  | 'middleware:exit'
  | 'handler:enter'
  | 'handler:exit'
  | 'module:call'
  | 'error:thrown'
  | 'breakpoint:hit';

/**
 * Lifecycle event data
 */
export interface LifecycleEvent {
  /** Event type */
  type: LifecycleEventType;
  /** Timestamp */
  timestamp: number;
  /** Trace ID for correlation */
  traceId: string;
  /** Event-specific data */
  data: Record<string, unknown>;
  /** Node ID (middleware/handler/module) */
  nodeId?: string;
  /** Node type */
  nodeType?: 'middleware' | 'handler' | 'module';
  /** Duration (for exit events) */
  duration?: number;
}

/**
 * Execution mode for playground
 */
export type ExecutionMode = 'go' | 'debug';

/**
 * Breakpoint configuration
 */
export interface Breakpoint {
  /** Breakpoint ID */
  id: string;
  /** Node ID where breakpoint is set */
  nodeId: string;
  /** Node type */
  nodeType: 'middleware' | 'handler' | 'module';
  /** Whether breakpoint is enabled */
  enabled: boolean;
  /** Condition (optional expression) */
  condition?: string;
}

/**
 * Debug session state
 */
export interface DebugSession {
  /** Session ID */
  id: string;
  /** Trace ID being debugged */
  traceId: string;
  /** Execution mode */
  mode: ExecutionMode;
  /** Active breakpoints */
  breakpoints: Breakpoint[];
  /** Current pause state */
  isPaused: boolean;
  /** Current execution node */
  currentNode?: string;
  /** Call stack */
  callStack: CallFrame[];
  /** Variable inspection data */
  variables: Record<string, unknown>;
}

/**
 * Call stack frame
 */
export interface CallFrame {
  /** Frame ID */
  id: string;
  /** Node ID */
  nodeId: string;
  /** Node type */
  nodeType: 'middleware' | 'handler' | 'module';
  /** Node name */
  name: string;
  /** Entry timestamp */
  timestamp: number;
}

/**
 * Playground module configuration
 */
export interface PlaygroundConfig {
  /** Enable playground (default: false in production) */
  enabled: boolean;
  /** Port for playground UI (default: 3001) */
  port: number;
  /** WebSocket port (default: 3002) */
  wsPort: number;
  /** Enable debug mode (default: false) */
  debugMode: boolean;
  /** Maximum event buffer size */
  maxEventBuffer: number;
  /** Event retention time in ms */
  eventRetentionMs: number;
}

/**
 * Playground module interface
 */
export interface PlaygroundModule {
  /** Module configuration */
  config: PlaygroundConfig;
  /** Get all registered routes */
  getRoutes(): RouteInfo[];
  /** Get route by ID */
  getRoute(routeId: string): RouteInfo | null;
  /** Get active instances */
  getInstances(): InstanceInfo[];
  /** Emit lifecycle event */
  emitEvent(event: LifecycleEvent): void;
  /** Get event stream for trace */
  getEventStream(traceId: string): LifecycleEvent[];
  /** Create debug session */
  createDebugSession(traceId: string): DebugSession;
  /** Get debug session */
  getDebugSession(sessionId: string): DebugSession | null;
  /** Set breakpoint */
  setBreakpoint(breakpoint: Breakpoint): void;
  /** Remove breakpoint */
  removeBreakpoint(breakpointId: string): void;
  /** Step through execution (debug mode) */
  stepNext(sessionId: string): void;
  /** Resume execution (debug mode) */
  resume(sessionId: string): void;
}

/**
 * WebSocket message types
 */
export type WSMessageType =
  | 'event'
  | 'breakpoint:set'
  | 'breakpoint:remove'
  | 'debug:step'
  | 'debug:resume'
  | 'debug:pause'
  | 'subscribe'
  | 'unsubscribe';

/**
 * WebSocket message
 */
export interface WSMessage {
  /** Message type */
  type: WSMessageType;
  /** Message payload */
  payload: unknown;
  /** Trace ID (for filtering) */
  traceId?: string;
}

/**
 * Instrumented handler wrapper
 */
export type InstrumentedHandler = (
  ...args: Parameters<Handler>
) => ReturnType<Handler>;

/**
 * Instrumented middleware wrapper
 */
export type InstrumentedMiddleware = (
  ...args: Parameters<Middleware>
) => ReturnType<Middleware>;
