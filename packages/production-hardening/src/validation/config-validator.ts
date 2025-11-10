/**
 * @module production-hardening/validation
 * @description Configuration validation with schema support
 */

import { z } from 'zod';
import Ajv from 'ajv';

/**
 * Deployment configuration schema
 */
export const DeploymentConfigSchema = z.object({
  appName: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/),
  environment: z.enum(['development', 'staging', 'production']),
  region: z.string().min(1),
  cloudProvider: z.enum(['aws', 'gcp', 'azure', 'local']),
  kubernetes: z.object({
    clusterName: z.string().min(1),
    namespace: z.string().default('default'),
    version: z.string().regex(/^\d+\.\d+$/),
  }),
  resources: z.object({
    replicas: z.number().int().min(1).max(100),
    cpu: z.object({
      request: z.string().regex(/^\d+(m|)$/),
      limit: z.string().regex(/^\d+(m|)$/),
    }),
    memory: z.object({
      request: z.string().regex(/^\d+(Mi|Gi)$/),
      limit: z.string().regex(/^\d+(Mi|Gi)$/),
    }),
  }),
  autoscaling: z.object({
    enabled: z.boolean(),
    minReplicas: z.number().int().min(1).optional(),
    maxReplicas: z.number().int().min(1).optional(),
    targetCPU: z.number().int().min(1).max(100).optional(),
    targetMemory: z.number().int().min(1).max(100).optional(),
  }).optional(),
  networking: z.object({
    port: z.number().int().min(1).max(65535),
    protocol: z.enum(['HTTP', 'HTTPS', 'TCP']).default('HTTP'),
    ingress: z.object({
      enabled: z.boolean(),
      host: z.string().optional(),
      tls: z.boolean().default(false),
    }).optional(),
  }),
  secrets: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

/**
 * Configuration validator
 */
export class ConfigValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
  }

  /**
   * Validate deployment configuration using Zod
   */
  validateDeploymentConfig(config: unknown): {
    valid: boolean;
    data?: DeploymentConfig;
    errors?: string[];
  } {
    try {
      const validated = DeploymentConfigSchema.parse(config);
      
      // Additional custom validation
      const customErrors = this.validateCustomRules(validated);
      
      if (customErrors.length > 0) {
        return {
          valid: false,
          errors: customErrors,
        };
      }

      return {
        valid: true,
        data: validated,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(
            (e) => `${e.path.join('.')}: ${e.message}`
          ),
        };
      }

      return {
        valid: false,
        errors: ['Unknown validation error'],
      };
    }
  }

  /**
   * Custom validation rules
   */
  private validateCustomRules(config: DeploymentConfig): string[] {
    const errors: string[] = [];

    // Validate resource limits vs requests
    const cpuLimit = this.parseResource(config.resources.cpu.limit);
    const cpuRequest = this.parseResource(config.resources.cpu.request);
    
    if (cpuLimit < cpuRequest) {
      errors.push('CPU limit must be greater than or equal to CPU request');
    }

    const memLimit = this.parseMemory(config.resources.memory.limit);
    const memRequest = this.parseMemory(config.resources.memory.request);
    
    if (memLimit < memRequest) {
      errors.push('Memory limit must be greater than or equal to memory request');
    }

    // Validate autoscaling config
    if (config.autoscaling?.enabled) {
      if (!config.autoscaling.minReplicas || !config.autoscaling.maxReplicas) {
        errors.push('Autoscaling requires minReplicas and maxReplicas');
      }

      if (
        config.autoscaling.minReplicas &&
        config.autoscaling.maxReplicas &&
        config.autoscaling.minReplicas > config.autoscaling.maxReplicas
      ) {
        errors.push('minReplicas must be less than or equal to maxReplicas');
      }

      if (config.autoscaling.minReplicas && config.resources.replicas < config.autoscaling.minReplicas) {
        errors.push('replicas must be greater than or equal to minReplicas');
      }
    }

    // Validate production environment requirements
    if (config.environment === 'production') {
      if (config.resources.replicas < 2) {
        errors.push('Production environment requires at least 2 replicas for high availability');
      }

      if (!config.autoscaling?.enabled) {
        errors.push('Production environment should enable autoscaling');
      }

      if (config.networking.ingress?.enabled && !config.networking.ingress.tls) {
        errors.push('Production ingress should enable TLS');
      }
    }

    return errors;
  }

  /**
   * Parse CPU resource string to millicores
   */
  private parseResource(resource: string): number {
    if (resource.endsWith('m')) {
      return parseInt(resource.slice(0, -1));
    }
    return parseInt(resource) * 1000;
  }

  /**
   * Parse memory resource string to MB
   */
  private parseMemory(memory: string): number {
    if (memory.endsWith('Gi')) {
      return parseInt(memory.slice(0, -2)) * 1024;
    }
    if (memory.endsWith('Mi')) {
      return parseInt(memory.slice(0, -2));
    }
    return parseInt(memory);
  }

  /**
   * Validate JSON schema
   */
  validateJSONSchema(data: unknown, schema: object): {
    valid: boolean;
    errors?: string[];
  } {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(
          (e) => `${e.instancePath} ${e.message}`
        ) || ['Validation failed'],
      };
    }

    return { valid: true };
  }

  /**
   * Pre-deployment validation checklist
   */
  async preDeploymentCheck(config: DeploymentConfig): Promise<{
    passed: boolean;
    checks: Array<{ name: string; passed: boolean; message?: string }>;
  }> {
    const checks: Array<{ name: string; passed: boolean; message?: string }> = [];

    // Check 1: Configuration valid
    const configValidation = this.validateDeploymentConfig(config);
    checks.push({
      name: 'Configuration validation',
      passed: configValidation.valid,
      message: configValidation.errors?.join(', '),
    });

    // Check 2: Required secrets present
    if (config.secrets && config.secrets.length > 0) {
      const missingSecrets = config.secrets.filter(
        (secret) => !process.env[secret]
      );
      checks.push({
        name: 'Required secrets',
        passed: missingSecrets.length === 0,
        message: missingSecrets.length > 0
          ? `Missing secrets: ${missingSecrets.join(', ')}`
          : undefined,
      });
    }

    // Check 3: Production readiness
    if (config.environment === 'production') {
      const prodChecks = [
        {
          name: 'High availability',
          passed: config.resources.replicas >= 2,
          message: 'At least 2 replicas required for HA',
        },
        {
          name: 'Autoscaling enabled',
          passed: config.autoscaling?.enabled === true,
          message: 'Autoscaling recommended for production',
        },
        {
          name: 'TLS enabled',
          passed: config.networking.ingress?.tls === true || !config.networking.ingress?.enabled,
          message: 'TLS required for production ingress',
        },
      ];

      checks.push(...prodChecks);
    }

    const passed = checks.every((check) => check.passed);

    return {
      passed,
      checks,
    };
  }
}
