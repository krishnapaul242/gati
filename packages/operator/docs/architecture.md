# Operator Architecture

## Overview

The Gati Operator uses a contracts-based architecture to enable pluggable deployment backends.

## Core Components

### Deployment Contracts
- **IDeploymentTarget** - Abstraction for Kubernetes, Helm, GitOps
- **IManifestGenerator** - Creates deployment manifests

### Controllers
- **OperatorController** - Watches CRDs and orchestrates reconciliation
- **ScalingController** - Manages HPA for auto-scaling
- **TimescapeOrchestrator** - Handles multi-version deployments
- **VersionDecommissioner** - Removes drained versions

### Deployers
- **HandlerDeployer** - Deploys Gati handlers
- **ModuleDeployer** - Deploys Gati modules with security enforcement

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Kubernetes API Server           │
└─────────────────┬───────────────────────┘
                  │ Watch CRDs
                  ▼
┌─────────────────────────────────────────┐
│        OperatorController               │
│  ┌─────────────────────────────────┐   │
│  │   IDeploymentTarget (Contract)  │   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Kubernetes   │    │ Helm/GitOps  │
│ Target       │    │ Targets      │
└──────────────┘    └──────────────┘
```

## Reconciliation Flow

1. Watch GatiHandler/GatiModule CRDs
2. Generate manifests via IManifestGenerator
3. Apply resources via IDeploymentTarget
4. Create HPA for auto-scaling
5. Update CRD status
