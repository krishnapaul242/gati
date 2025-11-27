import type { IDeploymentTarget, WatchEvent } from '@gati-framework/contracts';
import type { GatiHandler, GatiModule } from './types/crds.js';
import { ManifestGenerator } from './manifest-generator.js';
import pino from 'pino';

export class OperatorController {
  private target: IDeploymentTarget;
  private generator: ManifestGenerator;
  private logger: pino.Logger;
  private running = false;

  constructor(target: IDeploymentTarget) {
    this.target = target;
    this.generator = new ManifestGenerator();
    this.logger = pino({ name: 'operator-controller' });
  }

  async start(): Promise<void> {
    this.running = true;
    this.logger.info('Operator controller starting');

    await Promise.all([
      this.watchHandlers(),
      this.watchModules(),
    ]);
  }

  async stop(): Promise<void> {
    this.running = false;
    this.logger.info('Operator controller stopping');
  }

  private async watchHandlers(): Promise<void> {
    await this.target.watch('GatiHandler', 'default', async (event: WatchEvent) => {
      if (!this.running) return;

      const handler = event.resource as unknown as GatiHandler;
      this.logger.info({ type: event.type, name: handler.metadata.name }, 'Handler event');

      try {
        await this.reconcileHandler(event.type, handler);
      } catch (error) {
        this.logger.error({ error, handler: handler.metadata.name }, 'Failed to reconcile handler');
      }
    });
  }

  private async watchModules(): Promise<void> {
    await this.target.watch('GatiModule', 'default', async (event: WatchEvent) => {
      if (!this.running) return;

      const module = event.resource as unknown as GatiModule;
      this.logger.info({ type: event.type, name: module.metadata.name }, 'Module event');

      try {
        await this.reconcileModule(event.type, module);
      } catch (error) {
        this.logger.error({ error, module: module.metadata.name }, 'Failed to reconcile module');
      }
    });
  }

  private async reconcileHandler(type: string, handler: GatiHandler): Promise<void> {
    const { name, namespace } = handler.metadata;

    if (type === 'DELETED') {
      await this.target.delete('Deployment', namespace, `handler-${name}`);
      await this.target.delete('Service', namespace, `handler-${name}`);
      return;
    }

    const deploymentSpec = this.generator.generateDeployment(handler.spec);
    const serviceSpec = this.generator.generateService(handler.spec);

    await this.target.apply({
      kind: 'Deployment',
      metadata: { name: `handler-${name}`, namespace, labels: { app: 'gati-handler' } },
      spec: deploymentSpec,
    });

    await this.target.apply({
      kind: 'Service',
      metadata: { name: `handler-${name}`, namespace, labels: { app: 'gati-handler' } },
      spec: serviceSpec,
    });
  }

  private async reconcileModule(type: string, module: GatiModule): Promise<void> {
    const { name, namespace } = module.metadata;

    if (type === 'DELETED') {
      await this.target.delete('Deployment', namespace, `module-${name}`);
      await this.target.delete('Service', namespace, `module-${name}`);
      return;
    }

    const deploymentSpec = this.generator.generateDeployment(module.spec);
    const serviceSpec = this.generator.generateService(module.spec);

    await this.target.apply({
      kind: 'Deployment',
      metadata: { name: `module-${name}`, namespace, labels: { app: 'gati-module' } },
      spec: deploymentSpec,
    });

    await this.target.apply({
      kind: 'Service',
      metadata: { name: `module-${name}`, namespace, labels: { app: 'gati-module' } },
      spec: serviceSpec,
    });
  }
}
