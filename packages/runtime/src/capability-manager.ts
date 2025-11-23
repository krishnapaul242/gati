/**
 * @module runtime/capability-manager
 * @description Capability-based security enforcement for modules
 * 
 * This implements capability enforcement from Task 10:
 * - Capability validation against module manifests
 * - Runtime capability checking
 * - Resource access control
 * 
 * Requirements: 5.3, 12.1, 12.2
 */

import type {
  Capability,
  CapabilityValidationResult,
  ModuleManifest,
  NetworkAccess,
} from './types/module-manifest.js';

/**
 * Capability Manager
 * 
 * Enforces capability-based security for modules.
 * Validates that modules only access resources they have declared capabilities for.
 */
export class CapabilityManager {
  /**
   * Map of module ID to granted capabilities
   */
  private grantedCapabilities: Map<string, Set<string>> = new Map();

  /**
   * Map of module ID to network access configuration
   */
  private networkAccess: Map<string, NetworkAccess> = new Map();

  /**
   * System-level capability policies
   * Defines which capabilities can be granted
   */
  private systemPolicies: Map<string, CapabilityPolicy> = new Map();

  constructor() {
    // Initialize default system policies
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default system capability policies
   */
  private initializeDefaultPolicies(): void {
    // Database capabilities
    this.systemPolicies.set('database:read', {
      name: 'database:read',
      description: 'Read access to database',
      grantable: true,
    });

    this.systemPolicies.set('database:write', {
      name: 'database:write',
      description: 'Write access to database',
      grantable: true,
    });

    // Filesystem capabilities
    this.systemPolicies.set('filesystem:read', {
      name: 'filesystem:read',
      description: 'Read access to filesystem',
      grantable: true,
    });

    this.systemPolicies.set('filesystem:write', {
      name: 'filesystem:write',
      description: 'Write access to filesystem',
      grantable: true,
    });

    // Network capabilities
    this.systemPolicies.set('network:egress', {
      name: 'network:egress',
      description: 'Outbound network access',
      grantable: true,
    });

    this.systemPolicies.set('network:ingress', {
      name: 'network:ingress',
      description: 'Inbound network access',
      grantable: true,
    });

    // Secrets capabilities
    this.systemPolicies.set('secrets:read', {
      name: 'secrets:read',
      description: 'Read access to secrets',
      grantable: true,
    });

    // Cache capabilities
    this.systemPolicies.set('cache:read', {
      name: 'cache:read',
      description: 'Read access to cache',
      grantable: true,
    });

    this.systemPolicies.set('cache:write', {
      name: 'cache:write',
      description: 'Write access to cache',
      grantable: true,
    });

    // Metrics capabilities
    this.systemPolicies.set('metrics:write', {
      name: 'metrics:write',
      description: 'Write access to metrics',
      grantable: true,
    });

    // Logging capabilities
    this.systemPolicies.set('logging:write', {
      name: 'logging:write',
      description: 'Write access to logs',
      grantable: true,
    });
  }

  /**
   * Validate module capabilities against system policies
   * 
   * @param manifest - Module manifest to validate
   * @returns Validation result with granted/denied capabilities
   */
  validateCapabilities(manifest: ModuleManifest): CapabilityValidationResult {
    const result: CapabilityValidationResult = {
      valid: true,
      granted: [],
      denied: [],
      missingRequired: [],
      errors: [],
    };

    // Validate each declared capability
    for (const capability of manifest.capabilities) {
      const policy = this.systemPolicies.get(capability.name);

      if (!policy) {
        // Unknown capability
        result.errors.push(`Unknown capability: ${capability.name}`);
        result.denied.push(capability.name);

        if (capability.required) {
          result.missingRequired.push(capability.name);
          result.valid = false;
        }
        continue;
      }

      if (!policy.grantable) {
        // Capability exists but cannot be granted
        result.errors.push(`Capability cannot be granted: ${capability.name}`);
        result.denied.push(capability.name);

        if (capability.required) {
          result.missingRequired.push(capability.name);
          result.valid = false;
        }
        continue;
      }

      // Grant the capability
      result.granted.push(capability.name);
    }

    // Validate network access
    if (manifest.networkAccess.egress) {
      const hasNetworkCapability = manifest.capabilities.some(
        (c) => c.name === 'network:egress'
      );

      if (!hasNetworkCapability) {
        result.errors.push(
          'Network egress enabled but network:egress capability not declared'
        );
        result.valid = false;
      }
    }

    if (manifest.networkAccess.ingress) {
      const hasNetworkCapability = manifest.capabilities.some(
        (c) => c.name === 'network:ingress'
      );

      if (!hasNetworkCapability) {
        result.errors.push(
          'Network ingress enabled but network:ingress capability not declared'
        );
        result.valid = false;
      }
    }

    return result;
  }

  /**
   * Register granted capabilities for a module
   * 
   * @param moduleId - Module identifier
   * @param capabilities - List of granted capabilities
   * @param networkAccess - Network access configuration
   */
  registerModule(
    moduleId: string,
    capabilities: string[],
    networkAccess: NetworkAccess
  ): void {
    this.grantedCapabilities.set(moduleId, new Set(capabilities));
    this.networkAccess.set(moduleId, networkAccess);
  }

  /**
   * Check if a module has a specific capability
   * 
   * @param moduleId - Module identifier
   * @param capability - Capability name to check
   * @returns True if module has the capability
   */
  hasCapability(moduleId: string, capability: string): boolean {
    const capabilities = this.grantedCapabilities.get(moduleId);
    return capabilities?.has(capability) ?? false;
  }

  /**
   * Enforce capability check - throws if module lacks capability
   * 
   * @param moduleId - Module identifier
   * @param capability - Required capability
   * @param operation - Description of operation being attempted
   * @throws {CapabilityError} If module lacks the required capability
   */
  enforceCapability(
    moduleId: string,
    capability: string,
    operation: string
  ): void {
    if (!this.hasCapability(moduleId, capability)) {
      throw new CapabilityError(
        `Module "${moduleId}" lacks required capability "${capability}" for operation: ${operation}`,
        moduleId,
        capability,
        operation
      );
    }
  }

  /**
   * Check if a module can access a specific network host
   * 
   * @param moduleId - Module identifier
   * @param host - Hostname to check
   * @param port - Port number to check
   * @returns True if access is allowed
   */
  canAccessNetwork(moduleId: string, host: string, port?: number): boolean {
    const access = this.networkAccess.get(moduleId);

    if (!access || !access.egress) {
      return false;
    }

    // Check if module has network:egress capability
    if (!this.hasCapability(moduleId, 'network:egress')) {
      return false;
    }

    // Check allowed hosts
    if (access.allowedHosts && access.allowedHosts.length > 0) {
      const hostAllowed = access.allowedHosts.some((allowedHost) => {
        // Support wildcard matching
        if (allowedHost.startsWith('*.')) {
          const domain = allowedHost.slice(2);
          return host.endsWith(domain);
        }
        return host === allowedHost;
      });

      if (!hostAllowed) {
        return false;
      }
    }

    // Check allowed ports
    if (port !== undefined && access.allowedPorts && access.allowedPorts.length > 0) {
      if (!access.allowedPorts.includes(port)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enforce network access check - throws if access is denied
   * 
   * @param moduleId - Module identifier
   * @param host - Hostname being accessed
   * @param port - Port number being accessed
   * @throws {NetworkAccessError} If network access is denied
   */
  enforceNetworkAccess(moduleId: string, host: string, port?: number): void {
    if (!this.canAccessNetwork(moduleId, host, port)) {
      throw new NetworkAccessError(
        `Module "${moduleId}" denied network access to ${host}${port ? `:${port}` : ''}`,
        moduleId,
        host,
        port
      );
    }
  }

  /**
   * Get all granted capabilities for a module
   * 
   * @param moduleId - Module identifier
   * @returns Array of granted capability names
   */
  getGrantedCapabilities(moduleId: string): string[] {
    const capabilities = this.grantedCapabilities.get(moduleId);
    return capabilities ? Array.from(capabilities) : [];
  }

  /**
   * Get network access configuration for a module
   * 
   * @param moduleId - Module identifier
   * @returns Network access configuration or undefined
   */
  getNetworkAccess(moduleId: string): NetworkAccess | undefined {
    return this.networkAccess.get(moduleId);
  }

  /**
   * Unregister a module and revoke all capabilities
   * 
   * @param moduleId - Module identifier
   */
  unregisterModule(moduleId: string): void {
    this.grantedCapabilities.delete(moduleId);
    this.networkAccess.delete(moduleId);
  }

  /**
   * Add a custom system capability policy
   * 
   * @param policy - Capability policy to add
   */
  addSystemPolicy(policy: CapabilityPolicy): void {
    this.systemPolicies.set(policy.name, policy);
  }

  /**
   * Get all system capability policies
   * 
   * @returns Array of capability policies
   */
  getSystemPolicies(): CapabilityPolicy[] {
    return Array.from(this.systemPolicies.values());
  }
}

/**
 * System capability policy
 */
export interface CapabilityPolicy {
  /**
   * Capability name
   */
  name: string;

  /**
   * Description of what this capability allows
   */
  description: string;

  /**
   * Whether this capability can be granted to modules
   */
  grantable: boolean;

  /**
   * Optional additional constraints
   */
  constraints?: Record<string, unknown>;
}

/**
 * Capability error thrown when a module attempts unauthorized access
 */
export class CapabilityError extends Error {
  public readonly moduleId: string;
  public readonly capability: string;
  public readonly operation: string;

  constructor(
    message: string,
    moduleId: string,
    capability: string,
    operation: string
  ) {
    super(message);
    this.name = 'CapabilityError';
    this.moduleId = moduleId;
    this.capability = capability;
    this.operation = operation;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CapabilityError);
    }
  }
}

/**
 * Network access error thrown when a module attempts unauthorized network access
 */
export class NetworkAccessError extends Error {
  public readonly moduleId: string;
  public readonly host: string;
  public readonly port?: number;

  constructor(
    message: string,
    moduleId: string,
    host: string,
    port?: number
  ) {
    super(message);
    this.name = 'NetworkAccessError';
    this.moduleId = moduleId;
    this.host = host;
    this.port = port;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkAccessError);
    }
  }
}
