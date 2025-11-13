/**
 * Test handler with playground integration
 */

import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  // Playground will automatically track this handler execution
  const isPlayground = req.headers['x-playground-request'];
  
  if (isPlayground) {
    // Add delay for visualization
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  res.json({
    message: 'Test handler executed',
    requestId: lctx.requestId,
    playground: !!isPlayground
  });
};