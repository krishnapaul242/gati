/**
 * @module cloud-aws/deployment/eks
 * @description AWS EKS cluster deployment and management
 */

import {
  EKSClient,
  CreateClusterCommand,
  DeleteClusterCommand,
  DescribeClusterCommand,
  CreateNodegroupCommand,
  DeleteNodegroupCommand,
  DescribeNodegroupCommand,
  ListNodegroupsCommand,
  UpdateClusterVersionCommand,
  type Cluster,
  type Nodegroup,
} from '@aws-sdk/client-eks';
import {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  GetRoleCommand,
  type Role,
} from '@aws-sdk/client-iam';
import type {
  ClusterConfig,
  ClusterInfo,
  NodePoolInfo,
  DeploymentResult,
  ValidationResult,
} from '@gati-framework/core';

/**
 * EKS deployment manager
 */
export class EKSDeployment {
  private eksClient: EKSClient;
  private iamClient: IAMClient;
  private region: string;

  constructor(region: string = 'us-east-1') {
    this.region = region;
    this.eksClient = new EKSClient({ region });
    this.iamClient = new IAMClient({ region });
  }

  /**
   * Create EKS cluster with node groups
   */
  async createCluster(config: ClusterConfig): Promise<DeploymentResult> {
    try {
      // Create IAM role for cluster
      const clusterRole = await this.createClusterRole(config.name);

      // Create cluster
      const createClusterCommand = new CreateClusterCommand({
        name: config.name,
        version: config.version,
        roleArn: clusterRole.Arn,
        resourcesVpcConfig: {
          subnetIds: config.network?.subnetIds || [],
          endpointPrivateAccess: config.network?.privateNetworking,
          endpointPublicAccess: !config.network?.privateNetworking,
        },
        tags: {
          ManagedBy: 'Gati',
          Environment: 'production',
        },
      });

      const clusterResponse = await this.eksClient.send(createClusterCommand);

      // Wait for cluster to be active
      await this.waitForClusterActive(config.name);

      // Create node groups
      for (const nodePool of config.nodePools) {
        await this.createNodeGroup(config.name, nodePool);
      }

      const cluster = await this.getCluster(config.name);

      return {
        success: true,
        clusterEndpoint: cluster.endpoint,
        metadata: {
          clusterName: config.name,
          region: this.region,
          status: cluster.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create IAM role for EKS cluster
   */
  private async createClusterRole(clusterName: string): Promise<Role> {
    const roleName = `${clusterName}-eks-cluster-role`;

    try {
      // Check if role already exists
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const existingRole = await this.iamClient.send(getRoleCommand);
      return existingRole.Role!;
    } catch {
      // Role doesn't exist, create it
      const createRoleCommand = new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      });

      const roleResponse = await this.iamClient.send(createRoleCommand);

      // Attach required policies
      const policies = [
        'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
        'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      ];

      for (const policyArn of policies) {
        await this.iamClient.send(
          new AttachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: policyArn,
          })
        );
      }

      return roleResponse.Role!;
    }
  }

  /**
   * Create node group for EKS cluster
   */
  private async createNodeGroup(
    clusterName: string,
    nodePool: any
  ): Promise<void> {
    const nodeRole = await this.createNodeRole(clusterName, nodePool.name);

    const createNodeGroupCommand = new CreateNodegroupCommand({
      clusterName,
      nodegroupName: nodePool.name,
      scalingConfig: {
        minSize: nodePool.minNodes,
        maxSize: nodePool.maxNodes,
        desiredSize: nodePool.desiredNodes,
      },
      subnets: [], // Will be filled from cluster VPC
      nodeRole: nodeRole.Arn,
      instanceTypes: [nodePool.instanceType],
      diskSize: nodePool.diskSizeGb || 20,
      labels: nodePool.labels,
      taints: nodePool.taints?.map((t: any) => ({
        key: t.key,
        value: t.value,
        effect: t.effect,
      })),
    });

    await this.eksClient.send(createNodeGroupCommand);
  }

  /**
   * Create IAM role for node group
   */
  private async createNodeRole(
    clusterName: string,
    nodeGroupName: string
  ): Promise<Role> {
    const roleName = `${clusterName}-${nodeGroupName}-node-role`;

    try {
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const existingRole = await this.iamClient.send(getRoleCommand);
      return existingRole.Role!;
    } catch {
      const createRoleCommand = new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      });

      const roleResponse = await this.iamClient.send(createRoleCommand);

      // Attach required policies
      const policies = [
        'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
        'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
        'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      ];

      for (const policyArn of policies) {
        await this.iamClient.send(
          new AttachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: policyArn,
          })
        );
      }

