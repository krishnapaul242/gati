import type { IDeploymentTarget, IManifestGenerator } from '@gati-framework/contracts';
import type { GatiHandler } from '../types/crds.js';
import pino from 'pino';

export class HandlerDeployer {
  private target: IDeploymentTarget;
  private generator: IManifestGenerator;
  private logger: pino.Logger;

  constructor(target: IDeploymentTarget, generator: IManifestGenerator) {
    this.target = target;
    this.generator = generator;
    this.logger = pino({ name: 'handler-deployer' });
  }

  async reconcile(handler: GatiHandler): Promise<void> {
    const { name, namespace } = handler.metadata;
    const labels = this.getLabels(handler);

    const deploymentSpec = this.generator.generateDeployment(handler.spec);
    const serviceSpec = this.generator.generateService(handler.spec);

    await this.target.apply({
      kind: 'Deployment',
      metadata: {
        name: `handler-${name}`,
        namespace,
        labels,
        annotations: { 'gati.dev/version': handler.spec.version },
      },
      spec: deploymentSpec,
    });

    await this.target.apply({
      kind: 'Service',
      metadata: {
        name: `handler-${name}`,
        namespace,
        labels,
      },
      spec: serviceSpec,
    });

    this.logger.info({ handler: name, namespace }, 'Handler reconciled');
  }

  async delete(handler: GatiHandler): Promise<void> {
    const { name, namespace } = handler.metadata;

    await this.target.delete('Deployment', namespace, `handler-${name}`);
    await this.target.delete('Service', namespace, `handler-${name}`);

    this.logger.info({ handler: name, namespace }, 'Handler deleted');
  }

  private getLabels(handler: GatiHandler): Record<string, string> {
    return {
      'app.kubernetes.io/name': 'gati-handler',
      'app.kubernetes.io/instance': handler.metadata.name,
      'app.kubernetes.io/version': handler.spec.version,
      'app.kubernetes.io/managed-by': 'gati-operator',
    };
  }
}
