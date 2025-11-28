import type { IDeploymentTarget } from '@gati-framework/contracts';
import type { GatiHandler, GatiModule } from '../types/crds.js';
import pino from 'pino';

interface HPASpec {
  scaleTargetRef: {
    apiVersion: string;
    kind: string;
    name: string;
  };
  minReplicas: number;
  maxReplicas: number;
  metrics: Array<{
    type: string;
    resource?: {
      name: string;
      target: {
        type: string;
        averageUtilization: number;
      };
    };
  }>;
}

export class ScalingController {
  private target: IDeploymentTarget;
  private logger: pino.Logger;

  constructor(target: IDeploymentTarget) {
    this.target = target;
    this.logger = pino({ name: 'scaling-controller' });
  }

  async reconcileHandlerScaling(handler: GatiHandler): Promise<void> {
    const { name, namespace } = handler.metadata;
    const minReplicas = Math.max(1, Math.floor(handler.spec.replicas / 2));
    const maxReplicas = handler.spec.replicas * 3;

    const hpaSpec = this.generateHPA(
      `handler-${name}`,
      'Deployment',
      minReplicas,
      maxReplicas
    );

    await this.target.apply({
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: `handler-${name}-hpa`,
        namespace,
        labels: { 'app.kubernetes.io/name': 'gati-handler' },
      },
      spec: hpaSpec,
    });

    this.logger.info({ handler: name, minReplicas, maxReplicas }, 'Handler HPA reconciled');
  }

  async reconcileModuleScaling(module: GatiModule): Promise<void> {
    const { name, namespace } = module.metadata;
    const minReplicas = Math.max(1, Math.floor(module.spec.replicas / 2));
    const maxReplicas = module.spec.replicas * 3;

    const hpaSpec = this.generateHPA(
      `module-${name}`,
      'Deployment',
      minReplicas,
      maxReplicas
    );

    await this.target.apply({
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: `module-${name}-hpa`,
        namespace,
        labels: { 'app.kubernetes.io/name': 'gati-module' },
      },
      spec: hpaSpec,
    });

    this.logger.info({ module: name, minReplicas, maxReplicas }, 'Module HPA reconciled');
  }

  async deleteHandlerScaling(namespace: string, name: string): Promise<void> {
    await this.target.delete('HorizontalPodAutoscaler', namespace, `handler-${name}-hpa`);
    this.logger.info({ handler: name, namespace }, 'Handler HPA deleted');
  }

  async deleteModuleScaling(namespace: string, name: string): Promise<void> {
    await this.target.delete('HorizontalPodAutoscaler', namespace, `module-${name}-hpa`);
    this.logger.info({ module: name, namespace }, 'Module HPA deleted');
  }

  private generateHPA(
    targetName: string,
    targetKind: string,
    minReplicas: number,
    maxReplicas: number
  ): HPASpec {
    return {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: targetKind,
        name: targetName,
      },
      minReplicas,
      maxReplicas,
      metrics: [
        {
          type: 'Resource',
          resource: {
            name: 'cpu',
            target: {
              type: 'Utilization',
              averageUtilization: 70,
            },
          },
        },
        {
          type: 'Resource',
          resource: {
            name: 'memory',
            target: {
              type: 'Utilization',
              averageUtilization: 80,
            },
          },
        },
      ],
    };
  }
}
