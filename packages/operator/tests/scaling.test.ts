import { ScalingController } from '../src/scaling/scaling.controller.js';
import type { IDeploymentTarget } from '@gati-framework/contracts';
import type { GatiHandler } from '../src/types/crds.js';

class FakeDeploymentTarget implements IDeploymentTarget {
  public applied: any[] = [];

  async apply(resource: any): Promise<void> {
    this.applied.push(resource);
  }

  async delete(): Promise<void> {}
  async get(): Promise<any> { return null; }
  async list(): Promise<any[]> { return []; }
  async watch(): Promise<void> {}
}

describe('ScalingController', () => {
  it('should create HPA with correct min/max replicas', async () => {
    const target = new FakeDeploymentTarget();
    const controller = new ScalingController(target);

    const handler: GatiHandler = {
      apiVersion: 'gati.dev/v1alpha1',
      kind: 'GatiHandler',
      metadata: { name: 'test-handler', namespace: 'default' },
      spec: {
        handlerPath: '/api/test',
        version: 'v1',
        replicas: 4,
        image: 'test:v1',
        port: 3000,
      },
    };

    await controller.reconcileHandlerScaling(handler);

    expect(target.applied).toHaveLength(1);
    const hpa = target.applied[0];
    expect(hpa.kind).toBe('HorizontalPodAutoscaler');
    expect(hpa.spec.minReplicas).toBe(2); // 4 / 2
    expect(hpa.spec.maxReplicas).toBe(12); // 4 * 3
  });
});
