# Kubernetes Deployment

Deploy Gati applications to Kubernetes clusters.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

## Overview

Gati generates production-ready Kubernetes manifests automatically.

## Quick Deploy

```bash
# Generate manifests
gatic deploy dev --dry-run

# Deploy to local cluster
gatic deploy dev --local

# Deploy to production
gatic deploy prod
```

## Generated Manifests

Gati creates:
- `deployment.yaml` - Pod deployment configuration
- `service.yaml` - Service configuration
- `hpa.yaml` - Horizontal Pod Autoscaler
- `ingress.yaml` - Ingress configuration (optional)

## Configuration

```typescript
// gati.config.ts
export default {
  environments: {
    dev: {
      replicas: 1,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '200m', memory: '256Mi' }
      }
    },
    prod: {
      replicas: 3,
      resources: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '1000m', memory: '1Gi' }
      }
    }
  }
};
```

## Related

- [Docker Guide](./deployment.md) - Containerization
- [Environment Config](./deployment.md) - Configuration management
- [Building](./deployment.md) - Production builds
