/**
 * @module runtime/types/context
 * @description Type definitions for global and local context in Gati framework
 */

// Note: This interface is compatible with @gati-framework/core types
// but includes additional runtime-specific properties

/**
 * Module registry for dependency injection
 * Can be extended via declaration merging
 */
export interface ModuleRegistry {
  [moduleName: string]: unknown;
}

/**
 * Local context state interface
 * Can be extended via declaration merging
 */
export interface LocalContextState {
  [key: string]: unknown;
}

/**
 * WebSocket event interface
 */
export interface WebSocketEvent {
  type: string;
  requestId: string;
  data?: unknown;
  timestamp: number;
}

/**
 * WebSocket coordinator interface
 */
export interface WebSocketCoordinator {
  waitForEvent(requestId: string, eventType: string, timeout?: number): Promise<WebSocketEvent>;
  emitEvent(event: WebSocketEvent): void;
  cleanup(requestId: string): void;
}

/**
 * External service interfaces for distributed architecture
 */
export interface ExternalServices {
  cache?: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
  };
  database?: {
    query<T>(sql: string, params?: unknown[]): Promise<T[]>;
    transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
  };
  messageQueue?: {
    publish(topic: string, message: unknown): Promise<void>;
    subscribe(topic: string, handler: (message: unknown) => void): Promise<void>;
  };
  sessionStore?: {
    get(sessionId: string): Promise<unknown>;
    set(sessionId: string, data: unknown, ttl?: number): Promise<void>;
  };
  websocket?: WebSocketCoordinator;
}

/**
 * Lifecycle hook priorities for ordered execution
 */
export enum LifecyclePriority {
  CRITICAL = 1000,
  HIGH = 800,
  NORMAL = 500,
  LOW = 200,
  CLEANUP = 100,
}

/**
 * Lifecycle hook with metadata
 */
export interface LifecycleHook {
  name: string;
  priority: LifecyclePriority;
  timeout?: number;
  fn: () => void | Promise<void>;
}

/**
 * Health check status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }>;
  timestamp: number;
}

/**
 * Distributed lifecycle coordinator
 */
export interface LifecycleCoordinator {
  /**
   * Register instance with service discovery
   */
  register(): Promise<void>;

  /**
   * Deregister instance from service discovery
   */
  deregister(): Promise<void>;

  /**
   * Report health status to coordinator
   */
  reportHealth(status: HealthStatus): Promise<void>;

  /**
   * Listen for shutdown signals from coordinator
   */
  onCoordinatedShutdown(fn: () => Promise<void>): void;
}

/**
 * Global context (gctx) - shared across all requests
 * Optimized for distributed, stateless architecture
 */
export interface GlobalContext {
  /**
   * Instance metadata
   */
  instance: {
    id: string;
    region: string;
    zone: string;
    startedAt: number;
  };

  /**
   * Module registry for dependency injection
   */
  modules: ModuleRegistry;

  /**
   * External services (Redis, DB, etc.)
   */
  services: ExternalServices;

  /**
   * Application configuration (read-only)
   */
  config: Record<string, unknown>;

  /**
   * Enhanced lifecycle management for distributed systems
   */
  lifecycle: {
    /**
     * Application startup hooks
     */
    onStartup: (name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority) => void;

    /**
     * Health check registration
     */
    onHealthCheck: (name: string, fn: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string; }>) => void;

    /**
     * Graceful shutdown hooks
     */
    onShutdown: (name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority) => void;

    /**
     * Pre-shutdown hooks (stop accepting new requests)
     */
    onPreShutdown: (name: string, fn: () => void | Promise<void>) => void;

    /**
     * Configuration reload hooks
     */
    onConfigReload: (name: string, fn: (newConfig: Record<string, unknown>) => void | Promise<void>) => void;

    /**
     * Memory pressure hooks
     */
    onMemoryPressure: (name: string, fn: (level: 'low' | 'medium' | 'high') => void | Promise<void>) => void;

    /**
     * Circuit breaker state change hooks
     */
    onCircuitBreakerChange: (name: string, fn: (service: string, state: 'open' | 'closed' | 'half-open') => void) => void;

    /**
     * Execute startup hooks
     */
    executeStartup: () => Promise<void>;

    /**
     * Execute health checks
     */
    executeHealthChecks: () => Promise<HealthStatus>;

    /**
     * Execute shutdown hooks
     */
    executeShutdown: () => Promise<void>;

    /**
     * Check if the context is shutting down
     */
    isShuttingDown: () => boolean;

    /**
     * Distributed lifecycle coordinator
     */
    coordinator?: LifecycleCoordinator;
  };
}

/**
 * Client metadata information
 */
export interface ClientMetadata {
  /**
   * Client IP address
   */
  ip: string;

