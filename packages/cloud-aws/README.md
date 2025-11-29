# @gati-framework/cloud-aws

> AWS EKS deployment provider for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/cloud-aws.svg)](https://www.npmjs.com/package/@gati-framework/cloud-aws)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Deploy Gati applications to AWS EKS with automatic VPC, networking, secrets management, and load balancing.

## Installation

```bash
npm install @gati-framework/cloud-aws
```

## Quick Start

```bash
# Configure AWS credentials
aws configure

# Deploy to EKS
gati deploy prod --cloud aws --region us-east-1 --cluster my-cluster
```

## Features

- ✅ **EKS Cluster Management** - Create and manage Kubernetes clusters
- ✅ **VPC & Networking** - Automatic VPC, subnets, security groups
- ✅ **Secrets Management** - AWS Secrets Manager integration
- ✅ **Load Balancing** - ALB/NLB with automatic SSL
- ✅ **IAM Roles** - Service accounts with IRSA
- ✅ **Auto-scaling** - HPA and cluster autoscaler

## Configuration

### gati.config.ts

```typescript
import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'my-app',
  cloud: {
    provider: 'aws',
    region: 'us-east-1',
    kubernetes: {
      clusterName: 'my-cluster',
      namespace: 'production',
      nodeType: 't3.medium',
      minNodes: 2,
      maxNodes: 10
    }
  }
} satisfies GatiConfig;
```

## Deployment

### Create EKS Cluster

```typescript
import { AWSProvider } from '@gati-framework/cloud-aws';

const provider = new AWSProvider({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

await provider.deploy({
  clusterName: 'my-cluster',
  nodeType: 't3.medium',
  minNodes: 2,
  maxNodes: 10
});
```

### Deploy Application

```bash
# Deploy to existing cluster
gati deploy prod --cloud aws --cluster my-cluster

# Deploy with custom configuration
gati deploy prod \
  --cloud aws \
  --region us-east-1 \
  --cluster my-cluster \
  --namespace production
```

## Networking

### VPC Configuration

Automatic VPC creation with:
- Public subnets (2 AZs)
- Private subnets (2 AZs)
- NAT gateways
- Internet gateway
- Route tables

```typescript
const vpc = await provider.createVPC({
  cidr: '10.0.0.0/16',
  availabilityZones: ['us-east-1a', 'us-east-1b']
});
```

### Security Groups

Automatic security group configuration:
- EKS control plane
- Worker nodes
- Load balancers
- Database access

### Load Balancing

```typescript
// Application Load Balancer
const alb = await provider.createLoadBalancer({
  type: 'application',
  scheme: 'internet-facing',
  subnets: vpc.publicSubnets
});

// Network Load Balancer
const nlb = await provider.createLoadBalancer({
  type: 'network',
  scheme: 'internal',
  subnets: vpc.privateSubnets
});
```

## Secrets Management

### Store Secrets

```typescript
import { SecretsManager } from '@gati-framework/cloud-aws';

const secrets = new SecretsManager({ region: 'us-east-1' });

await secrets.createSecret({
  name: 'my-app/database',
  value: {
    host: 'db.example.com',
    username: 'admin',
    password: 'secret'
  }
});
```

### Access in Handlers

```typescript
export const handler: Handler = async (req, res, gctx) => {
  const secrets = gctx.modules['secrets'];
  const dbConfig = await secrets.get('my-app/database');
  
  // Use database config
  const db = connect(dbConfig);
};
```

## IAM Roles

### Service Account with IRSA

```typescript
await provider.createServiceAccount({
  name: 'my-app',
  namespace: 'production',
  policies: [
    'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    'arn:aws:iam::aws:policy/SecretsManagerReadWrite'
  ]
});
```

### Custom IAM Policy

```typescript
await provider.createIAMPolicy({
  name: 'my-app-policy',
  statements: [
    {
      effect: 'Allow',
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: ['arn:aws:s3:::my-bucket/*']
    }
  ]
});
```

## Auto-scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Cluster Autoscaler

```typescript
await provider.enableClusterAutoscaler({
  minNodes: 2,
  maxNodes: 10,
  nodeGroups: ['my-app-nodes']
});
```

## Monitoring

### CloudWatch Integration

```typescript
await provider.enableCloudWatch({
  logGroup: '/aws/eks/my-cluster',
  metricsNamespace: 'MyApp'
});
```

### Container Insights

```bash
# Enable Container Insights
gati deploy prod --cloud aws --enable-insights
```

## Cost Optimization

### Spot Instances

```typescript
await provider.createNodeGroup({
  name: 'spot-nodes',
  instanceTypes: ['t3.medium', 't3.large'],
  capacityType: 'SPOT',
  minSize: 0,
  maxSize: 10
});
```

### Fargate

```typescript
await provider.createFargateProfile({
  name: 'my-app-fargate',
  namespace: 'production',
  selectors: [{ namespace: 'production' }]
});
```

## Troubleshooting

**Cluster creation fails**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam get-user
```

**Deployment timeout**:
```bash
# Check cluster status
aws eks describe-cluster --name my-cluster

# Check node status
kubectl get nodes
```

**Load balancer not accessible**:
```bash
# Check security groups
aws ec2 describe-security-groups

# Check ALB status
aws elbv2 describe-load-balancers
```

## Examples

### Complete Deployment

```typescript
import { AWSProvider } from '@gati-framework/cloud-aws';

const provider = new AWSProvider({ region: 'us-east-1' });

// Create VPC
const vpc = await provider.createVPC({
  cidr: '10.0.0.0/16',
  availabilityZones: ['us-east-1a', 'us-east-1b']
});

// Create EKS cluster
const cluster = await provider.createCluster({
  name: 'my-cluster',
  version: '1.28',
  vpcId: vpc.id,
  subnetIds: vpc.privateSubnets
});

// Create node group
await provider.createNodeGroup({
  clusterName: 'my-cluster',
  name: 'my-nodes',
  instanceTypes: ['t3.medium'],
  minSize: 2,
  maxSize: 10
});

// Deploy application
await provider.deployApplication({
  clusterName: 'my-cluster',
  namespace: 'production',
  image: 'my-app:latest'
});
```

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
```

## Related Packages

- [@gati-framework/core](../core) - Core types
- [@gati-framework/cli](../cli) - CLI tools
- [@gati-framework/cloud-gcp](../cloud-gcp) - GCP provider
- [@gati-framework/cloud-azure](../cloud-azure) - Azure provider

## Documentation

- [AWS EKS Deployment Guide](https://krishnapaul242.github.io/gati/guides/aws-eks-deployment)
- [Multi-Cloud Deployment](https://krishnapaul242.github.io/gati/guides/deployment)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
