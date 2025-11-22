/**
 * @module cli/commands/deploy
 * @description Deploy Gati application to cloud infrastructure
 */

/* eslint-disable no-console */

import type { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import prompts from 'prompts';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { generateCompleteManifests } from '../deployment/kubernetes.js';
import { executeLocalDeploy } from '../deployment/local.js';
import type { DeploymentEnvironment } from '../deployment/types.js';

interface DeployOptions {
  env?: string;
  dryRun?: boolean;
  skipBuild?: boolean;
  provider?: 'aws' | 'gcp' | 'azure' | 'kubernetes';
  local?: boolean;
  clusterName?: string;
  skipCluster?: boolean;
  verbose?: boolean;
  healthCheckPath?: string;
  portForward?: boolean;
  timeout?: string;
  autoTag?: boolean;
}

interface EnvironmentConfig {
  name: string;
  provider: 'aws' | 'gcp' | 'azure' | 'kubernetes';
  cluster?: string;
  region?: string;
  namespace?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu: string; memory: string };
    limits?: { cpu: string; memory: string };
  };
}

interface GatiConfig {
  name: string;
  version?: string;
  port?: number;
  environments?: Record<string, EnvironmentConfig>;
}

/**
 * Load gati.config.ts or gati.config.js
 */
async function loadGatiConfig(cwd: string): Promise<GatiConfig | null> {
  const configPaths = [
    join(cwd, 'gati.config.ts'),
    join(cwd, 'gati.config.js'),
    join(cwd, 'package.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      if (configPath.endsWith('package.json')) {
        const pkg = JSON.parse(readFileSync(configPath, 'utf-8'));
        return {
          name: pkg.name || 'gati-app',
          version: pkg.version,
          port: 3000,
        };
      }
      // For now, return default config - will implement dynamic import later
      return {
        name: 'gati-app',
        port: 3000,
      };
    }
  }

  return null;
}

/**
 * Validate environment configuration
 */
function validateEnvironment(env: EnvironmentConfig): string[] {
  const errors: string[] = [];

  if (!env.name) {
    errors.push('Environment name is required');
  }

  if (!env.provider) {
    errors.push('Provider is required (aws, gcp, azure, or kubernetes)');
  }

  if (env.provider === 'aws' && !env.region) {
    errors.push('AWS region is required for AWS deployments');
  }

  if (!env.namespace) {
    errors.push('Kubernetes namespace is required');
  }

  return errors;
}

/**
 * Deploy command handler
 */
