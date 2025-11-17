# Gati Feature Registry

> **Complete master index of every feature, package, subsystem, and capability in the Gati ecosystem.**

This document provides a comprehensive overview of Gati's architecture, organized by subsystem. Features are marked with their current status:

- ✅ **Stable** — Production-ready, battle-tested
- 🚧 **In Progress** — Actively being developed
- 📅 **Planned** — Designed and scheduled for implementation

---

## 1. Core Runtime (Engine)

The foundation of Gati's execution model.

### 1.1 Runtime Architecture

| Feature | Status | Description |
|---------|--------|-------------|
| Stateless handlers | ✅ Stable | Pure functions: `(req, res, gctx, lctx) => unknown` |
| LocalContext (lctx) | ✅ Stable | Request-scoped data with lifecycle hooks |
| GlobalContext (gctx) | ✅ Stable | Shared resources, modules, app config |
| Local Context Controller | ✅ Stable | Manages lctx lifecycle per request |
| Distributed runtime | 📅 M8 (Q1 2026) | Containerized, multi-instance execution |
| Route Managers | ✅ Stable | HTTP route matching and parameter extraction |
| Module Processes | 🚧 M8 (Q1 2026) | Isolated module execution (Docker/NPM/local) |
| Middleware pipelines | ✅ Stable | Composable request/response processing |
| Plugin runtime | 📅 M8 (Q1 2026) | Sandboxed plugin execution |
| Ingress + version routing | 📅 M2 (Q2 2025) | Timescape timestamp-based routing |
| Pub/Sub + queue fabric | 📅 M7 (Q4 2025) | Multi-provider messaging abstraction |
| Resolver contracts | 📅 M8 (Q1 2026) | Transport-agnostic communication |
| Queue abstraction | 📅 M7 (Q4 2025) | Unified interface for SQS/Pub/Sub/RabbitMQ |
| Worker scaling | 📅 M7 (Q4 2025) | Auto-scale background workers |
| Request lifecycle hooks | ✅ Stable | before/after/catch/cleanup hooks |
| Debug gates | 🚧 Playground | Pause/inspect request flow mid-execution |
| Rich requestId | ✅ Stable | Includes version, path, flags, traceId |
| Plugin sandboxing | 📅 M8 (Q1 2026) | Isolated execution with safety layers |

---

## 2. Type System & Validation

TypeScript-native approach with zero boilerplate.

### 2.1 Gati Native Types

| Feature | Status | Description |
|---------|--------|-------------|
| Branded primitives | 📅 M2 (Q2 2025) | `EmailString`, `UUID`, `PositiveNumber` |
| Constraint combinators | 📅 M2 (Q2 2025) | `MinLen<N>`, `Max<N>`, `Pattern<S>` |
| Common types library | 📅 M2 (Q2 2025) | Pre-defined types (PasswordString, etc.) |

### 2.2 Gati Validation Engine

| Feature | Status | Description |
|---------|--------|-------------|
| TS-driven schema extraction | 📅 M2 (Q2 2025) | Analyzer extracts types from source code |
| Type → GType compiler | 📅 M2 (Q2 2025) | Converts branded types to runtime schemas |
| Runtime validator | 📅 M2 (Q2 2025) | Optimized validation (Ajv-level performance) |
| Request validation | 📅 M2 (Q2 2025) | Auto-validate `req.body` against handler types |
| Response validation | 📅 M2 (Q2 2025) | Validate `res.json()` against output types |
| Cross-version validation | 📅 M2 (Q2 2025) | Timescape compatibility checking |
| Deterministic validation | 📅 M2 (Q2 2025) | Distributed-safe, consistent results |
| Validation modes | 📅 M2 (Q2 2025) | Strict/soft/relaxed validation levels |
| Schema diff engine | 📅 M2 (Q2 2025) | Detect breaking changes automatically |
| OpenAPI generation | 📅 M5 (Q3 2025) | Auto-generate OpenAPI 3.0 specs |

