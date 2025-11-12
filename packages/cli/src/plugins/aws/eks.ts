/**
 * @module plugins/aws/eks
 * @description AWS EKS cluster management
 */

import type {
  EKSClusterConfig,
  NodeGroupConfig,
  DeploymentOptions,
  ResourceStatus,
} from './types';

/**
 * Generate CloudFormation template for EKS cluster
 */
export function generateEKSClusterTemplate(config: EKSClusterConfig): string {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `Gati EKS Cluster: ${config.clusterName}`,
    
    Parameters: {
      ClusterName: {
        Type: 'String',
        Default: config.clusterName,
        Description: 'Name of the EKS cluster',
      },
    },
    
    Resources: {
      ClusterSecurityGroup: {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          GroupDescription: `Security group for ${config.clusterName} EKS cluster`,
          VpcId: { 'Fn::ImportValue': `${config.clusterName}-VpcId` },
          Tags: [
            { Key: 'Name', Value: `${config.clusterName}-cluster-sg` },
            { Key: 'kubernetes.io/cluster/' + config.clusterName, Value: 'owned' },
          ],
        },
      },
      
      ClusterRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: config.iam.clusterRoleName,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'eks.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
            'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
          ],
        },
      },
      
      EKSCluster: {
        Type: 'AWS::EKS::Cluster',
        DependsOn: ['ClusterRole'],
        Properties: {
          Name: config.clusterName,
          Version: config.version,
          RoleArn: { 'Fn::GetAtt': ['ClusterRole', 'Arn'] },
          ResourcesVpcConfig: {
            SecurityGroupIds: [{ Ref: 'ClusterSecurityGroup' }],
            SubnetIds: {
              'Fn::Split': [
                ',',
                {
                  'Fn::Join': [
                    ',',
                    [
                      { 'Fn::ImportValue': `${config.clusterName}-PublicSubnetIds` },
                      { 'Fn::ImportValue': `${config.clusterName}-PrivateSubnetIds` },
                    ],
                  ],
                },
              ],
            },
            EndpointPublicAccess: true,
            EndpointPrivateAccess: true,
          },
          Logging: config.logging
            ? {
                ClusterLogging: {
                  EnabledTypes: config.logging.types.map((type) => ({
                    Type: type,
                  })),
                },
              }
            : undefined,
          Tags: config.tags
            ? Object.entries(config.tags).map(([Key, Value]) => ({ Key, Value }))
            : [],
        },
      },
    },
    
    Outputs: {
      ClusterEndpoint: {
        Value: { 'Fn::GetAtt': ['EKSCluster', 'Endpoint'] },
        Export: { Name: `${config.clusterName}-Endpoint` },
      },
      ClusterArn: {
        Value: { 'Fn::GetAtt': ['EKSCluster', 'Arn'] },
        Export: { Name: `${config.clusterName}-Arn` },
      },
      ClusterSecurityGroupId: {
        Value: { Ref: 'ClusterSecurityGroup' },
        Export: { Name: `${config.clusterName}-SecurityGroupId` },
      },
    },
  };
  
  return JSON.stringify(template, null, 2);
}

/**
 * Generate CloudFormation template for node group
 */
export function generateNodeGroupTemplate(
  clusterName: string,
  nodeGroup: NodeGroupConfig,
  nodeRoleName: string
): string {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `Node group ${nodeGroup.name} for cluster ${clusterName}`,
    
    Resources: {
      NodeSecurityGroup: {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          GroupDescription: `Security group for ${nodeGroup.name} node group`,
          VpcId: { 'Fn::ImportValue': `${clusterName}-VpcId` },
          SecurityGroupIngress: [
            {
              Description: 'Allow nodes to communicate with each other',
              IpProtocol: '-1',
              SourceSecurityGroupId: { Ref: 'NodeSecurityGroup' },
            },
            {
              Description: 'Allow pods to communicate with the cluster API Server',
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              SourceSecurityGroupId: { 'Fn::ImportValue': `${clusterName}-SecurityGroupId` },
            },
          ],
          SecurityGroupEgress: [
            {
              Description: 'Allow all outbound traffic',
              IpProtocol: '-1',
              CidrIp: '0.0.0.0/0',
            },
          ],
          Tags: [
            { Key: 'Name', Value: `${clusterName}-${nodeGroup.name}-sg` },
            { Key: 'kubernetes.io/cluster/' + clusterName, Value: 'owned' },
          ],
        },
      },
      
      NodeRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `${nodeRoleName}-${nodeGroup.name}`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'ec2.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
            ],
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
            'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
            'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
          ],
        },
      },
      
      NodeGroup: {
        Type: 'AWS::EKS::Nodegroup',
        DependsOn: ['NodeRole'],
        Properties: {
          ClusterName: clusterName,
          NodegroupName: nodeGroup.name,
          NodeRole: { 'Fn::GetAtt': ['NodeRole', 'Arn'] },
          Subnets: {
            'Fn::Split': [',', { 'Fn::ImportValue': `${clusterName}-PrivateSubnetIds` }],
          },
          ScalingConfig: {
            MinSize: nodeGroup.minSize,
            MaxSize: nodeGroup.maxSize,
            DesiredSize: nodeGroup.desiredSize,
          },
          DiskSize: nodeGroup.diskSize,
          InstanceTypes: [nodeGroup.instanceType],
          RemoteAccess: nodeGroup.sshKeyName
            ? {
                Ec2SshKey: nodeGroup.sshKeyName,
                SourceSecurityGroups: [{ Ref: 'NodeSecurityGroup' }],
              }
            : undefined,
          Labels: nodeGroup.labels,
          Taints: nodeGroup.taints,
          Tags: {
            Name: `${clusterName}-${nodeGroup.name}`,
            [`kubernetes.io/cluster/${clusterName}`]: 'owned',
          },
        },
      },
    },
    
    Outputs: {
      NodeGroupArn: {
        Value: { 'Fn::GetAtt': ['NodeGroup', 'Arn'] },
        Export: { Name: `${clusterName}-${nodeGroup.name}-Arn` },
      },
      NodeSecurityGroupId: {
        Value: { Ref: 'NodeSecurityGroup' },
        Export: { Name: `${clusterName}-${nodeGroup.name}-SecurityGroupId` },
      },
    },
  };
  
  return JSON.stringify(template, null, 2);
}

