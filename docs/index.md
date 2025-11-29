---
layout: home

hero:
  name: "Gati"
  text: "The Backend That Builds, Scales, and Evolves Itself"
  tagline: "Zero-Ops, Infinite Evolution — Let developers write business logic. Let Gati handle everything else."
  image:
    src: /gati.png
    alt: Gati Framework
  actions:
    - theme: brand
      text: Quick Start
      link: /onboarding/quick-start
    - theme: alt
      text: Read the Blog
      link: /blog/
    - theme: alt
      text: View on GitHub
      link: https://github.com/krishnapaul242/gati

features:
  - icon: 🧠
    title: Code That Understands Itself
    details: Gati analyzes your handlers, modules, types, and schemas — automatically generating optimized runtime, manifests, validators, and deployment configs. No manual configuration needed.
  
  - icon: 🔄
    title: Timescape — APIs That Never Break
    details: Revolutionary version management with automatic schema diffing, transformer generation, and parallel version execution. Ship new versions without fear. (Planned M2+)
  
  - icon: 📦
    title: Modular Architecture
    details: Everything is a module — databases, caches, auth, storage, AI models. Install modules like NPM packages with isolated processes, manifests, and contracts.
  
  - icon: ⚡
    title: High Performance Runtime
    details: 172K requests/sec with sub-millisecond latency. Queue fabric architecture, worker pool isolation, and optimized route matching. 2.6M route matches/sec.
  
  - icon: 🚀
    title: Zero-Ops Deployment
    details: Automatic containerization, K8s manifests, multi-cloud deployment (AWS/GCP/Azure), scaling policies, SSL provisioning, and CDN integration. Deploy anywhere in seconds.
  
  - icon: 🎮
    title: Visual Debugging Playground
    details: 3-mode visualization (API testing, 2D network map, 3D request lifecycle) with debug gates, stress testing, and real-time observability. Postman on steroids.
  
  - icon: 🔍
    title: Manifest-Driven Development
    details: File-based routing with auto-generated manifests. Write code, Gati generates config. Hot reload with 50-200ms updates. Single source of truth prevents config drift.
  
  - icon: 🛠️
    title: AI-Augmented DX
    details: Auto-generated transformers for breaking changes, migration assistants for Express/Nest/Fastify, schema diff explanations, and intelligent debugging suggestions.
  
  - icon: 🌐
    title: Plugin Ecosystem
    details: Extend with full Gati projects as plugins. Marketplace-ready with versioning, sandboxing, and revenue-share (70/30 model). Build once, distribute everywhere.

---

<style>
.VPHero .container {
  max-width: 1152px !important;
}

.VPFeatures {
  padding-top: 48px !important;
}
</style>

## NPM Packages

All Gati packages are published to npm and ready for production use:

