# @gati-framework/cloud-azure

> Azure AKS deployment provider for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/cloud-azure.svg)](https://www.npmjs.com/package/@gati-framework/cloud-azure)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Deploy Gati applications to Azure Kubernetes Service with automatic VNet, networking, secrets, and load balancing.

## Installation

```bash
npm install @gati-framework/cloud-azure
```

## Quick Start

```bash
# Configure Azure
az login
az account set --subscription my-subscription

# Deploy to AKS
gati deploy prod --cloud azure --region eastus --cluster my-cluster
```

## Features

- ✅ **AKS Cluster Management** - Create and manage Kubernetes clusters
- ✅ **VNet & Networking** - Automatic VNet, subnets, NSGs
- ✅ **Secrets Management** - Key Vault integration
- ✅ **Load Balancing** - Azure Load Balancer with SSL
- ✅ **Managed Identity** - Azure AD integration
- ✅ **Auto-scaling** - HPA and cluster autoscaler

## Configuration

```typescript
import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'my-app',
  cloud: {
    provider: 'azure',
    region: 'eastus',
    kubernetes: {
      clusterName: 'my-cluster',
      namespace: 'production',
      nodeType: 'Standard_D2s_v3',
      minNodes: 2,
      maxNodes: 10
    }
  }
} satisfies GatiConfig;
```

## Deployment

```typescript
import { AzureProvider } from '@gati-framework/cloud-azure';

const provider = new AzureProvider({
  subscriptionId: 'my-subscription',
  resourceGroup: 'my-rg',
  region: 'eastus'
});

await provider.deploy({
  clusterName: 'my-cluster',
  nodeType: 'Standard_D2s_v3',
  minNodes: 2,
  maxNodes: 10
});
```

## Networking

### VNet Configuration

```typescript
const vnet = await provider.createVNet({
  name: 'my-vnet',
  addressSpace: '10.0.0.0/16',
  subnets: [
    { name: 'subnet-1', addressPrefix: '10.0.0.0/24' },
    { name: 'subnet-2', addressPrefix: '10.0.1.0/24' }
  ]
});
```

### Load Balancing

```typescript
const lb = await provider.createLoadBalancer({
  name: 'my-lb',
  type: 'Public',
  sku: 'Standard'
});
```

## Secrets Management

```typescript
import { KeyVault } from '@gati-framework/cloud-azure';

const vault = new KeyVault({ vaultName: 'my-vault' });

await vault.setSecret({
  name: 'database-password',
  value: 'secret-value'
});
```

## Managed Identity

```typescript
await provider.createManagedIdentity({
  name: 'my-app',
  namespace: 'production',
  roles: ['Key Vault Secrets User']
});
```

## Related Packages

- [@gati-framework/core](../core) - Core types
- [@gati-framework/cli](../cli) - CLI tools
- [@gati-framework/cloud-aws](../cloud-aws) - AWS provider
- [@gati-framework/cloud-gcp](../cloud-gcp) - GCP provider

## Documentation

- [Azure Deployment Guide](https://krishnapaul242.github.io/gati/guides/deployment)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
