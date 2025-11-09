/**
 * @handler GET /hello
 * @description Simple hello world handler
 */

import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res) => {
  const name = (req.query["name"] ?? 'World') as string;

  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
};
