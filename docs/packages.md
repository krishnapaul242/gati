# NPM Packages

All Gati packages are published to npm and ready for production use. Install them individually or use the CLI to scaffold a complete project.

## Core Packages

### @gati-framework/core

[![npm version](https://img.shields.io/npm/v/@gati-framework/core)](https://npmjs.com/package/@gati-framework/core)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/core)](https://npmjs.com/package/@gati-framework/core)

Core runtime types and base configuration for Gati framework.

```bash
npm install @gati-framework/core
```

**Features:**
- Handler, Request, Response interfaces
- GlobalContext and LocalContext types
- Base TypeScript configuration
- Core type definitions

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/core)
- [Documentation](/api-reference/handler)

---

### @gati-framework/runtime

[![npm version](https://img.shields.io/npm/v/@gati-framework/runtime)](https://npmjs.com/package/@gati-framework/runtime)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/runtime)](https://npmjs.com/package/@gati-framework/runtime)

Gati runtime execution engine for running handler-based applications.

```bash
npm install @gati-framework/runtime
```

**Features:**
- Handler execution pipeline
- Request/Response processing
- Context management (global and local)
- Module system integration
- Graceful shutdown support

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/runtime)
- [Documentation](/guides/handlers)

---

### @gati-framework/types

[![npm version](https://img.shields.io/npm/v/@gati-framework/types)](https://npmjs.com/package/@gati-framework/types)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/types)](https://npmjs.com/package/@gati-framework/types)

TypeScript-first branded types and schema system for Gati.

```bash
npm install @gati-framework/types
```

**Features:**
- Branded type definitions
- Schema validation
- Type-safe constraints
- Runtime type checking

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/types)
- [Documentation](/architecture/type-system)

---

### @gati-framework/cli

[![npm version](https://img.shields.io/npm/v/@gati-framework/cli)](https://npmjs.com/package/@gati-framework/cli)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/cli)](https://npmjs.com/package/@gati-framework/cli)

CLI tool for Gati framework - create, develop, build and deploy cloud-native applications.

```bash
npm install -g @gati-framework/cli
```

**Features:**
- Project scaffolding (`gati create`)
- Development server with hot reload (`gati dev`)
- Build system (`gati build`)
- Deployment commands (`gati deploy`)
- Health check validation

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/cli)
- [Documentation](/guides/gatic)

---

## Cloud Provider Plugins

### @gati-framework/cloud-aws

[![npm version](https://img.shields.io/npm/v/@gati-framework/cloud-aws)](https://npmjs.com/package/@gati-framework/cloud-aws)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/cloud-aws)](https://npmjs.com/package/@gati-framework/cloud-aws)

AWS cloud provider plugin for Gati framework.

```bash
npm install @gati-framework/cloud-aws
```

**Features:**
- EKS deployment automation
- ECR image registry integration
- AWS resource provisioning
- IAM role management
- CloudWatch integration

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/cloud-aws)
- [Documentation](/guides/aws-eks-deployment)

---

### @gati-framework/cloud-gcp

[![npm version](https://img.shields.io/npm/v/@gati-framework/cloud-gcp)](https://npmjs.com/package/@gati-framework/cloud-gcp)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/cloud-gcp)](https://npmjs.com/package/@gati-framework/cloud-gcp)

GCP cloud provider plugin for Gati framework.

```bash
npm install @gati-framework/cloud-gcp
```

**Features:**
- GKE deployment automation
- GCR image registry integration
- GCP resource provisioning
- IAM management
- Cloud Monitoring integration

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/cloud-gcp)
- [Documentation](/guides/deployment)

---

### @gati-framework/cloud-azure

[![npm version](https://img.shields.io/npm/v/@gati-framework/cloud-azure)](https://npmjs.com/package/@gati-framework/cloud-azure)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/cloud-azure)](https://npmjs.com/package/@gati-framework/cloud-azure)

Azure cloud provider plugin for Gati framework.

```bash
npm install @gati-framework/cloud-azure
```

**Features:**
- AKS deployment automation
- ACR image registry integration
- Azure resource provisioning
- RBAC management
- Azure Monitor integration

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/cloud-azure)
- [Documentation](/guides/deployment)

---

## Infrastructure Packages

### @gati-framework/observability

[![npm version](https://img.shields.io/npm/v/@gati-framework/observability)](https://npmjs.com/package/@gati-framework/observability)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/observability)](https://npmjs.com/package/@gati-framework/observability)

Observability stack for Gati framework - Prometheus, Grafana, Loki, and Tracing.

```bash
npm install @gati-framework/observability
```

**Features:**
- Prometheus metrics collection
- Grafana dashboards
- Loki log aggregation
- Distributed tracing
- Custom metrics API

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/observability)
- [Documentation](/guides/deployment)

---

### @gati-framework/production-hardening

[![npm version](https://img.shields.io/npm/v/@gati-framework/production-hardening)](https://npmjs.com/package/@gati-framework/production-hardening)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/production-hardening)](https://npmjs.com/package/@gati-framework/production-hardening)

Production hardening utilities for Gati - secret management, config validation, auto-scaling.

```bash
npm install @gati-framework/production-hardening
```

**Features:**
- Secret management integration
- Configuration validation
- Auto-scaling policies
- Health check endpoints
- Graceful shutdown handling

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/production-hardening)
- [Documentation](/guides/deployment)

---

### @gati-framework/playground

[![npm version](https://img.shields.io/npm/v/@gati-framework/playground)](https://npmjs.com/package/@gati-framework/playground)
[![npm downloads](https://img.shields.io/npm/dm/@gati-framework/playground)](https://npmjs.com/package/@gati-framework/playground)

Visual request flow debugging for Gati framework.

```bash
npm install @gati-framework/playground
```

**Features:**
- 3-mode visualization (API, Network, Tracking)
- Request/response inspection
- Debug gates
- Stress testing
- Real-time observability

**Links:**
- [npm Package](https://npmjs.com/package/@gati-framework/playground)
- [Documentation](/guides/development-server)

---

## Installation

### Quick Start (Recommended)

Use the CLI to create a new project with all dependencies:

```bash
npx @gati-framework/cli create my-api
cd my-api
pnpm install
```

### Manual Installation

Install packages individually:

```bash
# Core packages
npm install @gati-framework/core @gati-framework/runtime @gati-framework/types

# CLI tools
npm install -g @gati-framework/cli

# Cloud providers (choose one or more)
npm install @gati-framework/cloud-aws
npm install @gati-framework/cloud-gcp
npm install @gati-framework/cloud-azure

# Infrastructure
npm install @gati-framework/observability
npm install @gati-framework/production-hardening
npm install @gati-framework/playground
```

---

## Version Compatibility

All packages follow [Semantic Versioning](https://semver.org/). The following versions are compatible:

| Package | Version | Compatible With |
|---------|---------|-----------------|
| @gati-framework/core | 0.4.5 | runtime@2.x, cli@1.x |
| @gati-framework/runtime | 2.0.3 | core@0.4.x, types@1.x |
| @gati-framework/types | 1.0.1 | core@0.4.x, runtime@2.x |
| @gati-framework/cli | 1.0.14 | core@0.4.x, runtime@2.x |
| @gati-framework/cloud-* | 1.0.x | core@0.4.x, runtime@2.x |
| @gati-framework/observability | 1.0.2 | core@0.4.x, runtime@2.x |
| @gati-framework/production-hardening | 1.0.2 | core@0.4.x, runtime@2.x |
| @gati-framework/playground | 1.0.0 | core@0.4.x, runtime@2.x |

---

## Support

- 📖 [Documentation](/)
- 💬 [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions)
- 🐛 [Issue Tracker](https://github.com/krishnapaul242/gati/issues)
- ⭐ [Star on GitHub](https://github.com/krishnapaul242/gati)

---

## License

All packages are released under the MIT License.

Copyright © 2025 [Krishna Paul](https://github.com/krishnapaul242)
