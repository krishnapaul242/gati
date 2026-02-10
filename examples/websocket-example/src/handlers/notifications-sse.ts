/**
 * Server-Sent Events (SSE) Real-Time Notifications Example
 * 
 * This example demonstrates:
 * - SSE connection lifecycle
 * - Real-time event streaming to clients
 * - User-specific event filtering
 * - Keep-alive and connection management
 */

import {
  createSSEHandler,
  type SSEHandlerConfig,
  type SSEEvent,
} from '@gati-framework/runtime';
import type { GlobalContext } from '@gati-framework/runtime';

// User subscriptions (in production, use Redis or similar)
const userSubscriptions = new Map<string, Set<string>>(); // userId -> Set<connectionId>
const connectionUsers = new Map<string, string>(); // connectionId -> userId

export function createNotificationSSEHandler(gctx: GlobalContext) {
  const config: SSEHandlerConfig = {
    // Handle new SSE connection
    onConnect: async (connection, request, gctx, lctx, ssectx) => {
      console.log(`[SSE] New connection: ${connection.id}`);

      // Extract user from query params
      const url = new URL(request.url || '', 'http://localhost');
      const userId = url.searchParams.get('userId') || 'anonymous';

      // Store user metadata
      connection.metadata.userId = userId;
      connectionUsers.set(connection.id, userId);

      // Add to user subscriptions
      if (!userSubscriptions.has(userId)) {
        userSubscriptions.set(userId, new Set());
      }
      userSubscriptions.get(userId)!.add(connection.id);

      console.log(`[SSE] User ${userId} subscribed (${userSubscriptions.get(userId)!.size} connections)`);

      // Send initial connection event
      connection.send({
        event: 'connected',
        data: {
          message: 'Connected to notification stream',
          userId,
          timestamp: Date.now(),
        },
        id: `conn-${connection.id}`,
      });

      // Send any pending notifications
      // (In production, retrieve from database/cache)
      setTimeout(() => {
        connection.send({
          event: 'notification',
          data: {
            title: 'Welcome!',
            message: 'You are now subscribed to notifications',
            type: 'info',
          },
          id: `notif-${Date.now()}`,
        });
      }, 1000);
    },

    // Handle disconnection
    onDisconnect: async (connection, gctx, lctx, ssectx) => {
      console.log(`[SSE] Connection closed: ${connection.id}`);

      const userId = connection.metadata.userId;

      // Remove from user subscriptions
      if (userId && userSubscriptions.has(userId)) {
        userSubscriptions.get(userId)!.delete(connection.id);
        if (userSubscriptions.get(userId)!.size === 0) {
          userSubscriptions.delete(userId);
        }
      }

      connectionUsers.delete(connection.id);

      console.log(`[SSE] User ${userId} unsubscribed`);
    },

    // Configuration
    options: {
      keepAliveInterval: 15000, // 15 seconds
      connectionTimeout: 5 * 60 * 1000, // 5 minutes
      retryInterval: 3000, // Tell client to retry after 3 seconds
    },
  };

  return createSSEHandler(config, gctx);
}

/**
 * Helper function to send notification to specific user
 */
export function sendNotificationToUser(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
  },
  ssectx: any // SSEContext from handler
): void {
  const connections = userSubscriptions.get(userId);
  if (!connections) {
    console.log(`[SSE] No connections for user ${userId}`);
    return;
  }

  const event: SSEEvent = {
    event: 'notification',
    data: {
      ...notification,
      timestamp: Date.now(),
    },
    id: `notif-${Date.now()}`,
  };

  // Send to all user's connections
  for (const connectionId of connections) {
    ssectx.sendTo(connectionId, event);
  }

  console.log(`[SSE] Sent notification to user ${userId} (${connections.size} connections)`);
}

/**
 * Helper function to broadcast notification to all users
 */
export function broadcastNotification(
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  },
  ssectx: any // SSEContext from handler
): void {
  const event: SSEEvent = {
    event: 'notification',
    data: {
      ...notification,
      timestamp: Date.now(),
    },
    id: `broadcast-${Date.now()}`,
  };

  ssectx.broadcast(event);

  console.log('[SSE] Broadcast notification to all users');
}
