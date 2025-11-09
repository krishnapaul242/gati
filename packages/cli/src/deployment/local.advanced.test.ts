/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeLocalDeploy } from './local';
import type { LocalDeployOptions } from './local';

// Track exec/spawn calls
let execCallHistory: string[] = [];
let spawnCallHistory: Array<{ args: string[] }>; 

// Mocks
vi.mock('child_process', () => {
  const exec = vi.fn(
    (
      cmd: string,
      _options?: unknown,
      callback?: (err: Error | null, result?: { stdout: string; stderr: string }) => void
    ) => {
      execCallHistory.push(cmd);
      let stdout = '';
      let stderr = '';
      let err: Error | null = null;

      if (cmd.includes('git rev-parse')) {
        stdout = 'abc123';
      } else if (cmd.includes('docker --version') || cmd.includes('kubectl --version') || cmd.includes('kind --version')) {
        stdout = '1.0.0';
      } else if (cmd.includes('kind get clusters')) {
        stdout = '';
      } else if (cmd.includes('kubectl get namespace')) {
        err = new Error('NotFound');
      } else {
        stdout = 'ok';
      }

      if (callback) return callback(err, { stdout, stderr });
      if (err) return Promise.reject(err);
      return Promise.resolve({ stdout, stderr });
    }
  );

  const spawn = vi.fn((command: string, args: string[]) => {
    spawnCallHistory.push({ args: [command, ...args] });
    // Minimal child process mock
    return {
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    } as unknown as NodeJS.Process;
  });

  return { exec, spawn };
});

// Mock chalk and ora to keep output clean
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    cyan: (s: string) => s,
    gray: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    bold: { cyan: (s: string) => s },
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
      dockerfilePath: '/tmp/.gati/manifests/dev/Dockerfile',
      deploymentPath: '/tmp/.gati/manifests/dev/deployment.yaml',
      servicePath: '/tmp/.gati/manifests/dev/service.yaml',
      helmChartPath: '/tmp/.gati/manifests/dev/helm/Chart.yaml',
      helmValuesPath: '/tmp/.gati/manifests/dev/helm/values.yaml',
    })
  ),
}));

// Mock http for health checks
let requestedUrl: string | null = null;
vi.mock('http', () => ({
  request: (url: string, _opts: any, cb: (res: any) => void) => {
    requestedUrl = url;
    const res = { statusCode: 200, resume: () => {} };
    setTimeout(() => cb(res), 0);
    return {
      on: (_event: string, _handler: (...args: any[]) => void) => {},
      end: () => {},
      destroy: () => {},
    };
  },
}));

describe('local deployment - advanced behaviors', () => {
  const baseOptions: LocalDeployOptions = {
    appName: 'test-app',
    namespace: 'test-ns',
    env: 'development',
    workingDir: '/tmp',
    verbose: false,
  };

  beforeEach(() => {
    execCallHistory = [];
    spawnCallHistory = [];
    requestedUrl = null;
  process.env['VITEST'] = '1'; // ensure non-blocking port-forward branch
    vi.clearAllMocks();
  });

  afterEach(() => {
  delete process.env['VITEST'];
    vi.clearAllMocks();
  });

  it('uses custom rollout timeout when provided', async () => {
    await executeLocalDeploy({ ...baseOptions, timeoutSeconds: 300 });
    const rollout = execCallHistory.find((c) => c.includes('kubectl rollout status')) || '';
    expect(rollout).toContain('--timeout=300s');
  });

  it('applies auto-tag strategy with git SHA + timestamp', async () => {
    await executeLocalDeploy({ ...baseOptions, autoTag: true });
    const buildCmd = execCallHistory.find((c) => c.startsWith('docker build -t test-app:'));
    expect(buildCmd).toBeTruthy();
    // should include short sha suffix
    expect(buildCmd as string).toMatch(/-abc123\b/);
    // should also load same image into kind
    const loadCmd = execCallHistory.find((c) => c.startsWith('kind load docker-image test-app:'));
    expect(loadCmd).toBeTruthy();
  });

  it('performs health check via temporary port-forward', async () => {
    await executeLocalDeploy({ ...baseOptions, healthCheckPath: '/health', port: 3000 });
    // spawn was called for port-forward
    expect(spawnCallHistory.length).toBeGreaterThan(0);
    // http GET was made to expected url
    expect(requestedUrl).toBe('http://127.0.0.1:3000/health');
  });

  it('starts and stops persistent port-forward without blocking under test', async () => {
    await executeLocalDeploy({ ...baseOptions, portForward: true, port: 3000 });
    // port-forward spawned
    expect(spawnCallHistory.length).toBeGreaterThan(0);
    // ensure test returned (i.e., function resolved), indicating non-blocking in VITEST env
    expect(execCallHistory).toContain('kind get clusters');
  });
});
