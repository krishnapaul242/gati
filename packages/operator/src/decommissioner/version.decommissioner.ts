import type { IDeploymentTarget } from '@gati-framework/contracts';
import type { GatiVersion } from '../types/crds.js';
import pino from 'pino';

interface TrafficRecord {
  count: number;
  timestamp: number;
}

export class VersionDecommissioner {
  private target: IDeploymentTarget;
  private logger: pino.Logger;
  private trafficHistory = new Map<string, TrafficRecord[]>();
  private readonly GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
  private readonly ZERO_TRAFFIC_THRESHOLD = 5;

  constructor(target: IDeploymentTarget, gracePeriodMs?: number) {
    this.target = target;
    this.logger = pino({ name: 'version-decommissioner' });
    if (gracePeriodMs) {
      this.GRACE_PERIOD_MS = gracePeriodMs;
    }
  }

  async recordTraffic(version: GatiVersion, count: number): Promise<void> {
    const key = `${version.metadata.namespace}/${version.metadata.name}`;
    const history = this.trafficHistory.get(key) || [];
    
    history.push({ count, timestamp: Date.now() });
    
    // Keep only last 10 records
    if (history.length > 10) {
      history.shift();
    }
    
    this.trafficHistory.set(key, history);
    
    // Update version status
    if (version.status) {
      version.status.trafficCount = count;
      if (count > 0) {
        version.status.lastTrafficTimestamp = new Date().toISOString();
      }
    }
  }

  async shouldDecommission(version: GatiVersion): Promise<boolean> {
    const key = `${version.metadata.namespace}/${version.metadata.name}`;
    const history = this.trafficHistory.get(key) || [];
    
    // Need enough data points
    if (history.length < this.ZERO_TRAFFIC_THRESHOLD) {
      return false;
    }
    
    // Check last N records are all zero
    const lastN = history.slice(-this.ZERO_TRAFFIC_THRESHOLD);
    const allZero = lastN.every(record => record.count === 0);
    
    if (!allZero) {
      return false;
    }
    
    // Check grace period elapsed
    const lastTrafficTime = version.status?.lastTrafficTimestamp 
      ? new Date(version.status.lastTrafficTimestamp).getTime()
      : 0;
    
    const gracePeriodElapsed = Date.now() - lastTrafficTime >= this.GRACE_PERIOD_MS;
    
    return gracePeriodElapsed;
  }

  async decommission(version: GatiVersion): Promise<void> {
    const { name, namespace } = version.metadata;
    const { deploymentName, serviceName } = version.spec;
    
    // Check for in-flight requests
    const hasInflight = await this.checkInflightRequests(version);
    if (hasInflight) {
      this.logger.warn({ version: name }, 'In-flight requests detected, delaying decommission');
      return;
    }
    
    // Delete deployment and service
    if (deploymentName) {
      await this.target.delete('Deployment', namespace, deploymentName);
    }
    if (serviceName) {
      await this.target.delete('Service', namespace, serviceName);
    }
    
    // Update version status
    await this.target.apply({
      kind: 'GatiVersion',
      metadata: { name, namespace },
      spec: version.spec,
      status: {
        phase: 'Decommissioned',
        decommissionedAt: new Date().toISOString(),
      },
    });
    
    // Clean up traffic history
    const key = `${namespace}/${name}`;
    this.trafficHistory.delete(key);
    
    this.logger.info({ version: name, namespace }, 'Version decommissioned');
  }

  private async checkInflightRequests(version: GatiVersion): Promise<boolean> {
    const { namespace } = version.metadata;
    const { deploymentName } = version.spec;
    
    if (!deploymentName) return false;
    
    try {
      const deployment = await this.target.get('Deployment', namespace, deploymentName);
      if (!deployment) return false;
      
      // Check if pods are terminating
      const status = (deployment as any).status;
      const terminating = status?.unavailableReplicas || 0;
      
      return terminating > 0;
    } catch {
      return false;
    }
  }
}
