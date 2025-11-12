/**
 * @module examples/hello-world/handlers/hello
 * @description Simple hello world handler demonstrating basic Gati usage
 */

import type { Handler } from '@gati-framework/runtime';

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
export const helloHandler: Handler = (_req, res, _gctx, lctx) => {
  // Access request timestamp from local context
  const timestamp = lctx.timestamp;

  // Send JSON response
  res.json({
    message: 'Hello, World!',
    timestamp,
    requestId: lctx.requestId,
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
export const helloNameHandler: Handler = (req, res, _gctx, lctx) => {
  // Extract path parameter
  const name = req.params['name'] as string;

  // Send personalized greeting
  res.json({
    message: `Hello, ${name}!`,
    timestamp: lctx.timestamp,
    requestId: lctx.requestId,
  });
};
