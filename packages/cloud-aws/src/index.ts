/**
 * @module cloud-aws
 * @description AWS cloud provider implementation for Gati framework
 */

import type {
  ICloudProvider,
  CloudProvider,
  CloudProviderConfig,
  ClusterConfig,
  ClusterInfo,
  LoadBalancerConfig,
  LoadBalancerInfo,
  SecretConfig,
  DeploymentResult,
  ValidationResult,
} from '@gati-framework/core/cloud-provider';
import { EKSDeployment } from './deployment/eks.js';
import { AWSSecretsManager } from './secrets/secrets-manager.js';
import { AWSLoadBalancer } from './networking/load-balancer.js';

/**
 * AWS cloud provider implementation
 */
export class AWSCloudProvider implements ICloudProvider {
  readonly name: CloudProvider = 'aws';

  private region: string = 'us-east-1';
  private eksDeployment?: EKSDeployment;
  private secretsManager?: AWSSecretsManager;
  private loadBalancer?: AWSLoadBalancer;

  /**
   * Initialize AWS provider with configuration
   */
  async initialize(config: CloudProviderConfig): Promise<void> {
    this.region = config.region || 'us-east-1';

    // Initialize AWS SDK clients
    this.eksDeployment = new EKSDeployment(this.region);
    this.secretsManager = new AWSSecretsManager(this.region);
    this.loadBalancer = new AWSLoadBalancer(this.region);

    // Configure credentials if provided
    if (config.credentials) {
      process.env.AWS_ACCESS_KEY_ID = config.credentials.accessKeyId || '';
      process.env.AWS_SECRET_ACCESS_KEY =
        config.credentials.secretAccessKey || '';
      if (config.credentials.sessionToken) {
        process.env.AWS_SESSION_TOKEN = config.credentials.sessionToken;
      }
    }
  }

  /**
   * Create EKS cluster
   */
  async createCluster(config: ClusterConfig): Promise<DeploymentResult> {
    if (!this.eksDeployment) {
      throw new Error('AWS provider not initialized');
    }

    return this.eksDeployment.createCluster(config);
  }

  /**
   * Delete EKS cluster
   */
  async deleteCluster(clusterName: string): Promise<void> {
    if (!this.eksDeployment) {
      throw new Error('AWS provider not initialized');
    }

    await this.eksDeployment.deleteCluster(clusterName);
  }

  /**
   * Get EKS cluster information
   */
  async getCluster(clusterName: string): Promise<ClusterInfo> {
    if (!this.eksDeployment) {
      throw new Error('AWS provider not initialized');
    }

    return this.eksDeployment.getCluster(clusterName);
  }

  /**
   * Create Application Load Balancer
   */
  async createLoadBalancer(config: LoadBalancerConfig): Promise<LoadBalancerInfo> {
    if (!this.loadBalancer) {
      throw new Error('AWS provider not initialized');
    }

    return this.loadBalancer.createLoadBalancer(config);
  }

  /**
   * Delete load balancer
   */
  async deleteLoadBalancer(name: string): Promise<void> {
    if (!this.loadBalancer) {
      throw new Error('AWS provider not initialized');
    }

    await this.loadBalancer.deleteLoadBalancer(name);
  }

  /**
   * Store secret in AWS Secrets Manager
   */
  async storeSecret(config: SecretConfig): Promise<void> {
    if (!this.secretsManager) {
      throw new Error('AWS provider not initialized');
    }

    await this.secretsManager.storeSecret(config);
  }

  /**
   * Retrieve secret from AWS Secrets Manager
   */
  async retrieveSecret(name: string): Promise<Record<string, string>> {
    if (!this.secretsManager) {
      throw new Error('AWS provider not initialized');
    }

    return this.secretsManager.retrieveSecret(name);
  }

  /**
   * Delete secret from AWS Secrets Manager
   */
  async deleteSecret(name: string): Promise<void> {
    if (!this.secretsManager) {
      throw new Error('AWS provider not initialized');
    }

    await this.secretsManager.deleteSecret(name);
  }

  /**
   * Get kubeconfig for EKS cluster
   */
  async getKubeconfig(clusterName: string): Promise<string> {
    if (!this.eksDeployment) {
      throw new Error('AWS provider not initialized');
    }

    return this.eksDeployment.getKubeconfig(clusterName);
  }

  /**
   * Validate cluster configuration
   */
  async validateConfig(config: ClusterConfig): Promise<ValidationResult> {
    if (!this.eksDeployment) {
      throw new Error('AWS provider not initialized');
    }

    return this.eksDeployment.validateConfig(config);
  }
}

export * from './deployment/eks.js';
export * from './secrets/secrets-manager.js';
export * from './networking/load-balancer.js';