/**
 * Generate kubeconfig file content
 */
export function generateKubeconfig(
  clusterName: string,
  endpoint: string,
  certificateAuthority: string,
  region: string
): string {
  return `apiVersion: v1
kind: Config
clusters:
- cluster:
    server: ${endpoint}
    certificate-authority-data: ${certificateAuthority}
  name: ${clusterName}
contexts:
- context:
    cluster: ${clusterName}
    user: ${clusterName}
  name: ${clusterName}
current-context: ${clusterName}
users:
- name: ${clusterName}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
        - eks
        - get-token
        - --cluster-name
        - ${clusterName}
        - --region
        - ${region}
`;
}

/**
 * Validate EKS cluster configuration
 */
export function validateEKSConfig(config: EKSClusterConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate cluster name
  if (!config.clusterName || config.clusterName.length === 0) {
    errors.push('Cluster name is required');
  }
  
  if (config.clusterName.length > 100) {
    errors.push('Cluster name must be 100 characters or less');
  }
  
  // Validate version
  const validVersions = ['1.28', '1.29', '1.30', '1.31'];
  if (!validVersions.includes(config.version)) {
    errors.push(`Invalid Kubernetes version: ${config.version}. Supported: ${validVersions.join(', ')}`);
  }
  
  // Validate node groups
  if (!config.nodeGroups || config.nodeGroups.length === 0) {
    errors.push('At least one node group is required');
  }
  
  config.nodeGroups.forEach((ng, index) => {
    if (!ng.name) {
      errors.push(`Node group ${index + 1}: name is required`);
    }
    
    if (ng.minSize < 1) {
      errors.push(`Node group ${ng.name}: minSize must be at least 1`);
    }
    
    if (ng.maxSize < ng.minSize) {
      errors.push(`Node group ${ng.name}: maxSize must be >= minSize`);
    }
    
    if (ng.desiredSize < ng.minSize || ng.desiredSize > ng.maxSize) {
      errors.push(`Node group ${ng.name}: desiredSize must be between minSize and maxSize`);
    }
    
    if (ng.diskSize < 20) {
      errors.push(`Node group ${ng.name}: diskSize must be at least 20 GB`);
    }
  });
  
  // Validate IAM configuration
  if (!config.iam.clusterRoleName) {
    errors.push('Cluster role name is required');
  }
  
  if (!config.iam.nodeGroupRoleName) {
    errors.push('Node group role name is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default EKS cluster configuration
 */
export function getDefaultEKSConfig(clusterName: string, region: string): EKSClusterConfig {
  return {
    clusterName,
    region,
    version: '1.30',
    vpc: {
      cidr: '10.0.0.0/16',
      availabilityZones: [`${region}a`, `${region}b`],
      publicSubnets: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnets: ['10.0.10.0/24', '10.0.11.0/24'],
      enableNat: true,
    },
    nodeGroups: [
      {
        name: 'default',
        instanceType: 't3.medium',
        minSize: 2,
        maxSize: 5,
        desiredSize: 2,
        diskSize: 20,
      },
    ],
    iam: {
      clusterRoleName: `${clusterName}-cluster-role`,
      nodeGroupRoleName: `${clusterName}-node-role`,
    },
    logging: {
      types: ['api', 'audit', 'authenticator'],
    },
    tags: {
      Environment: 'production',
      ManagedBy: 'Gati',
    },
  };
}

/**
 * Simulate deployment status (would be replaced with actual AWS SDK calls)
 */
export async function getDeploymentStatus(
  clusterName: string,
  _options?: DeploymentOptions
): Promise<ResourceStatus[]> {
  // This would make actual AWS API calls in production
  // For now, return mock status
  await new Promise((resolve) => setTimeout(resolve, 0));
  
  return [
    {
      type: 'vpc',
      id: 'vpc-1234567890',
      name: `${clusterName}-vpc`,
      status: 'active',
      message: 'VPC is active',
      createdAt: new Date(),
    },
    {
      type: 'eks-cluster',
      id: `${clusterName}`,
      name: clusterName,
      status: 'creating',
      message: 'Cluster is being created',
    },
  ];
}
