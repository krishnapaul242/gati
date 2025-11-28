import { VersionDecommissioner } from '../src/decommissioner/version.decommissioner.js';
import type { IDeploymentTarget } from '@gati-framework/contracts';
import type { GatiVersion } from '../src/types/crds.js';

class FakeTarget implements IDeploymentTarget {
  async apply(): Promise<void> {}
  async delete(): Promise<void> {}
  async get(): Promise<any> { return null; }
  async list(): Promise<any[]> { return []; }
  async watch(): Promise<void> {}
}

describe('VersionDecommissioner', () => {
  it('should not decommission with insufficient data', async () => {
    const target = new FakeTarget();
    const decommissioner = new VersionDecommissioner(target, 1000);

    const version: GatiVersion = {
      apiVersion: 'gati.dev/v1alpha1',
      kind: 'GatiVersion',
      metadata: { name: 'v1', namespace: 'default' },
      spec: { versionId: 'v1.0.0', breaking: false, routingWeight: 0 },
    };

    await decommissioner.recordTraffic(version, 0);
    const should = await decommissioner.shouldDecommission(version);

    expect(should).toBe(false);
  });

  it('should decommission after zero traffic threshold', async () => {
    const target = new FakeTarget();
    const decommissioner = new VersionDecommissioner(target, 100);

    const version: GatiVersion = {
      apiVersion: 'gati.dev/v1alpha1',
      kind: 'GatiVersion',
      metadata: { name: 'v1', namespace: 'default' },
      spec: { versionId: 'v1.0.0', breaking: false, routingWeight: 0 },
      status: { phase: 'Active', lastTrafficTimestamp: new Date(Date.now() - 200).toISOString() },
    };

    for (let i = 0; i < 5; i++) {
      await decommissioner.recordTraffic(version, 0);
    }

    const should = await decommissioner.shouldDecommission(version);
    expect(should).toBe(true);
  });
});
