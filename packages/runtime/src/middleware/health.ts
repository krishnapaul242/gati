/**
 * @module runtime/middleware/health
 * @description Health check middleware with dependency validation
 */

import type { Middleware } from '../types/middleware.js';
import type { Request, Response, GlobalContext, LocalContext } from '../types/index.js';
import { logger } from '../logger.js';

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: number;
  duration?: number;
}

/**
 * Dependency health check
 */
export interface DependencyCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  required?: boolean; // If true, unhealthy dependency marks entire service unhealthy
  timeout?: number; // Timeout in ms (default: 5000)
}

/**
 * Health check middleware configuration
 */
export interface HealthCheckConfig {
  /**
   * Health check endpoint path (default: '/health')
   */
  path?: string;

  /**
   * Liveness endpoint path (default: '/health/live')
   * Basic check that service is running
   */
  livenesspath?: string;

  /**
   * Readiness endpoint path (default: '/health/ready')
   * Check if service is ready to accept traffic
   */
  readinessPath?: string;

  /**
   * Dependency checks
   */
  dependencies?: DependencyCheck[];

  /**
   * Include system metrics in response
   */
  includeMetrics?: boolean;

  /**
   * Cache health check results (in ms)
   */
  cacheDuration?: number;
}

/**
 * Health check result cache
 */
interface HealthCheckCache {
  result: {
    status: HealthStatus;
    checks: Record<string, HealthCheckResult>;
    metrics?: Record<string, unknown>;
    timestamp: number;
  };
  expiresAt: number;
}

let healthCheckCache: HealthCheckCache | null = null;

/**
 * Create health check middleware
 */
export function createHealthCheckMiddleware(config: HealthCheckConfig = {}): Middleware {
  const {
    path = '/health',
    livenesspath = '/health/live',
    readinessPath = '/health/ready',
    dependencies = [],
    includeMetrics = true,
    cacheDuration = 5000, // 5 seconds
  } = config;

  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    // Check if this is a health check endpoint
    if (req.path === livenesspath) {
      // Liveness probe - just check if service is running
      res.status(200).json({
        status: HealthStatus.HEALTHY,
        timestamp: Date.now(),
      });
      return;
    }

    if (req.path === readinessPath || req.path === path) {
      // Readiness probe - check dependencies
      const isReadiness = req.path === readinessPath;

      // Check cache
      if (healthCheckCache && healthCheckCache.expiresAt > Date.now()) {
        const cached = healthCheckCache.result;
        const statusCode = cached.status === HealthStatus.HEALTHY ? 200 : 503;
        res.status(statusCode).json(cached);
        return;
      }

      const startTime = Date.now();
      const checks: Record<string, HealthCheckResult> = {};
      let overallStatus = HealthStatus.HEALTHY;

      // Run dependency checks in parallel
      const checkPromises = dependencies.map(async (dep) => {
        const depStartTime = Date.now();

        try {
          // Run check with timeout
          const timeout = dep.timeout || 5000;
          const result = await Promise.race([
            dep.check(),
            new Promise<HealthCheckResult>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(`Health check timeout for ${dep.name}`)
                  ),
                timeout
              )
            ),
          ]);

          result.duration = Date.now() - depStartTime;
          checks[dep.name] = result;

          // Update overall status
          if (result.status === HealthStatus.UNHEALTHY && dep.required) {
            overallStatus = HealthStatus.UNHEALTHY;
          } else if (
            result.status === HealthStatus.DEGRADED &&
            overallStatus === HealthStatus.HEALTHY
          ) {
            overallStatus = HealthStatus.DEGRADED;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          checks[dep.name] = {
            status: HealthStatus.UNHEALTHY,
            message: errorMessage,
            duration: Date.now() - depStartTime,
            timestamp: Date.now(),
          };

          if (dep.required) {
            overallStatus = HealthStatus.UNHEALTHY;
          } else if (overallStatus === HealthStatus.HEALTHY) {
            overallStatus = HealthStatus.DEGRADED;
          }

          logger.warn(
            { dependency: dep.name, error },
            'Dependency health check failed'
          );
        }
      });

      await Promise.allSettled(checkPromises);

      // Build response
      const response: Record<string, unknown> = {
        status: overallStatus,
        checks,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

      // Add system metrics if requested
      if (includeMetrics) {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();

        response.metrics = {
          memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          },
          uptime: Math.round(uptime),
          instance: {
            id: gctx.instance.id,
            region: gctx.instance.region,
          },
        };
      }

      // Cache result
      healthCheckCache = {
        result: response as HealthCheckCache['result'],
        expiresAt: Date.now() + cacheDuration,
      };

      // Set status code
      const statusCode = overallStatus === HealthStatus.HEALTHY ? 200 : 503;
      res.status(statusCode).json(response);
      return;
    }

    // Not a health check endpoint - continue to next middleware
    await next();
  };
}

/**
 * Create database health check
 */
export function createDatabaseHealthCheck(
  name: string,
  checkFn: () => Promise<boolean>,
  required = true
): DependencyCheck {
  return {
    name,
    required,
    check: async () => {
      const startTime = Date.now();
      try {
        const isHealthy = await checkFn();
        return {
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          message: isHealthy ? 'Database connection OK' : 'Database connection failed',
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: error instanceof Error ? error.message : 'Database check failed',
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      }
    },
  };
}

/**
 * Create Redis health check
 */
export function createRedisHealthCheck(
  name: string,
  checkFn: () => Promise<boolean>,
  required = false
): DependencyCheck {
  return {
    name,
    required,
    check: async () => {
      const startTime = Date.now();
      try {
        const isHealthy = await checkFn();
        return {
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          message: isHealthy ? 'Redis connection OK' : 'Redis connection failed',
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      } catch (error) {
        return {
          status: HealthStatus.DEGRADED,
          message: error instanceof Error ? error.message : 'Redis check failed',
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      }
    },
  };
}

/**
 * Create external service health check
 */
export function createServiceHealthCheck(
  name: string,
  url: string,
  required = false
): DependencyCheck {
  return {
    name,
    required,
    timeout: 10000,
    check: async () => {
      const startTime = Date.now();
      try {
        // Use fetch to check service health
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        const isHealthy = response.ok;
        return {
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          message: isHealthy
            ? 'Service responding'
            : `Service returned ${response.status}`,
          details: {
            statusCode: response.status,
            url,
          },
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      } catch (error) {
        return {
          status: required ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED,
          message: error instanceof Error ? error.message : 'Service check failed',
          details: { url },
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };
      }
    },
  };
}

/**
 * Clear health check cache (useful for testing)
 */
export function clearHealthCheckCache(): void {
  healthCheckCache = null;
}
