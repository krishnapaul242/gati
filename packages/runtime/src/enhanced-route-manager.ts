/**
 * @module runtime/enhanced-route-manager
 * @description Enhanced Route Manager with version resolution and Timescape integration
 * 
 * This implements Task 9 from the runtime architecture spec:
 * - Version resolution using Timescape
 * - Manifest, GType, and health status caching
 * - Handler instance selection and routing
 * - Policy enforcement (rate limiting, authentication)
 * - Warm pool management
 * - Usage tracking for auto-decommissioning
 */

import type { Handler } from './types/handler.js';
import type { HttpMethod } from './types/request.js';
import type { TSV } from './timescape/types.js';
import { VersionRegistry } from './timescape/registry.js';
import { VersionResolver } from './timescape/resolver.js';
import { TransformerEngine, type TransformerPair, type TransformResult } from './timescape/transformer.js';

/**
 * Handler manifest containing metadata and policies
 */
export interface HandlerManifest {
  handlerId: string;
  path: string;
  method: HttpMethod | HttpMethod[];
  version: TSV;
  gtypes: {
    request?: string;
    response?: string;
    params?: string;
    headers?: string;
  };
  hooks?: {
    before?: string[];
    after?: string[];
    catch?: string[];
  };
  policies?: {
    roles?: string[];
    rateLimit?: {
      limit: number;
      window: number; // in milliseconds
    };
  };
  dependencies?: {
    modules?: string[];
    plugins?: string[];
  };
  hash: string;
}

/**
 * Handler instance representing a deployed handler version
 */
export interface HandlerInstance {
  id: string;
  handlerId: string;
  version: TSV;
  handler: Handler;
  manifest: HandlerManifest;
  health: HealthStatus;
  createdAt: number;
  lastAccessed: number;
}

/**
 * Health status for handler instances
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  consecutiveFailures: number;
  message?: string;
}

/**
 * Authentication context for policy enforcement
 */
export interface AuthContext {
  userId?: string;
  roles: string[];
  token?: string;
}

/**
 * Request descriptor for routing
 */
export interface RequestDescriptor {
  requestId: string;
  path: string;
  method: HttpMethod;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  authContext?: AuthContext;
  clientId: string;
}

/**
 * Routing result
 */
export interface RoutingResult {
  instance: HandlerInstance;
  manifest: HandlerManifest;
  version: TSV;
  cached: boolean;
  transformedRequest?: TransformResult;
  requiresResponseTransform?: boolean;
  originalVersion?: TSV;
}

/**
 * Routing error
 */
export interface RoutingError {
  code: 'NO_HANDLER' | 'NO_VERSION' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'UNHEALTHY';
  message: string;
  details?: unknown;
}

/**
 * Warm pool configuration
 */
export interface WarmPoolConfig {
  minInstances: number;
  maxInstances: number;
  targetUtilization: number;
}

/**
 * Usage metrics for tracking
 */
export interface UsageMetrics {
  requestCount: number;
  errorCount: number;
  avgLatency: number;
  lastAccessed: number;
}

/**
 * Rate limit state
 */
interface RateLimitState {
  count: number;
  windowStart: number;
}

/**
 * Enhanced Route Manager with version resolution and Timescape integration
 */
export class EnhancedRouteManager {
  private registry: VersionRegistry;
  private resolver: VersionResolver;
  private transformerEngine: TransformerEngine;
  
  // Handler instances by path and version
  private instances: Map<string, Map<TSV, HandlerInstance>> = new Map();
  
  // Manifest cache
  private manifestCache: Map<string, HandlerManifest> = new Map();
  
  // GType cache
  private gtypeCache: Map<string, unknown> = new Map();
  
  // Health status cache
  private healthCache: Map<string, HealthStatus> = new Map();
  
  // Rate limiting state
  private rateLimitState: Map<string, RateLimitState> = new Map();
  
  // Warm pool configurations
  private warmPools: Map<string, WarmPoolConfig> = new Map();
  
  // Usage tracking
  private usageMetrics: Map<string, UsageMetrics> = new Map();
  
  // Cache configuration
  private readonly maxCacheSize = 1000;
  private readonly healthCheckInterval = 30000; // 30 seconds
  private readonly rateLimitCleanupInterval = 60000; // 1 minute

  constructor(registry?: VersionRegistry, transformerEngine?: TransformerEngine) {
    this.registry = registry || new VersionRegistry();
    this.resolver = new VersionResolver(this.registry);
    this.transformerEngine = transformerEngine || new TransformerEngine();
    
    // Start background tasks
    this.startHealthCheckLoop();
    this.startRateLimitCleanup();
  }

