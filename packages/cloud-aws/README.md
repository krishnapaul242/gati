# @gati-framework/cloud-aws

AWS cloud provider plugin for Gati framework, enabling seamless deployment to Amazon EKS.

## Features

- ✅ **EKS Cluster Management** - Automated cluster creation and management
- ✅ **Load Balancer Integration** - Application Load Balancer (ALB) configuration
- ✅ **Secrets Manager** - Secure secret storage and rotation
- ✅ **IAM Role Automation** - Automatic role and policy management
- ✅ **Multi-AZ Support** - High availability across availability zones

## Installation

```bash
pnpm add @gati-framework/cloud-aws
```

## Usage

### Initialize AWS Provider

```typescript
import { AWSCloudProvider } from '@gati-framework/cloud-aws';
import { CloudProviderFactory } from '@gati-framework/core/cloud-provider';

// Register the provider
CloudProviderFactory.register('aws', () => new AWSCloudProvider());

// Create and initialize
const provider = CloudProviderFactory.create('aws');
await provider.initialize({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

### Create EKS Cluster

```typescript
const result = await provider.createCluster({
  name: 'my-gati-cluster',
  version: '1.28',
  nodePools: [
    {
      name: 'default',
      instanceType: 't3.medium',
      minNodes: 2,
      maxNodes: 10,
      desiredNodes: 3,
      diskSizeGb: 20,
    },
  ],
  network: {
    privateNetworking: true,
  },
});

console.log('Cluster endpoint:', result.clusterEndpoint);
```

### Manage Secrets

```typescript
// Store secret
await provider.storeSecret({
  name: 'my-app-secret',
  values: {
    DATABASE_URL: 'postgresql://...',
    API_KEY: 'secret-key',
  },
  tags: {
    Environment: 'production',
  },
});

// Retrieve secret
const secrets = await provider.retrieveSecret('my-app-secret');
console.log(secrets.DATABASE_URL);
```

### Create Load Balancer

```typescript
const lb = await provider.createLoadBalancer({
  type: 'application',
  scheme: 'internet-facing',
  targetPort: 3000,
  healthCheck: {
    path: '/health',
    intervalSeconds: 30,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
  },
  ssl: {
    certificateId: 'arn:aws:acm:...',
    redirectHttp: true,
  },
});

console.log('Load balancer endpoint:', lb.endpoint);
```

## Configuration

### Environment Variables

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_SESSION_TOKEN` - Session token (optional)
- `AWS_REGION` - Default AWS region

### IAM Permissions Required

The AWS credentials must have permissions for:
- EKS cluster management
- EC2 instance management
- IAM role creation and management
- Secrets Manager access
- Elastic Load Balancing

## API Reference

See [TypeScript definitions](./src/index.ts) for complete API documentation.

## License

MIT © Krishna Paul
