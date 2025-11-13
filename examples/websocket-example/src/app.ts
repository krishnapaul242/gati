/**
 * Example app setup with WebSocket coordinator
 */

import { createApp, DefaultWebSocketCoordinator } from '@gati-framework/runtime';

// Create WebSocket coordinator
const wsCoordinator = new DefaultWebSocketCoordinator();

// Create app with WebSocket support
const app = createApp({
  services: {
    websocket: wsCoordinator
  }
});

// Example WebSocket server integration (pseudo-code)
// In real implementation, integrate with your WebSocket library
/*
websocketServer.on('message', (ws, message) => {
  const { type, requestId, data } = JSON.parse(message);
  
  // Emit event to waiting handlers
  wsCoordinator.emitEvent({
    type,
    requestId,
    data,
    timestamp: Date.now()
  });
});
*/

export { app, wsCoordinator };