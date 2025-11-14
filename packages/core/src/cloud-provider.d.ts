/**
 * @module cloud-provider
 * @description Common cloud provider interface for unified multi-cloud abstraction
 */
/**
 * Cloud provider types supported by Gati
 */
export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'local';
/**
 * Deployment environment configuration
 */
export interface DeploymentEnvironment {
    /** Environment name (development, staging, production) */
    name: 'development' | 'staging' | 'production';
    /** Cloud provider to use */
    provider: CloudProvider;
    /** Region for deployment */
    region: string;
    /** Availability zones */
    availabilityZones?: string[];
    /** Custom tags/labels */
    tags?: Record<string, string>;
}
/**
 * Cluster configuration for Kubernetes
 */
export interface ClusterConfig {
    /** Cluster name */
    name: string;
    /** Kubernetes version */
    version: string;
    /** VPC/Network configuration */
    network?: NetworkConfig;
    /** Node pool configuration */
    nodePools: NodePoolConfig[];
    /** Auto-scaling configuration */
    autoscaling?: AutoScalingConfig;
}
/**
 * Network configuration for cluster
 */
export interface NetworkConfig {
    /** VPC/VNet ID or name */
    vpcId?: string;
    /** Subnet IDs */
    subnetIds?: string[];
    /** CIDR block */
    cidrBlock?: string;
    /** Enable private networking */
    privateNetworking?: boolean;
}
/**
 * Node pool configuration
 */
export interface NodePoolConfig {
    /** Node pool name */
    name: string;
    /** Instance type/size */
    instanceType: string;
    /** Minimum number of nodes */
    minNodes: number;
    /** Maximum number of nodes */
    maxNodes: number;
    /** Desired number of nodes */
    desiredNodes: number;
    /** Disk size in GB */
    diskSizeGb?: number;
    /** Labels for nodes */
    labels?: Record<string, string>;
    /** Taints for nodes */
    taints?: NodeTaint[];
}
/**
 * Node taint configuration
 */
export interface NodeTaint {
    key: string;
    value: string;
    effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}
/**
 * Auto-scaling configuration
 */
export interface AutoScalingConfig {
    /** Enable cluster autoscaler */
    enabled: boolean;
    /** Minimum total nodes across all pools */
    minNodes?: number;
    /** Maximum total nodes across all pools */
    maxNodes?: number;
    /** Scale down delay */
    scaleDownDelay?: string;
    /** Unneeded time threshold */
    unneededTime?: string;
}
/**
 * Load balancer configuration
 */
export interface LoadBalancerConfig {
    /** Load balancer type */
    type: 'application' | 'network' | 'classic';
    /** Internal or external */
    scheme: 'internal' | 'internet-facing';
    /** Target port */
    targetPort: number;
    /** Health check configuration */
    healthCheck?: HealthCheckConfig;
    /** SSL/TLS configuration */
    ssl?: SSLConfig;
}
/**
 * Health check configuration
 */
export interface HealthCheckConfig {
    /** Health check path */
    path: string;
    /** Health check port */
    port?: number;
    /** Protocol (HTTP, HTTPS, TCP) */
    protocol?: 'HTTP' | 'HTTPS' | 'TCP';
    /** Interval in seconds */
    intervalSeconds?: number;
    /** Timeout in seconds */
    timeoutSeconds?: number;
    /** Healthy threshold */
    healthyThreshold?: number;
    /** Unhealthy threshold */
    unhealthyThreshold?: number;
}
/**
 * SSL/TLS configuration
 */
export interface SSLConfig {
    /** Certificate ARN/ID */
    certificateId?: string;
    /** SSL policy */
    sslPolicy?: string;
    /** Enable HTTP to HTTPS redirect */
    redirectHttp?: boolean;
}
/**
 * Secret configuration
 */
