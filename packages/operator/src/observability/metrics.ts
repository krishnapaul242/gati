export class OperatorMetrics {
  private reconciliationDurations = new Map<string, number[]>();
  private deploymentCounts = new Map<string, number>();

  recordReconciliation(resource: string, durationMs: number): void {
    const durations = this.reconciliationDurations.get(resource) || [];
    durations.push(durationMs);
    if (durations.length > 100) durations.shift();
    this.reconciliationDurations.set(resource, durations);
  }

  incrementDeployment(kind: string): void {
    const count = this.deploymentCounts.get(kind) || 0;
    this.deploymentCounts.set(kind, count + 1);
  }

  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {
      deployment_count: Object.fromEntries(this.deploymentCounts),
    };

    const reconciliationMetrics: Record<string, any> = {};
    for (const [resource, durations] of this.reconciliationDurations) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      reconciliationMetrics[resource] = { avg, max, count: durations.length };
    }
    metrics['reconciliation_duration_ms'] = reconciliationMetrics;

    return metrics;
  }
}
