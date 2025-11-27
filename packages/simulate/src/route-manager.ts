import type { RouteDefinition } from './types.js';

export interface RouteMatch {
  handler: string;
  params: Record<string, string>;
}

export class SimulatedRouteManager {
  private routes: RouteDefinition[];
  private metrics = { total: 0, byRoute: {} as Record<string, number> };

  constructor(routes: RouteDefinition[]) {
    this.routes = routes;
  }

  match(method: string, path: string): RouteMatch | null {
    for (const route of this.routes) {
      if (route.method && route.method !== method) continue;

      const params = this.extractParams(route.path, path);
      if (params) {
        this.metrics.total++;
        this.metrics.byRoute[route.path] = (this.metrics.byRoute[route.path] || 0) + 1;
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  private extractParams(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]!;
      const pathPart = pathParts[i]!;

      if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
        const paramName = patternPart.slice(1, -1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  getMetrics() {
    return { ...this.metrics };
  }
}
