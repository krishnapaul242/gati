/**
 * @module runtime/websocket-handler
 * @description WebSocket handler implementation with lifecycle management
 */

import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage, Server as HTTPServer } from 'http';
import type {
  WebSocketConnection,
  WebSocketContext,
  WebSocketHandlerConfig,
  WebSocketMessage,
} from './types/websocket-handler.js';
import type { GlobalContext, LocalContext } from './types/index.js';
import { logger } from './logger.js';
import { randomUUID } from 'crypto';

/**
 * WebSocket connection implementation
 */
class WebSocketConnectionImpl implements WebSocketConnection {
  constructor(
    public id: string,
    public ws: WebSocket,
    public metadata: {
      connectedAt: number;
      ip: string;
      userAgent?: string;
      userId?: string;
      sessionId?: string;
    }
  ) {}

  send(data: unknown): void {
    if (this.isOpen()) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
    }
  }

  sendJSON(data: unknown): void {
    if (this.isOpen()) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close(code?: number, reason?: string): void {
    if (this.isOpen()) {
      this.ws.close(code, reason);
    }
  }

  isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * WebSocket context implementation
 */
class WebSocketContextImpl implements WebSocketContext {
  public connections = new Map<string, WebSocketConnection>();

  broadcast(data: unknown, filter?: (conn: WebSocketConnection) => boolean): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    for (const connection of this.connections.values()) {
      if (!filter || filter(connection)) {
        if (connection.isOpen()) {
          connection.ws.send(message);
        }
      }
    }
  }

  broadcastJSON(data: unknown, filter?: (conn: WebSocketConnection) => boolean): void {
    this.broadcast(JSON.stringify(data), filter);
  }

  sendTo(connectionId: string, data: unknown): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.send(data);
    }
  }

  sendJSONTo(connectionId: string, data: unknown): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.sendJSON(data);
    }
  }

  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  closeConnection(connectionId: string, code?: number, reason?: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close(code, reason);
      this.connections.delete(connectionId);
    }
  }

  closeAll(code?: number, reason?: string): void {
    for (const connection of this.connections.values()) {
      connection.close(code, reason);
    }
    this.connections.clear();
  }
}

/**
 * WebSocket handler manager
 */
