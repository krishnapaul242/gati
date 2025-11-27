export interface RouteDefinition {
  path: string;
  handler: string;
  method?: string;
}

export interface HookConfig {
  before?: Array<(req: any, res: any) => void | Promise<void>>;
  after?: Array<(req: any, res: any) => void | Promise<void>>;
  catch?: Array<(error: Error) => void | Promise<void>>;
  finally?: Array<() => void | Promise<void>>;
}

export interface SimulationConfig {
  handlers: Record<string, any>;
  modules?: Record<string, any>;
  hooks?: HookConfig;
  routes: RouteDefinition[];
  hookTimeout?: number;
  moduleLatency?: number;
}

export interface SimulatedResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

export interface RuntimeMetrics {
  requests: {
    total: number;
    byRoute: Record<string, number>;
  };
  hooks: {
    executions: number;
    timeouts: number;
    errors: number;
  };
  modules: {
    calls: number;
    errors: number;
    totalLatency: number;
  };
}

export interface SimulatedRuntime {
  request(method: string, path: string, body?: any): Promise<SimulatedResponse>;
  getMetrics(): RuntimeMetrics;
  shutdown(): Promise<void>;
}
