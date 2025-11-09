/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { generateProject } from '../utils/file-generator';
import { executeLocalDeploy } from '../deployment/local';
import type { LocalDeployOptions } from '../deployment/local';
import type { ClientRequest } from 'http';

// E2E: scaffold → deploy (mocked) → curl (health check) → teardown

// Capture commands and network calls
let execCalls: string[] = [];
let spawned: Array<{ args: string[] }>; 
let requestedUrl: string | null = null;

// Mock child_process for deploy flow
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
      } else if (cmd.includes('kubectl rollout status')) {
        stdout = 'deployment "app" successfully rolled out';
      } else {
        stdout = 'ok';
      }

      if (callback) return callback(err, { stdout, stderr });
      if (err) return Promise.reject(err);
      return Promise.resolve({ stdout, stderr });
    }
  );

  const spawn = vi.fn((command: string, args: string[]) => {
    spawned.push({ args: [command, ...args] });
    return {
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    } as unknown as NodeJS.Process;
  });

  return { exec, spawn };
});

// Mock chalk and ora for quiet output
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

// Mock http for curl/health probe
vi.mock('http', () => ({
  request: (
    url: string,
    _opts: unknown,
    cb: (res: { statusCode?: number; resume: () => void }) => void
  ) => {
    requestedUrl = url;
    const res = { statusCode: 200, resume: () => {} };
    setTimeout(() => cb(res), 0);
    return {
      on: (_event: string, _handler: (...args: unknown[]) => void) => {},
      end: () => {},
      destroy: () => {},
    } as unknown as ClientRequest;
  },
}));

// Mock manifest generator to avoid FS dependencies
vi.mock('../deployment/manifest-generator.js', () => ({
  createManifests: vi.fn(() => ({
    dockerfile: 'FROM node:20',
    deployment: 'apiVersion: apps/v1',
    service: 'apiVersion: v1',
    helmChart: 'apiVersion: v2',
    helmValues: 'replicaCount: 1',
  })),
  writeManifests: vi.fn(() =>
    Promise.resolve({
      dockerfilePath: '/e2e/.gati/manifests/dev/Dockerfile',
      deploymentPath: '/e2e/.gati/manifests/dev/deployment.yaml',
      servicePath: '/e2e/.gati/manifests/dev/service.yaml',
      helmChartPath: '/e2e/.gati/manifests/dev/helm/Chart.yaml',
      helmValuesPath: '/e2e/.gati/manifests/dev/helm/values.yaml',
    })
  ),
}));

describe('E2E: scaffold → deploy → curl → teardown', () => {
  let tmpProjectDir: string;

  beforeAll(async () => {
    execCalls = [];
    spawned = [];
    requestedUrl = null;
    process.env['VITEST'] = '1'; // ensure non-blocking branch

    // Create temp project via scaffolder (skip install)
    const tmpBase = await mkdtemp(join(tmpdir(), 'gati-e2e-'));
    tmpProjectDir = join(tmpBase, 'my-app');
    await generateProject({
      projectPath: tmpProjectDir,
      projectName: 'my-app',
      description: 'E2E test app',
      author: 'tester',
      template: 'default',
      skipInstall: true,
    });
  });

  afterAll(async () => {
    delete process.env['VITEST'];
    // Teardown: remove temp project directory
    if (tmpProjectDir) {
      await rm(join(tmpProjectDir, '..'), { recursive: true, force: true });
    }
  });

  it('runs full mocked deployment and health probe', async () => {
    const opts: LocalDeployOptions = {
      appName: 'my-app',
      namespace: 'e2e-ns',
      env: 'development',
      workingDir: tmpProjectDir,
      port: 3000,
      healthCheckPath: '/health',
      portForward: true,
      verbose: true,
    };

    await executeLocalDeploy(opts);

    // Assert key phases
    expect(execCalls).toContain('kind get clusters');
    expect(execCalls.find((c) => c.startsWith('docker build -t my-app:'))).toBeTruthy();
    const applies = execCalls.filter((c) => c.includes('kubectl apply'));
    expect(applies.length).toBeGreaterThanOrEqual(2);
    expect(execCalls.find((c) => c.includes('kubectl rollout status'))).toBeTruthy();

    // Health probe made request
    expect(requestedUrl).toBe('http://127.0.0.1:3000/health');
    // Port-forward started (health + persistent)
    expect(spawned.length).toBeGreaterThan(0);
  });
});
