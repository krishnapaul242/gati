import type { SimulationConfig, SimulatedRuntime, SimulatedResponse, RuntimeMetrics } from './types.js';
import { SimulatedRouteManager } from './route-manager.js';
import { SimulatedLCC } from './lcc.js';
import { SimulatedModuleRPC } from './module-rpc.js';

export function simulateRuntime(config: SimulationConfig): SimulatedRuntime {
  const routeManager = new SimulatedRouteManager(config.routes);
  const lcc = new SimulatedLCC(config.hooks, config.hookTimeout);
  const moduleRPC = new SimulatedModuleRPC(config.modules, config.moduleLatency);

  return {
    async request(method: string, path: string, body?: any): Promise<SimulatedResponse> {
      const match = routeManager.match(method, path);
      
      if (!match) {
        return { status: 404, body: { error: 'Not Found' } };
      }

      const handler = config.handlers[match.handler];
      if (!handler) {
        return { status: 500, body: { error: 'Handler not found' } };
      }

      const req = createRequest(method, path, match.params, body);
      const res = createResponse();
      const gctx = createGlobalContext(moduleRPC.getProxies());
      const lctx = createLocalContext();

      try {
        await lcc.execute(() => (handler as any)(req, res, gctx, lctx), req, res);
        return { status: res.statusCode, body: res.body, headers: res.headers };
      } catch (error) {
        return { 
          status: 500, 
          body: { error: (error as Error).message } 
        };
      }
    },

    getMetrics(): RuntimeMetrics {
      return {
        requests: routeManager.getMetrics(),
        hooks: lcc.getMetrics(),
        modules: moduleRPC.getMetrics(),
      };
    },

    async shutdown(): Promise<void> {
      await moduleRPC.cleanup();
    },
  };
}

function createRequest(method: string, path: string, params: Record<string, string>, body?: any): any {
  return {
    method,
    path,
    query: {},
    params,
    body,
  };
}

function createResponse(): any {
  let statusCode = 200;
  let responseBody: any = null;
  let headers: Record<string, string> = {};
  let sent = false;

  const res: any = {
    get statusCode() { return statusCode; },
    get body() { return responseBody; },
    get headers() { return headers; },
    
    status(code: number) {
      statusCode = code;
      return res;
    },

    header(name: string, value: string | string[] | number) {
      headers[name] = String(value);
      return res;
    },

    setHeaders(hdrs: Record<string, string | string[] | number>) {
      for (const [key, value] of Object.entries(hdrs)) {
        headers[key] = String(value);
      }
      return res;
    },

    json(data: unknown) {
      responseBody = data;
      headers['Content-Type'] = 'application/json';
      sent = true;
    },

    text(data: string) {
      responseBody = data;
      headers['Content-Type'] = 'text/plain';
      sent = true;
    },

    send(data: string | Buffer) {
      responseBody = data;
      sent = true;
    },

    end() {
      sent = true;
    },

    isSent() {
      return sent;
    },

    headersSent: false,
    raw: {} as any,
  };

  return res;
}

function createGlobalContext(modules: Record<string, any>): any {
  return {
    instance: {
      id: 'sim-instance',
      region: 'local',
      zone: 'local',
      startedAt: Date.now(),
    },
    modules,
    services: {},
    config: {},
    state: {},
    lifecycle: {} as any,
    metrics: {} as any,
    timescape: {} as any,
  };
}

function createLocalContext(): any {
  return {
    requestId: `req-${Date.now()}`,
    timestamp: Date.now(),
    traceId: `trace-${Date.now()}`,
    clientId: `client-${Date.now()}`,
    refs: {},
    client: {
      ip: '127.0.0.1',
      userAgent: 'simulate',
      region: 'local',
    },
    meta: {
      timestamp: Date.now(),
      instanceId: 'sim-instance',
      region: 'local',
      method: 'GET',
      path: '/',
      phase: 'received' as any,
      startTime: Date.now(),
    },
    state: {},
    websocket: {} as any,
    lifecycle: {} as any,
    timescape: {} as any,
    snapshot: {} as any,
  };
}
