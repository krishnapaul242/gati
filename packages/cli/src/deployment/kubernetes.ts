/**
 * @module runtime/deployment/kubernetes
 * @description Kubernetes deployment manifest generator for Gati applications
 */

import * as ejs from 'ejs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  DockerfileConfig,
  DeploymentConfig,
  ServiceConfig,
  HPAConfig,
  IngressConfig,
  HelmChartConfig,
  DeploymentManifests,
  DeploymentEnvironment,
  ContainerResources,
  EnvironmentVariable,
} from './types';

// Template paths (ESM compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, 'templates');
const DOCKERFILE_TEMPLATE = join(TEMPLATES_DIR, 'Dockerfile.ejs');
const DEPLOYMENT_TEMPLATE = join(TEMPLATES_DIR, 'deployment.yaml.ejs');
const SERVICE_TEMPLATE = join(TEMPLATES_DIR, 'service.yaml.ejs');
const HPA_TEMPLATE = join(TEMPLATES_DIR, 'hpa.yaml.ejs');
const INGRESS_TEMPLATE = join(TEMPLATES_DIR, 'ingress.yaml.ejs');
const HELM_CHART_TEMPLATE = join(TEMPLATES_DIR, 'helm', 'Chart.yaml.ejs');
const HELM_VALUES_TEMPLATE = join(TEMPLATES_DIR, 'helm', 'values.yaml.ejs');

/**
 * Generate Dockerfile for Gati application
 * 
 * @param config - Dockerfile configuration
 * @returns Generated Dockerfile content
 * 
 * @example
 * ```typescript
 * const dockerfile = generateDockerfile({
 *   nodeVersion: '20',
 *   appName: 'my-gati-app',
 *   port: 3000,
 *   startCommand: 'pnpm start'
 * });
 * ```
 */
export function generateDockerfile(config: DockerfileConfig): string {
  const template = readFileSync(DOCKERFILE_TEMPLATE, 'utf-8');
  
  const data = {
    nodeVersion: config.nodeVersion,
    appName: config.appName,
    port: config.port,
    buildCommand: config.buildCommand,
    startCommand: config.startCommand,
    additionalDependencies: config.additionalDependencies || [],
    buildArgs: config.buildArgs || {},
  };

  return ejs.render(template, data);
}

/**
 * Generate Kubernetes Deployment manifest
 * 
 * @param config - Deployment configuration
 * @returns Generated Deployment YAML
 * 
 * @example
 * ```typescript
 * const deployment = generateDeployment({
 *   name: 'my-app',
 *   namespace: 'default',
 *   replicas: 3,
 *   image: 'my-app:latest',
 *   imagePullPolicy: 'IfNotPresent',
 *   containerPort: 3000,
 *   env: [],
 *   resources: {
 *     limits: { cpu: '1000m', memory: '512Mi' },
 *     requests: { cpu: '500m', memory: '256Mi' }
 *   }
 * });
 * ```
 */
export function generateDeployment(config: DeploymentConfig): string {
  const template = readFileSync(DEPLOYMENT_TEMPLATE, 'utf-8');
  
  // Add default probes if not provided
  const data = {
    ...config,
    livenessProbe: config.livenessProbe || {
      path: '/health',
      port: config.containerPort,
      initialDelaySeconds: 30,
      periodSeconds: 10,
      timeoutSeconds: 5,
      successThreshold: 1,
      failureThreshold: 3,
    },
    readinessProbe: config.readinessProbe || {
      path: '/health',
      port: config.containerPort,
      initialDelaySeconds: 15,
      periodSeconds: 10,
      timeoutSeconds: 5,
      successThreshold: 1,
      failureThreshold: 3,
    },
  };

  return ejs.render(template, data);
}

/**
 * Generate Kubernetes Service manifest
 * 
 * @param config - Service configuration
 * @returns Generated Service YAML
 * 
 * @example
 * ```typescript
 * const service = generateService({
 *   name: 'my-app',
 *   namespace: 'default',
 *   type: 'LoadBalancer',
 *   port: 80,
 *   targetPort: 3000,
 *   selector: { app: 'my-app' }
 * });
 * ```
 */
