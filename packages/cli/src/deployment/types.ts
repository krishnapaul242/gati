/**
 * @module runtime/deployment/types
 * @description Type definitions for Kubernetes deployment and containerization
 */

/**
 * Supported deployment environments
 */
export type DeploymentEnvironment = 'development' | 'staging' | 'production';

/**
 * Kubernetes service types
 */
export type ServiceType = 'ClusterIP' | 'LoadBalancer' | 'NodePort';

/**
 * Resource limits and requests for containers
 */
export interface ResourceConfig {
  /** CPU limit in millicores (e.g., "500m" or "1000m") */
  cpu: string;
  /** Memory limit (e.g., "512Mi" or "1Gi") */
  memory: string;
}

/**
 * Container resources specification
 */
export interface ContainerResources {
  /** Resource limits */
  limits: ResourceConfig;
  /** Resource requests */
  requests: ResourceConfig;
}

/**
 * Environment variable configuration
 */
export interface EnvironmentVariable {
  /** Variable name */
  name: string;
  /** Variable value or reference */
  value?: string;
  /** Reference to ConfigMap or Secret */
  valueFrom?: {
    configMapKeyRef?: {
      name: string;
      key: string;
    };
    secretKeyRef?: {
      name: string;
      key: string;
    };
  };
}

/**
 * Health check probe configuration
 */
export interface ProbeConfig {
  /** HTTP path to check */
  path: string;
  /** Port to check */
  port: number;
  /** Initial delay in seconds */
  initialDelaySeconds: number;
  /** Period in seconds */
  periodSeconds: number;
  /** Timeout in seconds */
  timeoutSeconds: number;
  /** Success threshold */
  successThreshold: number;
  /** Failure threshold */
  failureThreshold: number;
}

/**
 * Dockerfile generation configuration
 */
export interface DockerfileConfig {
  /** Node.js version */
  nodeVersion: string;
  /** Application name */
  appName: string;
  /** Exposed port */
  port: number;
  /** Build command */
  buildCommand?: string;
  /** Start command */
  startCommand: string;
  /** Additional dependencies to install */
  additionalDependencies?: string[];
  /** Environment variables to set at build time */
  buildArgs?: Record<string, string>;
}

/**
 * Kubernetes deployment configuration
 */
export interface DeploymentConfig {
  /** Application name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Number of replicas */
  replicas: number;
  /** Container image */
  image: string;
  /** Image pull policy */
  imagePullPolicy: 'Always' | 'IfNotPresent' | 'Never';
  /** Container port */
  containerPort: number;
  /** Environment variables */
  env: EnvironmentVariable[];
  /** Resource requirements */
  resources: ContainerResources;
  /** Liveness probe */
  livenessProbe?: ProbeConfig;
  /** Readiness probe */
  readinessProbe?: ProbeConfig;
  /** Labels */
  labels?: Record<string, string>;
  /** Annotations */
  annotations?: Record<string, string>;
}

/**
 * Kubernetes service configuration
 */
export interface ServiceConfig {
  /** Service name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Service type */
  type: ServiceType;
  /** Port configuration */
  port: number;
  /** Target port */
  targetPort: number;
  /** Selector labels */
  selector: Record<string, string>;
  /** Additional labels */
  labels?: Record<string, string>;
  /** Annotations */
  annotations?: Record<string, string>;
}

/**
 * Horizontal Pod Autoscaler configuration
 */
export interface HPAConfig {
  /** HPA name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Target deployment name */
  targetDeployment: string;
  /** Minimum number of replicas */
  minReplicas: number;
  /** Maximum number of replicas */
  maxReplicas: number;
  /** Target CPU utilization percentage */
  targetCPUUtilizationPercentage: number;
  /** Target memory utilization percentage (optional) */
  targetMemoryUtilizationPercentage?: number;
  /** Additional labels */
  labels?: Record<string, string>;
  /** Annotations */
  annotations?: Record<string, string>;
}

/**
 * Ingress rule configuration
 */
export interface IngressRule {
  /** Hostname for the rule */
  host: string;
  /** HTTP paths */
  paths: Array<{
    path: string;
    pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
    serviceName: string;
    servicePort: number;
  }>;
}

/**
 * Ingress TLS configuration
 */
export interface IngressTLS {
  /** Hosts covered by certificate */
  hosts: string[];
  /** Secret name containing TLS certificate */
  secretName: string;
}

/**
 * Kubernetes Ingress configuration
 */
export interface IngressConfig {
  /** Ingress name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Ingress class name (e.g., 'nginx', 'alb') */
  ingressClassName: string;
  /** Ingress rules */
  rules: IngressRule[];
  /** TLS configuration */
  tls?: IngressTLS[];
  /** Additional labels */
  labels?: Record<string, string>;
  /** Annotations */
  annotations?: Record<string, string>;
}

/**
 * Helm chart configuration
 */
export interface HelmChartConfig {
  /** Chart name */
  name: string;
  /** Chart version */
  version: string;
  /** Application version */
  appVersion: string;
  /** Chart description */
  description: string;
  /** Values for the chart */
  values: HelmValues;
}

/**
 * Helm values structure
 */
export interface HelmValues {
  /** Replica count */
  replicaCount: number;
  /** Image configuration */
  image: {
    repository: string;
    tag: string;
    pullPolicy: string;
  };
  /** Service configuration */
  service: {
    type: ServiceType;
    port: number;
    targetPort: number;
  };
  /** Resource configuration */
  resources: ContainerResources;
  /** Environment variables */
  env: EnvironmentVariable[];
  /** ConfigMap data */
  configMap?: Record<string, string>;
  /** Secret data */
  secrets?: Record<string, string>;
  /** Autoscaling configuration */
  autoscaling?: {
    enabled: boolean;
    minReplicas: number;
    maxReplicas: number;
    targetCPUUtilizationPercentage: number;
  };
}

/**
 * Complete deployment manifest set
 */
export interface DeploymentManifests {
  /** Dockerfile content */
  dockerfile: string;
  /** Kubernetes deployment YAML */
  deployment: string;
  /** Kubernetes service YAML */
  service: string;
  /** Kubernetes HPA YAML (optional) */
  hpa?: string;
  /** Kubernetes Ingress YAML (optional) */
  ingress?: string;
  /** Helm chart files */
  helm: {
    chartYaml: string;
    valuesYaml: string;
    deploymentTemplate: string;
    serviceTemplate: string;
    configMapTemplate?: string;
    secretTemplate?: string;
    hpaTemplate?: string;
    ingressTemplate?: string;
  };
}
