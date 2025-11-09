/**
 * @module cli/deployment/local
 * @description Local Kubernetes deployment executor (kind first approach)
 */

import { exec as _exec, spawn } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { createManifests, writeManifests } from './manifest-generator.js';
import type { DeploymentEnvironment } from './types.js';

const exec = promisify(_exec);

/**
 * Check if a required command-line tool is available
 */
async function checkTool(name: string): Promise<boolean> {
  try {
    await exec(`${name} --version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify all required tools are installed
 */
async function verifyTools(): Promise<{ missing: string[]; instructions: string[] }> {
  const tools = [
    { name: 'docker', installUrl: 'https://docs.docker.com/get-docker/' },
    { name: 'kubectl', installUrl: 'https://kubernetes.io/docs/tasks/tools/' },
    { name: 'kind', installUrl: 'https://kind.sigs.k8s.io/docs/user/quick-start/#installation' },
  ];

  const missing: string[] = [];
  const instructions: string[] = [];

  for (const tool of tools) {
    const available = await checkTool(tool.name);
    if (!available) {
      missing.push(tool.name);
      instructions.push(`  - ${tool.name}: ${tool.installUrl}`);
    }
  }

  return { missing, instructions };
}

export interface LocalDeployOptions {
  appName: string;
  namespace: string;
  env: DeploymentEnvironment;
  imageTag?: string; // repository:tag style
  clusterName?: string;
  workingDir: string;
  skipCluster?: boolean;
  dryRun?: boolean;
  healthCheckPath?: string; // e.g., '/health' to probe after rollout
  portForward?: boolean; // keep a port-forward session running after deploy (non-test mode)
  timeoutSeconds?: number; // rollout timeout
  autoTag?: boolean; // derive image tag from git sha + timestamp
  port?: number;
  replicas?: number;
  verbose?: boolean;
}

async function run(cmd: string, cwd?: string): Promise<string> {
  const { stdout, stderr } = await exec(cmd, { cwd });
  if (stderr && stderr.trim().length > 0) {
    // Non-fatal stderr surfaces for transparency
    console.warn(chalk.dim(`[stderr] ${stderr.trim()}`));
  }
  return stdout.trim();
}

async function clusterExists(name: string): Promise<boolean> {
  try {
    const output = await run(`kind get clusters`);
    return output.split(/\s+/).includes(name);
  } catch {
    return false;
  }
}

async function createCluster(name: string): Promise<void> {
  await run(`kind create cluster --name ${name}`);
}

async function loadImageIntoKind(name: string, image: string): Promise<void> {
  await run(`kind load docker-image ${image} --name ${name}`);
}

async function buildDockerImage(workingDir: string, image: string): Promise<void> {
  await run(`docker build -t ${image} .`, workingDir);
}

async function kubectlApply(namespace: string, file: string): Promise<void> {
  await run(`kubectl apply -n ${namespace} -f ${file}`);
}

async function waitForDeployment(namespace: string, name: string): Promise<void> {
  const timeout = currentTimeoutSeconds || 120;
  await run(`kubectl rollout status deployment/${name} -n ${namespace} --timeout=${timeout}s`);
}

async function ensureNamespace(namespace: string): Promise<void> {
  try {
    await run(`kubectl get namespace ${namespace}`);
  } catch {
    await run(`kubectl create namespace ${namespace}`);
  }
}

let currentTimeoutSeconds = 120;

function formatTimestamp(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${MM}${dd}-${hh}${mm}${ss}`;
}

async function computeAutoTag(appName: string): Promise<string> {
  try {
    const sha = await run('git rev-parse --short HEAD');
    return `${appName}:${formatTimestamp()}-${sha}`;
  } catch {
    return `${appName}:${formatTimestamp()}`;
  }
}

async function httpGet(url: string, timeoutMs: number): Promise<number> {
  const { request } = await import('http');
  return await new Promise<number>((resolve, reject) => {
    const req = request(url, { method: 'GET', timeout: timeoutMs }, (res) => {
      resolve(res.statusCode || 0);
      res.resume(); // drain
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.end();
  });
}

function startPortForward(namespace: string, serviceName: string, localPort: number, targetPort: number) {
  const args = ['port-forward', '-n', namespace, `svc/${serviceName}`, `${localPort}:${targetPort}`];
  const child = spawn('kubectl', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return child;
}

async function probeHealthWithPortForward(
  namespace: string,
  serviceName: string,
  localPort: number,
  targetPort: number,
  path: string,
  timeoutMs: number
): Promise<boolean> {
  const pf = startPortForward(namespace, serviceName, localPort, targetPort);
  // Give port-forward a moment to bind
  await new Promise((r) => setTimeout(r, 300));
  try {
    const status = await httpGet(`http://127.0.0.1:${localPort}${path}`, timeoutMs);
    return status >= 200 && status < 400;
  } finally {
    try { pf.kill(); } catch { /* noop */ }
  }
}

/**
 * Execute a full local deployment flow
 */
export async function executeLocalDeploy(options: LocalDeployOptions): Promise<void> {
  const spinner = ora();
  const {
    appName,
    namespace,
    env,
    imageTag,
    clusterName = 'gati-local',
    workingDir,
    skipCluster,
    dryRun,
    healthCheckPath,
    portForward,
    timeoutSeconds,
    autoTag,
    port = 3000,
    replicas = env === 'production' ? 3 : 1,
    verbose,
  } = options;

  // Verify required tools are installed (skip in test mode)
  if (!process.env['VITEST']) {
    const { missing, instructions } = await verifyTools();
    if (missing.length > 0) {
      spinner.fail(chalk.red(`Missing required tools: ${missing.join(', ')}`));
      // eslint-disable-next-line no-console
      console.log(chalk.yellow('\nPlease install the following tools:'));
      instructions.forEach((instruction) => {
        // eslint-disable-next-line no-console
        console.log(chalk.gray(instruction));
      });
      throw new Error(`Missing required tools: ${missing.join(', ')}`);
    }
  }

  spinner.start('Preparing local deployment');

  // Manifests output dir
  const outDir = join(workingDir, '.gati', 'manifests', env);

  // rollout timeout configuration
  currentTimeoutSeconds = typeof timeoutSeconds === 'number' && timeoutSeconds > 0 ? timeoutSeconds : 120;

  // image tag strategy
  const resolvedImageTag = autoTag ? await computeAutoTag(appName) : (imageTag || `${appName}:local`);

  // 1. Generate manifests
  const manifests = createManifests(appName, namespace, env, {
    port,
    replicas,
    image: resolvedImageTag,
    nodeVersion: '20',
    serviceType: 'ClusterIP',
    enableAutoscaling: false,
  });
  const { /* dockerfilePath, */ deploymentPath, servicePath } = await writeManifests(outDir, manifests);

  spinner.succeed(chalk.green(`Manifests generated at ${outDir}`));

  // If dry-run, stop here
  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(chalk.cyan('\n📄 Dry run complete. Manifests ready for deployment:'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Deployment: ${deploymentPath}`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  Service: ${servicePath}`));
    // eslint-disable-next-line no-console
    console.log(chalk.yellow('\nTo deploy, run without --dry-run flag'));
    return;
  }

  spinner.start('Deploying to local cluster');

  // 2. Create kind cluster if needed
  if (!skipCluster) {
    const exists = await clusterExists(clusterName);
    if (!exists) {
      spinner.text = `Creating kind cluster '${clusterName}'`;
      await createCluster(clusterName);
    }
  }

  // 3. Build Docker image
  spinner.text = 'Building Docker image';
  await buildDockerImage(workingDir, resolvedImageTag);

  // 4. Load image into kind
  spinner.text = 'Loading image into kind';
  await loadImageIntoKind(clusterName, resolvedImageTag);

  // 5. Ensure namespace exists
  spinner.text = `Ensuring namespace '${namespace}'`;
  await ensureNamespace(namespace);

  // 6. Apply deployment and service
  spinner.text = 'Applying Kubernetes manifests';
  await kubectlApply(namespace, deploymentPath);
  await kubectlApply(namespace, servicePath);

  // 7. Wait for rollout
  spinner.text = 'Waiting for deployment rollout';
  await waitForDeployment(namespace, appName);

  spinner.succeed(chalk.green('Local deployment successful'));

  // 8. Optional health check
  if (healthCheckPath) {
    const ok = await probeHealthWithPortForward(namespace, appName, port, port, healthCheckPath, 5_000);
    if (ok) {
      // eslint-disable-next-line no-console
      console.log(chalk.green(`Health check passed at http://127.0.0.1:${port}${healthCheckPath}`));
    } else {
      // eslint-disable-next-line no-console
      console.log(chalk.red(`Health check failed at http://127.0.0.1:${port}${healthCheckPath}`));
    }
  }

  // 8. Provide follow-up info
  if (verbose) {
    // eslint-disable-next-line no-console
    console.log(chalk.cyan('\n📡 Access your service:'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  kubectl port-forward -n ${namespace} svc/${appName} 3000:80`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray('\n🧹 Teardown cluster:'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(`  kind delete cluster --name ${clusterName}`));
  }

  // 9. Optional persistent port-forward helper
  if (portForward) {
    const child = startPortForward(namespace, appName, port, port);
    // Cleanup on exit
    const cleanup = () => {
      try { child.kill(); } catch { /* noop */ }
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    if (process.env['VITEST']) {
      // In tests, don't block; short delay then cleanup
      await new Promise((r) => setTimeout(r, 200));
      cleanup();
      return;
    }

    // eslint-disable-next-line no-console
    console.log(chalk.cyan(`\n🔌 Port-forward active: http://127.0.0.1:${port}`));
    // eslint-disable-next-line no-console
    console.log(chalk.gray('Press Ctrl+C to stop port-forward...'));
    await new Promise<void>((resolve) => {
      const handler = () => {
        process.off('SIGINT', handler);
        resolve();
      };
      process.on('SIGINT', handler);
    });
    cleanup();
  }
}
