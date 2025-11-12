/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeLocalDeploy } from './local';
import type { LocalDeployOptions } from './local';
import { exec as _exec } from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock chalk and ora to avoid terminal output in tests
vi.mock('chalk', () => ({
  default: {
    green: (msg: string) => msg,
    cyan: (msg: string) => msg,
    gray: (msg: string) => msg,
    dim: (msg: string) => msg,
    red: (msg: string) => msg,
    yellow: (msg: string) => msg,
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Mock manifest generator
vi.mock('./manifest-generator.js', () => ({
  createManifests: vi.fn(() => ({
    dockerfile: 'FROM node:20',
    deployment: 'apiVersion: apps/v1',
    service: 'apiVersion: v1',
    helmChart: 'apiVersion: v2',
    helmValues: 'replicaCount: 1',
  })),
  writeManifests: vi.fn(() =>
    Promise.resolve({
      dockerfilePath: '/test/.gati/manifests/dev/Dockerfile',
      deploymentPath: '/test/.gati/manifests/dev/deployment.yaml',
      servicePath: '/test/.gati/manifests/dev/service.yaml',
      helmChartPath: '/test/.gati/manifests/dev/helm/Chart.yaml',
      helmValuesPath: '/test/.gati/manifests/dev/helm/values.yaml',
    })
  ),
}));

describe('local deployment', () => {
  const mockExec = _exec as unknown as ReturnType<typeof vi.fn>;
  let execCallHistory: string[];

  beforeEach(() => {
    execCallHistory = [];

    // Setup exec mock to record commands and handle tool checks
    mockExec.mockImplementation(
      ((cmd: string, _options: unknown, callback?: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
        execCallHistory.push(cmd);

        // Determine response based on command
        let err: Error | null = null;
        let stdout = '';
        const stderr = '';

        if (cmd.includes('docker --version') || cmd.includes('kubectl --version') || cmd.includes('kind --version')) {
          stdout = '1.0.0';
        } else if (cmd.includes('kind get clusters')) {
          stdout = '';
        } else if (cmd.includes('kubectl get namespace')) {
          err = new Error('NotFound');
        } else {
          stdout = 'success';
        }

        // Call callback if provided, otherwise return promise
        if (callback) {
          callback(err, { stdout, stderr });
          return undefined;
        } else {
          if (err) {
            return Promise.reject(err);
          }
          return Promise.resolve({ stdout, stderr });
        }
      }) as unknown as typeof _exec
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeLocalDeploy', () => {
    const baseOptions: LocalDeployOptions = {
      appName: 'test-app',
      namespace: 'test-ns',
      env: 'development',
      workingDir: '/test',
      verbose: false,
    };

    it('should execute full deployment sequence', async () => {
      // Act
      await executeLocalDeploy(baseOptions);

      // Assert - verify command sequence
      expect(execCallHistory).toContain('kind get clusters');
      expect(execCallHistory).toContain('kind create cluster --name gati-local');
      expect(execCallHistory).toContain('docker build -t test-app:local .');
      expect(execCallHistory).toContain('kind load docker-image test-app:local --name gati-local');
      expect(execCallHistory).toContain('kubectl get namespace test-ns');
      expect(execCallHistory).toContain('kubectl create namespace test-ns');

      // Check for kubectl apply calls
      const applyCommands = execCallHistory.filter((cmd) => cmd.includes('kubectl apply'));
      expect(applyCommands.length).toBeGreaterThanOrEqual(2); // deployment + service

      // Check for rollout wait
      expect(execCallHistory).toContain(
        'kubectl rollout status deployment/test-app -n test-ns --timeout=120s'
      );
    });

    it('should skip cluster creation when skipCluster is true', async () => {
      // Arrange
      const options: LocalDeployOptions = {
        ...baseOptions,
        skipCluster: true,
      };

      // Act
      await executeLocalDeploy(options);

      // Assert
      expect(execCallHistory).not.toContain(expect.stringContaining('kind create cluster'));
    });

    it('should use custom image tag when provided', async () => {
      // Arrange
      const options: LocalDeployOptions = {
        ...baseOptions,
        imageTag: 'my-app:v1.2.3',
      };

      // Act
      await executeLocalDeploy(options);

      // Assert
      expect(execCallHistory).toContain('docker build -t my-app:v1.2.3 .');
      expect(execCallHistory).toContain('kind load docker-image my-app:v1.2.3 --name gati-local');
    });

    it('should use custom cluster name when provided', async () => {
      // Arrange
      const options: LocalDeployOptions = {
        ...baseOptions,
        clusterName: 'my-cluster',
      };

      // Act
      await executeLocalDeploy(options);

      // Assert
      expect(execCallHistory).toContain('kind create cluster --name my-cluster');
      const loadCommands = execCallHistory.filter((cmd) =>
        cmd.includes('kind load docker-image') && cmd.includes('my-cluster')
      );
      expect(loadCommands.length).toBeGreaterThan(0);
    });

    it('should handle docker build failure', async () => {
      // Arrange
      mockExec.mockImplementation(
        ((cmd: string, _options: unknown, callback: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
          execCallHistory.push(cmd);

          if (cmd.includes('docker build')) {
            callback(new Error('Docker build failed'), { stdout: '', stderr: 'Build error' });
          } else if (cmd.includes('kind get clusters')) {
            callback(null, { stdout: '', stderr: '' });
          } else if (cmd.includes('kubectl get namespace')) {
            callback(new Error('NotFound'), { stdout: '', stderr: '' });
          } else {
            callback(null, { stdout: 'success', stderr: '' });
          }
        }) as typeof _exec
      );

      // Act & Assert
      await expect(executeLocalDeploy(baseOptions)).rejects.toThrow();
    });

    it('should handle kind cluster creation failure', async () => {
      // Arrange
      mockExec.mockImplementation(
        ((cmd: string, _options: unknown, callback: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
          execCallHistory.push(cmd);

          if (cmd.includes('kind create cluster')) {
            callback(new Error('Cluster creation failed'));
          } else if (cmd.includes('kind get clusters')) {
            callback(null, { stdout: '', stderr: '' });
          } else if (cmd.includes('kubectl get namespace')) {
            callback(new Error('NotFound'), { stdout: '', stderr: '' });
          } else {
            callback(null, { stdout: 'success', stderr: '' });
          }
        }) as typeof _exec
      );

      // Act & Assert
      await expect(executeLocalDeploy(baseOptions)).rejects.toThrow();
    });

    it('should handle rollout timeout', async () => {
      // Arrange
      mockExec.mockImplementation(
        ((cmd: string, _options: unknown, callback: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
          execCallHistory.push(cmd);

          if (cmd.includes('kubectl rollout status')) {
            callback(new Error('Timeout waiting for rollout'));
          } else if (cmd.includes('kind get clusters')) {
            callback(null, { stdout: '', stderr: '' });
          } else if (cmd.includes('kubectl get namespace')) {
            callback(new Error('NotFound'), { stdout: '', stderr: '' });
          } else {
            callback(null, { stdout: 'success', stderr: '' });
          }
        }) as typeof _exec
      );

      // Act & Assert
      await expect(executeLocalDeploy(baseOptions)).rejects.toThrow();
    });

    it('should create namespace if it does not exist', async () => {
      // Act
      await executeLocalDeploy(baseOptions);

      // Assert
      expect(execCallHistory).toContain('kubectl get namespace test-ns');
      expect(execCallHistory).toContain('kubectl create namespace test-ns');
    });

    it('should not recreate existing namespace', async () => {
      // Arrange - mock namespace already exists
      mockExec.mockImplementation(
        ((cmd: string, _options: unknown, callback: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
          execCallHistory.push(cmd);

          if (cmd.includes('kubectl get namespace')) {
            callback(null, { stdout: 'test-ns Active 1d', stderr: '' });
          } else if (cmd.includes('kind get clusters')) {
            callback(null, { stdout: '', stderr: '' });
          } else {
            callback(null, { stdout: 'success', stderr: '' });
          }
        }) as typeof _exec
      );

      // Act
      await executeLocalDeploy(baseOptions);

      // Assert
      expect(execCallHistory).toContain('kubectl get namespace test-ns');
      expect(execCallHistory).not.toContain('kubectl create namespace test-ns');
    });

    it('should detect and reuse existing kind cluster', async () => {
      // Arrange - cluster already exists
      mockExec.mockImplementation(
        ((cmd: string, _options: unknown, callback: (err: Error | null, result?: { stdout: string; stderr: string }) => void) => {
          execCallHistory.push(cmd);

          if (cmd.includes('kind get clusters')) {
            callback(null, { stdout: 'gati-local\nother-cluster', stderr: '' });
          } else if (cmd.includes('kubectl get namespace')) {
            callback(new Error('NotFound'), { stdout: '', stderr: '' });
          } else {
            callback(null, { stdout: 'success', stderr: '' });
          }
        }) as typeof _exec
      );

      // Act
      await executeLocalDeploy(baseOptions);

      // Assert
      expect(execCallHistory).toContain('kind get clusters');
      expect(execCallHistory).not.toContain('kind create cluster --name gati-local');
    });

    it('should use production replicas for production env', async () => {
      // Arrange
      const options: LocalDeployOptions = {
        ...baseOptions,
        env: 'production',
      };

      // Act
      await executeLocalDeploy(options);

      // Assert - check manifest generation was called
      const { createManifests } = await import('./manifest-generator.js');
      expect(createManifests).toHaveBeenCalledWith(
        'test-app',
        'test-ns',
        'production',
        expect.objectContaining({
          replicas: 3,
        })
      );
    });

    it('should handle dry-run mode', async () => {
      // Arrange
      const options: LocalDeployOptions = {
        ...baseOptions,
        dryRun: true,
      };

      // Act
      await executeLocalDeploy(options);

      // Assert - only manifest generation, no cluster operations
      const clusterCommands = execCallHistory.filter(
        (cmd) => cmd.includes('kind create') || cmd.includes('docker build') || cmd.includes('kubectl apply')
      );
      expect(clusterCommands.length).toBe(0);
    });

    // Note: Tool verification test skipped in test environment
    // In production, missing tools (docker/kubectl/kind) will throw errors with install instructions
  });
});