  /**
   * Register a handler instance
   */
  public registerHandler(
    path: string,
    version: TSV,
    handler: Handler,
    manifest: HandlerManifest
  ): void {
    if (!this.instances.has(path)) {
      this.instances.set(path, new Map());
    }

    const instance: HandlerInstance = {
      id: `${path}:${version}`,
      handlerId: manifest.handlerId,
      version,
      handler,
      manifest,
      health: {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0,
      },
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    this.instances.get(path)!.set(version, instance);
    
    // Cache manifest
    this.cacheManifest(manifest);
    
    // Register version in Timescape
    this.registry.registerVersion(path, version, {
      hash: manifest.hash,
      status: 'hot',
      requestCount: 0,
      lastAccessed: Date.now(),
      tags: [],
    });
  }

  /**
   * Resolve handler version using Timescape
   */
  public resolveVersion(
    path: string,
    query: Record<string, string | string[] | undefined> = {},
    headers: Record<string, string | string[] | undefined> = {}
  ): TSV | RoutingError {
    const result = this.resolver.resolveVersion(path, query, headers);
    
    if ('code' in result) {
      return {
        code: 'NO_VERSION',
        message: result.message,
        details: result.details,
      };
    }

    return result.version;
  }

  /**
   * Route a request to the appropriate handler instance
   */
  public async routeRequest(descriptor: RequestDescriptor): Promise<RoutingResult | RoutingError> {
    // 1. Resolve version
    const versionResult = this.resolveVersion(
      descriptor.path,
      descriptor.query,
      descriptor.headers
    );

    if (typeof versionResult !== 'string') {
      return versionResult;
    }

    const version = versionResult;

    // 2. Get handler instance
    const instance = this.getInstance(descriptor.path, version);
    if (!instance) {
      return {
        code: 'NO_HANDLER',
        message: `No handler instance found for ${descriptor.path} version ${version}`,
      };
    }

    // 3. Check health
    if (instance.health.status === 'unhealthy') {
      return {
        code: 'UNHEALTHY',
        message: `Handler instance is unhealthy: ${instance.health.message || 'unknown reason'}`,
      };
    }

    // 4. Enforce rate limiting
    const rateLimitError = this.enforceRateLimit(instance.manifest, descriptor.clientId);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 5. Verify authentication
    const authError = this.verifyAuthentication(instance.manifest, descriptor.authContext);
    if (authError) {
      return authError;
    }

    // 6. Check if request needs transformation
    const requestedVersion = this.extractRequestedVersion(descriptor.headers);
    let transformedRequest: TransformResult | undefined;
    let requiresResponseTransform = false;
    let originalVersion: TSV | undefined;

    if (requestedVersion && requestedVersion !== version) {
      // Request is for an old version, but we're routing to a new version
      // Transform the request from old version to new version
      const transformResult = await this.transformRequest(
        descriptor.body,
        requestedVersion,
        version,
        descriptor.path
      );

      if (!transformResult.success) {
        return {
          code: 'NO_VERSION',
          message: `Failed to transform request from ${requestedVersion} to ${version}: ${transformResult.error?.message}`,
          details: transformResult,
        };
      }

      transformedRequest = transformResult;
      requiresResponseTransform = true;
      originalVersion = requestedVersion;
    }

    // 7. Track usage
    this.trackUsage(instance.id, {
      requestCount: 1,
      errorCount: 0,
      avgLatency: 0,
      lastAccessed: Date.now(),
    });

    // 8. Update instance last accessed
    instance.lastAccessed = Date.now();

    // 9. Record request in Timescape
    this.registry.recordRequest(version);

    return {
      instance,
      manifest: instance.manifest,
      version,
      cached: this.manifestCache.has(instance.manifest.handlerId),
      transformedRequest,
      requiresResponseTransform,
      originalVersion,
    };
  }

  /**
   * Enforce rate limiting policies
   */
  public enforceRateLimit(
    manifest: HandlerManifest,
    clientId: string
  ): RoutingError | null {
    if (!manifest.policies?.rateLimit) {
      return null;
    }

    const { limit, window } = manifest.policies.rateLimit;
    const key = `${manifest.handlerId}:${clientId}`;
    const now = Date.now();

    let state = this.rateLimitState.get(key);

    // Initialize or reset window
    if (!state || now - state.windowStart >= window) {
      state = {
        count: 0,
        windowStart: now,
      };
      this.rateLimitState.set(key, state);
    }

    // Check limit
    if (state.count >= limit) {
      return {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded: ${limit} requests per ${window}ms`,
        details: {
          limit,
          window,
          current: state.count,
        },
      };
    }

    // Increment count
    state.count++;

    return null;
  }

  /**
   * Verify authentication requirements
   */
  public verifyAuthentication(
    manifest: HandlerManifest,
    authContext?: AuthContext
  ): RoutingError | null {
    if (!manifest.policies?.roles || manifest.policies.roles.length === 0) {
      return null;
    }

    if (!authContext) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          requiredRoles: manifest.policies.roles,
        },
      };
    }

    const hasRequiredRole = manifest.policies.roles.some(role =>
      authContext.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Insufficient permissions',
        details: {
          requiredRoles: manifest.policies.roles,
          userRoles: authContext.roles,
        },
      };
    }

    return null;
  }

  /**
   * Get handler instance
   */
  private getInstance(path: string, version: TSV): HandlerInstance | undefined {
    return this.instances.get(path)?.get(version);
  }

  /**
   * Cache manifest
   */
  private cacheManifest(manifest: HandlerManifest): void {
    if (this.manifestCache.size >= this.maxCacheSize) {
      const firstKey = this.manifestCache.keys().next().value;
      if (firstKey) {
        this.manifestCache.delete(firstKey);
      }
    }
    this.manifestCache.set(manifest.handlerId, manifest);
  }

  /**
   * Get cached manifest
   */
  public getManifest(handlerId: string): HandlerManifest | undefined {
    return this.manifestCache.get(handlerId);
  }

  /**
   * Cache GType schema
   */
  public cacheGType(ref: string, schema: unknown): void {
    if (this.gtypeCache.size >= this.maxCacheSize) {
      const firstKey = this.gtypeCache.keys().next().value;
      if (firstKey) {
        this.gtypeCache.delete(firstKey);
      }
    }
    this.gtypeCache.set(ref, schema);
  }

  /**
   * Get cached GType schema
   */
  public getGType(ref: string): unknown | undefined {
    return this.gtypeCache.get(ref);
  }

  /**
   * Maintain warm pool for critical versions
   */
  public maintainWarmPool(handlerId: string, config: WarmPoolConfig): void {
    this.warmPools.set(handlerId, config);
  }

  /**
   * Get warm pool configuration
   */
  public getWarmPoolConfig(handlerId: string): WarmPoolConfig | undefined {
    return this.warmPools.get(handlerId);
  }

  /**
   * Track usage metrics
   */
  public trackUsage(instanceId: string, metrics: Partial<UsageMetrics>): void {
    const existing = this.usageMetrics.get(instanceId) || {
      requestCount: 0,
      errorCount: 0,
      avgLatency: 0,
      lastAccessed: Date.now(),
    };

    this.usageMetrics.set(instanceId, {
      requestCount: existing.requestCount + (metrics.requestCount || 0),
      errorCount: existing.errorCount + (metrics.errorCount || 0),
      avgLatency: metrics.avgLatency !== undefined ? metrics.avgLatency : existing.avgLatency,
      lastAccessed: metrics.lastAccessed || existing.lastAccessed,
    });
  }

  /**
   * Get usage metrics
   */
  public getUsageMetrics(instanceId: string): UsageMetrics | undefined {
    return this.usageMetrics.get(instanceId);
  }

  /**
   * Get all instances for a path
   */
  public getInstances(path: string): HandlerInstance[] {
    const instances = this.instances.get(path);
    return instances ? Array.from(instances.values()) : [];
  }

  /**
   * Get all registered paths
   */
  public getPaths(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Update health status
   */
  public updateHealth(path: string, version: TSV, health: HealthStatus): void {
    const instance = this.getInstance(path, version);
    if (instance) {
      instance.health = health;
      this.healthCache.set(instance.id, health);
    }
  }

  /**
   * Get health status
   */
  public getHealth(path: string, version: TSV): HealthStatus | undefined {
    const instance = this.getInstance(path, version);
    return instance?.health;
  }

  /**
   * Start health check loop
   */
  private startHealthCheckLoop(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  /**
   * Perform health checks on all instances
   */
  private performHealthChecks(): void {
    for (const [path, versionMap] of this.instances) {
      for (const [version, instance] of versionMap) {
        // Simple health check: mark as degraded if not accessed recently
        const timeSinceAccess = Date.now() - instance.lastAccessed;
        const fiveMinutes = 5 * 60 * 1000;

        if (timeSinceAccess > fiveMinutes && instance.health.status === 'healthy') {
          instance.health.status = 'degraded';
          instance.health.lastCheck = Date.now();
        }
      }
    }
  }

  /**
   * Start rate limit cleanup
   */
  private startRateLimitCleanup(): void {
    setInterval(() => {
      this.cleanupRateLimits();
    }, this.rateLimitCleanupInterval);
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimits(): void {
    const now = Date.now();
    const maxWindow = 60000; // 1 minute max window

    for (const [key, state] of this.rateLimitState) {
      if (now - state.windowStart > maxWindow) {
        this.rateLimitState.delete(key);
      }
    }
  }

  /**
   * Get registry for external access
   */
  public getRegistry(): VersionRegistry {
    return this.registry;
  }

  /**
   * Get resolver for external access
   */
  public getResolver(): VersionResolver {
    return this.resolver;
  }

  /**
   * Clear all caches
   */
  public clearCaches(): void {
    this.manifestCache.clear();
    this.gtypeCache.clear();
    this.healthCache.clear();
    this.resolver.clearCache();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    manifests: number;
    gtypes: number;
    health: number;
    rateLimits: number;
  } {
    return {
      manifests: this.manifestCache.size,
      gtypes: this.gtypeCache.size,
      health: this.healthCache.size,
      rateLimits: this.rateLimitState.size,
    };
  }

  /**
   * Register a transformer pair
   */
  public registerTransformer(transformer: TransformerPair): void {
    this.transformerEngine.register(transformer);
  }

  /**
   * Get transformer between two versions
   */
  public getTransformer(from: TSV, to: TSV): TransformerPair | undefined {
    return this.transformerEngine.getTransformer(from, to);
  }

  /**
   * Check if transformer exists
   */
  public hasTransformer(from: TSV, to: TSV): boolean {
    return this.transformerEngine.hasTransformer(from, to);
  }

  /**
   * Transform request data from one version to another
   */
  public async transformRequest(
    data: unknown,
    fromVersion: TSV,
    toVersion: TSV,
    path: string
  ): Promise<TransformResult> {
    // Get all versions for this path
    const versions = this.getVersionsForPath(path);
    
    if (versions.length === 0) {
      return {
        success: false,
        error: new Error(`No versions found for path ${path}`),
        transformedVersions: [],
        chainLength: 0,
      };
    }

    // Execute transformation chain
    return this.transformerEngine.transformRequest(data, fromVersion, toVersion, versions, {
      maxHops: 10,
      timeout: 5000,
      fallbackOnError: false,
    });
  }

  /**
   * Transform response data from one version to another
   */
  public async transformResponse(
    data: unknown,
    fromVersion: TSV,
    toVersion: TSV,
    path: string
  ): Promise<TransformResult> {
    // Get all versions for this path
    const versions = this.getVersionsForPath(path);
    
    if (versions.length === 0) {
      return {
        success: false,
        error: new Error(`No versions found for path ${path}`),
        transformedVersions: [],
        chainLength: 0,
      };
    }

    // Execute transformation chain
    return this.transformerEngine.transformResponse(data, fromVersion, toVersion, versions, {
      maxHops: 10,
      timeout: 5000,
      fallbackOnError: false,
    });
  }

  /**
   * Get all versions for a path (sorted by timestamp)
   */
  private getVersionsForPath(path: string): TSV[] {
    const versionMap = this.instances.get(path);
    if (!versionMap) {
      return [];
    }

    return Array.from(versionMap.keys()).sort((a, b) => {
      const tsA = this.extractTimestamp(a);
      const tsB = this.extractTimestamp(b);
      return tsA - tsB;
    });
  }

  /**
   * Extract timestamp from TSV
   */
  private extractTimestamp(tsv: TSV): number {
    const match = tsv.match(/^tsv:(\d+)-/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extract requested version from headers
   */
  private extractRequestedVersion(headers: Record<string, string | string[] | undefined>): TSV | undefined {
    const versionHeader = headers['x-gati-version'] || headers['X-Gati-Version'];
    if (typeof versionHeader === 'string' && versionHeader.startsWith('tsv:')) {
      return versionHeader as TSV;
    }
    return undefined;
  }

  /**
   * Get transformer engine for external access
   */
  public getTransformerEngine(): TransformerEngine {
    return this.transformerEngine;
  }

  /**
   * Get all registered transformers
   */
  public getAllTransformers(): TransformerPair[] {
    return this.transformerEngine.getAllTransformers();
  }

  /**
   * Get transformer count
   */
  public getTransformerCount(): number {
    return this.transformerEngine.getTransformerCount();
  }
}

/**
 * Create an enhanced route manager instance
 */
export function createEnhancedRouteManager(
  registry?: VersionRegistry,
  transformerEngine?: TransformerEngine
): EnhancedRouteManager {
  return new EnhancedRouteManager(registry, transformerEngine);
}
