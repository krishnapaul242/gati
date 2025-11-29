# @gati-framework/operator

> Kubernetes operator for Gati handler and module deployment

[![npm version](https://img.shields.io/npm/v/@gati-framework/operator.svg)](https://www.npmjs.com/package/@gati-framework/operator)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Kubernetes operator that manages Gati applications with custom resources for handlers, modules, and versions.

## Installation

```bash
npm install -g @gati-framework/operator
```

## Quick Start

```bash
# Install CRDs
kubectl apply -f node_modules/@gati-framework/operator/crds/

# Start operator
gati-operator start

# Deploy handler
kubectl apply -f handler.yaml
```

## Features

- ✅ **Custom Resources** - GatiHandler, GatiModule, GatiVersion
- ✅ **Auto-scaling** - HPA integration
- ✅ **Rolling Updates** - Zero-downtime deployments
- ✅ **Health Checks** - Automatic health monitoring
- ✅ **Resource Management** - CPU/memory limits
- ✅ **Observability** - Metrics and logging

## Custom Resources

### GatiHandler

```yaml
apiVersion: gati.dev/v1
kind: GatiHandler
metadata:
  name: user-handler
spec:
  route: /users/:id
  method: GET
  image: my-app:latest
  replicas: 3
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
```

### GatiModule

```yaml
apiVersion: gati.dev/v1
kind: GatiModule
metadata:
  name: database
spec:
  type: postgres
  image: my-app:latest
  replicas: 1
  config:
    host: postgres.default.svc
    port: 5432
```

### GatiVersion

```yaml
apiVersion: gati.dev/v1
kind: GatiVersion
metadata:
  name: v1-0-0
spec:
  version: 1.0.0
  handlers:
    - user-handler
  modules:
    - database
  timestamp: 2025-11-25T00:00:00Z
```

## Operator Commands

```bash
# Start operator
gati-operator start

# Check status
gati-operator status

# View logs
gati-operator logs

# Stop operator
gati-operator stop
```

## Auto-scaling

```yaml
apiVersion: gati.dev/v1
kind: GatiHandler
metadata:
  name: user-handler
spec:
  route: /users/:id
  method: GET
  image: my-app:latest
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPU: 70
```

## Rolling Updates

```bash
# Update handler image
kubectl set image gatihandler/user-handler app=my-app:v2

# Rollback
kubectl rollout undo gatihandler/user-handler
```

## Health Checks

```yaml
spec:
  healthCheck:
    path: /health
    interval: 10s
    timeout: 5s
    failureThreshold: 3
```

## Related Packages

- [@gati-framework/core](../core) - Core types
- [@gati-framework/cli](../cli) - CLI tools
- [@gati-framework/runtime](../runtime) - Runtime engine

## Documentation

- [Operator Guide](https://krishnapaul242.github.io/gati/guides/operator)
- [CRD Reference](./docs/crds.md)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
