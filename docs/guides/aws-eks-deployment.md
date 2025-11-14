# AWS EKS Deployment Plugin

Complete guide for deploying Gati applications to AWS EKS (Elastic Kubernetes Service).

## Overview

The AWS EKS plugin automates the complete deployment pipeline from infrastructure provisioning to application deployment on AWS. It generates CloudFormation templates for:

- **VPC and Networking** - Subnets, NAT gateways, route tables
- **EKS Cluster** - Kubernetes control plane, node groups
- **Load Balancing** - Application Load Balancer (ALB) configuration
- **Security** - IAM roles, security groups, Secrets Manager
- **Monitoring** - CloudWatch logs, metrics

## Quick Start

### Basic Deployment

```typescript
import { deployToAWS, getDefaultEKSConfig } from '@gati-framework/cli/plugins/aws';

// Create default configuration
const config = getDefaultEKSConfig('my-app', 'us-east-1');

// Deploy to AWS
const result = await deployToAWS(config, { dryRun: false });

console.log('Cluster endpoint:', result.endpoint);
console.log('Kubeconfig:', result.kubeconfig);
```

### Custom Configuration

```typescript
import { createAWSDeployer } from '@gati-framework/cli/plugins/aws';
import type { EKSClusterConfig } from '@gati-framework/cli/plugins/aws/types';

const config: EKSClusterConfig = {
  clusterName: 'production-cluster',
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
      labels: { workload: 'general' },
    },
  ],
  
  iam: {
    clusterRoleName: 'prod-cluster-role',
    nodeGroupRoleName: 'prod-node-role',
  },
  
  alb: {
    enabled: true,
    scheme: 'internet-facing',
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/abc123',
  },
  
  secrets: {
    enabled: true,
    secretPrefix: 'gati/production',
    secrets: [
      { name: 'database-url', description: 'Production DB connection' },
      { name: 'api-keys', description: 'External API keys' },
    ],
  },
};

const deployer = createAWSDeployer(config);

// Validate configuration
const validation = deployer.validate();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}

// Deploy
const result = await deployer.deploy();
```

## Configuration Reference

### EKSClusterConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `clusterName` | string | Yes | Name of the EKS cluster (max 100 chars) |
| `region` | AWSRegion | Yes | AWS region (e.g., 'us-east-1') |
| `version` | EKSVersion | Yes | Kubernetes version ('1.28', '1.29', '1.30', '1.31') |
| `vpc` | VPCConfig | Yes | VPC and networking configuration |
| `nodeGroups` | NodeGroupConfig[] | Yes | Node group configurations (min 1 required) |
| `iam` | IAMConfig | Yes | IAM roles and policies |
| `alb` | ALBConfig | No | Application Load Balancer configuration |
| `secrets` | SecretsConfig | No | AWS Secrets Manager integration |
| `logging` | LoggingConfig | No | CloudWatch logging configuration |
| `tags` | Record<string, string> | No | Resource tags |

### VPCConfig

```typescript
{
  cidr: '10.0.0.0/16',                    // VPC CIDR block
  availabilityZones: ['us-east-1a', ...], // Min 2 AZs for HA
  publicSubnets: ['10.0.1.0/24', ...],    // Public subnet CIDRs
  privateSubnets: ['10.0.10.0/24', ...],  // Private subnet CIDRs
  enableNat: true,                        // Enable NAT gateways
  enableFlowLogs: false,                  // Enable VPC Flow Logs
}
```

### NodeGroupConfig

```typescript
{
  name: 'default',              // Node group name
  instanceType: 't3.medium',    // EC2 instance type
  minSize: 2,                   // Minimum nodes (min 1)
  maxSize: 10,                  // Maximum nodes (>= minSize)
  desiredSize: 3,               // Desired nodes (between min and max)
  diskSize: 20,                 // Disk size in GB (min 20)
  labels: {                     // Kubernetes node labels
    'workload': 'general'
  },
  taints: [                     // Kubernetes node taints
    {
      key: 'dedicated',
      value: 'compute',
      effect: 'NoSchedule'
    }
  ],
  sshKeyName: 'my-keypair',     // SSH key for node access (optional)
}
```

### ALBConfig

```typescript
{
  enabled: true,
  scheme: 'internet-facing',    // or 'internal'
  certificateArn: 'arn:aws:acm:...', // ACM certificate for HTTPS
  accessLogs: {
    enabled: true,
    s3Bucket: 'my-alb-logs',
    s3Prefix: 'prod-alb/',
  },
  healthCheck: {
    path: '/health',
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
  },
}
```

### SecretsConfig

```typescript
{
  enabled: true,
  secretPrefix: 'gati/production',  // Prefix for secret names
  secrets: [
    {
      name: 'database-url',
      description: 'Database connection string',
      value: 'postgresql://...',    // Optional: set value directly
    },
  ],
  enableRotation: false,             // Enable automatic rotation
}
```

## AWS Prerequisites

### 1. AWS Account Setup

- Active AWS account with billing enabled
- AWS CLI configured with credentials
- Sufficient permissions to create resources

### 2. Required Permissions

The deploying user/role needs permissions for:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:*",
        "ec2:*",
        "iam:*",
        "cloudformation:*",
        "secretsmanager:*",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Service Quotas

Ensure your account has sufficient quotas:

- VPCs: At least 1 available
- Elastic IPs: 2 per AZ (for NAT gateways)
- Security Groups: 10+
- EKS Clusters: 1+

## Deployment Process

### Phase 1: Infrastructure (VPC)

1. Creates VPC with specified CIDR
2. Creates public and private subnets across AZs
3. Provisions Internet Gateway for public subnets
4. Creates NAT Gateways (one per AZ)
5. Configures route tables

**Duration:** ~5-10 minutes

