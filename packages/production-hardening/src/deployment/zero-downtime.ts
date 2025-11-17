/**
 * @module production-hardening/deployment
 * @description Zero-downtime deployment strategies and verification
 */

/**
 * Deployment strategy types
 */
export type DeploymentStrategy = 'rolling' | 'blue-green' | 'canary';

/**
 * Rolling update configuration
 */
export interface RollingUpdateConfig {
  /** Maximum surge (extra pods during update) */
  maxSurge: string | number;
  /** Maximum unavailable pods during update */
  maxUnavailable: string | number;
  /** Time to wait before considering pod ready */
  minReadySeconds?: number;
  /** Revision history limit */
  revisionHistoryLimit?: number;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Health check endpoint path */
  path: string;
  /** Port for health checks */
  port: number;
  /** Initial delay before first check */
  initialDelaySeconds: number;
  /** Check interval */
  periodSeconds: number;
  /** Timeout for each check */
  timeoutSeconds: number;
  /** Success threshold */
  successThreshold: number;
  /** Failure threshold */
  failureThreshold: number;
}

/**
 * Deployment smoke test
 */
export interface SmokeTest {
  /** Test name */
  name: string;
  /** Test endpoint */
  endpoint: string;
  /** Expected status code */
  expectedStatus: number;
  /** Expected response body pattern */
  expectedBody?: string | RegExp;
  /** Test timeout */
  timeout?: number;
}

/**
 * Zero-downtime deployment manager
 */
export class ZeroDowntimeDeployment {
  /**
   * Generate rolling update deployment manifest
   */
  generateRollingUpdateManifest(
    appName: string,
    namespace: string,
    config: RollingUpdateConfig
  ): string {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  namespace: ${namespace}
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: ${config.maxSurge}
      maxUnavailable: ${config.maxUnavailable}
  minReadySeconds: ${config.minReadySeconds || 10}
  revisionHistoryLimit: ${config.revisionHistoryLimit || 10}
`;
  }

  /**
   * Generate health check probes
   */
  generateHealthProbes(
    livenessCheck: HealthCheckConfig,
    readinessCheck: HealthCheckConfig
  ): string {
    return `        livenessProbe:
          httpGet:
            path: ${livenessCheck.path}
            port: ${livenessCheck.port}
          initialDelaySeconds: ${livenessCheck.initialDelaySeconds}
          periodSeconds: ${livenessCheck.periodSeconds}
          timeoutSeconds: ${livenessCheck.timeoutSeconds}
          successThreshold: ${livenessCheck.successThreshold}
          failureThreshold: ${livenessCheck.failureThreshold}
        readinessProbe:
          httpGet:
            path: ${readinessCheck.path}
            port: ${readinessCheck.port}
          initialDelaySeconds: ${readinessCheck.initialDelaySeconds}
          periodSeconds: ${readinessCheck.periodSeconds}
          timeoutSeconds: ${readinessCheck.timeoutSeconds}
          successThreshold: ${readinessCheck.successThreshold}
          failureThreshold: ${readinessCheck.failureThreshold}
`;
  }

  /**
   * Run smoke tests against deployment
   */
  async runSmokeTests(
    baseUrl: string,
    tests: SmokeTest[]
  ): Promise<{
    passed: boolean;
    results: Array<{
      test: string;
      passed: boolean;
      error?: string;
      duration: number;
    }>;
  }> {
    const results = [];

    for (const test of tests) {
      const start = Date.now();
      
      try {
        const response = await fetch(`${baseUrl}${test.endpoint}`, {
          signal: AbortSignal.timeout(test.timeout || 5000),
        });

        const duration = Date.now() - start;
        let passed = response.status === test.expectedStatus;

        if (passed && test.expectedBody) {
          const body = await response.text();
          
          if (typeof test.expectedBody === 'string') {
            passed = body.includes(test.expectedBody);
          } else {
            passed = test.expectedBody.test(body);
          }
        }

        results.push({
          test: test.name,
          passed,
          duration,
          error: passed ? undefined : `Expected status ${test.expectedStatus}, got ${response.status}`,
        });
      } catch (error) {
        results.push({
          test: test.name,
          passed: false,
          duration: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      passed: results.every((r) => r.passed),
      results,
    };
  }

  /**
   * Verify deployment health
   */
  async verifyDeploymentHealth(
    healthEndpoint: string,
    timeout: number = 60000
  ): Promise<{
    healthy: boolean;
    message: string;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(healthEndpoint, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          return {
            healthy: true,
            message: 'Deployment is healthy',
          };
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        // Continue retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    return {
      healthy: false,
      message: 'Deployment health check timeout',
    };
  }

  /**
   * Get recommended rolling update configuration
   */
  getRecommendedRollingConfig(
    environment: 'development' | 'staging' | 'production'
  ): RollingUpdateConfig {
    const configs: Record<string, RollingUpdateConfig> = {
      development: {
        maxSurge: '100%',
        maxUnavailable: 0,
        minReadySeconds: 5,
        revisionHistoryLimit: 5,
      },
      staging: {
        maxSurge: '50%',
        maxUnavailable: 0,
        minReadySeconds: 10,
        revisionHistoryLimit: 10,
      },
      production: {
        maxSurge: '25%',
        maxUnavailable: 0,
        minReadySeconds: 30,
        revisionHistoryLimit: 20,
      },
    };
    const selectedConfig = configs[environment];
    if(!selectedConfig) {
      throw new Error(`No recommended config for environment: ${environment}`);
    }
    return selectedConfig;
  }

  /**
   * Get recommended health check configuration
   */
  getRecommendedHealthChecks(): {
    liveness: HealthCheckConfig;
    readiness: HealthCheckConfig;
  } {
    return {
      liveness: {
        path: '/health',
        port: 3000,
        initialDelaySeconds: 30,
        periodSeconds: 10,
        timeoutSeconds: 5,
        successThreshold: 1,
        failureThreshold: 3,
      },
      readiness: {
        path: '/ready',
        port: 3000,
        initialDelaySeconds: 15,
        periodSeconds: 10,
        timeoutSeconds: 5,
        successThreshold: 1,
        failureThreshold: 3,
      },
    };
  }

  /**
   * Create rollback command
   */
  generateRollbackCommand(appName: string, namespace: string): string {
    return `kubectl rollout undo deployment/${appName} -n ${namespace}`;
  }

  /**
   * Monitor deployment rollout
   */
  async monitorRollout(
    appName: string,
    namespace: string,
    timeout: number = 600000
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < timeout) {
      try {
        // Check rollout status using kubectl
        const { execSync } = await import('child_process');
        
        const statusCommand = `kubectl rollout status deployment/${appName} -n ${namespace} --timeout=10s`;
        
        try {
          const output = execSync(statusCommand, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          // Check if rollout completed successfully
          if (output.includes('successfully rolled out')) {
            return {
              success: true,
              message: `Deployment ${appName} in namespace ${namespace} rolled out successfully`,
            };
          }
        } catch (cmdError) {
          // kubectl rollout status returns non-zero if not complete yet
          // Continue monitoring unless it's a fatal error
          const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
          
          if (errorMessage.includes('not found') || errorMessage.includes('error')) {
            return {
              success: false,
              message: `Deployment monitoring failed: ${errorMessage}`,
            };
          }
        }

        // Wait before next check
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch (error) {
        return {
          success: false,
          message: `Error monitoring rollout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Timeout reached
    return {
      success: false,
      message: `Deployment rollout timeout after ${timeout}ms for ${appName} in namespace ${namespace}`,
    };
  }
}
