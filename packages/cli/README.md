# @gati-framework/cli

> Development and deployment tools for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/cli.svg)](https://www.npmjs.com/package/@gati-framework/cli)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Command-line interface for creating, developing, building, and deploying Gati applications with hot reload, manifest generation, and multi-cloud deployment.

## Installation

```bash
# Global installation
npm install -g @gati-framework/cli

# Project dependency
npm install --save-dev @gati-framework/cli
```

## Quick Start

```bash
# Create new project (use gatic instead)
npx gatic create my-app

# Start development server
gati dev

# Build for production
gati build

# Deploy to Kubernetes
gati deploy dev --local
```

## Commands

### `gati dev`

Start development server with hot reload (50-200ms).

```bash
gati dev [options]

Options:
  -p, --port <port>     Port number (default: 3000)
  -h, --host <host>     Host address (default: localhost)
  --no-reload           Disable hot reload
  --playground          Enable playground UI
```

**Features**:
- Hot reload on file changes
- Automatic manifest generation
- Type checking
- Error reporting
- Playground integration

### `gati build`

Build application for production.

```bash
gati build [options]

Options:
  -o, --outDir <dir>    Output directory (default: dist)
  --minify              Minify output
  --sourcemap           Generate source maps
```

**Output**:
- Compiled TypeScript
- Generated manifests
- Type definitions
- Docker image (optional)

### `gati deploy`

Deploy to Kubernetes cluster.

```bash
gati deploy <env> [options]

Arguments:
  env                   Environment (dev, staging, prod)

Options:
  --local               Deploy to local kind cluster
  --cloud <provider>    Cloud provider (aws, gcp, azure)
  --region <region>     Cloud region
  --cluster <name>      Cluster name
```

**Examples**:
```bash
# Local development
gati deploy dev --local

# AWS EKS
gati deploy prod --cloud aws --region us-east-1

# GCP GKE
gati deploy prod --cloud gcp --region us-central1
```

### `gati generate`

Generate code and manifests.

```bash
gati generate <type> [options]

Types:
  handler               Generate handler
  module                Generate module
  manifest              Generate manifests
  types                 Generate type definitions
```

**Examples**:
```bash
# Generate handler
gati generate handler users/[id]

# Generate module
gati generate module database

# Regenerate manifests
gati generate manifest
```

### `gati validate`

Validate configuration and manifests.

```bash
gati validate [options]

Options:
  --config              Validate gati.config.ts
  --manifests           Validate handler/module manifests
  --types               Validate type definitions
```

## Configuration

### gati.config.ts

```typescript
import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'my-app',
  version: '1.0.0',
  
  // Development server
  dev: {
    port: 3000,
    host: 'localhost',
    hotReload: true,
    playground: true
  },
  
  // Build options
  build: {
    outDir: 'dist',
    minify: true,
    sourcemap: true
  },
  
  // Deployment
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

## Development Workflow

### 1. Create Project

```bash
npx gatic create my-app
cd my-app
```

### 2. Start Dev Server

```bash
gati dev --playground
```

Server starts at `http://localhost:3000`  
Playground at `http://localhost:3000/__playground`

### 3. Create Handler

```bash
gati generate handler users/[id]
```

Creates `src/handlers/users/[id].ts`:

```typescript
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  res.json({ userId });
};
```

### 4. Hot Reload

Save file → Auto-reload (50-200ms) → Test immediately

### 5. Build & Deploy

```bash
gati build
gati deploy prod --cloud aws
```

## Hot Reload

Fast file watching with automatic reloading:

- **Handler changes**: 50-100ms reload
- **Module changes**: 100-150ms reload
- **Config changes**: 150-200ms reload

**Implementation**:
```typescript
import { createWatcher } from '@gati-framework/cli/utils/watcher';

const watcher = createWatcher('./src', {
  onChange: (file) => console.log(`Reloading ${file}`)
});
```

## Manifest Generation

Automatic manifest generation from TypeScript:

```typescript
// src/handlers/users/[id].ts
export const METHOD = 'GET';
export const ROUTE = '/users/:id';
export const handler: Handler = async (req, res) => {
  res.json({ id: req.params.id });
};
```

Generates `.gati/manifests/users_[id].json`:

```json
{
  "id": "users_[id]",
  "route": "/users/:id",
  "method": "GET",
  "filePath": "./src/handlers/users/[id].ts",
  "exportName": "handler"
}
```

## Deployment

### Local Kubernetes (kind)

```bash
# Create cluster
kind create cluster --name gati-dev

# Deploy
gati deploy dev --local

# Access
kubectl port-forward svc/my-app 3000:80
```

### AWS EKS

```bash
# Configure AWS
aws configure

# Deploy
gati deploy prod --cloud aws --region us-east-1 --cluster my-cluster

# Get endpoint
kubectl get ingress
```

### GCP GKE

```bash
# Configure GCP
gcloud auth login

# Deploy
gati deploy prod --cloud gcp --region us-central1 --cluster my-cluster
```

## Utilities

### File Watcher

```typescript
import { createWatcher } from '@gati-framework/cli/utils/watcher';

const watcher = createWatcher('./src', {
  onChange: (file) => console.log(`Changed: ${file}`),
  onError: (error) => console.error(error)
});
```

### Environment Loader

```typescript
import { loadEnv } from '@gati-framework/cli/utils/env-loader';

const env = loadEnv('.env');
```

### Bundler

```typescript
import { bundle } from '@gati-framework/cli/utils/bundler';

await bundle({
  entry: './src/index.ts',
  outDir: './dist',
  minify: true
});
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm dev  # Watch mode
```

## Troubleshooting

**Hot reload not working**:
- Check file watcher permissions
- Verify `.gati` directory exists
- Check console for errors

**Deployment fails**:
- Verify cloud credentials
- Check cluster connectivity
- Validate manifests: `gati validate`

**Build errors**:
- Run `pnpm typecheck`
- Check `gati.config.ts`
- Verify dependencies

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime execution engine
- [@gati-framework/core](../core) - Core types
- [gatic](../gatic) - Project scaffolding
- [@gati-framework/cloud-aws](../cloud-aws) - AWS deployment

## Documentation

- [CLI Guide](https://krishnapaul242.github.io/gati/guides/cli)
- [Development Server](https://krishnapaul242.github.io/gati/guides/development-server)
- [Deployment](https://krishnapaul242.github.io/gati/guides/deployment)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