### Phase 2: EKS Cluster

1. Creates IAM roles for cluster
2. Creates security groups
3. Provisions EKS control plane
4. Enables logging and monitoring

**Duration:** ~10-15 minutes

### Phase 3: Node Groups

1. Creates IAM roles for nodes
2. Provisions EC2 Auto Scaling groups
3. Registers nodes with cluster
4. Applies labels and taints

**Duration:** ~5-10 minutes per node group

### Phase 4: Secrets (if enabled)

1. Creates Secrets Manager secrets
2. Sets up rotation policies (if enabled)
3. Creates IAM policies for access

**Duration:** ~2-5 minutes

### Total Deployment Time

- **Minimal setup:** 20-25 minutes
- **Production setup:** 30-40 minutes

## Accessing Your Cluster

### Update Kubeconfig

```bash
# The deployment returns a kubeconfig string
# Save it to a file
echo "$KUBECONFIG_CONTENT" > ~/.kube/my-cluster-config

# Or use AWS CLI
aws eks update-kubeconfig \
  --region us-east-1 \
  --name my-cluster
```

### Verify Access

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## Cost Estimation

### Monthly Costs (us-east-1, as of 2025)

**EKS Control Plane:**
- $0.10/hour × 730 hours = **$73/month**

**Node Groups (3 × t3.medium):**
- $0.0416/hour × 3 × 730 hours = **$91/month**

**NAT Gateways (2 AZs):**
- $0.045/hour × 2 × 730 hours = **$66/month**
- Data processing: ~$0.045/GB

**Load Balancer (ALB):**
- $0.0225/hour × 730 hours = **$16/month**
- LCU hours: variable

**Total Baseline:** ~$246/month (excluding data transfer and storage)

### Cost Optimization Tips

1. **Use Spot Instances** for non-critical workloads
2. **Single NAT Gateway** for dev/staging (not recommended for production)
3. **Reserved Instances** for predictable workloads
4. **Auto-scaling** to match demand
5. **Delete unused resources** promptly

## Examples

### Development Environment

```typescript
const devConfig: EKSClusterConfig = {
  clusterName: 'dev-cluster',
  region: 'us-east-1',
  version: '1.30',
  
  vpc: {
    cidr: '10.1.0.0/16',
    availabilityZones: ['us-east-1a', 'us-east-1b'],
    publicSubnets: ['10.1.1.0/24', '10.1.2.0/24'],
    privateSubnets: ['10.1.10.0/24', '10.1.11.0/24'],
    enableNat: true,
  },
  
  nodeGroups: [
    {
      name: 'default',
      instanceType: 't3.small',
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      diskSize: 20,
    },
  ],
  
  iam: {
    clusterRoleName: 'dev-cluster-role',
    nodeGroupRoleName: 'dev-node-role',
  },
  
  tags: {
    Environment: 'development',
    AutoShutdown: 'true',
  },
};
```

### Production Environment with High Availability

```typescript
const prodConfig: EKSClusterConfig = {
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
      name: 'system',
      instanceType: 't3.medium',
      minSize: 3,
      maxSize: 6,
      desiredSize: 3,
      diskSize: 50,
      labels: { 'node-role': 'system' },
    },
    {
      name: 'application',
      instanceType: 'm5.large',
      minSize: 3,
      maxSize: 20,
      desiredSize: 5,
      diskSize: 100,
      labels: { 'node-role': 'application' },
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
    secretPrefix: 'gati/production',
    secrets: [
      { name: 'database-url' },
      { name: 'api-keys' },
      { name: 'jwt-secret' },
    ],
    enableRotation: true,
  },
  
  logging: {
    types: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
  },
  
  tags: {
    Environment: 'production',
    Team: 'platform',
    CostCenter: '12345',
    Compliance: 'PCI-DSS',
  },
};
```

## Troubleshooting

### Common Issues

**1. Insufficient Permissions**
```
Error: User is not authorized to perform: eks:CreateCluster
```
**Solution:** Add required IAM permissions to your user/role

**2. Quota Exceeded**
```
Error: You have exceeded the maximum number of VPCs
```
**Solution:** Request quota increase or delete unused VPCs

**3. Subnet CIDR Conflicts**
```
Error: The CIDR '10.0.1.0/24' conflicts with another subnet
```
**Solution:** Use non-overlapping CIDR blocks

**4. Node Group Launch Failures**
```
Error: Nodes failed to join cluster
```
**Solution:** Check security groups, IAM roles, and subnet connectivity

### Debug Mode

Enable verbose logging:

```typescript
const result = await deployer.deploy({
  verbose: true,
  dryRun: false,
});
```

### Validation Before Deployment

```typescript
const deployer = createAWSDeployer(config);
const validation = deployer.validate();

if (!validation.valid) {
  console.error('Validation failed:');
  validation.errors.forEach((error) => {
    console.error(`  - ${error}`);
  });
  process.exit(1);
}
```

## Cleanup

### Delete Cluster

```typescript
await deployer.destroy({ dryRun: false });
```

### Manual Cleanup (if automated deletion fails)

1. Delete node groups via AWS Console
2. Delete EKS cluster
3. Delete CloudFormation stacks (in reverse order)
4. Delete VPC and associated resources

## Next Steps

- [HPA and Ingress Configuration](./hpa-ingress.md) - Configure auto-scaling and load balancing
- [Deployment Guide](./deployment.md) - General deployment best practices
- [Kubernetes Guide](./kubernetes.md) - Kubernetes-specific configuration
- [Configuration Guide](./configuration.md) - Environment configuration

## Support

For issues or questions:
- GitHub Issues: https://github.com/krishnapaul242/gati/issues
- Documentation: https://gati-framework.dev/docs
- Slack: #aws-deployment channel
