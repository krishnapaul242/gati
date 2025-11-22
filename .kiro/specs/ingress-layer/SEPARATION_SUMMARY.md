# Spec Separation Summary

## Overview

The original ingress-layer spec had grown to 74 requirements covering multiple distinct concerns. It has been refactored into 5 focused specs, each addressing a specific architectural concern.

## New Spec Structure

### 1. **ingress-layer** (20 requirements)
**Focus:** HTTP/WebSocket gateway, envelope creation, request handling

**Key Concerns:**
- HTTP/1.1, HTTP/2, and WebSocket support
- GatiRequestEnvelope construction
- Timescape version resolution
- gRPC communication with Route Manager
- Health checks and observability
- TLS termination and CORS
- Fastify-based Node.js implementation
- Runtime hot-swapping (Node.js → Rust/Go)
- Graceful shutdown and connection pooling

### 2. **contracts-package** (20 requirements)
**Focus:** @gati/contracts NPM package with language-neutral interfaces

**Key Concerns:**
- TypeScript interface definitions
- JSON Schema representations
- Protobuf definitions
- GatiRequestEnvelope and GatiResponseEnvelope contracts
- IngressContract, RouteManagerContract interfaces
- LocalContext and GlobalContext contracts
- ModuleClient and HandlerVersion contracts
- GType schema system
- Test fixtures and validation helpers
- Semantic versioning and backward compatibility

### 3. **code-generation** (12 requirements)
**Focus:** Automated generation of Rust and Go bindings

**Key Concerns:**
- Protobuf compilation (protoc, prost, tonic)
- JSON Schema to typed code (quicktype)
- Rust build.rs configuration
- Go protoc plugins (protoc-gen-go, protoc-gen-go-grpc)
- Generation scripts (gen-proto.sh, gen-jsonschema.sh)
- CI automation for automatic updates
- Roundtrip validation tests
- Dependency management
- Error handling and metadata

### 4. **route-manager** (12 requirements)
**Focus:** gRPC routing service and mock implementation

**Key Concerns:**
- RouteRequest and RouteResponse gRPC contract
- Mock server for local testing
- Handler version resolution via Timescape
- Handler registry and health checks
- Canary deployments and A/B testing
- Metrics and distributed tracing
- Error handling and graceful degradation
- Docker containerization
- Docker Compose integration

### 5. **kubernetes-deployment** (20 requirements)
**Focus:** Helm charts and Kubernetes manifests

**Key Concerns:**
- Helm chart structure and values.yaml
- Deployment resources with resource limits
- Service and ConfigMap creation
- HPA (CPU-based autoscaling)
- KEDA (request-rate based autoscaling)
- ServiceMonitor for Prometheus Operator
- Node affinity, tolerations, and placement
- External Ingress and TLS with cert-manager
- RBAC configuration
- PodDisruptionBudget and multi-zone deployment
- Environment-specific configurations
- Docker Compose for local development
- Graceful shutdown and init containers

## Benefits of Separation

1. **Focused Development:** Each spec can be implemented independently
2. **Clear Ownership:** Different teams can own different specs
3. **Easier Review:** Smaller, focused requirements are easier to review and approve
4. **Parallel Work:** Multiple specs can be worked on simultaneously
5. **Better Testing:** Each concern can have its own test strategy
6. **Clearer Dependencies:** Relationships between specs are explicit

## Spec Dependencies

```
ingress-layer
  ├─ depends on: contracts-package (interfaces)
  └─ communicates with: route-manager (gRPC)

contracts-package
  └─ used by: ingress-layer, route-manager, code-generation

code-generation
  └─ depends on: contracts-package (source definitions)

route-manager
  ├─ depends on: contracts-package (interfaces)
  └─ communicates with: ingress-layer (gRPC)

kubernetes-deployment
  ├─ deploys: ingress-layer
  └─ deploys: route-manager
```

## Next Steps

1. Review each spec independently
2. Approve requirements for each spec
3. Create design documents for each spec
4. Implement specs in priority order:
   - contracts-package (foundation)
   - ingress-layer (core functionality)
   - route-manager (routing logic)
   - code-generation (multi-language support)
   - kubernetes-deployment (production deployment)
