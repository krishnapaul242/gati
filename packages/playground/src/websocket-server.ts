/**
 * @module playground/websocket-server
 * @description WebSocket server for playground events
 */

import { WebSocketServer } from 'ws';
import type { PlaygroundEngine } from './playground-engine.js';

export class PlaygroundWebSocketServer {
  private wss: WebSocketServer;
  private clients = new Set<any>();

  constructor(private engine: PlaygroundEngine, port = 3001) {
    this.wss = new WebSocketServer({ port });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      // Send current blocks on connection
      ws.send(JSON.stringify({
        type: 'blocks',
        data: this.engine.getBlocks()
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // Forward playground events to all clients
    this.engine.on('playground-event', (event) => {
      this.broadcast({
        type: 'event',
        data: event
      });
    });
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(data);
      }
    });
  }

  close(): void {
    this.wss.close();
  }
}