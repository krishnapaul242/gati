# 🚀 Gati — Product Requirements Document (PRD)

**Version:** 0.1 (Draft)  
**Project Name:** Gati (meaning "motion" or "progress" in Sanskrit)  
**Project Type:** Solo-Led Open Source Framework  
**Author:** [Krishna Paul](https://krishnapaul.in)  
**Date:** 2025-11-08

---

## 1. 📌 Executive Summary

**Gati** is an open-source JavaScript/TypeScript framework designed to enable developers to create **infinitely scalable, cloud-native, modular applications**, while abstracting the pains of infrastructure and versioning.

With Gati, developers focus **only on business logic**. The platform automatically handles:

- Kubernetes deployment
- Distributed scaling
- Versioned APIs (semantic & timestamp-based)
- Multi-cloud deploys (AWS, GCP, Azure)
- CDN + SSL provisioning
- Live control panel and API Playground
- Typed SDK generation for client-side apps

Gati = "Backend without backend hassle".

---

## 2. 🎯 Goals & Objectives

| Goal | Description |
|------|-------------|
| ✅ Empower developers | Focus only on handlers, modules, effects |
| ✅ Provide future-proof APIs | Auto semantic + timestamp versioning |
| ✅ Scale seamlessly | Kubernetes-native with auto scaling & routing |
| ✅ Support multi-region | Integrated CDN + global deployment plugins |
| ✅ Type-safe clients | Auto generate SDKs from handler signatures |
| ✅ Built-in monitoring | Admin UI with logs, metrics, live topology |
| ✅ **Polyglot extensibility** | **Support modules from NPM, Docker (Rust/Go/Python), local files** |
| ✅ **Hot-loadable architecture** | **Zero-downtime module swapping and version updates** |

---

## 3. 🧱 Architecture Overview

```plaintext
    Client
      ↓
 CDN + Auto SSL
      ↓
  App Core (version resolver, router)
      ↓
Route Manager (global context, runtime scaling)
      ↓
  Handlers  →  Modules  →  Databases or Effect Queue → Workers
````

* `App Core`: Global router that handles version resolution and client metadata.
* `Route Manager`: Container-per-domain managing business logic entrypoints and scaling.
* `Handler`: Pluggable functions implementing HTTP routes.
* `Module`: Stateless, composable logic (reusable across handlers).
* `Effect Worker`: Long-running and retryable tasks.

---

## 4. 🧠 Core Features

### 4.1 Handlers & Modules

**Handler example:**

```ts
export const route = 'POST /payments/:id/capture';

export async function handler(req, res, gctx, lctx) {
  const ok = await gctx.modules.ledger.reserve(req.params.id, req.body.amount);
  if (!ok) {
    res.status = 409;
    return res.json({ error: 'ReservationFailed' });
  }
  await gctx.effects.enqueue('capturePayment', { id: req.params.id });
  res.status = 202;
  res.body = { state: 'capturing' };
}
```

* `req`, `res`: Passed through pipeline (mutable)
* `gctx`: Global context for DB, modules, effects, queue
* `lctx`: Local context (per handler and request)

---

### 4.2 Versioned API Routing

* Auto-diffs handlers to assign **semantic version bump**
* Deployment stores snapshot with timestamp
* Client header:

  ```
  X-API-Version: 2025-11-09T10:00:00Z
  ```

If version missing → return options with available versions.

---

### 4.3 Cloud Deployment Plugins

* Built-in: `@gati/cloud-aws`, `@gati/cloud-gcp`, `@gati/cloud-azure`
* Handles:

  * Kubernetes deploy
  * Per-region service scaling
  * CDN (CloudFront, Cloud CDN, Azure Front Door)
  * Auto SSL via ACM or Let’s Encrypt

**Custom provider example:**

```yaml
provider: custom
cdnScript: ./scripts/cdn.sh
deployScript: ./scripts/deploy.sh
```

---

### 4.4 Control Panel

* Mounted at:

  ```
  /_control
  ```
* Includes:

  * Deployment graph
  * Status and live tracing
  * Logs & metrics (from Loki, Prometheus)
  * Rollback, scaling, config editor
* Auth:

  * Passkey (WebAuthn)
  * TOTP (RFC 6238)

---

### 4.5 API Playground

* Route explorer with:

  * Pre/post scripts using isolated VM
  * WebSockets testing
  * Supports bearer auth and session reuse
  * Exportable as integration test flows

---

### 4.6 CLI & Code Generator

**Commands:**

```bash
gati dev
gati build
gati deploy [env]
gati generate         # typed client
```

**generates →**

* `.gati/generated/client.ts` — typed clients, version aware
* `.gati/generated/context.ts` — local/global context types
* `/sdk/appname-<semver>.tgz` — publishable package

---

## 5. 🧪 Developer Workflow Example

```
1. Write handler in /src/handlers/payments/capture.ts
2. Link modules & effects in route manager
3. Run `gati dev` and test locally
4. Commit, merge → CI runs `gati build && gati deploy prod`
5. Use generated SDK in frontend: `npm i @gati/payments-client`
6. Inspect version & topology in GUI `/control`
```

---

## 6. 📡 Technical Stack

| Layer         | Stack                           |
| ------------- | ------------------------------- |
| Runtime       | Node.js 20, Fastify, TypeScript |
| PaaS          | Kubernetes (AKS, EKS, GKE)      |
| Deployment    | GitHub Actions / Argo CD        |
| CDN           | CloudFront, Cloudflare, etc     |
| Observability | OpenTelemetry, Loki, Prometheus |
| Queues        | SQS, Pub/Sub, Azure Queue       |

---

## 7. 🚧 Technical Milestones

| Milestone | Scope                                     | Status      |
| --------- | ----------------------------------------- | ----------- |
| M1        | Handler/Module runtime with CLI           | ✅ Complete |
| M2        | Kubernetes deploy + AWS plugin            | ⏳ Pending  |
| M3        | Version diff analyzer                     | ⏳ Pending  |
| M4        | Control Panel (limited) + Logs            | ⏳ Pending  |
| M5        | SDK codegen + Playground                  | ⏳ Pending  |
| M6        | CDN + SSL automation                      | ⏳ Pending  |
| M7        | Effects + async jobs                      | ⏳ Pending  |
| **M8**    | **Dynamic Module System & Extensibility** | ⏳ Pending  |

**M8 Highlights:**

- 🔌 Multi-source modules: NPM, Docker (Rust/Go/Python), local files
- ♻️ Hot-reload with zero downtime
- 🌐 Polyglot support via containerized modules
- 📦 Module marketplace ecosystem
- 🚀 Per-component autoscaling

---

## 8. 🧭 KPIs for Success

| KPI                       | Target              | Layer/Phase       |
| ------------------------- | ------------------- | ----------------- |
| Dev setup time            | ≤5 min              | M1                |
| No-downtime deploy        | Every version       | M2-M3             |
| Auto-generated types      | <50ms per type      | M5 / Phase 2      |
| Validator performance     | 2-5× faster vs Zod  | Phase 2           |
| Route lookup              | <0.5ms              | Phase 3           |
| Handler invocation        | <1ms overhead       | Phase 3           |
| Middleware chain          | <5ms total          | Phase 4           |
| E2E request p50           | <30ms               | Phase 6           |
| E2E request p95           | <100ms              | Phase 6           |
| E2E request p99           | <300ms              | Phase 6           |
| Analyzer incremental      | <100ms              | Phase 2           |
| Startup (100 routes + DB) | <500ms              | Phase 6           |
| Regional failover         | ≤30s                | M6                |
| Logs/metrics coverage     | 100%                | M4 / Phase 6      |
| Benchmark regression rate | <5% of PRs flagged  | Phase 6 onward    |

**Performance SLOs**:
- Availability: 99.95%
- Request Success Rate: 99.9%
- p50 Latency: <30ms
- p95 Latency: <100ms
- p99 Latency: <300ms

**See Also**:
- [Performance Guide](../guides/performance.md) - Complete latency budgets
- [Benchmarking Guide](../guides/benchmarking.md) - Benchmark specifications
- [Milestones](./milestones.md) - Phased delivery plan

---

## 9. 🎯 Performance-First Architecture

### 10-Layer Model

Gati is built on a **performance-first, layered architecture** with specific latency budgets per layer:

| Layer | Responsibility | Target Latency |
|-------|----------------|----------------|
| 1. Developer Tooling | File watching, hot reload, analyzer | <100ms incremental |
| 2. File-Based Router | Route discovery, param extraction | <0.5ms lookup |
| 3. Gati Analyzer | AST parsing, type extraction, GType | <50ms single file |
| 4. Artifact Generators | Validators, .d.ts, DB schemas | <50ms per type |
| 5. Protocol Gateways | HTTP, WebSocket, RPC adapters | 0.5-2ms |
| 6. Middleware Chain | Auth, CORS, rate limit, tracing | <5ms total |
| 7. Context Builder | gctx + lctx → ctx merge | <0.2ms |
| 8. Handler Engine | Invocation, validation, errors | <1ms overhead |
| 9. DB Client | Query builder, type safety | <2ms overhead |
| 10. External Systems | Postgres, Redis, S3 | 5-100+ ms (network) |

**Critical Path** (Layers 2, 5-9): Combined overhead target **<10ms** excluding database network I/O.

### Benchmarking Infrastructure

Gati includes comprehensive benchmarking:

- **6 Micro-benchmark Suites**: Validator, routing, middleware, startup, analyzer, RPS
- **Baseline Management**: Automated regression detection
- **CI Integration**: Nightly benchmarks + PR performance guards
- **Load Testing**: Artillery and k6 examples included

---

## 10. 🔒 Out of Scope (for now)

* RPC runtime (future addition)
* Multi-language module DSL
* Auth server as a product
* Built-in identity federation

---

## 10. 📄 License

* License: MIT (planned)
* Contributions: Open to issues, discussions, plugins

---

## 11. ✅ Next Steps

1. Scaffold project structure
2. Implement handler runtime and CLI
3. Build and test AWS deployment plugin
4. Create roadmap docs and contribution guide

 

**Welcome to the journey — Gati is motion in code.**