---

## 3. Timescape Version System

Revolutionary API versioning that eliminates breaking changes.

### 3.1 Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Automatic version creation | 📅 M2 (Q2 2025) | New version on schema change detection |
| Version timestamp routing | 📅 M2 (Q2 2025) | `X-API-Version: 2024-11-15T14:30:00Z` |
| Multi-version execution | 📅 M2 (Q2 2025) | Parallel v1, v2, v3 handler execution |
| Hot/warm/cold states | 📅 M3 (Q3 2025) | Version lifecycle management |
| Auto-deactivation | 📅 M3 (Q3 2025) | Retire old versions after sunset |
| Backward transformers | 📅 M2 (Q2 2025) | v2 → v1 data transformation |
| Forward transformers | 📅 M2 (Q2 2025) | v1 → v2 data transformation |
| Cascaded chains | 📅 M3 (Q3 2025) | v1 → v2 → v3 → v4 composition |
| Bidirectional transforms | 📅 M2 (Q2 2025) | Round-trip compatibility |
| Schema diffing | 📅 M2 (Q2 2025) | Automatic change detection |
| Breaking change detection | 📅 M2 (Q2 2025) | Identify non-compatible changes |
| Auto-generated stubs | 📅 M2 (Q2 2025) | AI-assisted transformer creation |
| Compatibility modes | 📅 M2 (Q2 2025) | Strict/lenient version matching |
| Version metadata storage | 📅 M2 (Q2 2025) | `.gati/timescape/registry.json` |
| Versioned manifests | 📅 M2 (Q2 2025) | Per-version handler manifests |

### 3.2 Developer Controls

| Feature | Status | Description |
|---------|--------|-------------|
| Version inspection | 📅 M2 (Q2 2025) | `gati timescape list` command |
| Version override | 📅 M2 (Q2 2025) | Test specific versions in dev |
| Transformer override | 📅 M2 (Q2 2025) | Manual transformer injection |
| Auto-migration preview | 📅 M3 (Q3 2025) | Preview data transformations |
| Per-handler history | 📅 M2 (Q2 2025) | Version timeline per endpoint |

---

## 4. Analyzer & Codegen

Automatic manifest and code generation from source.

### 4.1 Analyzer

| Feature | Status | Description |
|---------|--------|-------------|
| File watching | ✅ Stable | Auto-regenerate on source changes |
| Handler manifests | ✅ Stable | Extract routes, methods, signatures |
| Module manifests | ✅ Stable | Extract module exports, dependencies |
| Plugin manifests | 📅 M8 (Q1 2026) | Extract plugin metadata |
| Route manager manifests | ✅ Stable | Centralized route registry |
| Middleware manifests | ✅ Stable | Middleware order and config |
| App manifest | ✅ Stable | `.gati/manifests/_app.json` |
| Type extraction | 📅 M2 (Q2 2025) | TypeChecker API for branded types |
| Decorator scanning | 📅 Future | Optional plugin-based decorators |
| Schema extraction | 📅 M2 (Q2 2025) | Convert types to GType schemas |
| Plugin metadata | 📅 M8 (Q1 2026) | Extract plugin contracts |
| Version diffing | 📅 M2 (Q2 2025) | Compare handler signatures |
| AST transformation | 📅 M5 (Q3 2025) | Code modification utilities |

### 4.2 Codegen

