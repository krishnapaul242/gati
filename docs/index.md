---
layout: home

hero:
  name: "Gati"
  text: "Motion in Code"
  tagline: "Build cloud-native, versioned APIs with TypeScript — Deploy anywhere in seconds"
  image:
    src: /logo-large.svg
    alt: Gati
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/krishnapaul242/gati
    - theme: alt
      text: API Reference
      link: /api/handler

features:
  - icon: ⚡
    title: Lightning Fast Development
    details: Write business logic only. No boilerplate for routing, deployment, or infrastructure. Get your API running in under 5 minutes.
  
  - icon: 🧬
    title: Built-in API Versioning
    details: Timestamp-based routing keeps your APIs backward-compatible forever. Clients can pin to any version with "X-API-Version" header.
  
  - icon: ☁️
    title: Cloud-Native by Default
    details: Automatic Kubernetes manifests, Docker configs, and multi-cloud deployment (AWS, GCP, Azure). Scale from 1 to millions of requests.
  
  - icon: 🛠️
    title: Auto-Generated SDKs
    details: Generate fully-typed TypeScript clients from your handlers. One command gives your frontend team a ready-to-use SDK.
  
  - icon: 📦
    title: Modular Architecture
    details: Handlers for routes, Modules for business logic, Effects for async tasks. Clean separation with dependency injection.
  
  - icon: 🔍
    title: Production-Ready Observability
    details: Structured logging with Pino, request tracking, graceful shutdown, and CORS out of the box. Monitor everything from day one.
  
  - icon: 🚀
    title: Zero-Downtime Deployments
    details: Rolling updates, health checks, and automatic rollbacks. Your API stays online during every deployment.
  
  - icon: 🎯
    title: TypeScript-First
    details: Full type safety from handlers to SDKs. Catch errors at compile time, not in production.
  
  - icon: 📊
    title: Live Control Panel
    details: Web UI to monitor deployments, view logs, inspect metrics, and manage your application — no kubectl needed.

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
# Install Gati CLI
npm install -g @gati-framework/cli

# Create a new project
gati create my-api

# Start development server (with hot reload)
cd my-api
gati dev

# Build for production
gati build

# Deploy to Kubernetes
gati deploy prod
```

## Your First Handler

```typescript
// src/handlers/hello.ts
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res, gctx, lctx) => {
  const name = req.query.name || 'World';
  
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    requestId: lctx.requestId
  });
};
```

```bash
# Access your handler
curl http://localhost:3000/hello?name=Gati
# {"message":"Hello, Gati!","timestamp":"2025-11-10T...","requestId":"..."}
```

## Why Gati?

<div class="tip custom-block">

**Problem:** Building production-ready APIs requires handling infrastructure, versioning, scaling, monitoring, and deployment — before you even write your first route.

**Solution:** Gati abstracts all of this away. You write handlers, we handle the rest.

</div>

### Compare Traditional vs Gati

| Task | Traditional | Gati |
|------|------------|------|
| **Setup** | Install Express, configure routes, add middleware, set up logging | `gati create my-api` |
| **Deployment** | Write Dockerfile, K8s manifests, CI/CD pipeline, configure ingress | `gati deploy prod` |
| **Versioning** | Manually create `/v1`, `/v2` routes, maintain backward compatibility | Automatic timestamp routing |
| **SDK Generation** | Manually write client code or use OpenAPI generators | `gati generate` (fully typed) |
| **Monitoring** | Set up Prometheus, Grafana, logging pipelines | Built-in dashboard at `/_control` |

## Philosophy

Gati follows three core principles:

1. **Convention over Configuration** — Sensible defaults, minimal config files
2. **Progressive Enhancement** — Start simple, add complexity only when needed
3. **Cloud-Native First** — Built for Kubernetes from day one, but works anywhere

## What's Included

- 📦 **Runtime** (`@gati-framework/runtime`) — HTTP server, handler engine, middleware
- 🛠️ **CLI** (`@gati-framework/cli`) — Project scaffolding, dev server, deployment
- 📘 **Core Types** (`@gati-framework/core`) — TypeScript definitions, interfaces
- ☁️ **Cloud Plugins** — AWS EKS, GCP GKE, Azure AKS adapters (coming soon)
- 🎨 **Control Panel** — Web UI for monitoring and management (coming soon)

## Current Status

🚀 **Beta** — Core runtime and CLI are production-ready (v1.3.0)

| Feature | Status |
|---------|--------|
| Handler Execution | ✅ Stable |
| Structured Logging | ✅ Stable |
| CORS Middleware | ✅ Stable |
| Hot Reload (Dev) | ✅ Stable |
| Docker Support | ✅ Stable |
| Kubernetes Manifests | ✅ Stable |
| Local K8s Deployment | 🚧 In Progress |
| API Versioning | 📅 Planned Q2 2025 |
| SDK Generation | 📅 Planned Q3 2025 |
| Control Panel | 📅 Planned Q3 2025 |

## Community

- 💬 [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions) — Ask questions, share ideas
- 🐛 [Issue Tracker](https://github.com/krishnapaul242/gati/issues) — Report bugs, request features
- 📖 [Contributing Guide](/contributing) — Help build Gati

## License

MIT © [Krishna Paul](https://github.com/krishnapaul242)

---

<div class="tip custom-block" style="margin-top: 48px; text-align: center;">

Ready to build something amazing? [Get Started →](/guide/getting-started)

</div>
