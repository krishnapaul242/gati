/**
 * @file AWS EKS Plugin Tests
 * @description Comprehensive tests for AWS cloud provider plugin
 */

import { describe, it, expect } from 'vitest';
import {
  validateVPCConfig,
  generateVPCTemplate,
  getDefaultVPCConfig,
} from '../../../../packages/cli/src/plugins/aws/vpc';
import {
  validateEKSConfig,
  generateEKSClusterTemplate,
  generateKubeconfig,
  getDefaultEKSConfig,
} from '../../../../packages/cli/src/plugins/aws/eks';
import {
  validateSecretsConfig,
  generateSecretsTemplate,
  getDefaultSecretsConfig,
  generateSecretsIAMPolicy,
} from '../../../../packages/cli/src/plugins/aws/secrets';
import {
  createAWSDeployer,
  deployToAWS,
} from '../../../../packages/cli/src/plugins/aws';
import type {
  VPCConfig,
  EKSClusterConfig,
  SecretsConfig,
} from '../../../../packages/cli/src/plugins/aws/types';

describe('AWS VPC Configuration', () => {
  it('should validate correct VPC configuration', () => {
    const config: VPCConfig = {
      cidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      publicSubnets: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnets: ['10.0.10.0/24', '10.0.11.0/24'],
      enableNat: true,
    };
    
    const result = validateVPCConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject invalid CIDR blocks', () => {
    const config: VPCConfig = {
      cidr: 'invalid-cidr',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      publicSubnets: ['10.0.1.0/24'],
      privateSubnets: ['10.0.10.0/24'],
      enableNat: true,
    };
    
    const result = validateVPCConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid VPC CIDR'))).toBe(true);
  });
  
  it('should require at least 2 availability zones', () => {
    const config: VPCConfig = {
      cidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a'],
      publicSubnets: ['10.0.1.0/24'],
      privateSubnets: ['10.0.10.0/24'],
      enableNat: true,
    };
    
    const result = validateVPCConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('two availability zones'))).toBe(true);
  });
  
  it('should generate valid CloudFormation template', () => {
    const config = getDefaultVPCConfig('us-east-1');
    const template = generateVPCTemplate(config, 'test-cluster');
    
    expect(template).toBeTruthy();
    expect(template).toContain('AWSTemplateFormatVersion');
    expect(template).toContain('AWS::EC2::VPC');
    expect(template).toContain('AWS::EC2::Subnet');
    expect(template).toContain('AWS::EC2::InternetGateway');
    expect(template).toContain('test-cluster');
  });
  
  it('should include NAT gateway in template when enabled', () => {
    const config = getDefaultVPCConfig('us-east-1');
    const template = generateVPCTemplate(config, 'test-cluster');
    
    expect(template).toContain('AWS::EC2::NATGateway');
    expect(template).toContain('AWS::EC2::EIP');
  });
});

describe('AWS EKS Configuration', () => {
  it('should validate correct EKS configuration', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    const result = validateEKSConfig(config);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject invalid cluster names', () => {
    const config = getDefaultEKSConfig('', 'us-east-1');
    const result = validateEKSConfig(config);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cluster name is required'))).toBe(true);
  });
  
  it('should reject invalid Kubernetes versions', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    config.version = '1.99'; // Invalid version
    
    const result = validateEKSConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid Kubernetes version'))).toBe(true);
  });
  
  it('should require at least one node group', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    config.nodeGroups = [];
    
    const result = validateEKSConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('At least one node group'))).toBe(true);
  });
  
  it('should validate node group sizing', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    if (config.nodeGroups[0]) {
      config.nodeGroups[0].minSize = 5;
      config.nodeGroups[0].maxSize = 2; // max < min
    }
    
    const result = validateEKSConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('maxSize must be >= minSize'))).toBe(true);
  });
  
  it('should generate valid EKS cluster template', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    const template = generateEKSClusterTemplate(config);
    
    expect(template).toBeTruthy();
    expect(template).toContain('AWS::EKS::Cluster');
    expect(template).toContain('AWS::IAM::Role');
    expect(template).toContain('AWS::EC2::SecurityGroup');
    expect(template).toContain('test-cluster');
  });
  
  it('should generate valid kubeconfig', () => {
    const kubeconfig = generateKubeconfig(
      'test-cluster',
      'https://test-endpoint.eks.us-east-1.amazonaws.com',
      'LS0tLS1CRUdJTi...',
      'us-east-1'
    );
    
    expect(kubeconfig).toContain('apiVersion: v1');
    expect(kubeconfig).toContain('kind: Config');
    expect(kubeconfig).toContain('test-cluster');
    expect(kubeconfig).toContain('command: aws');
    expect(kubeconfig).toContain('get-token');
    expect(kubeconfig).toContain('us-east-1');
  });
});

