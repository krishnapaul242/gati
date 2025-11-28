import type { OperatorMetrics } from './metrics.js';

export class HealthEndpoints {
  private operatorMetrics: OperatorMetrics;
  private startTime: number;

  constructor(metrics: OperatorMetrics) {
    this.operatorMetrics = metrics;
    this.startTime = Date.now();
  }

  healthz(): { status: string; uptime: number } {
    return {
      status: 'ok',
      uptime: Date.now() - this.startTime,
    };
  }

  readyz(): { status: string; ready: boolean } {
    return {
      status: 'ok',
      ready: true,
    };
  }

  metrics(): Record<string, any> {
    return this.operatorMetrics.getMetrics();
  }
}
