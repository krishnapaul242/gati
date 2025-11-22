/**
 * @module playground
 * @description Gati Playground Module - Visual API testing and debugging
 */

import type { GlobalContext } from '@gati-framework/runtime';
import type {
  PlaygroundConfig,
  PlaygroundModule,
  RouteInfo,
  InstanceInfo,
  LifecycleEvent,
  DebugSession,
  Breakpoint,
} from './types.js';
import { createLogger } from './logger.js';
import { createPlaygroundWS } from './websocket.js';

/**
 * Default playground configuration
 */
const DEFAULT_CONFIG: PlaygroundConfig = {
  enabled: process.env['NODE_ENV'] !== 'production',
  port: 3001,
  wsPort: 3002,
  debugMode: false,
  maxEventBuffer: 10000,
  eventRetentionMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Create Gati Playground module
 * 
 * @param config - Playground configuration
 * @returns Playground module instance
 * 
 * @example
 * ```typescript
 * import { createApp } from '@gati-framework/runtime';
 * import { createPlaygroundModule } from '@gati-framework/playground';
 * 
 * const app = createApp();
 * const playground = createPlaygroundModule({ enabled: true });
 * 
 * // Register module in global context
 * app.getGlobalContext().modules.set('playground', playground);
 * ```
 */
export function createPlaygroundModule(
  config: Partial<PlaygroundConfig> = {},
  gctx?: GlobalContext
): PlaygroundModule {
  const finalConfig: PlaygroundConfig = { ...DEFAULT_CONFIG, ...config };
  const logger = createLogger({ name: 'gati-playground' });

  // Event storage: Map<traceId, events[]>
  const eventStore = new Map<string, LifecycleEvent[]>();
  
  // Debug sessions: Map<sessionId, session>
  const debugSessions = new Map<string, DebugSession>();
  
  // Breakpoints: Map<breakpointId, breakpoint>
  const breakpoints = new Map<string, Breakpoint>();

  // Store global context reference
  const globalContext = gctx;

  // Periodic cleanup of old events
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - finalConfig.eventRetentionMs;
    
    for (const [traceId, events] of eventStore.entries()) {
      const filtered = events.filter(e => e.timestamp > cutoff);
      if (filtered.length === 0) {
        eventStore.delete(traceId);
      } else {
        eventStore.set(traceId, filtered);
      }
    }
  }, 60000); // Cleanup every minute

  /**
   * Get all registered routes from Gati app
   */
  function getRoutes(): RouteInfo[] {
    // Access the route manager from global context if available
    const routeManager = (globalContext as any)?.routeManager || (gctx as any)?.routeManager;
    if (!routeManager) {
      return [];
    }

    const routes = routeManager.getRoutes();
    return routes.map((route: any, index: number) => ({
      id: `route_${index}_${route.method}_${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      method: route.method,
      path: route.path,
      handlerName: route.handler.name || 'anonymous',
      middleware: [], // Will be populated when middleware introspection is added
      modules: [], // Will be populated when module usage tracking is added
      metadata: {
        pattern: route.pattern,
        registeredAt: Date.now(),
      },
    }));
  }

  /**
   * Get specific route by ID
   */
  function getRoute(routeId: string): RouteInfo | null {
    const routes = getRoutes();
    return routes.find(r => r.id === routeId) || null;
  }

  /**
   * Get active instances
   */
  function getInstances(): InstanceInfo[] {
    // In single-instance mode, return current instance
    // In distributed mode, this would query service registry
    return [
      {
        id: process.env['INSTANCE_ID'] || 'local',
        region: process.env['AWS_REGION'] || 'local',
        zone: process.env['AWS_AVAILABILITY_ZONE'] || 'local-a',
        baseUrl: `http://localhost:${process.env['PORT'] || 3000}`,
        health: 'healthy',
        uptime: process.uptime() * 1000,
        activeConnections: 0, // Would be tracked by app
      },
    ];
  }

  /**
   * Emit lifecycle event
   */
  function emitEvent(event: LifecycleEvent): void {
    if (!finalConfig.enabled) return;

    const { traceId } = event;
    
    // Get or create event array for this trace
    let events = eventStore.get(traceId);
    if (!events) {
      events = [];
      eventStore.set(traceId, events);
    }

    // Add event
    events.push(event);

    // Enforce max buffer size
    if (events.length > finalConfig.maxEventBuffer) {
      events.shift(); // Remove oldest event
    }

    // Check for breakpoints in debug mode
    if (finalConfig.debugMode && event.nodeId) {
      const bp = Array.from(breakpoints.values()).find(
        b => b.enabled && b.nodeId === event.nodeId
      );

      if (bp) {
        // Emit breakpoint hit event
        const bpEvent: LifecycleEvent = {
          type: 'breakpoint:hit',
          timestamp: Date.now(),
          traceId,
          nodeId: event.nodeId,
          nodeType: event.nodeType,
          data: { breakpointId: bp.id },
        };
        events.push(bpEvent);

        logger.info({ traceId, breakpoint: bp.id }, 'Breakpoint hit');
      }
    }
  }

  /**
   * Get event stream for a trace
   */
  function getEventStream(traceId: string): LifecycleEvent[] {
    return eventStore.get(traceId) || [];
  }

  /**
   * Create debug session
   */
  function createDebugSession(traceId: string): DebugSession {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const session: DebugSession = {
      id: sessionId,
      traceId,
      mode: 'debug',
      breakpoints: Array.from(breakpoints.values()),
      isPaused: false,
      callStack: [],
      variables: {},
    };

    debugSessions.set(sessionId, session);
    logger.info({ sessionId, traceId }, 'Debug session created');

    return session;
  }

  /**
   * Get debug session
   */
  function getDebugSession(sessionId: string): DebugSession | null {
    return debugSessions.get(sessionId) || null;
  }

  /**
   * Set breakpoint
   */
  function setBreakpoint(breakpoint: Breakpoint): void {
    breakpoints.set(breakpoint.id, breakpoint);
    logger.info({ breakpoint: breakpoint.id, node: breakpoint.nodeId }, 'Breakpoint set');
  }

  /**
   * Remove breakpoint
   */
  function removeBreakpoint(breakpointId: string): void {
    breakpoints.delete(breakpointId);
    logger.info({ breakpoint: breakpointId }, 'Breakpoint removed');
  }

  /**
   * Step to next execution point
   */
  function stepNext(sessionId: string): void {
    const session = debugSessions.get(sessionId);
    if (!session) {
      logger.warn({ sessionId }, 'Debug session not found');
      return;
    }

    session.isPaused = false;
    logger.info({ sessionId }, 'Stepping to next');
  }

  /**
   * Resume execution
   */
  function resume(sessionId: string): void {
    const session = debugSessions.get(sessionId);
    if (!session) {
      logger.warn({ sessionId }, 'Debug session not found');
      return;
    }

    session.isPaused = false;
    logger.info({ sessionId }, 'Execution resumed');
  }

  return {
    config: finalConfig,
    getRoutes,
    getRoute,
    getInstances,
    emitEvent,
    getEventStream,
    createDebugSession,
    getDebugSession,
    setBreakpoint,
    removeBreakpoint,
    stepNext,
    resume,
  };
}

