/**
 * @module examples/hello-world/handlers/hello
 * @description Simple hello world handler demonstrating basic Gati usage
 */

import type { Handler } from '@gati-framework/runtime';
import { RequestPhase } from '@gati-framework/runtime';

/**
 * GET /hello
 * Returns a simple "Hello, World!" message
 *
 * @example
 * ```bash
 * curl http://localhost:3000/hello
 * # {"message":"Hello, World!","timestamp":1699564800000}
 * ```
 */
export const helloHandler: Handler = async (_req, res, _gctx, lctx) => {
  // Register request cleanup
  lctx.lifecycle.onCleanup('hello-cleanup', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`🧹 Cleaning up hello request ${lctx.requestId}`);
  });

  // Track request phases
  lctx.lifecycle.setPhase(RequestPhase.PROCESSING);
  
  // Simulate some processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  lctx.lifecycle.setPhase(RequestPhase.COMPLETED);

  // Send JSON response with distributed context info
  res.json({
    message: 'Hello, World!',
    requestId: lctx.requestId,
    traceId: lctx.traceId,
    clientId: lctx.clientId,
    refs: lctx.refs,
    client: lctx.client,
    meta: lctx.meta,
    duration: Date.now() - lctx.meta.startTime,
  });
};

/**
 * GET /hello/name/:name
 * Returns a personalized greeting
 *
 * @example
 * ```bash
 * curl http://localhost:3000/hello/name/Alice
 * # {"message":"Hello, Alice!","timestamp":1699564800000}
 * ```
 */
export const helloNameHandler: Handler = async (req, res, _gctx, lctx) => {
  // Extract path parameter
  const name = req.params['name'] as string;

  // Register phase change handler
  lctx.lifecycle.onPhaseChange((phase, previousPhase) => {
    console.log(`📋 Request ${lctx.requestId}: ${previousPhase} → ${phase}`);
  });

  // Progress through phases
  lctx.lifecycle.setPhase(RequestPhase.VALIDATED);
  lctx.lifecycle.setPhase(RequestPhase.PROCESSING);
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 200));
  
  lctx.lifecycle.setPhase(RequestPhase.COMPLETED);

  // Send personalized greeting
  res.json({
    message: `Hello, ${name}!`,
    requestId: lctx.requestId,
    traceId: lctx.traceId,
    clientId: lctx.clientId,
    refs: lctx.refs,
    client: lctx.client,
    meta: lctx.meta,
    duration: Date.now() - lctx.meta.startTime,
  });
};
