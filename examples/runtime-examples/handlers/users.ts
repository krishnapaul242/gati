/**
 * Example user handlers - CRUD operations
 */

import type { Handler } from '@gati-framework/runtime';

// Create user
export const createUser: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'] as any;
  const user = await db.createUser(req.body);
  res.status(201).json({ user });
};

// Get user
export const getUser: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'] as any;
  const user = await db.getUser(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
};

// Update user
export const updateUser: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'] as any;
  const user = await db.updateUser(req.params.id, req.body);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
};

// Delete user
export const deleteUser: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'] as any;
  const deleted = await db.deleteUser(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.status(204).send();
};

// List users
export const listUsers: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'] as any;
  const users = await db.listUsers();
  res.json({ users });
};
