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
): Promise<{ dockerfilePath: string; deploymentPath: string; servicePath: string; valuesPath: string; chartPath: string; }>{
  await mkdir(outDir, { recursive: true });

  const dockerfilePath = join(outDir, 'Dockerfile');
  const deploymentPath = join(outDir, 'deployment.yaml');
  const servicePath = join(outDir, 'service.yaml');
  const chartDir = join(outDir, 'helm');
  const chartPath = join(chartDir, 'Chart.yaml');
  const valuesPath = join(chartDir, 'values.yaml');

  await mkdir(chartDir, { recursive: true });

  await writeFile(dockerfilePath, manifests.dockerfile, 'utf-8');
  await writeFile(deploymentPath, manifests.deployment, 'utf-8');
  await writeFile(servicePath, manifests.service, 'utf-8');
  await writeFile(chartPath, manifests.helm.chartYaml, 'utf-8');
  await writeFile(valuesPath, manifests.helm.valuesYaml, 'utf-8');

  return { dockerfilePath, deploymentPath, servicePath, valuesPath, chartPath };
}
