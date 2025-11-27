/**
 * @module playground/api/debug-gate-websocket
 * @description WebSocket server for debug gate real-time notifications
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { DebugGateManager } from '@gati-framework/runtime';

/**
 * WebSocket message types
 */
type WSMessageType = 
  | 'gate:triggered'
  | 'gate:released'
  | 'gate:release'
  | 'gate:step'
  | 'subscribe'
  | 'unsubscribe';

/**
 * WebSocket message
 */
interface WSMessage {
  type: WSMessageType;
  payload?: any;
  traceId?: string;
}

/**
 * Client subscription
 */
interface ClientSubscription {
  ws: WebSocket;
  traceIds: Set<string>;
}

/**
 * Debug gate WebSocket server
 */
export class DebugGateWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Map<WebSocket, ClientSubscription>();

  constructor(
    private gateManager: DebugGateManager,
    port = 3002
  ) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
  }

  /**
   * Setup WebSocket and gate manager handlers
   */
  private setupHandlers(): void {
    // WebSocket connection handler
    this.wss.on('connection', (ws) => {
      this.clients.set(ws, { ws, traceIds: new Set() });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as WSMessage;
          this.handleMessage(ws, msg);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // Gate manager event handlers
    this.gateManager.on('gate:triggered', (event: any) => {
      this.broadcast({
        type: 'gate:triggered',
        payload: event,
        traceId: event.traceId,
      });
    });

    this.gateManager.on('gate:released', (event: any) => {
      this.broadcast({
        type: 'gate:released',
        payload: event,
      });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: WebSocket, msg: WSMessage): void {
    switch (msg.type) {
      case 'subscribe':
        if (msg.traceId) {
          const client = this.clients.get(ws);
          if (client) {
            client.traceIds.add(msg.traceId);
            ws.send(JSON.stringify({ type: 'subscribed', traceId: msg.traceId }));
          }
        }
        break;

      case 'unsubscribe':
        if (msg.traceId) {
          const client = this.clients.get(ws);
          if (client) {
            client.traceIds.delete(msg.traceId);
            ws.send(JSON.stringify({ type: 'unsubscribed', traceId: msg.traceId }));
          }
        }
        break;

      case 'gate:release':
        if (msg.payload?.gateId) {
          this.gateManager.releaseGate(msg.payload.gateId);
        }
        break;

      case 'gate:step':
        // Step-over: release current gate
        if (msg.payload?.gateId) {
          this.gateManager.releaseGate(msg.payload.gateId);
        }
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  /**
   * Broadcast message to subscribed clients
   */
  private broadcast(msg: WSMessage): void {
    const data = JSON.stringify(msg);
    
    for (const [ws, client] of this.clients.entries()) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      // Send to all if no traceId, or to subscribed clients
      if (!msg.traceId || client.traceIds.has(msg.traceId)) {
        ws.send(data);
      }
    }
  }

  /**
   * Close server
   */
  close(): void {
    this.wss.close();
  }
}

/**
 * Create debug gate WebSocket server
 */
export function createDebugGateWebSocket(
  gateManager: DebugGateManager,
  port?: number
): DebugGateWebSocketServer {
  return new DebugGateWebSocketServer(gateManager, port);
}
