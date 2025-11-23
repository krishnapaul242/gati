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
    title: TypeScript-Native Type System
    details: Branded types with constraint combinators (EmailString, MinLen<8>) generate validators, OpenAPI specs, SDKs, and Timescape metadata from single definitions. (Planned M2)
  
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

## Current Status

| Component | Version | Status | NPM | Description |
|-----------|---------|--------|-----|-------------|
| Core Framework | 0.4.5 | ✅ **Stable** | [@gati-framework/core](https://npmjs.com/package/@gati-framework/core) | Core runtime, handler engine, contexts |
| Type System | 1.0.1 | ✅ **Stable** | [@gati-framework/types](https://npmjs.com/package/@gati-framework/types) | TypeScript-first branded types and schema system |
| Runtime Engine | 2.0.3 | ✅ **Stable** | [@gati-framework/runtime](https://npmjs.com/package/@gati-framework/runtime) | Handler execution, lifecycle management |
| Runtime Architecture | - | 🚧 **55% Complete** | - | GType, contexts, hooks, manifests (468 tests) |
| CLI Tools | 1.0.14 | ✅ **Stable** | [@gati-framework/cli](https://npmjs.com/package/@gati-framework/cli) | Dev server, build, deployment commands |
| AWS Plugin | 1.0.0 | ✅ **Stable** | [@gati-framework/cloud-aws](https://npmjs.com/package/@gati-framework/cloud-aws) | AWS cloud provider plugin |
| GCP Plugin | 1.0.2 | ✅ **Stable** | [@gati-framework/cloud-gcp](https://npmjs.com/package/@gati-framework/cloud-gcp) | GCP cloud provider plugin |
| Azure Plugin | 1.0.2 | ✅ **Stable** | [@gati-framework/cloud-azure](https://npmjs.com/package/@gati-framework/cloud-azure) | Azure cloud provider plugin |
| Observability | 1.0.2 | ✅ **Stable** | [@gati-framework/observability](https://npmjs.com/package/@gati-framework/observability) | Prometheus, Grafana, Loki, Tracing |
| Production Hardening | 1.0.2 | ✅ **Stable** | [@gati-framework/production-hardening](https://npmjs.com/package/@gati-framework/production-hardening) | Secret management, config validation, auto-scaling |
| Playground | 1.0.0 | ✅ **Stable** | [@gati-framework/playground](https://npmjs.com/package/@gati-framework/playground) | Visual debugging (3-mode) |
| Timescape | - | 📅 **M3 Priority** | - | Version management, schema diffing |
| SDK Generation | - | 📅 **M5 Planned** | - | Auto-generated typed clients |
| Control Panel | - | 📅 **M4 Planned** | - | Web UI for monitoring |

### 🎉 M1 Complete — Now on NPM!

All core packages are **published to npm** and production-ready! CI/CD pipeline is passing with automated testing and releases.

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

### Production-Ready Features (✅ M1 Complete)

- **Core Runtime** — Handler engine, modules, middleware, contexts
- **Development** — Hot reload (50-200ms), manifest system, file-based routing
- **Deployment** — Local K8s (kind), AWS EKS, Docker, HPA, Ingress
- **Observability** — Structured logging (Pino), request tracing, health checks
- **Debugging** — Playground with API/Network/Tracking visualization modes
- **CI/CD** — Automated testing, building, and npm publishing
- **Project Scaffolding** — GatiC CLI for instant project creation

### Latest Update (Nov 23, 2025)

🚀 **Runtime Architecture Implementation** — Major progress with 468 passing tests!
- ✅ GType System (runtime type validation)
- ✅ Local Context (request-scoped state)
- ✅ Global Context (app-wide context)
- ✅ Hook Orchestrator (lifecycle management)
- ✅ Snapshot/Restore (debugging support)

[Read the full update →](/changelog/2025-11-23-runtime-architecture)

### Roadmap

**M3 (November 2025)** — 🚧 IN PROGRESS - Timescape versioning, module system, type system  
**M4 (February 2026)** — Module Registry & Marketplace ([Specs](https://github.com/krishnapaul242/gati/tree/main/apps/gati-registry))  
**M5 (Q1 2026)** — Control Panel (monitoring and configuration UI)  
**M6 (Q1 2026)** — SDK generation from handler signatures  
**M7 (Q2 2026)** — CDN integration, SSL automation

### Looking for Contributors!

Gati is currently a solo project by Krishna Paul. I'm actively looking for:
- 🧪 Beta testers
- 👨‍💻 Contributors (especially for M3 & M4 features)
- 📚 Technical writers
- 🎨 UI/UX designers (Module Registry & Control Panel)

[Join the journey →](/contributing/README)

## Latest from the Blog

### [Introducing Gati: The Backend That Builds, Scales, and Evolves Itself](/blog/introducing-gati)

**November 22, 2025** • *Krishna Paul*

A revolutionary TypeScript framework that eliminates infrastructure complexity. M1 and M2 are complete, and we're now live on npm! Learn about Gati's vision, current features, and what's coming next.

[Read the announcement →](/blog/introducing-gati)

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
