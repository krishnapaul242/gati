export interface ModuleRegistry {
    [moduleName: string]: unknown;
}
export interface LocalContextState {
    [key: string]: unknown;
}
export interface WebSocketEvent {
    type: string;
    requestId: string;
    data?: unknown;
    timestamp: number;
}
export interface WebSocketCoordinator {
    waitForEvent(requestId: string, eventType: string, timeout?: number): Promise<WebSocketEvent>;
    emitEvent(event: WebSocketEvent): void;
    cleanup(requestId: string): void;
}
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
export declare enum LifecyclePriority {
    CRITICAL = 1000,
    HIGH = 800,
    NORMAL = 500,
    LOW = 200,
    CLEANUP = 100
}
export interface LifecycleHook {
    name: string;
    priority: LifecyclePriority;
    timeout?: number;
    fn: () => void | Promise<void>;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, {
        status: 'pass' | 'fail' | 'warn';
        message?: string;
        duration?: number;
    }>;
    timestamp: number;
}
export interface LifecycleCoordinator {
    register(): Promise<void>;
    deregister(): Promise<void>;
    reportHealth(status: HealthStatus): Promise<void>;
    onCoordinatedShutdown(fn: () => Promise<void>): void;
}
export interface GlobalContext {
    instance: {
        id: string;
        region: string;
        zone: string;
        startedAt: number;
    };
    modules: ModuleRegistry;
    services: ExternalServices;
    config: Record<string, unknown>;
    lifecycle: {
        onStartup: (name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority) => void;
        onHealthCheck: (name: string, fn: () => Promise<{
            status: 'pass' | 'fail' | 'warn';
            message?: string;
        }>) => void;
        onShutdown: (name: string, fn: () => void | Promise<void>, priority?: LifecyclePriority) => void;
        onPreShutdown: (name: string, fn: () => void | Promise<void>) => void;
        onConfigReload: (name: string, fn: (newConfig: Record<string, unknown>) => void | Promise<void>) => void;
        onMemoryPressure: (name: string, fn: (level: 'low' | 'medium' | 'high') => void | Promise<void>) => void;
        onCircuitBreakerChange: (name: string, fn: (service: string, state: 'open' | 'closed' | 'half-open') => void) => void;
        executeStartup: () => Promise<void>;
        executeHealthChecks: () => Promise<HealthStatus>;
        executeShutdown: () => Promise<void>;
        isShuttingDown: () => boolean;
        coordinator?: LifecycleCoordinator;
    };
}
export interface ClientMetadata {
    ip: string;
    userAgent: string;
    headers: Record<string, string | string[] | undefined>;
}
export interface SessionMetadata {
    createdAt: number;
    lastActivity: number;
    data: Record<string, unknown>;
}
export interface DeviceMetadata {
    type: string;
    os: string;
    browser: string;
    userAgent: string;
    fingerprint: Record<string, unknown>;
}
export declare enum RequestPhase {
    RECEIVED = "received",
    AUTHENTICATED = "authenticated",
    AUTHORIZED = "authorized",
    VALIDATED = "validated",
    PROCESSING = "processing",
    COMPLETED = "completed",
    ERROR = "error"
}
export interface LocalContext {
    requestId: string;
    traceId: string;
    parentSpanId?: string;
    clientId: string;
    refs: {
        sessionId?: string;
        userId?: string;
        tenantId?: string;
    };
    client: {
        ip: string;
        userAgent: string;
        region: string;
    };
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
    state: LocalContextState;
    websocket: {
        waitForEvent: (eventType: string, timeout?: number) => Promise<WebSocketEvent>;
        emitEvent: (eventType: string, data?: unknown) => void;
    };
    lifecycle: {
        onCleanup: (name: string, fn: () => void | Promise<void>) => void;
        onTimeout: (fn: () => void | Promise<void>) => void;
        onError: (fn: (error: Error) => void | Promise<void>) => void;
        onPhaseChange: (fn: (phase: RequestPhase, previousPhase: RequestPhase) => void) => void;
        setPhase: (phase: RequestPhase) => void;
        executeCleanup: () => Promise<void>;
        isCleaningUp: () => boolean;
        isTimedOut: () => boolean;
    };
}
export interface GlobalContextOptions {
    instance?: {
        id: string;
        region: string;
        zone: string;
    };
    modules?: ModuleRegistry;
    services?: ExternalServices;
    config?: Record<string, unknown>;
}
export interface LocalContextOptions {
    requestId?: string;
    traceId?: string;
    parentSpanId?: string;
    clientId?: string;
    refs?: {
        sessionId?: string;
        userId?: string;
        tenantId?: string;
    };
    client?: {
        ip: string;
        userAgent: string;
        region: string;
    };
    meta?: {
        timestamp: number;
        instanceId: string;
        region: string;
        method: string;
        path: string;
    };
    state?: Record<string, unknown>;
}
