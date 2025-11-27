/**
 * @module contracts/deployment
 * @description Manifest generator contract for creating Kubernetes resources
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

export interface DeploymentSpec {
  replicas: number;
  selector: {
    matchLabels: Record<string, string>;
  };
  template: {
    metadata: {
      labels: Record<string, string>;
    };
    spec: {
      containers: Array<{
        name: string;
        image: string;
        ports?: Array<{ containerPort: number; protocol?: string }>;
        env?: Array<{ name: string; value: string }>;
        resources?: ResourceRequirements;
        livenessProbe?: ProbeSpec;
        readinessProbe?: ProbeSpec;
      }>;
    };
  };
}

export interface ServiceSpec {
  type: 'ClusterIP' | 'LoadBalancer' | 'NodePort';
  selector: Record<string, string>;
  ports: Array<{
    port: number;
    targetPort: number;
    protocol?: string;
    name?: string;
  }>;
}

export interface ConfigMapSpec {
  data: Record<string, string>;
}

export interface ProbeSpec {
  httpGet?: {
    path: string;
    port: number;
  };
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  failureThreshold?: number;
}

export interface HandlerSpec {
  handlerPath: string;
  version: string;
  replicas: number;
  image: string;
  port: number;
  resources?: ResourceRequirements;
  env?: Record<string, string>;
}

export interface ModuleSpec {
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

export interface IManifestGenerator {
  generateDeployment(spec: HandlerSpec | ModuleSpec): DeploymentSpec;
  generateService(spec: HandlerSpec | ModuleSpec): ServiceSpec;
  generateConfigMap(spec: HandlerSpec | ModuleSpec): ConfigMapSpec;
}
