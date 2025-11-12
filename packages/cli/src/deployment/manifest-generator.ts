/**
 * @module cli/deployment/manifest-generator
 * @description Thin wrapper around Kubernetes manifest generators that also writes files
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { DeploymentEnvironment, DeploymentManifests } from './types.js';
import { generateCompleteManifests } from './kubernetes.js';

export interface GenerateOptions {
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
}

export function createManifests(
  appName: string,
  namespace: string,
  env: DeploymentEnvironment,
  options: GenerateOptions = {}
): DeploymentManifests {
  return generateCompleteManifests(appName, namespace, env, options);
}

export async function writeManifests(
  outDir: string,
  manifests: DeploymentManifests
): Promise<{ 
  dockerfilePath: string; 
  deploymentPath: string; 
  servicePath: string; 
  hpaPath?: string;
  ingressPath?: string;
  valuesPath: string; 
  chartPath: string; 
}>{
  await mkdir(outDir, { recursive: true });

  const dockerfilePath = join(outDir, 'Dockerfile');
  const deploymentPath = join(outDir, 'deployment.yaml');
  const servicePath = join(outDir, 'service.yaml');
  const hpaPath = manifests.hpa ? join(outDir, 'hpa.yaml') : undefined;
  const ingressPath = manifests.ingress ? join(outDir, 'ingress.yaml') : undefined;
  const chartDir = join(outDir, 'helm');
  const chartPath = join(chartDir, 'Chart.yaml');
  const valuesPath = join(chartDir, 'values.yaml');

  await mkdir(chartDir, { recursive: true });

  await writeFile(dockerfilePath, manifests.dockerfile, 'utf-8');
  await writeFile(deploymentPath, manifests.deployment, 'utf-8');
  await writeFile(servicePath, manifests.service, 'utf-8');
  
  // Write HPA if present
  if (manifests.hpa && hpaPath) {
    await writeFile(hpaPath, manifests.hpa, 'utf-8');
  }
  
  // Write Ingress if present
  if (manifests.ingress && ingressPath) {
    await writeFile(ingressPath, manifests.ingress, 'utf-8');
  }
  
  await writeFile(chartPath, manifests.helm.chartYaml, 'utf-8');
  await writeFile(valuesPath, manifests.helm.valuesYaml, 'utf-8');

  return { dockerfilePath, deploymentPath, servicePath, hpaPath, ingressPath, valuesPath, chartPath };
}