export interface SecretConfig {
    /** Secret name */
    name: string;
    /** Secret key-value pairs */
    values: Record<string, string>;
    /** Secret tags/labels */
    tags?: Record<string, string>;
}
/**
 * Deployment result
 */
export interface DeploymentResult {
    /** Deployment success status */
    success: boolean;
    /** Cluster endpoint URL */
    clusterEndpoint?: string;
    /** Load balancer endpoint */
    loadBalancerEndpoint?: string;
    /** Kubeconfig for cluster access */
    kubeconfig?: string;
    /** Error message if failed */
    error?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Cloud provider interface
 * All cloud provider plugins must implement this interface
 */
export interface ICloudProvider {
    /** Provider name */
    readonly name: CloudProvider;
    /**
     * Initialize the cloud provider with credentials and configuration
     */
    initialize(config: CloudProviderConfig): Promise<void>;
    /**
     * Create or update a Kubernetes cluster
     */
    createCluster(config: ClusterConfig): Promise<DeploymentResult>;
    /**
     * Delete a Kubernetes cluster
     */
    deleteCluster(clusterName: string): Promise<void>;
    /**
     * Get cluster information
     */
    getCluster(clusterName: string): Promise<ClusterInfo>;
    /**
     * Create or update load balancer
     */
    createLoadBalancer(config: LoadBalancerConfig): Promise<LoadBalancerInfo>;
    /**
     * Delete load balancer
     */
    deleteLoadBalancer(name: string): Promise<void>;
    /**
     * Store secret in cloud secret manager
     */
    storeSecret(config: SecretConfig): Promise<void>;
    /**
     * Retrieve secret from cloud secret manager
     */
    retrieveSecret(name: string): Promise<Record<string, string>>;
    /**
     * Delete secret from cloud secret manager
     */
    deleteSecret(name: string): Promise<void>;
    /**
     * Get kubeconfig for cluster
     */
    getKubeconfig(clusterName: string): Promise<string>;
    /**
     * Validate configuration
     */
    validateConfig(config: ClusterConfig): Promise<ValidationResult>;
}
/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
    /** Provider-specific credentials */
    credentials?: Record<string, string>;
    /** Default region */
    region?: string;
    /** Additional configuration */
    options?: Record<string, unknown>;
}
/**
 * Cluster information
 */
export interface ClusterInfo {
    /** Cluster name */
    name: string;
    /** Cluster status */
    status: 'CREATING' | 'ACTIVE' | 'DELETING' | 'FAILED' | 'UPDATING';
    /** Cluster endpoint */
    endpoint?: string;
    /** Kubernetes version */
    version: string;
    /** Creation timestamp */
    createdAt?: Date;
    /** Node pools */
    nodePools?: NodePoolInfo[];
}
/**
 * Node pool information
 */
export interface NodePoolInfo {
    /** Node pool name */
    name: string;
    /** Instance type */
    instanceType: string;
    /** Current node count */
    nodeCount: number;
    /** Node pool status */
    status: string;
}
/**
 * Load balancer information
 */
export interface LoadBalancerInfo {
    /** Load balancer name */
    name: string;
    /** Load balancer DNS name or IP */
    endpoint: string;
    /** Load balancer status */
    status: string;
}
/**
 * Validation result
 */
export interface ValidationResult {
    /** Validation success */
    valid: boolean;
    /** Validation errors */
    errors: string[];
    /** Validation warnings */
    warnings?: string[];
}
/**
 * Factory for creating cloud provider instances
 */
export declare class CloudProviderFactory {
    private static providers;
    /**
     * Register a cloud provider implementation
     */
    static register(name: CloudProvider, factory: () => ICloudProvider): void;
    /**
     * Create a cloud provider instance
     */
    static create(name: CloudProvider): ICloudProvider;
    /**
     * Check if a provider is registered
     */
    static has(name: CloudProvider): boolean;
    /**
     * Get list of registered providers
     */
    static getRegistered(): CloudProvider[];
}
//# sourceMappingURL=cloud-provider.d.ts.map