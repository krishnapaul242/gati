import { EventEmitter } from 'events';
export class DefaultWebSocketCoordinator {
    emitter = new EventEmitter();
    pendingRequests = new Map();
    async waitForEvent(requestId, eventType, timeout = 30000) {
        const eventKey = `${requestId}:${eventType}`;
        if (!this.pendingRequests.has(requestId)) {
            this.pendingRequests.set(requestId, new Set());
        }
        this.pendingRequests.get(requestId).add(eventType);
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.emitter.removeListener(eventKey, resolve);
                reject(new Error(`WebSocket event timeout: ${eventType} for request ${requestId}`));
            }, timeout);
            this.emitter.once(eventKey, (event) => {
                clearTimeout(timeoutId);
                resolve(event);
            });
        });
    }
    emitEvent(event) {
        const eventKey = `${event.requestId}:${event.type}`;
        this.emitter.emit(eventKey, event);
    }
    cleanup(requestId) {
        const eventTypes = this.pendingRequests.get(requestId);
        if (eventTypes) {
            eventTypes.forEach(eventType => {
                const eventKey = `${requestId}:${eventType}`;
                this.emitter.removeAllListeners(eventKey);
            });
            this.pendingRequests.delete(requestId);
        }
    }
}
