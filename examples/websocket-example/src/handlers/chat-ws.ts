/**
 * WebSocket Chat Room Example
 * 
 * This example demonstrates:
 * - WebSocket connection lifecycle (connect, disconnect, error)
 * - Message broadcasting to all connected clients
 * - Room-based messaging with filters
 * - User authentication and context enrichment
 */

import { createWebSocketHandler, type WebSocketHandlerConfig } from '@gati-framework/runtime';
import type { GlobalContext } from '@gati-framework/runtime';

// Room management (in production, use Redis or similar)
const rooms = new Map<string, Set<string>>(); // roomId -> Set<connectionId>
const userConnections = new Map<string, string>(); // connectionId -> userId

export function createChatWebSocketHandler(gctx: GlobalContext) {
  const config: WebSocketHandlerConfig = {
    // Handle new connection
    onConnect: async (connection, request, gctx, lctx, wsctx) => {
      console.log(`[WS] New connection: ${connection.id}`);

      // Extract user from query params or auth header
      const url = new URL(request.url || '', 'ws://localhost');
      const userId = url.searchParams.get('userId') || 'anonymous';
      const roomId = url.searchParams.get('room') || 'general';

      // Store user metadata
      connection.metadata.userId = userId;
      connection.metadata.sessionId = roomId;
      userConnections.set(connection.id, userId);

      // Add to room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(connection.id);

      // Send welcome message
      connection.sendJSON({
        type: 'system',
        message: `Welcome to ${roomId} room!`,
        userId: 'system',
        timestamp: Date.now(),
      });

      // Notify others in room
      wsctx.broadcast(
        {
          type: 'user_joined',
          userId,
          timestamp: Date.now(),
        },
        (conn) => {
          // Send to same room, but not to the new connection
          return conn.metadata.sessionId === roomId && conn.id !== connection.id;
        }
      );

      console.log(`[WS] User ${userId} joined room ${roomId}`);
    },

    // Handle incoming messages
    onMessage: async (message, gctx, lctx, wsctx) => {
      const { connection, data } = message;
      console.log(`[WS] Message from ${connection.id}:`, data);

      // Parse message (assuming JSON)
      if (typeof data !== 'object' || !data) {
        connection.sendJSON({
          type: 'error',
          message: 'Invalid message format',
        });
        return;
      }

      const msg = data as {
        type: string;
        content?: string;
        targetUserId?: string;
      };

      // Handle different message types
      switch (msg.type) {
        case 'chat':
          // Broadcast to room
          const roomId = connection.metadata.sessionId || 'general';
          const userId = connection.metadata.userId || 'anonymous';

          wsctx.broadcast(
            {
              type: 'chat',
              content: msg.content,
              userId,
              timestamp: Date.now(),
            },
            (conn) => conn.metadata.sessionId === roomId
          );
          break;

        case 'private':
          // Send to specific user
          const targetUserId = msg.targetUserId;
          if (targetUserId) {
            // Find target connection
            for (const [connId, uid] of userConnections.entries()) {
              if (uid === targetUserId) {
                wsctx.sendJSONTo(connId, {
                  type: 'private',
                  content: msg.content,
                  from: connection.metadata.userId,
                  timestamp: Date.now(),
                });
                break;
              }
            }
          }
          break;

        case 'typing':
          // Broadcast typing indicator to room
          const typingRoomId = connection.metadata.sessionId || 'general';
          wsctx.broadcast(
            {
              type: 'typing',
              userId: connection.metadata.userId,
              timestamp: Date.now(),
            },
            (conn) =>
              conn.metadata.sessionId === typingRoomId && conn.id !== connection.id
          );
          break;

        default:
          connection.sendJSON({
            type: 'error',
            message: `Unknown message type: ${msg.type}`,
          });
      }
    },

    // Handle disconnection
    onDisconnect: async (connection, code, reason, gctx, lctx, wsctx) => {
      console.log(`[WS] Connection closed: ${connection.id} (${code}: ${reason})`);

      const userId = connection.metadata.userId;
      const roomId = connection.metadata.sessionId;

      // Remove from room
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)!.delete(connection.id);
        if (rooms.get(roomId)!.size === 0) {
          rooms.delete(roomId);
        }
      }

      // Remove user mapping
      userConnections.delete(connection.id);

      // Notify room
      if (roomId) {
        wsctx.broadcast(
          {
            type: 'user_left',
            userId,
            timestamp: Date.now(),
          },
          (conn) => conn.metadata.sessionId === roomId
        );
      }

      console.log(`[WS] User ${userId} left room ${roomId}`);
    },

    // Handle errors
    onError: async (error, connection, gctx, lctx, wsctx) => {
      console.error(`[WS] Error on connection ${connection.id}:`, error);

      connection.sendJSON({
        type: 'error',
        message: 'An error occurred',
        timestamp: Date.now(),
      });
    },

    // Configuration
    options: {
      maxMessageSize: 10 * 1024, // 10KB
      heartbeatInterval: 30000, // 30 seconds
      compress: true,
    },
  };

  return createWebSocketHandler(config, gctx);
}
