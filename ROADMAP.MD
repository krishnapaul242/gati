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

| KPI                   | Target           |
| --------------------- | ---------------- |
| Dev setup time        | ≤5 min           |
| No-downtime deploy    | Every version    |
| Auto-generated types  | <200ms per route |
| Regional failover     | ≤30s             |
| Logs, metrics visible | 100% coverage    |

---

## 9. 🔒 Out of Scope (for now)

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
