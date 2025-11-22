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
      text: Why Gati?
      link: /vision/why-gati
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

## Quick Start

```bash
# Create a new project
npx gatic create my-api
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
| Core Framework | 0.4.3 | ✅ **Stable** | ✅ **Published** | Core runtime, handler engine, contexts |
| Type Definitions | 0.4.3 | ✅ **Stable** | ✅ **Published** | TypeScript types and interfaces |
| Runtime Engine | 2.0.3 | ✅ **Stable** | ✅ **Published** | Handler execution, lifecycle management |
| CLI Tools | 1.0.7 | ✅ **Stable** | ✅ **Published** | Dev server, build, deployment commands |
| GatiC | 0.1.6 | ✅ **Stable** | ✅ **Published** | Project scaffolding tool |
| AWS EKS Plugin | 1.0.0 | ✅ **Stable** | ✅ **Published** | AWS deployment automation |
| Playground | 1.0.0 | ✅ **Stable** | ✅ **Published** | Visual debugging (3-mode) |
| Type System | - | 📅 **M2 Priority** | - | Branded types, constraint combinators |
| Timescape | - | 📅 **M2 Priority** | - | Version management, schema diffing |
| GCP/Azure | - | 📅 **M2 Planned** | - | Multi-cloud deployment |
| SDK Generation | - | 📅 **M5 Planned** | - | Auto-generated typed clients |
| Control Panel | - | 📅 **M4 Planned** | - | Web UI for monitoring |

### 🎉 M1 Complete — Now on NPM!

All core packages are **published to npm** and production-ready! CI/CD pipeline is passing with automated testing and releases.

### Production-Ready Features (✅ M1 Complete)

- **Core Runtime** — Handler engine, modules, middleware, contexts
- **Development** — Hot reload (50-200ms), manifest system, file-based routing
- **Deployment** — Local K8s (kind), AWS EKS, Docker, HPA, Ingress
- **Observability** — Structured logging (Pino), request tracing, health checks
- **Debugging** — Playground with API/Network/Tracking visualization modes
- **CI/CD** — Automated testing, building, and npm publishing
- **Project Scaffolding** — GatiC CLI for instant project creation

### Roadmap

**M2 (Q1 2026)** — Type System & Timescape foundations  
**M3 (Q1 2026)** — Multi-cloud deployment (GCP, Azure)  
**M4 (Q2 2026)** — Control Panel (read-only monitoring UI)  
**M5 (Q2 2026)** — SDK generation from handler signatures  
**M6 (Q3 2026)** — CDN integration, SSL automation

## Community

- 💬 [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions) — Ask questions, share ideas
- 🐛 [Issue Tracker](https://github.com/krishnapaul242/gati/issues) — Report bugs, request features
- 📖 [Contributing Guide](/contributing/README) — Help build Gati

## License

MIT © [Krishna Paul](https://github.com/krishnapaul242)

---

<div class="tip custom-block" style="margin-top: 48px; text-align: center;">

Ready to build something amazing? [Get Started →](/onboarding/getting-started)

</div>