export function generateService(config: ServiceConfig): string {
  const template = readFileSync(SERVICE_TEMPLATE, 'utf-8');
  return ejs.render(template, config);
}

/**
 * Generate Kubernetes HPA (Horizontal Pod Autoscaler) manifest
 * 
 * @param config - HPA configuration
 * @returns Generated HPA YAML
 * 
 * @example
 * ```typescript
 * const hpa = generateHPA({
 *   name: 'my-app',
 *   namespace: 'default',
 *   targetDeployment: 'my-app',
 *   minReplicas: 2,
 *   maxReplicas: 10,
 *   targetCPUUtilizationPercentage: 70,
 *   targetMemoryUtilizationPercentage: 80
 * });
 * ```
 */
export function generateHPA(config: HPAConfig): string {
  const template = readFileSync(HPA_TEMPLATE, 'utf-8');
  return ejs.render(template, config);
}

/**
 * Generate Kubernetes Ingress manifest
 * 
 * @param config - Ingress configuration
 * @returns Generated Ingress YAML
 * 
 * @example
 * ```typescript
 * const ingress = generateIngress({
 *   name: 'my-app',
 *   namespace: 'default',
 *   ingressClassName: 'nginx',
 *   rules: [{
 *     host: 'api.example.com',
 *     paths: [{
 *       path: '/',
 *       pathType: 'Prefix',
 *       serviceName: 'my-app',
 *       servicePort: 80
 *     }]
 *   }],
 *   tls: [{
 *     hosts: ['api.example.com'],
 *     secretName: 'my-app-tls'
 *   }]
 * });
 * ```
 */
export function generateIngress(config: IngressConfig): string {
  const template = readFileSync(INGRESS_TEMPLATE, 'utf-8');
  return ejs.render(template, config);
}

/**
 * Generate Helm Chart files
 * 
 * @param config - Helm chart configuration
 * @returns Object containing all Helm chart files
 * 
 * @example
 * ```typescript
 * const helmChart = generateHelmChart({
 *   name: 'my-app',
 *   version: '1.0.0',
 *   appVersion: '1.0.0',
 *   description: 'My Gati Application',
 *   values: { replicaCount: 3, ... }
 * });
 * ```
 */
export function generateHelmChart(config: HelmChartConfig): {
  chartYaml: string;
  valuesYaml: string;
  deploymentTemplate: string;
  serviceTemplate: string;
  configMapTemplate: string;
  secretTemplate: string;
  helpersTemplate: string;
  serviceAccountTemplate: string;
  hpaTemplate: string;
} {
  const chartTemplate = readFileSync(HELM_CHART_TEMPLATE, 'utf-8');
  const valuesTemplate = readFileSync(HELM_VALUES_TEMPLATE, 'utf-8');

  // Read Helm template files (these are not EJS templates, just plain YAML)
  const helmTemplatesDir = join(TEMPLATES_DIR, 'helm', 'templates');
  const deploymentTemplate = readFileSync(join(helmTemplatesDir, 'deployment.yaml'), 'utf-8');
  const serviceTemplate = readFileSync(join(helmTemplatesDir, 'service.yaml'), 'utf-8');
  const configMapTemplate = readFileSync(join(helmTemplatesDir, 'configmap.yaml'), 'utf-8');
  const secretTemplate = readFileSync(join(helmTemplatesDir, 'secret.yaml'), 'utf-8');
  const helpersTemplate = readFileSync(join(helmTemplatesDir, '_helpers.tpl'), 'utf-8');
  const serviceAccountTemplate = readFileSync(join(helmTemplatesDir, 'serviceaccount.yaml'), 'utf-8');
  const hpaTemplate = readFileSync(join(helmTemplatesDir, 'hpa.yaml'), 'utf-8');

  return {
    chartYaml: ejs.render(chartTemplate, config),
    valuesYaml: ejs.render(valuesTemplate, config.values),
    deploymentTemplate,
    serviceTemplate,
    configMapTemplate,
    secretTemplate,
    helpersTemplate,
    serviceAccountTemplate,
    hpaTemplate,
  };
}

