/**
 * @module playground/api/trace-endpoints
 * @description API endpoints for trace inspection and replay
 */

import type { Handler } from '@gati-framework/runtime';
import type { TraceStorage, RequestReplayer, DebugGateManager } from '@gati-framework/runtime';
import type { TraceFilter, ReplayOptions, StageName } from '@gati-framework/runtime';

/**
 * Trace module interface (injected via global context)
 */
export interface TraceModule {
  storage: TraceStorage;
  replayer: RequestReplayer;
  gateManager: DebugGateManager;
}

/**
 * GET /playground/api/traces
 * List traces with optional filtering
 */
export const listTracesHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const filter: TraceFilter = {
    status: req.query?.['status'] as any,
    path: req.query?.['path'] as string,
    startTime: req.query?.['startTime'] ? Number(req.query['startTime']) : undefined,
    endTime: req.query?.['endTime'] ? Number(req.query['endTime']) : undefined,
    limit: req.query?.['limit'] ? Number(req.query['limit']) : 100,
  };

  try {
    const traces = await traceModule.storage.listTraces(filter);
    res.json({ traces, count: traces.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /playground/api/traces/:traceId
 * Get trace details
 */
export const getTraceHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  try {
    const trace = await traceModule.storage.getTrace(traceId);
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' });
      return;
    }
    res.json({ trace });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /playground/api/traces/:traceId/snapshots
 * Get all snapshots for a trace
 */
export const getSnapshotsHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  try {
    const trace = await traceModule.storage.getTrace(traceId);
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' });
      return;
    }
    res.json({ snapshots: trace.snapshots, stages: trace.stages });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /playground/api/traces/:traceId/snapshots/:stage
 * Get snapshot for specific stage
 */
export const getStageSnapshotHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  const stage = req.params?.['stage'] as StageName;

  if (!traceId || !stage) {
    res.status(400).json({ error: 'Trace ID and stage required' });
    return;
  }

  try {
    const trace = await traceModule.storage.getTrace(traceId);
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' });
      return;
    }

    const stageData = findStage(trace.stages, stage);
    if (!stageData) {
      res.status(404).json({ error: 'Stage not found' });
      return;
    }

    const snapshot = trace.snapshots[stageData.snapshotId];
    res.json({ stage: stageData, snapshot });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /playground/api/traces/:traceId/replay
 * Replay a request
 */
export const replayTraceHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  const body = req.body as Partial<ReplayOptions> | undefined;
  const options: ReplayOptions = {
    traceId,
    fromStage: body?.fromStage,
    modifiedRequest: body?.modifiedRequest,
    compare: body?.compare ?? true,
  };

  try {
    const result = await traceModule.replayer.replay(options);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * POST /playground/api/traces/:traceId/gates
 * Create debug gate
 */
export const createGateHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  const body = req.body as { stage?: StageName; condition?: string } | undefined;
  if (!body?.stage) {
    res.status(400).json({ error: 'Stage required' });
    return;
  }

  try {
    const gate = traceModule.gateManager.createGate(traceId, body.stage, body.condition);
    res.json({ gate });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * GET /playground/api/traces/:traceId/gates
 * List gates for trace
 */
export const listGatesHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  try {
    const gates = traceModule.gateManager.listGates(traceId);
    res.json({ gates, count: gates.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * DELETE /playground/api/traces/:traceId/gates/:gateId
 * Remove debug gate
 */
export const removeGateHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const gateId = req.params?.['gateId'];
  if (!gateId) {
    res.status(400).json({ error: 'Gate ID required' });
    return;
  }

  try {
    const removed = traceModule.gateManager.removeGate(gateId);
    if (!removed) {
      res.status(404).json({ error: 'Gate not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * PUT /playground/api/traces/:traceId/gates/:gateId/release
 * Release debug gate
 */
export const releaseGateHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const gateId = req.params?.['gateId'];
  if (!gateId) {
    res.status(400).json({ error: 'Gate ID required' });
    return;
  }

  try {
    const released = traceModule.gateManager.releaseGate(gateId);
    if (!released) {
      res.status(404).json({ error: 'Gate not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * DELETE /playground/api/traces/:traceId
 * Delete trace
 */
export const deleteTraceHandler: Handler = async (req, res, gctx) => {
  const traceModule = (gctx.modules as any)?.['trace'] as TraceModule | undefined;

  if (!traceModule) {
    res.status(503).json({ error: 'Trace module not initialized' });
    return;
  }

  const traceId = req.params?.['traceId'];
  if (!traceId) {
    res.status(400).json({ error: 'Trace ID required' });
    return;
  }

  try {
    const deleted = await traceModule.storage.deleteTrace(traceId);
    if (!deleted) {
      res.status(404).json({ error: 'Trace not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/**
 * Helper: Find stage by name
 */
function findStage(stages: any[], name: StageName): any | null {
  for (const stage of stages) {
    if (stage.name === name) return stage;
    if (stage.children) {
      const found = findStage(stage.children, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Metadata for handlers (for auto-registration)
 */
export const metadata = {
  listTraces: { method: 'GET', route: '/playground/api/traces' },
  getTrace: { method: 'GET', route: '/playground/api/traces/:traceId' },
  getSnapshots: { method: 'GET', route: '/playground/api/traces/:traceId/snapshots' },
  getStageSnapshot: { method: 'GET', route: '/playground/api/traces/:traceId/snapshots/:stage' },
  replayTrace: { method: 'POST', route: '/playground/api/traces/:traceId/replay' },
  createGate: { method: 'POST', route: '/playground/api/traces/:traceId/gates' },
  listGates: { method: 'GET', route: '/playground/api/traces/:traceId/gates' },
  removeGate: { method: 'DELETE', route: '/playground/api/traces/:traceId/gates/:gateId' },
  releaseGate: { method: 'PUT', route: '/playground/api/traces/:traceId/gates/:gateId/release' },
  deleteTrace: { method: 'DELETE', route: '/playground/api/traces/:traceId' },
};