export class WebSocketHandlerManager {
  private wss?: WebSocketServer;
  private wsContext: WebSocketContextImpl;
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private config: WebSocketHandlerConfig,
    private gctx: GlobalContext
  ) {
    this.wsContext = new WebSocketContextImpl();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer, path?: string): void {
    this.wss = new WebSocketServer({
      server,
      path: path || '/ws',
      maxPayload: this.config.options?.maxMessageSize || 1024 * 1024, // 1MB default
      perMessageDeflate: this.config.options?.compress !== false,
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    logger.info({ path: path || '/ws' }, 'WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const connectionId = randomUUID();
    const ip = request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'];

    // Create connection wrapper
    const connection = new WebSocketConnectionImpl(connectionId, ws, {
      connectedAt: Date.now(),
      ip,
      userAgent,
    });

    // Add to connections map
    this.wsContext.connections.set(connectionId, connection);

    // Create local context for this connection
    const lctx = this.createLocalContext(connectionId);

    logger.info(
      { connectionId, ip, userAgent },
      'WebSocket connection established'
    );

    // Setup heartbeat if configured
    if (this.config.options?.heartbeatInterval) {
      this.setupHeartbeat(connection);
    }

    // Handle connection timeout
    if (this.config.options?.connectionTimeout) {
      setTimeout(() => {
        if (connection.isOpen()) {
          connection.close(1000, 'Connection timeout');
        }
      }, this.config.options.connectionTimeout);
    }

    // Setup event handlers
    ws.on('message', (data) => this.handleMessage(connection, data, lctx));
    ws.on('close', (code, reason) =>
      this.handleDisconnect(connection, code, reason.toString(), lctx)
    );
    ws.on('error', (error) => this.handleError(error, connection, lctx));
    ws.on('pong', () => this.handlePong(connection));

    // Call onConnect handler
    try {
      if (this.config.onConnect) {
        await this.config.onConnect(connection, request, this.gctx, lctx, this.wsContext);
      }
    } catch (error) {
      logger.error({ error, connectionId }, 'Error in onConnect handler');
      connection.close(1011, 'Internal server error');
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(
    connection: WebSocketConnection,
    data: Buffer | string,
    lctx: LocalContext
  ): Promise<void> {
    // Parse message
    let parsed: unknown;
    try {
      const raw = data.toString();
      parsed = JSON.parse(raw);
    } catch {
      parsed = data.toString();
    }

    const message: WebSocketMessage = {
      data: parsed,
      raw: data,
      connection,
      timestamp: Date.now(),
    };

    // Call onMessage handler
    try {
      if (this.config.onMessage) {
        await this.config.onMessage(message, this.gctx, lctx, this.wsContext);
      }
    } catch (error) {
      logger.error(
        { error, connectionId: connection.id },
        'Error in onMessage handler'
      );
      if (this.config.onError) {
        await this.config.onError(
          error as Error,
          connection,
          this.gctx,
          lctx,
          this.wsContext
        );
      }
    }
  }

  /**
   * Handle connection close
   */
  private async handleDisconnect(
    connection: WebSocketConnection,
    code: number,
    reason: string,
    lctx: LocalContext
  ): Promise<void> {
    logger.info(
      { connectionId: connection.id, code, reason },
      'WebSocket connection closed'
    );

    // Clear heartbeat
    this.clearHeartbeat(connection.id);

    // Remove from connections
    this.wsContext.connections.delete(connection.id);

    // Call onDisconnect handler
    try {
      if (this.config.onDisconnect) {
        await this.config.onDisconnect(
          connection,
          code,
          reason,
          this.gctx,
          lctx,
          this.wsContext
        );
      }
    } catch (error) {
      logger.error(
        { error, connectionId: connection.id },
        'Error in onDisconnect handler'
      );
    }

    // Execute cleanup hooks
    await lctx.lifecycle.executeCleanup();
  }

  /**
   * Handle WebSocket error
   */
  private async handleError(
    error: Error,
    connection: WebSocketConnection,
    lctx: LocalContext
  ): Promise<void> {
    logger.error(
      { error, connectionId: connection.id },
      'WebSocket connection error'
    );

    // Call onError handler
    try {
      if (this.config.onError) {
        await this.config.onError(error, connection, this.gctx, lctx, this.wsContext);
      }
    } catch (handlerError) {
      logger.error(
        { error: handlerError, connectionId: connection.id },
        'Error in onError handler'
      );
    }
  }

  /**
   * Setup heartbeat for connection
   */
  private setupHeartbeat(connection: WebSocketConnection): void {
    const interval = this.config.options?.heartbeatInterval || 30000;
    const timer = setInterval(() => {
      if (connection.isOpen()) {
        connection.ws.ping();
      } else {
        this.clearHeartbeat(connection.id);
      }
    }, interval);

    this.heartbeatIntervals.set(connection.id, timer);
  }

  /**
   * Clear heartbeat for connection
   */
  private clearHeartbeat(connectionId: string): void {
    const timer = this.heartbeatIntervals.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatIntervals.delete(connectionId);
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(connection: WebSocketConnection): void {
    logger.debug({ connectionId: connection.id }, 'WebSocket pong received');
  }

  /**
   * Create local context for WebSocket connection
   */
  private createLocalContext(connectionId: string): LocalContext {
    // Note: In a real implementation, this would use the context-manager
    // For now, return a minimal context
    return {
      requestId: connectionId,
      traceId: randomUUID(),
      timestamp: Date.now(),
      clientId: 'websocket',
      refs: {},
      client: { ip: 'unknown' },
      meta: {
        timestamp: Date.now(),
        instanceId: this.gctx.instance.id,
        region: this.gctx.instance.region,
        method: 'WS',
        path: '/ws',
        phase: 'RECEIVED',
      },
      state: {},
      lifecycle: {
        onCleanup: () => {},
        onTimeout: () => {},
        onError: () => {},
        onPhaseChange: () => {},
        setPhase: () => {},
        executeCleanup: async () => {},
        isCleaningUp: () => false,
        isTimedOut: () => false,
      },
      websocket: {
        waitForEvent: async () => ({
          type: '',
          requestId: '',
          timestamp: 0,
        }),
        emitEvent: () => {},
      },
    } as LocalContext;
  }

  /**
   * Get WebSocket context (for external access)
   */
  getContext(): WebSocketContext {
    return this.wsContext;
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    // Clear all heartbeats
    for (const timer of this.heartbeatIntervals.values()) {
      clearInterval(timer);
    }
    this.heartbeatIntervals.clear();

    // Close all connections
    this.wsContext.closeAll(1001, 'Server shutting down');

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve, reject) => {
        this.wss!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    logger.info('WebSocket server shutdown complete');
  }
}

/**
 * Create WebSocket handler manager
 */
export function createWebSocketHandler(
  config: WebSocketHandlerConfig,
  gctx: GlobalContext
): WebSocketHandlerManager {
  return new WebSocketHandlerManager(config, gctx);
}