  /**
   * User-Agent header
   */
  userAgent: string;

  /**
   * Additional client headers
   */
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Session metadata information
 */
export interface SessionMetadata {
  /**
   * Session creation timestamp
   */
  createdAt: number;

  /**
   * Last activity timestamp
   */
  lastActivity: number;

  /**
   * Session data
   */
  data: Record<string, unknown>;
}

/**
 * Device metadata information
 */
export interface DeviceMetadata {
  /**
   * Device type (mobile, desktop, tablet, etc.)
   */
  type: string;

  /**
   * Operating system
   */
  os: string;

  /**
   * Browser name and version
   */
  browser: string;

  /**
   * Raw User-Agent string
   */
  userAgent: string;

  /**
   * Device fingerprint data
   */
  fingerprint: Record<string, unknown>;
}

/**
 * Request lifecycle phases
 */
export enum RequestPhase {
  RECEIVED = 'received',
  AUTHENTICATED = 'authenticated', 
  AUTHORIZED = 'authorized',
  VALIDATED = 'validated',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * Local context (lctx) - scoped to a single request
 * Lightweight and stateless for distributed architecture
 */
export interface LocalContext {
  /**
   * Unique identifier for this request
   */
  requestId: string;

  /**
   * Distributed tracing ID
   */
  traceId: string;

  /**
   * Parent span ID for tracing
   */
  parentSpanId?: string;

  /**
   * Unique identifier for the client making this request
   */
  clientId: string;

  /**
   * External references (not actual data)
   */
  refs: {
    sessionId?: string;
    userId?: string;
    tenantId?: string;
  };

  /**
   * Minimal client metadata
   */
  client: {
    ip: string;
    userAgent: string;
    region: string;
  };

  /**
   * Request metadata
   */
  meta: {
    timestamp: number;
    instanceId: string;
    region: string;
    method: string;
    path: string;
    phase: RequestPhase;
    startTime: number;
    timeout?: number;
  };

  /**
   * Request-scoped state (typed via declaration merging)
   */
  state: LocalContextState;

  /**
   * WebSocket event coordination
   */
  websocket: {
    /**
     * Wait for a WebSocket event before proceeding
     */
    waitForEvent: (eventType: string, timeout?: number) => Promise<WebSocketEvent>;
    
    /**
     * Emit a WebSocket event for this request
     */
    emitEvent: (eventType: string, data?: unknown) => void;
  };

  /**
   * Enhanced lifecycle hooks for request processing
   */
  lifecycle: {
    /**
     * Register a cleanup function to be called when request completes
     */
    onCleanup: (name: string, fn: () => void | Promise<void>) => void;

    /**
     * Register timeout handler
     */
    onTimeout: (fn: () => void | Promise<void>) => void;

    /**
     * Register error handler
     */
    onError: (fn: (error: Error) => void | Promise<void>) => void;

    /**
     * Register phase change handler
     */
    onPhaseChange: (fn: (phase: RequestPhase, previousPhase: RequestPhase) => void) => void;

    /**
     * Set current request phase
     */
    setPhase: (phase: RequestPhase) => void;

    /**
     * Execute cleanup hooks
     */
    executeCleanup: () => Promise<void>;

    /**
     * Check if the context is being cleaned up
     */
    isCleaningUp: () => boolean;

    /**
     * Check if request has timed out
     */
    isTimedOut: () => boolean;
  };
}

/**
 * Options for creating a global context
 */
export interface GlobalContextOptions {
  /**
   * Instance metadata
   */
  instance?: {
    id: string;
    region: string;
    zone: string;
  };

  /**
   * Initial module registry
   */
  modules?: ModuleRegistry;

  /**
   * External services
   */
  services?: ExternalServices;

  /**
   * Application configuration
   */
  config?: Record<string, unknown>;
}

/**
 * Options for creating a local context
 */
export interface LocalContextOptions {
  /**
   * Custom request ID (auto-generated if not provided)
   */
  requestId?: string;

  /**
   * Distributed tracing ID
   */
  traceId?: string;

  /**
   * Parent span ID for tracing
   */
  parentSpanId?: string;

  /**
   * Custom client ID (auto-generated if not provided)
   */
  clientId?: string;

  /**
   * External references
   */
  refs?: {
    sessionId?: string;
    userId?: string;
    tenantId?: string;
  };

  /**
   * Client metadata
   */
  client?: {
    ip: string;
    userAgent: string;
    region: string;
  };

  /**
   * Request metadata
   */
  meta?: {
    timestamp: number;
    instanceId: string;
    region: string;
    method: string;
    path: string;
  };

  /**
   * Initial request-scoped state
   */
  state?: Record<string, unknown>;
}
