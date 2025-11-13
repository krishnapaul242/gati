/**
 * @module playground/websocket
 * @description WebSocket server for real-time event streaming
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { PlaygroundModule, WSMessage, LifecycleEvent } from './types.js';
import { createLogger } from './logger.js';

const logger = createLogger({ name: 'playground-ws' });

/**
 * Client connection tracking
 */
interface Client {
  ws: WebSocket;
  subscriptions: Set<string>; // trace IDs
}

/**
 * Create WebSocket server for playground
 * 
 * @param httpServer - HTTP server to attach to
 * @param playground - Playground module instance
 * @param port - WebSocket port (default: 3002)
 * 
 * @example
 * ```typescript
 * import { createServer } from 'http';
 * import { createPlaygroundWS } from '@gati-framework/playground';
 * 
 * const server = createServer();
 * const playground = createPlaygroundModule();
 * createPlaygroundWS(server, playground, 3002);
 * ```
 */
export function createPlaygroundWS(
  httpServer: HTTPServer | undefined,
  playground: PlaygroundModule,
  port: number = 3002
): WebSocketServer {
  const wss = new WebSocketServer({
    ...(httpServer ? { server: httpServer } : { port }),
  });

  const clients = new Map<WebSocket, Client>();

  wss.on('connection', (ws: WebSocket) => {
    const client: Client = {
      ws,
      subscriptions: new Set(),
    };

    clients.set(ws, client);
    logger.info({ clientCount: clients.size }, 'WebSocket client connected');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        handleMessage(client, message, playground);
      } catch (error) {
        logger.error({ error }, 'Failed to parse WebSocket message');
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info({ clientCount: clients.size }, 'WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      logger.error({ error }, 'WebSocket error');
    });
  });

  /**
   * Broadcast event to subscribed clients
   */
  function broadcastEvent(event: LifecycleEvent): void {
    const message: WSMessage = {
      type: 'event',
      payload: event,
      traceId: event.traceId,
    };

    const messageStr = JSON.stringify(message);

    for (const [ws, client] of clients.entries()) {
      if (client.subscriptions.has(event.traceId)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      }
    }
  }

  // Override playground's emitEvent to broadcast via WebSocket
  const originalEmit = playground.emitEvent.bind(playground);
  playground.emitEvent = (event: LifecycleEvent) => {
    originalEmit(event);
    broadcastEvent(event);
  };

  logger.info({ port: httpServer ? 'attached' : port }, 'WebSocket server started');

  return wss;
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(
  client: Client,
  message: WSMessage,
  playground: PlaygroundModule
): void {
  switch (message.type) {
    case 'subscribe':
      if (message.traceId) {
        client.subscriptions.add(message.traceId);
        logger.debug({ traceId: message.traceId }, 'Client subscribed to trace');
        
        // Send historical events for this trace
        const events = playground.getEventStream(message.traceId);
        events.forEach(event => {
          const msg: WSMessage = {
            type: 'event',
            payload: event,
            traceId: event.traceId,
          };
          client.ws.send(JSON.stringify(msg));
        });
      }
      break;

    case 'unsubscribe':
      if (message.traceId) {
        client.subscriptions.delete(message.traceId);
        logger.debug({ traceId: message.traceId }, 'Client unsubscribed from trace');
      }
      break;

    case 'breakpoint:set':
      if (message.payload) {
        playground.setBreakpoint(message.payload as any);
      }
      break;

    case 'breakpoint:remove':
      if (message.payload && typeof message.payload === 'string') {
        playground.removeBreakpoint(message.payload);
      }
      break;

    case 'debug:step':
      if (message.payload && typeof message.payload === 'string') {
        playground.stepNext(message.payload);
      }
      break;

    case 'debug:resume':
      if (message.payload && typeof message.payload === 'string') {
        playground.resume(message.payload);
      }
      break;

    default:
      logger.warn({ type: message.type }, 'Unknown message type');
  }
}