| Feature | Status | Description |
|---------|--------|-------------|
| Handler definitions | 📅 M5 (Q3 2025) | Generate handler boilerplate |
| Module APIs | 📅 M8 (Q1 2026) | Generate module interfaces |
| Plugin wrappers | 📅 M8 (Q1 2026) | Generate plugin scaffolding |
| TypeScript SDK | 📅 M5 (Q3 2025) | Type-safe client library |
| Python SDK | 📅 Future | Python client generation |
| Go SDK | 📅 Future | Go client generation |
| Transform stubs | 📅 M2 (Q2 2025) | Timescape transformer generation |
| Versioned schemas | 📅 M2 (Q2 2025) | Per-version type exports |
| Runtime scaffolding | 📅 M5 (Q3 2025) | Boilerplate code generation |
| OpenAPI generation | 📅 M5 (Q3 2025) | OpenAPI 3.0 spec files |
| Playground config | ✅ Stable | Auto-complete, validation templates |
| K8s artifacts | ✅ Stable | Deployment, Service, HPA manifests |

---

## 5. Plugins & Plugin Ecosystem

Marketplace for reusable Gati projects and modules.

### 5.1 Plugin Capabilities

| Feature | Status | Description |
|---------|--------|-------------|
| Database connectors | 📅 M8 (Q1 2026) | PostgreSQL, MySQL, MongoDB modules |
| Queue providers | 📅 M7 (Q4 2025) | SQS, Pub/Sub, RabbitMQ adapters |
| Pub/sub providers | 📅 M7 (Q4 2025) | Redis, Kafka, NATS integration |
| AI model providers | 📅 Future | OpenAI, Anthropic, local LLM modules |
| Object storage | 📅 Future | S3, GCS, Azure Blob modules |
| Auth/security plugins | 📅 Future | OAuth, JWT, WebAuthn, SAML |
| Cache plugins | 📅 M7 (Q4 2025) | Redis, Dragonfly, Memcached |
| Monitoring plugins | ✅ Stable | Pino logging, health checks |
| Playground extensions | 🚧 Playground | Custom visualization modes |
| Cloud deployer plugins | ✅ Stable (AWS) | AWS EKS, GCP GKE, Azure AKS |
| Framework migration | 📅 Future | Express, Nest, Fastify converters |
| Validator plugins | 📅 M2 (Q2 2025) | Custom validation logic |

### 5.2 Plugin Manager

| Feature | Status | Description |
|---------|--------|-------------|
| Install/uninstall | 📅 M8 (Q1 2026) | `gati plugin add/remove` |
| Versioning | 📅 M8 (Q1 2026) | Semantic versioning support |
| Marketplace integration | 📅 Future | Browse/install from marketplace |
| Plugin sandboxes | 📅 M8 (Q1 2026) | Isolated execution environments |
| Plugin contracts | 📅 M8 (Q1 2026) | API, resolver, lifecycle interfaces |
| Plugin analytics | 📅 Future | Usage stats, error tracking |
| Revenue-share | 📅 Future | 70/30 split for paid plugins |

---

## 6. Gati Playground

Visual debugging and API testing tool (3-mode visualization).

### 6.1 Modes

| Feature | Status | Description |
|---------|--------|-------------|
| API Mode | ✅ Stable | Postman-like API testing |
| Network Mode | ✅ Stable | 2D distributed backend visualization |
| Tracking Mode | ✅ Stable | 3D request lifecycle tracking |
| Stress testing | ✅ Stable | Built-in load testing |
| Mock datasets | ✅ Stable | Fixture data generation |
| Environment switching | ✅ Stable | Dev/staging/prod environments |
| Version switching | 📅 M2 (Q2 2025) | Test against specific API versions |
| Request particle flow | ✅ Stable | Visual request path animation |
| Component health | ✅ Stable | Latency, memory, CPU metrics |
| Debug gates | ✅ Stable | Pause execution, inspect data |
| Time-travel replay | 📅 Future | Replay past requests |

---

## 7. Gati Cloud

Managed hosting platform (planned).

### 7.1 Core Cloud Capabilities

