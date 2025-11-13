import { RequestPhase } from './types/context.js';
import { RequestLifecycleManager } from './lifecycle-manager.js';
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
function generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
function generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
}
export function createLocalContext(options = {}, wsCoordinator) {
    const requestLifecycle = new RequestLifecycleManager();
    const lifecycleSymbol = Symbol.for('gati:requestLifecycle');
    const lctx = {
        requestId: options.requestId || generateRequestId(),
        traceId: options.traceId || generateTraceId(),
        parentSpanId: options.parentSpanId,
        clientId: options.clientId || generateClientId(),
        refs: options.refs || {},
        client: options.client || {
            ip: 'unknown',
            userAgent: 'unknown',
            region: 'unknown',
        },
        meta: {
            timestamp: Date.now(),
            instanceId: 'unknown',
            region: 'unknown',
            method: 'GET',
            path: '/',
            phase: RequestPhase.RECEIVED,
            startTime: Date.now(),
            ...options.meta,
        },
        state: options.state || {},
        websocket: {
            waitForEvent: async (eventType, timeout) => {
                if (!wsCoordinator) {
                    throw new Error('WebSocket coordinator not available');
                }
                return wsCoordinator.waitForEvent(lctx.requestId, eventType, timeout);
            },
            emitEvent: (eventType, data) => {
                if (!wsCoordinator) {
                    throw new Error('WebSocket coordinator not available');
                }
                wsCoordinator.emitEvent({
                    type: eventType,
                    requestId: lctx.requestId,
                    data,
                    timestamp: Date.now(),
                });
            },
        },
        lifecycle: {
            onCleanup: (name, fn) => {
                requestLifecycle.onCleanup(name, fn);
            },
            onTimeout: (fn) => {
                requestLifecycle.onTimeout(fn);
            },
            onError: (fn) => {
                requestLifecycle.onError(fn);
            },
            onPhaseChange: (fn) => {
                requestLifecycle.onPhaseChange(fn);
            },
            setPhase: (phase) => {
                requestLifecycle.setPhase(phase);
                lctx.meta.phase = phase;
            },
            executeCleanup: () => requestLifecycle.executeCleanup(),
            isCleaningUp: () => requestLifecycle.isCleaningUp(),
            isTimedOut: () => requestLifecycle.isTimedOut(),
        },
    };
    lctx[lifecycleSymbol] = requestLifecycle;
    return lctx;
}
export async function cleanupLocalContext(lctx, wsCoordinator) {
    if (wsCoordinator) {
        wsCoordinator.cleanup(lctx.requestId);
    }
    await lctx.lifecycle.executeCleanup();
    lctx.state = {};
}
export function setState(lctx, key, value) {
    lctx.state[key] = value;
}
export function getState(lctx, key) {
    return lctx.state[key];
}