/**
 * Validate Kubernetes manifest YAML syntax
 * 
 * @param yaml - YAML content to validate
 * @returns True if valid, throws error if invalid
 * 
 * @throws {Error} If YAML is invalid
 */
export function validateManifest(yaml: string): boolean {
  // Basic validation checks
  if (!yaml || yaml.trim().length === 0) {
    throw new Error('Manifest is empty');
  }

  // Check for required Kubernetes fields
  if (!yaml.includes('apiVersion')) {
    throw new Error('Missing apiVersion field');
  }

  if (!yaml.includes('kind')) {
    throw new Error('Missing kind field');
  }

  if (!yaml.includes('metadata')) {
    throw new Error('Missing metadata field');
  }

  // Check for valid YAML structure (basic check)
  const lines = yaml.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
      // Skip undefined lines
      if (line === undefined) {
        continue;
      }
    
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const indent = line.search(/\S/);
    
    // Check for tab characters (not allowed in YAML)
    if (line.includes('\t')) {
      throw new Error(`Invalid YAML: Tab character found on line ${i + 1}`);
    }

    // Check indent is multiple of 2
    if (indent % 2 !== 0) {
      throw new Error(`Invalid YAML: Incorrect indentation on line ${i + 1}`);
    }
  }

  return true;
}

/**
 * Get default resource configuration for environment
 * 
 * @param env - Deployment environment
 * @returns Resource configuration
 */
export function getDefaultResources(env: DeploymentEnvironment): ContainerResources {
  const configs: Record<DeploymentEnvironment, ContainerResources> = {
    development: {
      limits: {
        cpu: '500m',
        memory: '512Mi',
      },
      requests: {
        cpu: '250m',
        memory: '256Mi',
      },
    },
    staging: {
      limits: {
        cpu: '1000m',
        memory: '1Gi',
      },
      requests: {
        cpu: '500m',
        memory: '512Mi',
      },
    },
    production: {
      limits: {
        cpu: '2000m',
        memory: '2Gi',
      },
      requests: {
        cpu: '1000m',
        memory: '1Gi',
      },
    },
  };

  return configs[env];
}

/**
 * Get default environment variables for Gati app
 * 
 * @param env - Deployment environment
 * @param port - Application port
 * @returns Array of environment variables
 */
export function getDefaultEnvironment(
  env: DeploymentEnvironment,
  port: number
): EnvironmentVariable[] {
  return [
    {
      name: 'NODE_ENV',
      value: env === 'development' ? 'development' : 'production',
    },
    {
      name: 'PORT',
      value: port.toString(),
    },
    {
      name: 'GATI_ENVIRONMENT',
      value: env,
    },
  ];
}

/**
 * Generate complete deployment manifests for a Gati application
 * 
 * @param appName - Application name
 * @param namespace - Kubernetes namespace
 * @param env - Deployment environment
 * @param options - Additional configuration options
 * @returns Complete set of deployment manifests
 * 
 * @example
 * ```typescript
 * const manifests = generateCompleteManifests(
 *   'my-app',
 *   'default',
 *   'production',
 *   {
 *     nodeVersion: '20',
 *     port: 3000,
 *     replicas: 3,
 *     image: 'my-registry/my-app:v1.0.0'
 *   }
 * );
 * ```
 */