| Feature | Status | Description |
|---------|--------|-------------|
| Hosting backends | 📅 Future | Fully managed Gati deployments |
| K8s management | 📅 M2 (Q2 2025) | Operator-based auto-management |
| Multi-cloud provisioning | 📅 M2 (Q2 2025) | AWS, GCP, Azure support |
| Auto-scaling clusters | ✅ Stable | HPA-based scaling |
| DB/cache provisioning | 📅 Future | Managed data services |
| TLS/SSL auto-management | 📅 M6 (Q4 2025) | ACM, Let's Encrypt integration |
| CDN integrations | 📅 M6 (Q4 2025) | CloudFront, Cloud CDN, Azure FD |
| Monitoring & alerts | ✅ Stable | Built-in observability |
| Secret management | ✅ Stable | Encrypted K8s secrets |
| One-click deployments | ✅ Stable | `gati deploy` command |
| Git integration | 📅 Future | Auto-deploy on push |

### 7.2 Dev Cloud

| Feature | Status | Description |
|---------|--------|-------------|
| Cloud dev environments | 📅 Future | Remote development workspaces |
| Hosted Playground | 📅 Future | Cloud-based visual debugging |
| Cloud analyzer/codegen | 📅 Future | Remote code generation |
| Cloud testing | 📅 Future | Remote test execution |
| Real-time logs/traces | ✅ Stable | Structured logging |

### 7.3 Billing

| Feature | Status | Description |
|---------|--------|-------------|
| Usage-based pricing | 📅 Future | Pay for what you use |
| Plugin billing | 📅 Future | Marketplace purchases |
| Multi-cloud cost estimation | 📅 Future | Cost calculator |

---

## 8. Multi-Cloud Deployer

Deploy to any cloud provider with one command.

| Cloud | Status | Description |
|-------|--------|-------------|
| AWS EKS | ✅ Stable | Automated EKS deployment |
| GCP GKE | 📅 M2 (Q2 2025) | Google Kubernetes Engine |
| Azure AKS | 📅 M2 (Q2 2025) | Azure Kubernetes Service |
| DigitalOcean | 📅 Future | DO Kubernetes |
| Gati Cloud | 📅 Future | Managed hosting |
| Custom clusters | ✅ Stable | Any K8s cluster (kind, minikube) |
| Cloud login | 📅 M2 (Q2 2025) | Auto-provision on auth |
| Cost-aware deployment | 📅 Future | Optimize for cost |
| Region selection | ✅ Stable | Deploy to specific regions |
| Auto failover | 📅 M6 (Q4 2025) | Cross-region failover |

---

## 9. Gati Operator (Kubernetes)

Kubernetes operator for automated lifecycle management.

| Feature | Status | Description |
|---------|--------|-------------|
| Managed deployment | ✅ Stable | Automated K8s deployments |
| Manifest syncing | ✅ Stable | Auto-update from source |
| Timescape deployment | 📅 M2 (Q2 2025) | Multi-version rollouts |
| Canary rollout | 📅 M3 (Q3 2025) | Gradual traffic shifting |
| Blue-green switching | 📅 Future | Zero-downtime deploys |
| Auto-scaling handlers | ✅ Stable | HPA-based scaling |
| Auto-scaling modules | 📅 M8 (Q1 2026) | Independent module scaling |
| Health checks | ✅ Stable | Liveness/readiness probes |
| Telemetry | ✅ Stable | Metrics, logs, traces |
| Secret injection | ✅ Stable | Encrypted secrets |
| Plugin deployment | 📅 M8 (Q1 2026) | Plugin sidecar management |
| Playground deployment | ✅ Stable | Deploy Playground UI |
| Migration rollout | 📅 Future | Safe migration strategies |

---

## 10. Migration Engine

Tools to migrate existing backends to Gati.

### 10.1 Express → Gati

| Feature | Status | Description |
|---------|--------|-------------|
| Route extraction | 📅 Future | Extract Express routes |
| Middleware conversion | 📅 Future | Convert middleware chain |
| Handler mapping | 📅 Future | Map route handlers |
| Type inference | 📅 Future | Infer types from JS/TS |
| Auto transformer suggestions | 📅 Future | AI-assisted migration |

