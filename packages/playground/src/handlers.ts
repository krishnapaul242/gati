/**
 * @module playground/handlers
 * @description Gati handlers for Playground API endpoints
 */

import type { Handler } from '@gati-framework/runtime';
import type { PlaygroundModule } from './types.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * GET /playground/api/port
 * Get current server port
 */
export const getPortHandler: Handler = async (_req, res) => {
  try {
    // Try to read port from .gati/last-port.txt
    const portFile = resolve(process.cwd(), '.gati', 'last-port.txt');
    if (existsSync(portFile)) {
      const port = readFileSync(portFile, 'utf-8').trim();
      res.json({ port });
      return;
    }
  } catch (error) {
    console.warn('Failed to read port file:', error);
  }
  
  // Fallback to process.env.PORT or default
  const port = process.env['PORT'] || '3000';
  res.json({ port });
};

/**
 * GET /playground/api/routes
 * Get all registered routes
 */
export const getRoutesHandler: Handler = async (_req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground) {
    res.status(503).json({
      error: 'Playground module not initialized',
    });
    return;
  }

  if (!playground.config.enabled) {
    res.status(403).json({
      error: 'Playground is disabled',
    });
    return;
  }

  const routes = playground.getRoutes();
  res.json({ routes });
};

/**
 * GET /playground/api/routes/:id
 * Get specific route details
 */
export const getRouteHandler: Handler = async (req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground || !playground.config.enabled) {
    res.status(403).json({ error: 'Playground unavailable' });
    return;
  }

  const routeId = req.params?.['id'];
  if (!routeId) {
    res.status(400).json({ error: 'Route ID required' });
    return;
  }

  const route = playground.getRoute(routeId);
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  res.json({ route });
};

/**
 * GET /playground/api/instances
 * Get active instances
 */
export const getInstancesHandler: Handler = async (_req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground || !playground.config.enabled) {
    res.status(403).json({ error: 'Playground unavailable' });
    return;
  }

  const instances = playground.getInstances();
  res.json({ instances });
};

/**
 * GET /playground/api/events/:traceId
 * Get lifecycle events for a trace
 */
export const getEventsHandler: Handler = async (req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground || !playground.config.enabled) {
    res.status(403).json({ error: 'Playground unavailable' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  const events = playground.getEventStream(traceId);
  res.json({ events, traceId });
};

/**
 * POST /playground/api/debug/session
 * Create debug session
 */
export const createDebugSessionHandler: Handler = async (req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground || !playground.config.enabled) {
    res.status(403).json({ error: 'Playground unavailable' });
    return;
  }

  const body = req.body as { traceId?: string } | undefined;
  const traceId = body?.traceId;

  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  const session = playground.createDebugSession(traceId);
  res.json({ session });
};

/**
 * POST /playground/api/debug/breakpoint
 * Set breakpoint
 */
export const setBreakpointHandler: Handler = async (req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground || !playground.config.enabled) {
    res.status(403).json({ error: 'Playground unavailable' });
    return;
  }

  const body = req.body as any;
  const { id, nodeId, nodeType, enabled, condition } = body;

  if (!id || !nodeId || !nodeType) {
    res.status(400).json({ error: 'Invalid breakpoint configuration' });
    return;
  }

  playground.setBreakpoint({
    id,
    nodeId,
    nodeType,
    enabled: enabled !== false,
    condition,
  });

  res.json({ success: true });
};

/**
 * DELETE /playground/api/debug/breakpoint/:id
 * Remove breakpoint
 */
export const removeBreakpointHandler: Handler = async (req, res, gctx) => {
  const playground = (gctx.modules as any)?.['playground'] as PlaygroundModule | undefined;

  if (!playground || !playground.config.enabled) {
    res.status(403).json({ error: 'Playground unavailable' });
    return;
  }

  const breakpointId = req.params?.['id'];
  if (!breakpointId) {
    res.status(400).json({ error: 'Breakpoint ID required' });
    return;
  }

  playground.removeBreakpoint(breakpointId);
  res.json({ success: true });
};

/**
 * Metadata for handlers (for auto-registration)
 */
export const metadata = {
  getPort: { method: 'GET', route: '/playground/api/port' },
  getRoutes: { method: 'GET', route: '/playground/api/routes' },
  getRoute: { method: 'GET', route: '/playground/api/routes/:id' },
  getInstances: { method: 'GET', route: '/playground/api/instances' },
  getEvents: { method: 'GET', route: '/playground/api/events/:traceId' },
  createDebugSession: { method: 'POST', route: '/playground/api/debug/session' },
  setBreakpoint: { method: 'POST', route: '/playground/api/debug/breakpoint' },
  removeBreakpoint: { method: 'DELETE', route: '/playground/api/debug/breakpoint/:id' },
};