      return roleResponse.Role!;
    }
  }

  /**
   * Wait for cluster to become active
   */
  private async waitForClusterActive(
    clusterName: string,
    maxWaitMinutes: number = 15
  ): Promise<void> {
    const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      const cluster = await this.getCluster(clusterName);
      
      if (cluster.status === 'ACTIVE') {
        return;
      }

      if (cluster.status === 'FAILED') {
        throw new Error(`Cluster creation failed: ${clusterName}`);
      }

      // Wait 30 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 30000));
      attempts++;
    }

    throw new Error(`Cluster creation timeout: ${clusterName}`);
  }

  /**
   * Get cluster information
   */
  async getCluster(clusterName: string): Promise<ClusterInfo> {
    const describeCommand = new DescribeClusterCommand({
      name: clusterName,
    });

    const response = await this.eksClient.send(describeCommand);
    const cluster = response.cluster!;

    // Get node groups
    const nodeGroupsCommand = new ListNodegroupsCommand({
      clusterName,
    });
    const nodeGroupsResponse = await this.eksClient.send(nodeGroupsCommand);
    const nodeGroups: NodePoolInfo[] = [];

    for (const nodeGroupName of nodeGroupsResponse.nodegroups || []) {
      const describeNodeGroupCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const ngResponse = await this.eksClient.send(describeNodeGroupCommand);
      const ng = ngResponse.nodegroup!;

      nodeGroups.push({
        name: nodeGroupName,
        instanceType: ng.instanceTypes?.[0] || 'unknown',
        nodeCount: ng.scalingConfig?.desiredSize || 0,
        status: ng.status || 'UNKNOWN',
      });
    }

    return {
      name: cluster.name!,
      status: cluster.status as any,
      endpoint: cluster.endpoint,
      version: cluster.version!,
      createdAt: cluster.createdAt,
      nodePools: nodeGroups,
    };
  }

  /**
   * Delete EKS cluster
   */
  async deleteCluster(clusterName: string): Promise<void> {
    // Delete node groups first
    const nodeGroupsCommand = new ListNodegroupsCommand({
      clusterName,
    });
    const nodeGroupsResponse = await this.eksClient.send(nodeGroupsCommand);

    for (const nodeGroupName of nodeGroupsResponse.nodegroups || []) {
      const deleteNodeGroupCommand = new DeleteNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      await this.eksClient.send(deleteNodeGroupCommand);
    }

    // Wait for node groups to be deleted
    await new Promise((resolve) => setTimeout(resolve, 60000));

    // Delete cluster
    const deleteClusterCommand = new DeleteClusterCommand({
      name: clusterName,
    });
    await this.eksClient.send(deleteClusterCommand);
  }

  /**
   * Validate cluster configuration
   */
  async validateConfig(config: ClusterConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate cluster name
    if (!config.name || config.name.length < 1 || config.name.length > 100) {
      errors.push('Cluster name must be between 1 and 100 characters');
    }

    // Validate Kubernetes version
    const validVersions = ['1.28', '1.29', '1.30'];
    if (!validVersions.some((v) => config.version.startsWith(v))) {
      errors.push(
        `Kubernetes version must be one of: ${validVersions.join(', ')}`
      );
    }

    // Validate node pools
    if (!config.nodePools || config.nodePools.length === 0) {
      errors.push('At least one node pool is required');
    } else {
      for (const nodePool of config.nodePools) {
        if (nodePool.minNodes > nodePool.maxNodes) {
          errors.push(
            `Node pool ${nodePool.name}: minNodes cannot exceed maxNodes`
          );
        }
        if (
          nodePool.desiredNodes < nodePool.minNodes ||
          nodePool.desiredNodes > nodePool.maxNodes
        ) {
          errors.push(
            `Node pool ${nodePool.name}: desiredNodes must be between minNodes and maxNodes`
          );
        }
      }
    }

    // Validate network config
    if (config.network?.subnetIds && config.network.subnetIds.length < 2) {
      warnings.push('At least 2 subnets recommended for high availability');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get kubeconfig for cluster
   */
  async getKubeconfig(clusterName: string): Promise<string> {
    const cluster = await this.getCluster(clusterName);

    const kubeconfig = {
      apiVersion: 'v1',
      kind: 'Config',
      clusters: [
        {
          name: clusterName,
          cluster: {
            server: cluster.endpoint,
            'certificate-authority-data': '', // Will be populated from cluster
          },
        },
      ],
      contexts: [
        {
          name: clusterName,
          context: {
            cluster: clusterName,
            user: clusterName,
          },
        },
      ],
      'current-context': clusterName,
      users: [
        {
          name: clusterName,
          user: {
            exec: {
              apiVersion: 'client.authentication.k8s.io/v1beta1',
              command: 'aws',
              args: [
                'eks',
                'get-token',
                '--cluster-name',
                clusterName,
                '--region',
                this.region,
              ],
            },
          },
        },
      ],
    };

    return JSON.stringify(kubeconfig, null, 2);
  }
}