**Core Packages:**
- [@gati-framework/core](https://npmjs.com/package/@gati-framework/core) - Core runtime and base config (v0.4.5)
- [@gati-framework/runtime](https://npmjs.com/package/@gati-framework/runtime) - Handler execution engine (v2.0.3)
- [@gati-framework/types](https://npmjs.com/package/@gati-framework/types) - TypeScript type system (v1.0.1)
- [@gati-framework/cli](https://npmjs.com/package/@gati-framework/cli) - CLI tools (v1.0.14)

**Cloud Providers:**
- [@gati-framework/cloud-aws](https://npmjs.com/package/@gati-framework/cloud-aws) - AWS plugin (v1.0.0)
- [@gati-framework/cloud-gcp](https://npmjs.com/package/@gati-framework/cloud-gcp) - GCP plugin (v1.0.2)
- [@gati-framework/cloud-azure](https://npmjs.com/package/@gati-framework/cloud-azure) - Azure plugin (v1.0.2)

**Infrastructure:**
- [@gati-framework/observability](https://npmjs.com/package/@gati-framework/observability) - Monitoring stack (v1.0.2)
- [@gati-framework/production-hardening](https://npmjs.com/package/@gati-framework/production-hardening) - Production utilities (v1.0.2)
- [@gati-framework/playground](https://npmjs.com/package/@gati-framework/playground) - Visual debugging (v1.0.0)

## Quick Start

```bash
# Create a new project
npx @gati-framework/cli create my-api
cd my-api

# Start development server with hot reload
pnpm dev

# Deploy to local Kubernetes
gati deploy dev --local
```

## Your First Handler

```typescript
// src/handlers/users/[id].ts
import type { Handler } from '@gati-framework/runtime';

export const METHOD = 'GET';
export const ROUTE = '/api/users/:id';

export const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  
  // Access modules via dependency injection
  const user = await gctx.modules['database']?.findUser(userId);
  
  if (!user) {
    throw new HandlerError('User not found', 404, { userId });
  }
  
  res.json({ 
    user,
    requestId: lctx.requestId,
    traceId: lctx.traceId 
  });
};
```

**That's it.** Gati handles routing, validation, deployment, scaling, versioning, and monitoring automatically.

## The Gati Difference

### Traditional Backend Development

```
❌ Manually configure routing, middleware, CORS
❌ Write Dockerfile, K8s manifests, CI/CD pipelines
❌ Manually version APIs, maintain backward compatibility
❌ Set up logging, metrics, tracing infrastructure
❌ Write client SDKs manually or use brittle codegen
❌ Deploy/scale/monitor requires DevOps expertise
```

### With Gati

```
✅ Write handlers — routing, middleware auto-configured
✅ gati deploy dev --local — automatic containerization
✅ Timescape handles versioning transparently (M2+)
✅ Built-in observability with /_control panel (M4)
✅ gati generate — type-safe SDKs auto-generated (M5)
✅ Zero-ops deployment to AWS/GCP/Azure/K8s
```

## Core Philosophy

**1. Let Developers Write Business Logic**

Gati analyzes your code and auto-generates everything else: manifests, validators, deployments, SDKs, transformers.

**2. APIs That Never Break**

Timescape enables parallel version execution with automatic schema diffing and data transformation. Ship fearlessly.

**3. Modules Like NPM Packages**

Install databases, caches, auth providers like frontend dependencies. Isolated processes, automatic scaling.

**4. TypeScript-Native Types**

Single type definition → runtime validator, OpenAPI spec, client SDKs, Timescape metadata. Zero boilerplate.

**5. Zero-Ops Deployment**

One command to deploy anywhere. Gati handles containers, manifests, scaling, SSL, CDN, monitoring.

## Performance

**Gati runtime achieves exceptional performance:**

- **172,000 RPS** - Single-threaded throughput
- **2.6M ops/sec** - Route matching performance
- **<6μs** - Total pipeline latency
- **172x better** - Than MVP target (1K RPS)

[Read the benchmarks →](/blog/runtime-performance-benchmarks)

## Current Status

| Component | Version | Status | NPM | Description |
|-----------|---------|--------|-----|-------------|
| Core Framework | 0.4.5 | ✅ **Stable** | [@gati-framework/core](https://npmjs.com/package/@gati-framework/core) | Core types and configuration |
| Runtime Engine | 2.0.8 | ✅ **Stable** | [@gati-framework/runtime](https://npmjs.com/package/@gati-framework/runtime) | 172K RPS execution engine |
| Type System | 1.0.1 | ✅ **Stable** | [@gati-framework/types](https://npmjs.com/package/@gati-framework/types) | GType branded types |
| CLI Tools | 1.0.19 | ✅ **Stable** | [@gati-framework/cli](https://npmjs.com/package/@gati-framework/cli) | Dev server, hot reload, deployment |
| Testing | 0.1.0 | ✅ **Stable** | [@gati-framework/testing](https://npmjs.com/package/@gati-framework/testing) | Test harness and mocks |
| Playground | 1.0.0 | ✅ **Stable** | [@gati-framework/playground](https://npmjs.com/package/@gati-framework/playground) | Visual debugging |
| AWS Plugin | 1.0.1 | ✅ **Stable** | [@gati-framework/cloud-aws](https://npmjs.com/package/@gati-framework/cloud-aws) | EKS deployment |
| GCP Plugin | 1.0.0 | ✅ **Stable** | [@gati-framework/cloud-gcp](https://npmjs.com/package/@gati-framework/cloud-gcp) | GKE deployment |
| Azure Plugin | 1.0.0 | ✅ **Stable** | [@gati-framework/cloud-azure](https://npmjs.com/package/@gati-framework/cloud-azure) | AKS deployment |
| Observability | 2.0.0 | ✅ **Stable** | [@gati-framework/observability](https://npmjs.com/package/@gati-framework/observability) | Metrics, logging, tracing |
| Timescape | - | 🚧 **M3 In Progress** | - | API versioning system |
| SDK Generation | - | 📅 **M5 Planned** | - | Auto-generated clients |
| Control Panel | - | 📅 **M4 Planned** | - | Monitoring UI |

### 🎉 M1 & M2 Complete — Production Ready!

All core packages are **published to npm** and production-ready with 99.3% test coverage (841/847 tests passing).

<p align="center">
  <a href="https://npmjs.com/package/@gati-framework/core">
    <img src="https://img.shields.io/npm/v/@gati-framework/core?label=core&color=blue" alt="Core">
  </a>
  <a href="https://npmjs.com/package/@gati-framework/runtime">
    <img src="https://img.shields.io/npm/v/@gati-framework/runtime?label=runtime&color=blue" alt="Runtime">
  </a>
  <a href="https://npmjs.com/package/@gati-framework/cli">
    <img src="https://img.shields.io/npm/v/@gati-framework/cli?label=cli&color=blue" alt="CLI">
  </a>
  <a href="https://npmjs.com/package/@gati-framework/types">
    <img src="https://img.shields.io/npm/v/@gati-framework/types?label=types&color=blue" alt="Types">
  </a>
</p>

### Production-Ready Features (✅ M1 & M2 Complete)

- **High Performance** — 172K RPS, <6μs latency, queue fabric architecture
- **Development** — Hot reload (50-200ms), manifest system, file-based routing
- **Deployment** — AWS EKS, GCP GKE, Azure AKS, local K8s (kind)
- **Observability** — Prometheus, Grafana, Loki, distributed tracing
- **Debugging** — Playground with 3 visualization modes, request replay
- **Testing** — Test harness, mocks, 99.3% coverage
- **CI/CD** — Automated testing, building, npm publishing

### Latest Update (Nov 25, 2025)

🚀 **Performance Benchmarks** — Achieved 172K RPS!
- ✅ 2.6M route matches/sec
- ✅ 505K context creations/sec
- ✅ 294K handler executions/sec
- ✅ <6μs total pipeline latency
- ✅ 172x better than MVP target

[Read the benchmarks →](/blog/runtime-performance-benchmarks)

### Roadmap

**M1 & M2 (Q4 2025)** — ✅ COMPLETE - Core runtime, deployment, observability  
**M3 (Q1 2026)** — 🚧 IN PROGRESS - Timescape versioning, enhanced modules  
**M4 (Feb 2026)** — Module Registry & Marketplace  
**M5 (Q1 2026)** — Control Panel (monitoring UI)  
**M6 (Q1 2026)** — SDK generation  
**M7 (Q2 2026)** — CDN integration, SSL automation

### Looking for Contributors!

Gati is currently a solo project by Krishna Paul. I'm actively looking for:
- 🧪 Beta testers
- 👨‍💻 Contributors (especially for M3 & M4 features)
- 📚 Technical writers
- 🎨 UI/UX designers (Module Registry & Control Panel)

[Join the journey →](/contributing/README)

## Latest from the Blog

### [Achieving 172K RPS: Gati Runtime Benchmarks](/blog/runtime-performance-benchmarks)

**November 25, 2025** • *Krishna Paul*

Deep dive into Gati runtime performance. How we achieved 172x better throughput than our MVP target with queue fabric architecture, worker pool isolation, and optimized route matching.

[Read the benchmarks →](/blog/runtime-performance-benchmarks)

### [From Idea to Production in 5 Minutes](/blog/rapid-development-workflow)

**November 25, 2025** • *Krishna Paul*

How Gati enables rapid development with instant scaffolding, hot reload, and one-command deployment. From `npx gatic create` to production in 5 minutes.

[Read the workflow guide →](/blog/rapid-development-workflow)

---

## Community

Gati is built by Krishna Paul as a solo project, and I'm looking for contributors!

<p align="center">
  <a href="https://github.com/krishnapaul242/gati/stargazers">
    <img src="https://img.shields.io/github/stars/krishnapaul242/gati?style=social" alt="GitHub stars">
  </a>
</p>

- ⭐ [Star on GitHub](https://github.com/krishnapaul242/gati/stargazers) — Show your support
- 💬 [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions) — Ask questions, share ideas
- 🐛 [Issue Tracker](https://github.com/krishnapaul242/gati/issues) — Report bugs, request features
- 📖 [Contributing Guide](/contributing/README) — Help build Gati
- 🧪 [Beta Testing](https://github.com/krishnapaul242/gati/discussions) — Try M3 features

**Want to contribute?** I'm especially looking for help with M3 (Timescape, modules, types)!

## License

MIT © [Krishna Paul](https://github.com/krishnapaul242)

---

<div class="tip custom-block" style="margin-top: 48px; text-align: center;">

Ready to build something amazing? [Get Started →](/onboarding/getting-started)

</div>
