/**
 * @module runtime/sse-handler
 * @description Server-Sent Events (SSE) handler implementation
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type {
  SSEConnection,
  SSEContext,
  SSEEvent,
  SSEHandlerConfig,
} from './types/websocket-handler.js';
import type { GlobalContext, LocalContext } from './types/index.js';
import { logger } from './logger.js';
import { randomUUID } from 'crypto';

/**
 * SSE connection implementation
 */
class SSEConnectionImpl implements SSEConnection {
  private closed = false;

  constructor(
    public id: string,
    private response: ServerResponse,
    public metadata: {
      connectedAt: number;
      ip: string;
      userAgent?: string;
      userId?: string;
      sessionId?: string;
    }
  ) {}

  send(event: SSEEvent): void {
    if (this.closed) return;

    try {
      // Format SSE message
      let message = '';

      if (event.id) {
        message += `id: ${event.id}\n`;
      }

      if (event.event) {
        message += `event: ${event.event}\n`;
      }

      if (event.retry) {
        message += `retry: ${event.retry}\n`;
      }

      // Format data (can be multi-line)
      const data =
        typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
      const dataLines = data.split('\n');
      for (const line of dataLines) {
        message += `data: ${line}\n`;
      }

      message += '\n'; // Empty line to signal end of event

      this.response.write(message);
    } catch (error) {
      logger.error({ error, connectionId: this.id }, 'Error sending SSE event');
    }
  }

  sendData(data: unknown, event?: string, id?: string): void {
    this.send({ data, event, id });
  }

  sendComment(comment: string): void {
    if (this.closed) return;
    this.response.write(`: ${comment}\n\n`);
  }

  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.response.end();
    }
  }

  isOpen(): boolean {
    return !this.closed && !this.response.writableEnded;
  }
}

/**
 * SSE context implementation
 */
class SSEContextImpl implements SSEContext {
  public connections = new Map<string, SSEConnection>();

  broadcast(event: SSEEvent, filter?: (conn: SSEConnection) => boolean): void {
    for (const connection of this.connections.values()) {
      if (!filter || filter(connection)) {
        if (connection.isOpen()) {
          connection.send(event);
        }
      }
    }
  }

  sendTo(connectionId: string, event: SSEEvent): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.isOpen()) {
      connection.send(event);
    }
  }

  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close();
      this.connections.delete(connectionId);
    }
  }

  closeAll(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
  }
}

/**
 * SSE handler manager
 */
export class SSEHandlerManager {
  private sseContext: SSEContextImpl;
  private keepAliveIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private config: SSEHandlerConfig,
    private gctx: GlobalContext
  ) {
    this.sseContext = new SSEContextImpl();
  }

  /**
   * Handle SSE connection
   */
  async handleConnection(
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> {
    const connectionId = randomUUID();
    const ip = request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'];

    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Create connection wrapper
    const connection = new SSEConnectionImpl(connectionId, response, {
      connectedAt: Date.now(),
      ip,
      userAgent,
    });

    // Add to connections map
    this.sseContext.connections.set(connectionId, connection);

    // Create local context for this connection
    const lctx = this.createLocalContext(connectionId);

    logger.info({ connectionId, ip, userAgent }, 'SSE connection established');

    // Send initial retry interval if configured
    if (this.config.options?.retryInterval) {
      connection.send({
        data: '',
        retry: this.config.options.retryInterval,
      });
    }

    // Setup keep-alive if configured
    if (this.config.options?.keepAliveInterval) {
      this.setupKeepAlive(connection);
    }

    // Handle connection close
    response.on('close', () => {
      this.handleDisconnect(connection, lctx);
    });

    // Handle connection timeout
    if (this.config.options?.connectionTimeout) {
      setTimeout(() => {
        if (connection.isOpen()) {
          connection.close();
        }
      }, this.config.options.connectionTimeout);
    }

    // Call onConnect handler
    try {
      if (this.config.onConnect) {
        await this.config.onConnect(
          connection,
          request,
          this.gctx,
          lctx,
          this.sseContext
        );
      }
    } catch (error) {
      logger.error({ error, connectionId }, 'Error in SSE onConnect handler');
      connection.close();
    }
  }

  /**
   * Handle connection close
   */
  private async handleDisconnect(
    connection: SSEConnection,
    lctx: LocalContext
  ): Promise<void> {
    logger.info({ connectionId: connection.id }, 'SSE connection closed');

    // Clear keep-alive
    this.clearKeepAlive(connection.id);

    // Remove from connections
    this.sseContext.connections.delete(connection.id);

    // Call onDisconnect handler
    try {
      if (this.config.onDisconnect) {
        await this.config.onDisconnect(connection, this.gctx, lctx, this.sseContext);
      }
    } catch (error) {
      logger.error(
        { error, connectionId: connection.id },
        'Error in SSE onDisconnect handler'
      );
    }

    // Execute cleanup hooks
    await lctx.lifecycle.executeCleanup();
  }

  /**
   * Setup keep-alive for connection
   */
  private setupKeepAlive(connection: SSEConnection): void {
    const interval = this.config.options?.keepAliveInterval || 30000;
    const timer = setInterval(() => {
      if (connection.isOpen()) {
        connection.sendComment('keep-alive');
      } else {
        this.clearKeepAlive(connection.id);
      }
    }, interval);

    this.keepAliveIntervals.set(connection.id, timer);
  }

  /**
   * Clear keep-alive for connection
   */
  private clearKeepAlive(connectionId: string): void {
    const timer = this.keepAliveIntervals.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.keepAliveIntervals.delete(connectionId);
    }
  }

  /**
   * Create local context for SSE connection
   */
  private createLocalContext(connectionId: string): LocalContext {
    // Note: In a real implementation, this would use the context-manager
    // For now, return a minimal context
    return {
      requestId: connectionId,
      traceId: randomUUID(),
      timestamp: Date.now(),
      clientId: 'sse',
      refs: {},
      client: { ip: 'unknown' },
      meta: {
        timestamp: Date.now(),
        instanceId: this.gctx.instance.id,
        region: this.gctx.instance.region,
        method: 'GET',
        path: '/events',
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
   * Get SSE context (for external access)
   */
  getContext(): SSEContext {
    return this.sseContext;
  }

  /**
   * Shutdown SSE server
   */
  async shutdown(): Promise<void> {
    // Clear all keep-alive timers
    for (const timer of this.keepAliveIntervals.values()) {
      clearInterval(timer);
    }
    this.keepAliveIntervals.clear();

    // Close all connections
    this.sseContext.closeAll();

    logger.info('SSE server shutdown complete');
  }
}

/**
 * Create SSE handler manager
 */
export function createSSEHandler(
  config: SSEHandlerConfig,
  gctx: GlobalContext
): SSEHandlerManager {
  return new SSEHandlerManager(config, gctx);
}
