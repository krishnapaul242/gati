/**
 * @module operator/types
 * @description TypeScript types for Gati Custom Resource Definitions
 */

export interface ResourceRequirements {
  requests?: {
    cpu?: string;
    memory?: string;
  };
  limits?: {
    cpu?: string;
    memory?: string;
  };
}

export interface GatiHandlerSpec {
  handlerPath: string;
  version: string;
  replicas: number;
  image: string;
  port: number;
  resources?: ResourceRequirements;
  env?: Record<string, string>;
  timescape?: {
    breaking?: boolean;
    routingWeight?: number;
  };
}

export interface GatiHandlerStatus {
  phase: 'Pending' | 'Running' | 'Failed' | 'Decommissioned';
  replicas?: number;
  readyReplicas?: number;
  lastUpdated?: string;
  conditions?: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
  }>;
}

export interface GatiHandler {
  apiVersion: 'gati.dev/v1alpha1';
  kind: 'GatiHandler';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    finalizers?: string[];
  };
  spec: GatiHandlerSpec;
  status?: GatiHandlerStatus;
}

export interface GatiModuleSpec {
  moduleName: string;
  moduleType: 'node' | 'wasm' | 'oci';
  runtime: string;
  replicas: number;
  image: string;
  port: number;
  resources?: ResourceRequirements;
  capabilities?: string[];
  env?: Record<string, string>;
}

export interface GatiModuleStatus {
  phase: 'Pending' | 'Running' | 'Failed';
  replicas?: number;
  readyReplicas?: number;
  lastUpdated?: string;
}

export interface GatiModule {
  apiVersion: 'gati.dev/v1alpha1';
  kind: 'GatiModule';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: GatiModuleSpec;
  status?: GatiModuleStatus;
}

export interface GatiVersionSpec {
  versionId: string;
  breaking: boolean;
  routingWeight: number;
  transformers?: string[];
  deploymentName?: string;
  serviceName?: string;
}

export interface GatiVersionStatus {
  phase: 'Active' | 'Draining' | 'Decommissioned';
  trafficCount?: number;
  lastTrafficTimestamp?: string;
  decommissionedAt?: string;
}

export interface GatiVersion {
  apiVersion: 'gati.dev/v1alpha1';
  kind: 'GatiVersion';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  spec: GatiVersionSpec;
  status?: GatiVersionStatus;
}
