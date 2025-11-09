/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ClientRequest } from 'http';

let execCalls: string[] = [];
let spawnCalls: Array<{ args: string[] }>; 

// child_process mock
vi.mock('child_process', () => {
  const exec = vi.fn(
    (
      cmd: string,
      _options?: unknown,
      callback?: (err: Error | null, result?: { stdout: string; stderr: string }) => void
    ) => {
      execCalls.push(cmd);
      let stdout = '';
      const stderr = '';
      let err: Error | null = null;

      if (cmd.includes('docker --version') || cmd.includes('kubectl --version') || cmd.includes('kind --version')) {
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
    spawnCalls.push({ args: [command, ...args] });
    return {
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    } as unknown as NodeJS.Process;
  });

  return { exec, spawn };
});

// formatting mocks
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    cyan: (s: string) => s,
    gray: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
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

// manifest generator mocks
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

// http mock to simulate failing health probe
vi.mock('http', () => ({
  request: (
    _url: string,
    _opts: unknown,
    cb: (res: { statusCode?: number; resume: () => void }) => void
  ) => {
    const res = { statusCode: 503, resume: () => {} };
    setTimeout(() => cb(res), 0);
    return {
      on: (_event: string, _handler: (...args: unknown[]) => void) => {},
      end: () => {},
      destroy: () => {},
    } as unknown as ClientRequest;
  },
}));

// Import after mocks
import { executeLocalDeploy } from './local';

describe('health check failure handling', () => {
  const base = {
    appName: 'test-app',
    namespace: 'test-ns',
    env: 'development' as const,
    workingDir: '/tmp',
    port: 3000,
  };

  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env['VITEST'] = '1';
    execCalls = [];
    spawnCalls = [];
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env['VITEST'];
    logSpy.mockRestore();
  });

  it('does not throw and logs failure on non-2xx health response', async () => {
    await expect(
      executeLocalDeploy({ ...base, healthCheckPath: '/health' })
    ).resolves.toBeUndefined();

    const logged = logSpy.mock.calls.flat().join('\n');
    expect(logged).toContain('Health check failed');
  });
});
