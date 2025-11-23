/**
 * @module runtime/types/module-manifest
 * @description Module manifest and capability system for Gati framework
 * 
 * This implements Task 10 from the runtime architecture spec:
 * - Module Manifest structure
 * - Capability declaration and validation
 * - Network access configuration
 * - Module method definitions with input/output types
 * 
 * Requirements: 5.3, 12.1, 12.2
 */

/**
 * Module runtime type
 */
export type ModuleRuntime = 'node' | 'wasm' | 'oci' | 'binary';

/**
 * Capability declaration for module security
 * 
 * Capabilities define what resources a module is allowed to access.
 * The Global Context enforces these capabilities at runtime.
 */
export interface Capability {
  /**
   * Unique capability name (e.g., 'database:read', 'filesystem:write')
   */
  name: string;

  /**
   * Human-readable description of what this capability allows
   */
  description: string;

  /**
   * Whether this capability is required for the module to function
   * If true, module initialization will fail if capability cannot be granted
   */
  required: boolean;

  /**
   * Optional resource constraints for this capability
   * For example, database:read might specify which tables are accessible
   */
  resources?: string[];
}

/**
 * Network access configuration for modules
 * 
 * By default, modules are denied external network egress for security.
 * This configuration allows explicit network access grants.
 */
export interface NetworkAccess {
  /**
   * Whether the module is allowed to make external network requests
   * Default: false
   */
  egress: boolean;

  /**
   * List of allowed hostnames for egress (if egress is true)
   * If undefined, all hosts are allowed when egress is true
   * If empty array, no hosts are allowed (egress effectively disabled)
   */
  allowedHosts?: string[];

  /**
   * List of allowed ports for egress
   * If undefined, all ports are allowed
   */
  allowedPorts?: number[];

  /**
   * Whether the module can accept incoming network connections
   * Default: false
   */
  ingress?: boolean;

  /**
   * Ports the module listens on (if ingress is true)
   */
  ingressPorts?: number[];
}

/**
 * Module method definition with type information
 * 
 * Defines the interface for RPC calls to module methods.
 */
export interface ModuleMethod {
  /**
   * Method name (must be unique within the module)
   */
  name: string;

  /**
   * GType reference for input validation
   * References a GType schema in the Manifest Store
   */
  inputType: string;

  /**
   * GType reference for output validation
   * References a GType schema in the Manifest Store
   */
  outputType: string;

  /**
   * Optional method description
   */
  description?: string;

  /**
   * Timeout in milliseconds for this method
   * If undefined, uses module-level or system default timeout
   */
  timeout?: number;

  /**
   * Whether this method is idempotent
   * Idempotent methods can be safely retried
   */
  idempotent?: boolean;

  /**
   * Retry configuration for this method
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     */
    maxAttempts: number;

    /**
     * Initial delay in milliseconds before first retry
     */
    initialDelay: number;

    /**
     * Backoff multiplier for exponential backoff
     */
    backoffMultiplier: number;

    /**
     * Maximum delay in milliseconds between retries
     */
    maxDelay: number;
  };
}

/**
 * Module Manifest
 * 
 * Complete metadata describing a module's interface, capabilities, and requirements.
 * Generated during module registration and stored in the Manifest Store.
 */
export interface ModuleManifest {
  /**
   * Unique module identifier (e.g., 'user-service', 'email-sender')
   */
  moduleId: string;

  /**
   * Module version (semver format)
   */
  version: string;

  /**
   * Runtime environment for the module
   */
  runtime: ModuleRuntime;

  /**
   * Capabilities required by this module
   * The Global Context enforces these at runtime
   */
  capabilities: Capability[];

  /**
   * Methods exposed by this module for RPC calls
   */
  methods: ModuleMethod[];

  /**
   * Network access configuration
   */
  networkAccess: NetworkAccess;

  /**
   * Optional module description
   */
  description?: string;

  /**
   * Module dependencies (other modules this module requires)
   */
  dependencies?: string[];

  /**
   * Resource limits for the module
   */
  resources?: {
    /**
     * Maximum memory in MB
     */
    maxMemory?: number;

    /**
     * Maximum CPU cores
     */
    maxCpu?: number;

    /**
     * Maximum disk space in MB
     */
    maxDisk?: number;
  };

  /**
   * Health check configuration
   */
  healthCheck?: {
    /**
     * Health check endpoint or method name
     */
    endpoint: string;

    /**
     * Interval in milliseconds between health checks
     */
    interval: number;

    /**
     * Timeout in milliseconds for health check
     */
    timeout: number;

    /**
     * Number of consecutive failures before marking unhealthy
     */
    unhealthyThreshold: number;

    /**
     * Number of consecutive successes before marking healthy
     */
    healthyThreshold: number;
  };

  /**
   * Manifest hash for integrity verification
   */
  hash: string;

  /**
   * Timestamp when manifest was created
   */
  createdAt: number;
}

/**
 * Capability validation result
 */
export interface CapabilityValidationResult {
  /**
   * Whether all required capabilities can be granted
   */
  valid: boolean;

  /**
   * List of capabilities that were granted
   */
  granted: string[];

  /**
   * List of capabilities that were denied
   */
  denied: string[];

  /**
   * List of missing required capabilities
   */
  missingRequired: string[];

  /**
   * Validation errors
   */
  errors: string[];
}

/**
 * Module manifest validation result
 */
export interface ManifestValidationResult {
  /**
   * Whether the manifest is valid
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings (non-fatal issues)
   */
  warnings: string[];
}
