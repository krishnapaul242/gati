/**
 * Example handler that waits for WebSocket events before proceeding
 */

import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    // Wait for a specific WebSocket event before proceeding
    const event = await lctx.websocket.waitForEvent('user_confirmation', 30000);
    
    // Process the event data
    const { confirmed, userId } = event.data as { confirmed: boolean; userId: string };
    
    if (!confirmed) {
      return res.status(400).json({ 
        error: 'User confirmation required',
        requestId: lctx.requestId 
      });
    }
    
    // Continue with business logic after confirmation
    res.json({
      success: true,
      message: 'Request processed after confirmation',
      userId,
      requestId: lctx.requestId,
      eventTimestamp: event.timestamp
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Timeout waiting for confirmation',
        requestId: lctx.requestId
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      requestId: lctx.requestId
    });
  }
};