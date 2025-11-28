import type { IDeploymentTarget, WatchEvent } from '@gati-framework/contracts';
import type { GatiHandler, GatiModule } from './types/crds.js';
import { ManifestGenerator } from './manifest-generator.js';
import pino from 'pino';
import { randomUUID } from 'crypto';

export class OperatorController {
  private target: IDeploymentTarget;
  private generator: ManifestGenerator;
  private logger: pino.Logger;
  private running = false;
  private reconcileQueue = new Map<string, Promise<void>>();

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
    
    // Wait for in-flight reconciliations
    const pending = Array.from(this.reconcileQueue.values());
    if (pending.length > 0) {
      this.logger.info({ count: pending.length }, 'Waiting for pending reconciliations');
      await Promise.allSettled(pending);
    }
    
    this.logger.info('Operator controller stopped');
  }

  private async watchHandlers(): Promise<void> {
    await this.target.watch('GatiHandler', 'default', async (event: WatchEvent) => {
      if (!this.running) return;

      const handler = event.resource as unknown as GatiHandler;
      const requestId = randomUUID();
      const key = `handler-${handler.metadata.namespace}-${handler.metadata.name}`;
      
      this.logger.info({ requestId, type: event.type, name: handler.metadata.name }, 'Handler event');

      const reconcile = this.reconcileWithRetry(
        () => this.reconcileHandler(event.type, handler),
        requestId,
        'handler',
        handler.metadata.name
      ).finally(() => this.reconcileQueue.delete(key));
      
      this.reconcileQueue.set(key, reconcile);
    });
  }

  private async watchModules(): Promise<void> {
    await this.target.watch('GatiModule', 'default', async (event: WatchEvent) => {
      if (!this.running) return;

      const module = event.resource as unknown as GatiModule;
      const requestId = randomUUID();
      const key = `module-${module.metadata.namespace}-${module.metadata.name}`;
      
      this.logger.info({ requestId, type: event.type, name: module.metadata.name }, 'Module event');

      const reconcile = this.reconcileWithRetry(
        () => this.reconcileModule(event.type, module),
        requestId,
        'module',
        module.metadata.name
      ).finally(() => this.reconcileQueue.delete(key));
      
      this.reconcileQueue.set(key, reconcile);
    });
  }

  private async reconcileWithRetry(
    fn: () => Promise<void>,
    requestId: string,
    resourceType: string,
    name: string
  ): Promise<void> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await fn();
        if (attempt > 0) {
          this.logger.info({ requestId, resourceType, name, attempt }, 'Reconciliation succeeded after retry');
        }
        return;
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          this.logger.warn({ requestId, resourceType, name, attempt, delay, error: error.message }, 'Reconciliation failed, retrying');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error({ requestId, resourceType, name, error: lastError }, 'Reconciliation failed after retries');
    throw lastError;
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