/**
 * Initialize playground module and register it with Gati app
 * 
 * @param gctx - Global context from Gati app
 * @param config - Playground configuration
 * @param app - Optional Gati app instance for route introspection
 * 
 * @example
 * ```typescript
 * import { createApp } from '@gati-framework/runtime';
 * import { initPlayground } from '@gati-framework/playground';
 * 
 * const app = createApp();
 * await initPlayground(app.getGlobalContext(), { enabled: true }, app);
 * ```
 */
export async function initPlayground(
  gctx: GlobalContext,
  config: Partial<PlaygroundConfig> = {},
  app?: any // GatiApp instance
): Promise<void> {
  const playground = createPlaygroundModule(config, gctx);

  // Store route manager reference for introspection
  if (app && app.getRouteManager) {
    (gctx as any).routeManager = app.getRouteManager();
  }

  // Register module in global context
  if (!gctx.modules) {
    (gctx as any).modules = new Map();
  }
  (gctx.modules as any)['playground'] = playground;

  // Start WebSocket server if enabled
  if (playground.config.enabled) {
    const wsPort = playground.config.wsPort;
    createPlaygroundWS(undefined, playground, wsPort);
    
    const logger = createLogger({ name: 'gati-playground' });
    logger.info(
      { 
        enabled: playground.config.enabled, 
        port: playground.config.port,
        wsPort: wsPort
      },
      'Playground module initialized with WebSocket server'
    );
  } else {
    const logger = createLogger({ name: 'gati-playground' });
    logger.info(
      { enabled: playground.config.enabled, port: playground.config.port },
      'Playground module initialized'
    );
  }
}
