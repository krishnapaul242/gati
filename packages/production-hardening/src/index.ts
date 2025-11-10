/**
 * @module production-hardening
 * @description Production hardening utilities for Gati framework
 */

export * from './secrets/secret-manager.js';
export * from './validation/config-validator.js';
export * from './scaling/auto-scaling.js';
export * from './deployment/zero-downtime.js';

import { SecretManager, SecretValidator } from './secrets/secret-manager.js';
import { ConfigValidator, DeploymentConfigSchema } from './validation/config-validator.js';
import { AutoScalingOptimizer, type ScalingPolicy, type WorkloadType } from './scaling/auto-scaling.js';
import { ZeroDowntimeDeployment, type DeploymentStrategy } from './deployment/zero-downtime.js';

/**
 * Production hardening suite
 */
export class ProductionHardeningSuite {
  public readonly secrets: SecretManager;
  public readonly validator: ConfigValidator;
  public readonly scaling: AutoScalingOptimizer;
  public readonly deployment: ZeroDowntimeDeployment;

  constructor(encryptionKey?: string) {
    this.secrets = new SecretManager(encryptionKey);
    this.validator = new ConfigValidator();
    this.scaling = new AutoScalingOptimizer();
    this.deployment = new ZeroDowntimeDeployment();
  }

  /**
   * Run complete production readiness check
   */
  async checkProductionReadiness(config: any): Promise<{
    ready: boolean;
    checks: Array<{ category: string; passed: boolean; details: any }>;
  }> {
    const checks = [];

    // Configuration validation
    const configCheck = this.validator.validateDeploymentConfig(config);
    checks.push({
      category: 'Configuration',
      passed: configCheck.valid,
      details: configCheck.errors || [],
    });

    // Pre-deployment checks
    if (configCheck.valid && configCheck.data) {
      const preDeployCheck = await this.validator.preDeploymentCheck(configCheck.data);
      checks.push({
        category: 'Pre-deployment',
        passed: preDeployCheck.passed,
        details: preDeployCheck.checks,
      });
    }

    // Scaling policy validation
    const scalingPolicy = this.scaling.getRecommendedPolicy(
      config.workloadType || 'api'
    );
    const scalingCheck = this.scaling.validatePolicy(scalingPolicy);
    checks.push({
      category: 'Auto-scaling',
      passed: scalingCheck.valid,
      details: scalingCheck.errors,
    });

    const ready = checks.every((check) => check.passed);

    return {
      ready,
      checks,
    };
  }
}
