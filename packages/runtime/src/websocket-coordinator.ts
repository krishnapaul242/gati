/**
 * @module runtime/websocket-coordinator
 * @description WebSocket event coordinator for request synchronization
 */

import { EventEmitter } from 'events';

export interface WebSocketEvent {
  type: string;
  requestId: string;
  data?: unknown;
  timestamp: number;
}

export interface WebSocketCoordinator {
  /**
   * Wait for a specific event related to a request
   */
  waitForEvent(requestId: string, eventType: string, timeout?: number): Promise<WebSocketEvent>;
  
  /**
   * Emit an event for a specific request
   */
  emitEvent(event: WebSocketEvent): void;
  
  /**
   * Clean up listeners for a request
   */
  cleanup(requestId: string): void;
}

export class DefaultWebSocketCoordinator implements WebSocketCoordinator {
  private emitter = new EventEmitter();
  private pendingRequests = new Map<string, Set<string>>();

  async waitForEvent(requestId: string, eventType: string, timeout = 30000): Promise<WebSocketEvent> {
    const eventKey = `${requestId}:${eventType}`;
    
    // Track pending request
    if (!this.pendingRequests.has(requestId)) {
      this.pendingRequests.set(requestId, new Set());
    }
    this.pendingRequests.get(requestId)!.add(eventType);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.emitter.removeListener(eventKey, resolve);
        reject(new Error(`WebSocket event timeout: ${eventType} for request ${requestId}`));
      }, timeout);

      this.emitter.once(eventKey, (event: WebSocketEvent) => {
        clearTimeout(timeoutId);
        resolve(event);
      });
    });
  }

  emitEvent(event: WebSocketEvent): void {
    const eventKey = `${event.requestId}:${event.type}`;
    this.emitter.emit(eventKey, event);
  }

  cleanup(requestId: string): void {
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