export function generateCompleteManifests(
  appName: string,
  namespace: string,
  env: DeploymentEnvironment,
  options: {
    nodeVersion?: string;
    port?: number;
    replicas?: number;
    image?: string;
    startCommand?: string;
    buildCommand?: string;
    serviceType?: 'ClusterIP' | 'LoadBalancer' | 'NodePort';
    enableAutoscaling?: boolean;
    minReplicas?: number;
    maxReplicas?: number;
    targetCPUUtilization?: number;
    targetMemoryUtilization?: number;
    enableIngress?: boolean;
    ingressHost?: string;
    ingressClassName?: string;
    enableTLS?: boolean;
    tlsSecretName?: string;
    additionalEnv?: EnvironmentVariable[];
  } = {}
): DeploymentManifests {
  const port = options.port || 3000;
  const nodeVersion = options.nodeVersion || '20';
  const replicas = options.replicas || 3;
  const image = options.image || `${appName}:latest`;
  const startCommand = options.startCommand || 'pnpm start';
  const serviceType = options.serviceType || 'LoadBalancer';

  // Generate Dockerfile
  const dockerfile = generateDockerfile({
    nodeVersion,
    appName,
    port,
    buildCommand: options.buildCommand || 'pnpm build',
    startCommand,
  });

  // Get default resources for environment
  const resources = getDefaultResources(env);
  
  // Combine default and additional environment variables
  const envVars = [
    ...getDefaultEnvironment(env, port),
    ...(options.additionalEnv || []),
  ];

  // Generate Deployment
  const deployment = generateDeployment({
    name: appName,
    namespace,
    replicas,
    image,
    imagePullPolicy: env === 'development' ? 'IfNotPresent' : 'Always',
    containerPort: port,
    env: envVars,
    resources,
  });

  // Generate Service
  const service = generateService({
    name: appName,
    namespace,
    type: serviceType,
    port: 80,
    targetPort: port,
    selector: { app: appName },
  });

  // Generate Helm Chart
  const helm = generateHelmChart({
    name: appName,
    version: '1.0.0',
    appVersion: '1.0.0',
    description: `Helm chart for ${appName}`,
    values: {
      replicaCount: replicas,
      image: {
        repository: image.split(':')[0] || image,
        tag: image.split(':')[1] || 'latest',
        pullPolicy: env === 'development' ? 'IfNotPresent' : 'Always',
      },
      service: {
        type: serviceType,
        port: 80,
        targetPort: port,
      },
      resources,
      env: envVars,
      autoscaling: options.enableAutoscaling
        ? {
            enabled: true,
            minReplicas: options.minReplicas || 2,
            maxReplicas: options.maxReplicas || 10,
            targetCPUUtilizationPercentage: options.targetCPUUtilization || 70,
          }
        : {
            enabled: false,
            minReplicas: 1,
            maxReplicas: 1,
            targetCPUUtilizationPercentage: 80,
          },
    },
  });

  // Generate HPA (if autoscaling enabled and not development)
  let hpa: string | undefined;
  if (options.enableAutoscaling && env !== 'development') {
    hpa = generateHPA({
      name: `${appName}-hpa`,
      namespace,
      targetDeployment: appName,
      minReplicas: options.minReplicas || 2,
      maxReplicas: options.maxReplicas || 10,
      targetCPUUtilizationPercentage: options.targetCPUUtilization || 70,
      targetMemoryUtilizationPercentage: options.targetMemoryUtilization,
    });
  }

  // Generate Ingress (if enabled)
  let ingress: string | undefined;
  if (options.enableIngress && options.ingressHost) {
    const ingressConfig: IngressConfig = {
      name: `${appName}-ingress`,
      namespace,
      ingressClassName: options.ingressClassName || 'nginx',
      rules: [
        {
          host: options.ingressHost,
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              serviceName: appName,
              servicePort: 80,
            },
          ],
        },
      ],
    };

    // Add TLS if enabled
    if (options.enableTLS) {
      ingressConfig.tls = [
        {
          hosts: [options.ingressHost],
          secretName: options.tlsSecretName || `${appName}-tls`,
        },
      ];
    }

    ingress = generateIngress(ingressConfig);
  }

  return {
    dockerfile,
    deployment,
    service,
    hpa,
    ingress,
    helm: {
      chartYaml: helm.chartYaml,
      valuesYaml: helm.valuesYaml,
      deploymentTemplate: helm.deploymentTemplate,
      serviceTemplate: helm.serviceTemplate,
      configMapTemplate: helm.configMapTemplate,
      secretTemplate: helm.secretTemplate,
    },
  };
}
