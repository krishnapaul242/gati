/**
 * @module runtime/types/websocket-handler
 * @description WebSocket and SSE handler type definitions
 */

import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import type { GlobalContext, LocalContext } from './context.js';

/**
 * WebSocket connection wrapper with lifecycle management
 */
export interface WebSocketConnection {
  /**
   * Unique connection ID
   */
  id: string;

  /**
   * Raw WebSocket instance
   */
  ws: WebSocket;

  /**
   * Connection metadata
   */
  metadata: {
    connectedAt: number;
    ip: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
  };

  /**
   * Send message to this connection
   */
  send(data: unknown): void;

  /**
   * Send JSON message to this connection
   */
  sendJSON(data: unknown): void;

  /**
   * Close this connection
   */
  close(code?: number, reason?: string): void;

  /**
   * Check if connection is open
   */
  isOpen(): boolean;
}

/**
 * WebSocket message event
 */
export interface WebSocketMessage {
  /**
   * Message data (parsed if JSON)
   */
  data: unknown;

  /**
   * Raw message data
   */
  raw: string | Buffer;

  /**
   * Connection that sent the message
   */
  connection: WebSocketConnection;

  /**
   * Message timestamp
   */
  timestamp: number;
}

/**
 * WebSocket lifecycle event types
 */
export enum WebSocketEventType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
}

/**
 * WebSocket event handler context
 */
export interface WebSocketContext {
  /**
   * All active connections
   */
  connections: Map<string, WebSocketConnection>;

  /**
   * Broadcast to all connections
   */
  broadcast(data: unknown, filter?: (conn: WebSocketConnection) => boolean): void;

  /**
   * Broadcast JSON to all connections
   */
  broadcastJSON(data: unknown, filter?: (conn: WebSocketConnection) => boolean): void;

  /**
   * Send to specific connection by ID
   */
  sendTo(connectionId: string, data: unknown): void;

  /**
   * Send JSON to specific connection by ID
   */
  sendJSONTo(connectionId: string, data: unknown): void;

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): WebSocketConnection | undefined;

  /**
   * Close specific connection
   */
  closeConnection(connectionId: string, code?: number, reason?: string): void;

  /**
   * Close all connections
   */
  closeAll(code?: number, reason?: string): void;
}

/**
 * WebSocket handler for connection lifecycle
 */
export type WebSocketConnectHandler = (
  connection: WebSocketConnection,
  request: IncomingMessage,
  gctx: GlobalContext,
  lctx: LocalContext,
  wsctx: WebSocketContext
) => Promise<void> | void;

/**
 * WebSocket handler for disconnect lifecycle
 */
export type WebSocketDisconnectHandler = (
  connection: WebSocketConnection,
  code: number,
  reason: string,
  gctx: GlobalContext,
  lctx: LocalContext,
  wsctx: WebSocketContext
) => Promise<void> | void;

/**
 * WebSocket handler for message events
 */
export type WebSocketMessageHandler = (
  message: WebSocketMessage,
  gctx: GlobalContext,
  lctx: LocalContext,
  wsctx: WebSocketContext
) => Promise<void> | void;

/**
 * WebSocket handler for error events
 */
export type WebSocketErrorHandler = (
  error: Error,
  connection: WebSocketConnection,
  gctx: GlobalContext,
  lctx: LocalContext,
  wsctx: WebSocketContext
) => Promise<void> | void;

/**
 * Complete WebSocket handler configuration
 */
export interface WebSocketHandlerConfig {
  /**
   * Handler for new connections
   */
  onConnect?: WebSocketConnectHandler;

  /**
   * Handler for disconnections
   */
  onDisconnect?: WebSocketDisconnectHandler;

  /**
   * Handler for incoming messages
   */
  onMessage?: WebSocketMessageHandler;

  /**
   * Handler for errors
   */
  onError?: WebSocketErrorHandler;

  /**
   * WebSocket options
   */
  options?: {
    /**
     * Maximum message size in bytes
     */
    maxMessageSize?: number;

    /**
     * Heartbeat interval in ms
     */
    heartbeatInterval?: number;

    /**
     * Connection timeout in ms
     */
    connectionTimeout?: number;

    /**
     * Enable compression
     */
    compress?: boolean;
  };
}

/**
 * Server-Sent Events (SSE) connection wrapper
 */
export interface SSEConnection {
  /**
   * Unique connection ID
   */
  id: string;

  /**
   * Connection metadata
   */
  metadata: {
    connectedAt: number;
    ip: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
  };

  /**
   * Send SSE event
   */
  send(event: SSEEvent): void;

  /**
   * Send SSE data event (convenience method)
   */
  sendData(data: unknown, event?: string, id?: string): void;

  /**
   * Send SSE comment (for keep-alive)
   */
  sendComment(comment: string): void;

  /**
   * Close SSE connection
   */
  close(): void;

  /**
   * Check if connection is open
   */
  isOpen(): boolean;
}

/**
 * SSE event structure
 */
export interface SSEEvent {
  /**
   * Event type (optional, defaults to 'message')
   */
  event?: string;

  /**
   * Event data (will be JSON stringified if object)
   */
  data: unknown;

  /**
   * Event ID (for Last-Event-ID support)
   */
  id?: string;

  /**
   * Retry interval in ms (tells client when to reconnect)
   */
  retry?: number;
}

/**
 * SSE context for managing connections
 */
export interface SSEContext {
  /**
   * All active SSE connections
   */
  connections: Map<string, SSEConnection>;

  /**
   * Broadcast event to all connections
   */
  broadcast(event: SSEEvent, filter?: (conn: SSEConnection) => boolean): void;

  /**
   * Send event to specific connection
   */
  sendTo(connectionId: string, event: SSEEvent): void;

  /**
   * Close specific connection
   */
  closeConnection(connectionId: string): void;

  /**
   * Close all connections
   */
  closeAll(): void;
}

/**
 * SSE handler for new connections
 */
export type SSEConnectHandler = (
  connection: SSEConnection,
  request: IncomingMessage,
  gctx: GlobalContext,
  lctx: LocalContext,
  ssectx: SSEContext
) => Promise<void> | void;

/**
 * SSE handler for disconnections
 */
export type SSEDisconnectHandler = (
  connection: SSEConnection,
  gctx: GlobalContext,
  lctx: LocalContext,
  ssectx: SSEContext
) => Promise<void> | void;

/**
 * Complete SSE handler configuration
 */
export interface SSEHandlerConfig {
  /**
   * Handler for new connections
   */
  onConnect?: SSEConnectHandler;

  /**
   * Handler for disconnections
   */
  onDisconnect?: SSEDisconnectHandler;

  /**
   * SSE options
   */
  options?: {
    /**
     * Keep-alive interval in ms
     */
    keepAliveInterval?: number;

    /**
     * Connection timeout in ms
     */
    connectionTimeout?: number;

    /**
     * Retry interval to send to clients (ms)
     */
    retryInterval?: number;
  };
}
