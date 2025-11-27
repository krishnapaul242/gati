/**
 * @module contracts/deployment
 * @description Deployment target contract for pluggable deployment backends
 */

export interface DeploymentResource {
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: any;
  status?: any;
}

export type WatchEventType = 'ADDED' | 'MODIFIED' | 'DELETED';

export interface WatchEvent {
  type: WatchEventType;
  resource: DeploymentResource;
}

export type WatchCallback = (event: WatchEvent) => void | Promise<void>;

export interface IDeploymentTarget {
  apply(resource: DeploymentResource): Promise<void>;
  delete(kind: string, namespace: string, name: string): Promise<void>;
  get(kind: string, namespace: string, name: string): Promise<DeploymentResource | null>;
  list(kind: string, namespace: string, labels?: Record<string, string>): Promise<DeploymentResource[]>;
  watch(kind: string, namespace: string, callback: WatchCallback): Promise<void>;
}
