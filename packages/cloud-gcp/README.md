# @gati-framework/cloud-gcp

> GCP GKE deployment provider for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/cloud-gcp.svg)](https://www.npmjs.com/package/@gati-framework/cloud-gcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Deploy Gati applications to Google Kubernetes Engine with automatic VPC, networking, secrets, and load balancing.

## Installation

```bash
npm install @gati-framework/cloud-gcp
```

## Quick Start

```bash
# Configure GCP
gcloud auth login
gcloud config set project my-project

# Deploy to GKE
gati deploy prod --cloud gcp --region us-central1 --cluster my-cluster
```

## Features

- ✅ **GKE Cluster Management** - Create and manage Kubernetes clusters
- ✅ **VPC & Networking** - Automatic VPC, subnets, firewall rules
- ✅ **Secrets Management** - Secret Manager integration
- ✅ **Load Balancing** - Cloud Load Balancing with SSL
- ✅ **IAM & Service Accounts** - Workload Identity
- ✅ **Auto-scaling** - HPA and cluster autoscaler

## Configuration

```typescript
import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'my-app',
  cloud: {
    provider: 'gcp',
    region: 'us-central1',
    kubernetes: {
      clusterName: 'my-cluster',
      namespace: 'production',
      nodeType: 'e2-medium',
      minNodes: 2,
      maxNodes: 10
    }
  }
} satisfies GatiConfig;
```

## Deployment

```typescript
import { GCPProvider } from '@gati-framework/cloud-gcp';

const provider = new GCPProvider({
  projectId: 'my-project',
  region: 'us-central1'
});

await provider.deploy({
  clusterName: 'my-cluster',
  nodeType: 'e2-medium',
  minNodes: 2,
  maxNodes: 10
});
```

## Networking

### VPC Configuration

```typescript
const vpc = await provider.createVPC({
  name: 'my-vpc',
  subnets: [
    { name: 'subnet-1', region: 'us-central1', cidr: '10.0.0.0/24' },
    { name: 'subnet-2', region: 'us-east1', cidr: '10.0.1.0/24' }
  ]
});
```

### Load Balancing

```typescript
const lb = await provider.createLoadBalancer({
  name: 'my-lb',
  type: 'EXTERNAL',
  protocol: 'HTTPS',
  certificateName: 'my-cert'
});
```

## Secrets Management

```typescript
import { SecretManager } from '@gati-framework/cloud-gcp';

const secrets = new SecretManager({ projectId: 'my-project' });

await secrets.createSecret({
  name: 'database-password',
  value: 'secret-value'
});
```

## Workload Identity

```typescript
await provider.createServiceAccount({
  name: 'my-app',
  namespace: 'production',
  roles: ['roles/secretmanager.secretAccessor']
});
```

## Related Packages

- [@gati-framework/core](../core) - Core types
- [@gati-framework/cli](../cli) - CLI tools
- [@gati-framework/cloud-aws](../cloud-aws) - AWS provider
- [@gati-framework/cloud-azure](../cloud-azure) - Azure provider

## Documentation

- [GCP Deployment Guide](https://krishnapaul242.github.io/gati/guides/deployment)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
