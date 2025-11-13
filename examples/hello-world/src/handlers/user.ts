/**
 * @module examples/hello-world/handlers/user
 * @description User handler demonstrating path parameters and module usage
 */

import type { Handler } from '@gati-framework/runtime';
import { HandlerError } from '@gati-framework/runtime';

export const METHOD = 'GET';
export const ROUTE = '/user';

// Mock user data for demonstration
const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com' },
];

export const getUserHandler: Handler = (req, res, gctx, _lctx) => {
  // Extract path parameter
  const userId = req.params['id'] as string;

  // Log request using logger module (if available)
  const logger = gctx.modules['logger'] as any;
  if (logger?.log) {
    logger.log(`Fetching user with ID: ${userId}`);
  }

  // Find user by ID
  const user = users.find((u) => u.id === userId);

  if (!user) {
    // Return 404 error
    throw new HandlerError('User not found', 404, { userId });
  }

  // Return user data
  res.json({ user });
};

export const listUsersHandler: Handler = (req, res, _gctx, _lctx) => {
  // Extract query parameter for filtering
  const nameFilter = req.query['name'] as string | undefined;

  let filteredUsers = users;

  if (nameFilter) {
    // Filter by name (case-insensitive)
    filteredUsers = users.filter((u) =>
      u.name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }

  // Return filtered users
  res.json({
    users: filteredUsers,
    count: filteredUsers.length,
  });
};
