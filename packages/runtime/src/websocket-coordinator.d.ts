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
export declare class DefaultWebSocketCoordinator implements WebSocketCoordinator {
    private emitter;
    private pendingRequests;
    waitForEvent(requestId: string, eventType: string, timeout?: number): Promise<WebSocketEvent>;
    emitEvent(event: WebSocketEvent): void;
    cleanup(requestId: string): void;
}