describe('AWS Secrets Manager Configuration', () => {
  it('should validate correct secrets configuration', () => {
    const config: SecretsConfig = {
      enabled: true,
      secretPrefix: 'gati/test-cluster',
      secrets: [
        { name: 'database-url', description: 'DB connection string' },
        { name: 'api-key', description: 'API key' },
      ],
    };
    
    const result = validateSecretsConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should require secret prefix', () => {
    const config: SecretsConfig = {
      enabled: true,
      secretPrefix: '',
      secrets: [],
    };
    
    const result = validateSecretsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Secret prefix is required'))).toBe(true);
  });
  
  it('should reject invalid secret names', () => {
    const config: SecretsConfig = {
      enabled: true,
      secretPrefix: 'gati/test',
      secrets: [
        { name: 'invalid secret name!', description: 'Invalid' },
      ],
    };
    
    const result = validateSecretsConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid characters'))).toBe(true);
  });
  
  it('should generate valid secrets template', () => {
    const config = getDefaultSecretsConfig('test-cluster');
    const template = generateSecretsTemplate('test-cluster', config);
    
    expect(template).toBeTruthy();
    expect(template).toContain('AWS::SecretsManager::Secret');
    expect(template).toContain('gati/test-cluster');
  });
  
  it('should generate valid IAM policy for secrets access', () => {
    const policy = generateSecretsIAMPolicy('test-cluster', [
      'arn:aws:secretsmanager:us-east-1:123456789012:secret:gati/test-cluster/db',
    ]);
    
    const parsed = JSON.parse(policy) as {
      Version: string;
      Statement: Array<{ Action: string[] }>;
    };
    expect(parsed.Version).toBe('2012-10-17');
    expect(parsed.Statement).toHaveLength(1);
    expect(parsed.Statement[0]?.Action).toContain('secretsmanager:GetSecretValue');
  });
});

describe('AWS EKS Deployer', () => {
  it('should create deployer instance', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    const deployer = createAWSDeployer(config);
    
    expect(deployer).toBeTruthy();
  });
  
  it('should validate configuration before deployment', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    config.nodeGroups = []; // Invalid
    
    const deployer = createAWSDeployer(config);
    const validation = deployer.validate();
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
  
  it('should generate all templates', () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    config.secrets = getDefaultSecretsConfig('test-cluster');
    
    const deployer = createAWSDeployer(config);
    const templates = deployer.generateTemplates();
    
    expect(templates.vpc).toBeTruthy();
    expect(templates.cluster).toBeTruthy();
    expect(templates.secrets).toBeTruthy();
  });
  
  it('should perform dry-run deployment', async () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    const deployer = createAWSDeployer(config);
    
    const result = await deployer.deploy({ dryRun: true });
    
    expect(result).toBeTruthy();
    expect(result.endpoint).toContain('test-cluster');
    expect(result.clusterArn).toContain('arn:aws:eks');
    expect(result.kubeconfig).toContain('apiVersion: v1');
  });
  
  it('should deploy using quick deploy function', async () => {
    const config = getDefaultEKSConfig('test-cluster', 'us-east-1');
    
    const result = await deployToAWS(config, { dryRun: true });
    
    expect(result).toBeTruthy();
    expect(result.endpoint).toBeTruthy();
    expect(result.kubeconfig).toBeTruthy();
  });
  
  it('should throw error on invalid configuration', async () => {
    const config = getDefaultEKSConfig('', 'us-east-1'); // Invalid name
    const deployer = createAWSDeployer(config);
    
    await expect(deployer.deploy()).rejects.toThrow('Configuration validation failed');
  });
});

describe('AWS EKS Integration Tests', () => {
  it('should create complete deployment configuration', () => {
    const config: EKSClusterConfig = {
      clusterName: 'prod-cluster',
      region: 'us-east-1',
      version: '1.30',
      vpc: {
        cidr: '10.0.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        publicSubnets: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnets: ['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24'],
        enableNat: true,
        enableFlowLogs: true,
      },
      nodeGroups: [
        {
          name: 'general',
          instanceType: 't3.medium',
          minSize: 2,
          maxSize: 10,
          desiredSize: 3,
          diskSize: 50,
          labels: {
            workload: 'general',
          },
        },
        {
          name: 'compute',
          instanceType: 'c5.xlarge',
          minSize: 1,
          maxSize: 5,
          desiredSize: 2,
          diskSize: 100,
          labels: {
            workload: 'compute-intensive',
          },
        },
      ],
      iam: {
        clusterRoleName: 'prod-cluster-role',
        nodeGroupRoleName: 'prod-node-role',
        additionalPolicies: [
          'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
        ],
      },
      alb: {
        enabled: true,
        scheme: 'internet-facing',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123',
        accessLogs: {
          enabled: true,
          s3Bucket: 'prod-alb-logs',
        },
      },
      secrets: {
        enabled: true,
        secretPrefix: 'gati/prod-cluster',
        secrets: [
          { name: 'database-url', description: 'Production DB connection' },
          { name: 'api-keys', description: 'External API keys' },
          { name: 'jwt-secret', description: 'JWT signing key' },
        ],
        enableRotation: true,
      },
      logging: {
        types: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
      },
      tags: {
        Environment: 'production',
        Team: 'platform',
        ManagedBy: 'Gati',
      },
    };
    
    const deployer = createAWSDeployer(config);
    const validation = deployer.validate();
    
    expect(validation.valid).toBe(true);
    
    const templates = deployer.generateTemplates();
    expect(templates.vpc).toContain('10.0.0.0/16');
    expect(templates.cluster).toContain('prod-cluster');
    expect(templates.secrets).toContain('database-url');
  });
  
  it('should handle multi-region deployment configuration', () => {
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
    
    regions.forEach((region) => {
      const config = getDefaultEKSConfig(`cluster-${region}`, region);
      const deployer = createAWSDeployer(config);
      const validation = deployer.validate();
      
      expect(validation.valid).toBe(true);
    });
  });
});
