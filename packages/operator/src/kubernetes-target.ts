import { KubeConfig, AppsV1Api, CoreV1Api, Watch } from '@kubernetes/client-node';
import type { IDeploymentTarget, DeploymentResource, WatchCallback, WatchEvent } from '@gati-framework/contracts';
import pino from 'pino';

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export class KubernetesDeploymentTarget implements IDeploymentTarget {
  private kc: KubeConfig;
  private appsApi: AppsV1Api;
  private coreApi: CoreV1Api;
  private logger: pino.Logger;

  private retryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
  };

  constructor() {
    this.kc = new KubeConfig();
    this.kc.loadFromDefault();
    this.appsApi = this.kc.makeApiClient(AppsV1Api);
    this.coreApi = this.kc.makeApiClient(CoreV1Api);
    this.logger = pino({ name: 'kubernetes-target' });
  }

  private async withRetry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (error.statusCode === 404 || error.statusCode === 409 || attempt === this.retryOptions.maxRetries) {
          throw error;
        }
        const delay = Math.min(
          this.retryOptions.initialDelayMs * Math.pow(2, attempt),
          this.retryOptions.maxDelayMs
        );
        this.logger.warn({ attempt, delay, operation, error: error.message }, 'Retrying operation');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  async apply(resource: DeploymentResource): Promise<void> {
    const { kind, metadata } = resource;
    const { namespace, name } = metadata;

    await this.withRetry(async () => {
      const existing = await this.get(kind, namespace, name);

      if (existing) {
        await this.update(kind, namespace, name, resource);
        this.logger.info({ kind, namespace, name }, 'Resource updated');
      } else {
        await this.create(kind, namespace, resource);
        this.logger.info({ kind, namespace, name }, 'Resource created');
      }
    }, `apply-${kind}`);
  }

  private async create(kind: string, namespace: string, resource: DeploymentResource): Promise<void> {
    switch (kind) {
      case 'Deployment':
        await this.appsApi.createNamespacedDeployment(namespace, resource as any);
        break;
      case 'Service':
        await this.coreApi.createNamespacedService(namespace, resource as any);
        break;
      case 'ConfigMap':
        await this.coreApi.createNamespacedConfigMap(namespace, resource as any);
        break;
      default:
        throw new Error(`Unsupported resource kind: ${kind}`);
    }
  }

  private async update(kind: string, namespace: string, name: string, resource: DeploymentResource): Promise<void> {
    switch (kind) {
      case 'Deployment':
        await this.appsApi.replaceNamespacedDeployment(name, namespace, resource as any);
        break;
      case 'Service':
        await this.coreApi.replaceNamespacedService(name, namespace, resource as any);
        break;
      case 'ConfigMap':
        await this.coreApi.replaceNamespacedConfigMap(name, namespace, resource as any);
        break;
      default:
        throw new Error(`Unsupported resource kind: ${kind}`);
    }
  }

  async delete(kind: string, namespace: string, name: string): Promise<void> {
    try {
      switch (kind) {
        case 'Deployment':
          await this.appsApi.deleteNamespacedDeployment(name, namespace);
          break;
        case 'Service':
          await this.coreApi.deleteNamespacedService(name, namespace);
          break;
        case 'ConfigMap':
          await this.coreApi.deleteNamespacedConfigMap(name, namespace);
          break;
        default:
          throw new Error(`Unsupported resource kind: ${kind}`);
      }
      this.logger.info({ kind, namespace, name }, 'Resource deleted');
    } catch (error: any) {
      if (error.statusCode === 404) {
        this.logger.debug({ kind, namespace, name }, 'Resource not found');
        return;
      }
      throw error;
    }
  }

  async get(kind: string, namespace: string, name: string): Promise<DeploymentResource | null> {
    try {
      let response;
      switch (kind) {
        case 'Deployment':
          response = await this.appsApi.readNamespacedDeployment(name, namespace);
          break;
        case 'Service':
          response = await this.coreApi.readNamespacedService(name, namespace);
          break;
        case 'ConfigMap':
          response = await this.coreApi.readNamespacedConfigMap(name, namespace);
          break;
        default:
          throw new Error(`Unsupported resource kind: ${kind}`);
      }
      return response.body as any;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async list(kind: string, namespace: string, labels?: Record<string, string>): Promise<DeploymentResource[]> {
    const labelSelector = labels ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',') : undefined;

    try {
      let response;
      switch (kind) {
        case 'Deployment':
          response = await this.appsApi.listNamespacedDeployment(namespace, undefined, undefined, undefined, undefined, labelSelector);
          break;
        case 'Service':
          response = await this.coreApi.listNamespacedService(namespace, undefined, undefined, undefined, undefined, labelSelector);
          break;
        case 'ConfigMap':
          response = await this.coreApi.listNamespacedConfigMap(namespace, undefined, undefined, undefined, undefined, labelSelector);
          break;
        default:
          throw new Error(`Unsupported resource kind: ${kind}`);
      }
      return (response.body as any).items || [];
    } catch (error) {
      this.logger.error({ error, kind, namespace }, 'Failed to list resources');
      throw error;
    }
  }

  async watch(kind: string, namespace: string, callback: WatchCallback): Promise<void> {
    const watch = new Watch(this.kc);
    let path: string;

    switch (kind) {
      case 'Deployment':
        path = `/apis/apps/v1/namespaces/${namespace}/deployments`;
        break;
      case 'Service':
        path = `/api/v1/namespaces/${namespace}/services`;
        break;
      case 'ConfigMap':
        path = `/api/v1/namespaces/${namespace}/configmaps`;
        break;
      default:
        throw new Error(`Unsupported resource kind: ${kind}`);
    }

    await watch.watch(
      path,
      {},
      (type: string, obj: any) => {
        const event: WatchEvent = {
          type: type as any,
          resource: obj,
        };
        callback(event);
      },
      (err: any) => {
        if (err) {
          this.logger.error({ error: err, kind, namespace }, 'Watch error');
        }
      }
    );
  }
}