async function deployCommand(environment: string, options: DeployOptions): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora();

  try {
    // Load configuration
    spinner.start('Loading configuration...');
    const config = await loadGatiConfig(cwd);
    
    if (!config) {
      spinner.fail(chalk.red('Could not find gati.config.ts or package.json'));
      process.exit(1);
    }

    spinner.succeed(chalk.green(`Loaded config for: ${config.name}`));

    // Select environment
    let targetEnv: string = environment || options.env || 'dev';
    
    if (!environment && !options.env) {
      const response = await prompts({
        type: 'select',
        name: 'env',
        message: 'Select deployment environment:',
        choices: [
          { title: 'Development', value: 'dev' },
          { title: 'Staging', value: 'staging' },
          { title: 'Production', value: 'prod' },
        ],
      });

      if (!response.env) {
        console.log(chalk.yellow('Deployment cancelled'));
        process.exit(0);
      }

      targetEnv = response.env;
    }

    // Get environment config
    const envConfig: EnvironmentConfig = config.environments?.[targetEnv] || {
      name: targetEnv,
      provider: options.provider || 'kubernetes',
      namespace: `${config.name}-${targetEnv}`,
      replicas: targetEnv === 'prod' ? 3 : 1,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '512Mi' },
      },
    };

    // Validate environment
    const validationErrors = validateEnvironment(envConfig);
    if (validationErrors.length > 0) {
      spinner.fail(chalk.red('Environment configuration errors:'));
      validationErrors.forEach(err => console.log(chalk.red(`  • ${err}`)));
      process.exit(1);
    }

    console.log(chalk.blue(`\n📦 Deploying to: ${chalk.bold(targetEnv)}`));
    console.log(chalk.gray(`   Provider: ${envConfig.provider}`));
    console.log(chalk.gray(`   Namespace: ${envConfig.namespace}`));
    console.log(chalk.gray(`   Replicas: ${envConfig.replicas}`));

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN MODE - No actual deployment will occur\n'));
    }

    // Generate manifests
    spinner.start('Generating Kubernetes manifests...');

    const deployEnv: DeploymentEnvironment = targetEnv === 'prod' 
      ? 'production' 
      : targetEnv === 'staging' 
      ? 'staging' 
      : 'development';

    const manifests = generateCompleteManifests(
      config.name,
      envConfig.namespace || 'default',
      deployEnv,
      {
        nodeVersion: '20',
        port: config.port || 3000,
        replicas: envConfig.replicas || 1,
        image: `${config.name}:${config.version || 'latest'}`,
        enableAutoscaling: targetEnv === 'prod',
        serviceType: targetEnv === 'prod' ? 'LoadBalancer' : 'ClusterIP',
      }
    );

    spinner.succeed(chalk.green('Manifests generated successfully'));

    if (options.dryRun) {
      console.log(chalk.cyan('\n📄 Generated Manifests:\n'));
      console.log(chalk.gray('--- Dockerfile ---'));
      console.log(manifests.dockerfile);
      console.log(chalk.gray('\n--- Deployment ---'));
      console.log(manifests.deployment);
      console.log(chalk.gray('\n--- Service ---'));
      console.log(manifests.service);
      
      console.log(chalk.green('\n✅ Dry run completed successfully'));
      return;
    }

    // Local deployment flow (kind) if requested or provider == kubernetes
    if (options.local || envConfig.provider === 'kubernetes') {
      spinner.stop();
      await executeLocalDeploy({
        appName: config.name,
        namespace: envConfig.namespace || `${config.name}-${targetEnv}`,
        env: deployEnv,
        workingDir: cwd,
        clusterName: options.clusterName,
        skipCluster: options.skipCluster,
        dryRun: options.dryRun,
        healthCheckPath: options.healthCheckPath,
        portForward: options.portForward,
        timeoutSeconds: options.timeout ? parseInt(options.timeout, 10) : undefined,
        autoTag: options.autoTag,
        replicas: envConfig.replicas,
        verbose: options.verbose,
        imageTag: `${config.name}:${config.version || 'latest'}`,
        port: config.port || 3000,
      });
    } else {
      // Build Docker image (if not skipped)
      if (!options.skipBuild) {
        spinner.start('Building Docker image...');
        spinner.info(chalk.yellow('Docker build not yet implemented'));
      }

      spinner.start(`Deploying to ${envConfig.provider}...`);
      switch (envConfig.provider) {
        case 'aws':
          spinner.info(chalk.yellow('AWS EKS deployment not yet implemented'));
          break;
        case 'gcp':
          spinner.info(chalk.yellow('GCP GKE deployment not yet implemented'));
          break;
        case 'azure':
          spinner.info(chalk.yellow('Azure AKS deployment not yet implemented'));
          break;
        default:
          spinner.fail(chalk.red(`Unknown provider: ${envConfig.provider}`));
          process.exit(1);
      }

      console.log(chalk.green('\n✨ Deployment prepared successfully!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Review generated manifests'));
      console.log(chalk.gray('  2. Configure cloud provider credentials'));
      console.log(chalk.gray('  3. Run deploy without --dry-run'));
    }

  } catch (error) {
    spinner.fail(chalk.red('Deployment failed'));
    console.error(chalk.red('\n' + (error as Error).message));
    if (process.env['DEBUG']) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Register deploy command
 */
export function registerDeployCommand(program: Command): void {
  program
    .command('deploy [environment]')
    .description('Deploy application to cloud infrastructure')
    .option('-e, --env <environment>', 'Target environment (dev, staging, prod)')
    .option('--dry-run', 'Generate manifests without deploying')
    .option('--skip-build', 'Skip Docker image build')
    .option('-p, --provider <provider>', 'Cloud provider (aws, gcp, azure, kubernetes)')
    .option('--local', 'Force local (kind) deployment flow')
    .option('--health-check-path <path>', 'Probe HTTP path after rollout (e.g., /health)')
    .option('--port-forward', 'Port-forward service to local port with auto cleanup (non-test mode holds until Ctrl+C)')
    .option('--timeout <seconds>', 'Rollout timeout in seconds (default: 120)')
    .option('--auto-tag', 'Auto-tag image with git SHA + timestamp')
    .option('--cluster-name <name>', 'Kind cluster name (default: gati-local)')
    .option('--skip-cluster', 'Skip cluster creation step')
    .option('-v, --verbose', 'Verbose output')
    .action(deployCommand);
}