### 10.2 NestJS → Gati

| Feature | Status | Description |
|---------|--------|-------------|
| DI graph reconstruction | 📅 Future | Map NestJS dependencies |
| Decorator extraction | 📅 Future | Convert decorators |
| Controllers → handlers | 📅 Future | Map controller methods |
| Providers → modules | 📅 Future | Convert providers |
| DTO → GTypes | 📅 Future | Convert validation |
| Guards/pipes → hooks | 📅 Future | Map to lctx hooks |

### 10.3 Other Frameworks

| Framework | Status | Description |
|-----------|--------|-------------|
| Fastify | 📅 Future | High-speed framework migration |
| Koa | 📅 Future | Middleware-based framework |
| Hapi | 📅 Future | Plugin-based framework |
| Adonis | 📅 Future | Full-stack framework |

---

## 11. Testing System

Built-in testing utilities and frameworks.

| Feature | Status | Description |
|---------|--------|-------------|
| `@gati/testing` | 📅 Future | Handler + lctx test utilities |
| `@gati/simulate` | 📅 Future | Runtime simulator |
| `@gati/e2e` | 📅 Future | K8s testing kit |
| `@gati/loadtest` | 📅 Future | k6/artillery wrappers |
| `@gati/timescape-test` | 📅 M2 (Q2 2025) | Version evolution tests |
| Playground simulation | ✅ Stable | Test via Playground UI |
| CI/CD integrations | 📅 Future | GitHub Actions, GitLab CI |
| Version rollout tests | 📅 M3 (Q3 2025) | Canary test automation |

---

## 12. AI Agents

Intelligent automation for development tasks.

### 12.1 Runtime Agents

| Feature | Status | Description |
|---------|--------|-------------|
| Transformer generator | 📅 M2 (Q2 2025) | Auto-generate transformers |
| Request optimizer | 📅 Future | Optimize handler performance |
| Debug assistant | 📅 Future | AI-powered debugging |
| Version evolution | 📅 M2 (Q2 2025) | Suggest version strategies |

### 12.2 Development Agents

| Feature | Status | Description |
|---------|--------|-------------|
| Code fix assistant | 📅 Future | Auto-fix common errors |
| Migration assistant | 📅 Future | Express/Nest → Gati |
| Schema diff explanation | 📅 M2 (Q2 2025) | Explain breaking changes |
| Test generator | 📅 Future | Generate test cases |
| Playground assistant | 📅 Future | AI-powered debugging |

---

## Summary Statistics

| Category | Total Features | Stable | In Progress | Planned |
|----------|----------------|--------|-------------|---------|
| **Core Runtime** | 18 | 10 | 1 | 7 |
| **Type System** | 20 | 0 | 0 | 20 |
| **Timescape** | 20 | 0 | 0 | 20 |
| **Analyzer & Codegen** | 26 | 6 | 0 | 20 |
| **Plugins** | 18 | 2 | 1 | 15 |
| **Playground** | 11 | 9 | 0 | 2 |
| **Cloud** | 21 | 4 | 1 | 16 |
| **Deployment** | 10 | 5 | 0 | 5 |
| **Operator** | 13 | 6 | 0 | 7 |
| **Migration** | 11 | 0 | 0 | 11 |
| **Testing** | 8 | 1 | 0 | 7 |
| **AI Agents** | 9 | 0 | 0 | 9 |
| **TOTAL** | **185** | **43** | **3** | **139** |

---

## Next Steps

- 📖 [Why Gati?](/vision/why-gati) — Understand the problems Gati solves
- 🎯 [Core Philosophy](/vision/philosophy) — Gati's design principles
- 🏗️ [Architecture Overview](/architecture/overview) — Deep dive into design
- 🗺️ [Milestones](/architecture/milestones) — Detailed implementation roadmap

---

*Last Updated: November 18, 2025*
