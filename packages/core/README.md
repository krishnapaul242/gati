# @gati-framework/core

> Core types, interfaces, and configuration for the Gati framework

[![npm version](https://img.shields.io/npm/v/@gati-framework/core.svg)](https://www.npmjs.com/package/@gati-framework/core)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Foundation package providing TypeScript types, interfaces, and base configuration used across all Gati packages.

## Installation

```bash
npm install @gati-framework/core
```

## Quick Start

```typescript
import type { GatiConfig, CloudProvider } from '@gati-framework/core';

const config: GatiConfig = {
  name: 'my-app',
  version: '1.0.0',
  cloud: {
    provider: 'aws',
    region: 'us-east-1'
  }
};
```

## Features

- ✅ **TypeScript Types** - Complete type definitions for Gati ecosystem
- ✅ **Cloud Provider Interface** - Unified interface for AWS/GCP/Azure
- ✅ **Configuration Schema** - Type-safe configuration
- ✅ **Base TSConfig** - Shared TypeScript configuration

## Core Types

### GatiConfig

Application configuration schema.

```typescript
interface GatiConfig {
  name: string;
  version: string;
  cloud?: CloudConfig;
  observability?: ObservabilityConfig;
  deployment?: DeploymentConfig;
}
```

### CloudProvider

Unified cloud provider interface.

```typescript
interface CloudProvider {
  name: 'aws' | 'gcp' | 'azure' | 'local';
  deploy(config: DeploymentConfig): Promise<DeploymentResult>;
  destroy(config: DeploymentConfig): Promise<void>;
  getStatus(config: DeploymentConfig): Promise<DeploymentStatus>;
}
```

### CloudConfig

Cloud-specific configuration.

```typescript
interface CloudConfig {
  provider: 'aws' | 'gcp' | 'azure';
  region: string;
  credentials?: CloudCredentials;
  kubernetes?: KubernetesConfig;
}
```

## Usage

### Configuration

```typescript
import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'my-api',
  version: '1.0.0',
  cloud: {
    provider: 'aws',
    region: 'us-east-1',
    kubernetes: {
      clusterName: 'my-cluster',
      namespace: 'production'
    }
  }
} satisfies GatiConfig;
```

### Cloud Provider

```typescript
import type { CloudProvider } from '@gati-framework/core';

class AWSProvider implements CloudProvider {
  name = 'aws' as const;
  
  async deploy(config) {
    // Deploy to AWS EKS
  }
  
  async destroy(config) {
    // Cleanup AWS resources
  }
  
  async getStatus(config) {
    // Get deployment status
  }
}
```

### TypeScript Configuration

Extend the base tsconfig in your project:

```json
{
  "extends": "@gati-framework/core/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Type Exports

```typescript
// Configuration
export type { GatiConfig, CloudConfig, DeploymentConfig };

// Cloud providers
export type { CloudProvider, CloudCredentials, DeploymentResult };

// Kubernetes
export type { KubernetesConfig, KubernetesManifest };

// Observability
export type { ObservabilityConfig, MetricsConfig, LoggingConfig };
```

## Base TSConfig

Shared TypeScript configuration with optimal settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Development

```bash
pnpm install
pnpm build
pnpm clean
```

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime execution engine
- [@gati-framework/cli](../cli) - CLI tools
- [@gati-framework/cloud-aws](../cloud-aws) - AWS provider
- [@gati-framework/cloud-gcp](../cloud-gcp) - GCP provider
- [@gati-framework/cloud-azure](../cloud-azure) - Azure provider

## Documentation

- [Configuration Guide](https://krishnapaul242.github.io/gati/guides/configuration)
- [Cloud Providers](https://krishnapaul242.github.io/gati/guides/deployment)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
