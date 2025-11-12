/**
 * @module plugins/aws/types
 * @description Type definitions for AWS EKS deployment plugin
 */

/**
 * AWS region configuration
 */
export type AWSRegion =
  | 'us-east-1'
  | 'us-east-2'
  | 'us-west-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'eu-central-1'
  | 'ap-south-1'
  | 'ap-southeast-1'
  | 'ap-southeast-2'
  | 'ap-northeast-1'
  | string;

/**
 * EKS cluster version
 */
export type EKSVersion = '1.28' | '1.29' | '1.30' | '1.31' | string;

/**
 * EC2 instance types for node groups
 */
export type InstanceType =
  | 't3.small'
  | 't3.medium'
  | 't3.large'
  | 't3.xlarge'
  | 'm5.large'
  | 'm5.xlarge'
  | 'm5.2xlarge'
  | 'c5.large'
  | 'c5.xlarge'
  | 'c5.2xlarge'
  | string;

/**
 * VPC configuration for EKS cluster
 */
export interface VPCConfig {
  /** CIDR block for VPC (e.g., '10.0.0.0/16') */
  cidr: string;
  /** Availability zones to use */
  availabilityZones: string[];
  /** Public subnet CIDRs */
  publicSubnets: string[];
  /** Private subnet CIDRs */
  privateSubnets: string[];
  /** Enable NAT gateway for private subnets */
  enableNat: boolean;
  /** Enable VPC flow logs */
  enableFlowLogs?: boolean;
}

/**
 * EKS node group configuration
 */
export interface NodeGroupConfig {
  /** Node group name */
  name: string;
  /** EC2 instance type */
  instanceType: InstanceType;
  /** Minimum number of nodes */
  minSize: number;
  /** Maximum number of nodes */
  maxSize: number;
  /** Desired number of nodes */
  desiredSize: number;
  /** Disk size in GB */
  diskSize: number;
  /** Node labels */
  labels?: Record<string, string>;
  /** Node taints */
  taints?: Array<{
    key: string;
    value: string;
    effect: 'NoSchedule' | 'NoExecute' | 'PreferNoSchedule';
  }>;
  /** SSH key name for node access */
  sshKeyName?: string;
}

/**
 * Application Load Balancer configuration
 */
export interface ALBConfig {
  /** Enable Application Load Balancer */
  enabled: boolean;
  /** ALB scheme (internal or internet-facing) */
  scheme: 'internal' | 'internet-facing';
  /** Certificate ARN for HTTPS */
  certificateArn?: string;
  /** Enable access logs */
  accessLogs?: {
    enabled: boolean;
    s3Bucket: string;
    s3Prefix?: string;
  };
  /** Health check configuration */
  healthCheck?: {
    path: string;
    interval: number;
    timeout: number;
    healthyThreshold: number;
    unhealthyThreshold: number;
  };
}

/**
 * IAM role configuration
 */
export interface IAMConfig {
  /** Cluster role name */
  clusterRoleName: string;
  /** Node group role name */
  nodeGroupRoleName: string;
  /** Additional policies to attach */
  additionalPolicies?: string[];
  /** Service account configurations for IRSA */
  serviceAccounts?: Array<{
    namespace: string;
    name: string;
    policyArns: string[];
  }>;
}

/**
 * Secrets Manager configuration
 */
export interface SecretsConfig {
  /** Enable Secrets Manager integration */
  enabled: boolean;
  /** Secret name prefix */
  secretPrefix: string;
  /** Secrets to create/manage */
  secrets?: Array<{
    name: string;
    description?: string;
    value?: string;
  }>;
  /** Enable automatic rotation */
  enableRotation?: boolean;
}

/**
 * EKS cluster configuration
 */
export interface EKSClusterConfig {
  /** Cluster name */
  clusterName: string;
  /** AWS region */
  region: AWSRegion;
  /** Kubernetes version */
  version: EKSVersion;
  /** VPC configuration */
  vpc: VPCConfig;
  /** Node group configurations */
  nodeGroups: NodeGroupConfig[];
  /** IAM configuration */
  iam: IAMConfig;
  /** ALB configuration */
  alb?: ALBConfig;
  /** Secrets configuration */
  secrets?: SecretsConfig;
  /** Enable cluster logging */
  logging?: {
    types: Array<'api' | 'audit' | 'authenticator' | 'controllerManager' | 'scheduler'>;
  };
  /** Resource tags */
  tags?: Record<string, string>;
}

/**
 * Deployment result
 */
export interface DeploymentResult {
  /** Cluster endpoint */
  endpoint: string;
  /** Cluster ARN */
  clusterArn: string;
  /** Load balancer DNS name */
  loadBalancerDns?: string;
  /** Kubeconfig content */
  kubeconfig: string;
  /** Created resources */
  resources: {
    vpcId: string;
    subnetIds: string[];
    securityGroupIds: string[];
    nodeGroupArns: string[];
  };
}

/**
 * AWS credentials
 */
export interface AWSCredentials {
  /** AWS access key ID */
  accessKeyId?: string;
  /** AWS secret access key */
  secretAccessKey?: string;
  /** AWS session token (for temporary credentials) */
  sessionToken?: string;
  /** AWS profile name */
  profile?: string;
  /** AWS region */
  region?: AWSRegion;
}

/**
 * Deployment options
 */
export interface DeploymentOptions {
  /** Dry run mode (validate without creating resources) */
  dryRun?: boolean;
  /** Wait for resources to be ready */
  wait?: boolean;
  /** Timeout in seconds */
  timeout?: number;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Resource status
 */
export interface ResourceStatus {
  /** Resource type */
  type: 'vpc' | 'subnet' | 'eks-cluster' | 'node-group' | 'alb' | 'secret';
  /** Resource ID/ARN */
  id: string;
  /** Resource name */
  name: string;
  /** Status */
  status: 'creating' | 'active' | 'failed' | 'deleting' | 'deleted';
  /** Status message */
  message?: string;
  /** Creation timestamp */
  createdAt?: Date;
}
