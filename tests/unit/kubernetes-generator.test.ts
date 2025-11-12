import { describe, it, expect } from 'vitest';
import {
  generateDockerfile,
  generateDeployment,
  generateService,
  generateHelmChart,
  generateCompleteManifests,
  validateManifest,
  getDefaultResources,
  getDefaultEnvironment,
} from '../../packages/cli/src/deployment/kubernetes';

describe('Kubernetes Deployment Generators', () => {
  it('generates a Dockerfile with defaults', () => {
    const dockerfile = generateDockerfile({
      nodeVersion: '20',
      appName: 'test-app',
      port: 3000,
      startCommand: 'pnpm start'
    });
    expect(dockerfile).toContain('FROM node:20-alpine');
    expect(dockerfile).toContain('EXPOSE 3000');
  });

  it('generates a deployment manifest', () => {
    const deployment = generateDeployment({
      name: 'test-app',
      namespace: 'default',
      replicas: 2,
      image: 'test-app:latest',
      imagePullPolicy: 'IfNotPresent',
      containerPort: 3000,
      env: [],
      resources: {
        limits: { cpu: '500m', memory: '512Mi' },
        requests: { cpu: '250m', memory: '256Mi' }
      }
    });
    expect(deployment).toContain('kind: Deployment');
    expect(deployment).toContain('name: test-app');
    expect(deployment).toContain('replicas: 2');
    expect(deployment).toContain('containerPort: 3000');
    expect(validateManifest(deployment)).toBe(true);
  });

  it('generates a service manifest', () => {
    const service = generateService({
      name: 'test-app',
      namespace: 'default',
      type: 'ClusterIP',
      port: 80,
      targetPort: 3000,
      selector: { app: 'test-app' }
    });
    expect(service).toContain('kind: Service');
    expect(service).toContain('port: 80');
    expect(service).toContain('targetPort: 3000');
    expect(validateManifest(service)).toBe(true);
  });

  it('generates Helm chart files', () => {
    const helm = generateHelmChart({
      name: 'test-app',
      version: '0.1.0',
      appVersion: '0.1.0',
      description: 'Test App',
      values: {
        replicaCount: 1,
        image: { repository: 'test-app', tag: 'latest', pullPolicy: 'IfNotPresent' },
        service: { type: 'ClusterIP', port: 80, targetPort: 3000 },
        resources: {
          limits: { cpu: '500m', memory: '512Mi' },
          requests: { cpu: '250m', memory: '256Mi' }
        },
        env: [],
        autoscaling: { enabled: false, minReplicas: 1, maxReplicas: 1, targetCPUUtilizationPercentage: 80 }
      }
    });
    expect(helm.chartYaml).toContain('name: test-app');
    expect(helm.valuesYaml).toContain('replicaCount: 1');
    expect(helm.deploymentTemplate).toContain('kind: Deployment');
    expect(helm.serviceTemplate).toContain('kind: Service');
  });

  it('generates complete manifests', () => {
    const manifests = generateCompleteManifests('test-app', 'default', 'development', {
      nodeVersion: '20',
      port: 3000,
      replicas: 2,
      image: 'test-app:latest'
    });
    expect(manifests.dockerfile).toContain('EXPOSE 3000');
    expect(manifests.deployment).toContain('kind: Deployment');
    expect(manifests.service).toContain('kind: Service');
    expect(manifests.helm.chartYaml).toContain('name: test-app');
  });

  it('provides default resources per environment', () => {
    const devResources = getDefaultResources('development');
    const prodResources = getDefaultResources('production');
    expect(devResources.limits.cpu).toBe('500m');
    expect(prodResources.limits.cpu).toBe('2000m');
  });

  it('provides default environment variables', () => {
    const envVars = getDefaultEnvironment('staging', 4000);
    expect(envVars.find(v => v.name === 'PORT')?.value).toBe('4000');
    expect(envVars.find(v => v.name === 'GATI_ENVIRONMENT')?.value).toBe('staging');
  });
});
