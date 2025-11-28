# @gati-framework/operator

Kubernetes Operator for automated deployment and orchestration of Gati handlers and modules.

## Installation

```bash
npm install @gati-framework/operator
```

## Architecture

The Gati Operator uses a contracts-based architecture to support multiple deployment targets:

- **Deployment Contracts**: Pluggable backends via `IDeploymentTarget` and `IManifestGenerator`
- **CRD-Driven**: Declarative resource definitions for handlers, modules, and versions
- **Reconciliation Loop**: Watches CRDs and ensures desired state matches actual state
- **Multi-Version Support**: Timescape-aware orchestration for zero-downtime deployments

## Custom Resource Definitions

### GatiHandler

Defines a Gati handler deployment:

```yaml
apiVersion: gati.dev/v1alpha1
kind: GatiHandler
metadata:
  name: user-handler
  namespace: default
spec:
  handlerPath: /api/users
  version: v1.0.0
  replicas: 2
  image: my-app:v1.0.0
  port: 3000
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
```

### GatiModule

Defines a Gati module deployment:

```yaml
apiVersion: gati.dev/v1alpha1
kind: GatiModule
metadata:
  name: db-module
  namespace: default
spec:
  moduleName: database
  moduleType: node
  runtime: node:20
  replicas: 1
  image: db-module:v1.0.0
  port: 50051
  capabilities:
    - network
    - storage
```

### GatiVersion

Defines version metadata for Timescape orchestration:

```yaml
apiVersion: gati.dev/v1alpha1
kind: GatiVersion
metadata:
  name: user-handler-v1
  namespace: default
spec:
  versionId: v1.0.0
  breaking: false
  routingWeight: 100
  transformers: []
```

## Installation

```bash
# Install CRDs
kubectl apply -f crds/

# Deploy operator
kubectl apply -f operator.yaml
```

## Deployment Targets

The operator supports multiple deployment backends:

- **Kubernetes**: Direct API via @kubernetes/client-node
- **Helm**: Generate Helm charts
- **GitOps**: Integration with ArgoCD/Flux

Configure via `DEPLOYMENT_TARGET` environment variable.

## Features

- ✅ Automated handler and module deployment
- ✅ Horizontal Pod Autoscaling (HPA) and KEDA support
- ✅ Timescape-aware multi-version orchestration
- ✅ Automatic version decommissioning after traffic drains
- ✅ Structured logging and Prometheus metrics
- ✅ Graceful shutdown and error handling

## Documentation

- [Architecture](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [CRD Reference](./docs/crds.md)
- [Deployment Targets](./docs/targets.md)
- [Troubleshooting](./docs/troubleshooting.md)

## License

MIT © Krishna Paul
