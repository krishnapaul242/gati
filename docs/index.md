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
    details: File-based routing with hot reloading (50-200ms). Write handlers, see changes instantly. No server restarts needed.
  
  - icon: 📁
    title: Zero-Configuration Routing
    details: Drop files in src/handlers/ and they become API routes. users/[id].ts → /api/users/:id. METHOD and ROUTE exports for full control.
  
  - icon: 🔥
    title: Manifest-Based Hot Reload
    details: Individual file manifests enable incremental updates. Only changed files are reprocessed, making development blazingly fast.
  
  - icon: 🚀
    title: Auto Port Detection
    details: Smart port detection finds available ports automatically. Remembers your last port and handles conflicts gracefully.
  
  - icon: 📦
    title: Modular Architecture
    details: Handlers for routes, Modules for business logic, Context for shared state. Clean separation with dependency injection.
  
  - icon: 🔍
    title: Built-in Observability
    details: Structured logging, request tracking, health checks, and performance metrics. Monitor everything from day one.
  
  - icon: ☁️
    title: Cloud-Native Deployment
    details: Automatic Kubernetes manifests, Docker configs, and multi-cloud deployment (AWS, GCP, Azure). Deploy anywhere in seconds.
  
  - icon: 🎯
    title: TypeScript-First
    details: Full type safety from handlers to context. Auto-generated types from schemas. Catch errors at compile time.
  
  - icon: 🛠️
    title: Developer Experience
    details: Comprehensive CLI, detailed error messages, debugging tools, and extensive documentation. Built by developers, for developers.

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
# Create a new project with GatiC
npx gatic create my-api

# Navigate to your project
cd my-api

# Start development server (with hot reload)
pnpm dev

# Build for production
pnpm build

# Deploy to Kubernetes
gati deploy dev --local
```

## Your First Handler

```typescript
// src/handlers/hello.ts
import type { Handler } from '@gati-framework/runtime';

// HTTP method (optional, defaults to GET)
export const METHOD = 'GET';

// Handler function - automatically available at /api/hello
export const handler: Handler = (req, res) => {
  const name = req.query.name || 'World';
  
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
};
```

```bash
# Access your handler
curl http://localhost:3000/api/hello?name=Gati
# {"message":"Hello, Gati!","timestamp":"2025-11-10T..."}
```

## Why Gati?

<div class="tip custom-block">

**Problem:** Building production-ready APIs requires handling infrastructure, versioning, scaling, monitoring, and deployment — before you even write your first route.

**Solution:** Gati abstracts all of this away. You write handlers, we handle the rest.

</div>

### Compare Traditional vs Gati

| Task | Traditional | Gati |
|------|------------|------|
| **Setup** | Install Express, configure routes, add middleware, set up logging | `npx gatic create my-api` |
| **Deployment** | Write Dockerfile, K8s manifests, CI/CD pipeline, configure ingress | `gati deploy dev --local` |
| **Versioning** | Manually create `/v1`, `/v2` routes, maintain backward compatibility | Automatic timestamp routing (planned) |
| **SDK Generation** | Manually write client code or use OpenAPI generators | `gati generate` (planned) |
| **Monitoring** | Set up Prometheus, Grafana, logging pipelines | Built-in dashboard at `/_control` (planned) |

## Philosophy

Gati follows three core principles:

1. **Convention over Configuration** — Sensible defaults, minimal config files
2. **Progressive Enhancement** — Start simple, add complexity only when needed
3. **Cloud-Native First** — Built for Kubernetes from day one, but works anywhere

## What's Included

- 📦 **Runtime** (`@gati-framework/runtime@2.0.3`) — HTTP server, handler engine, middleware
- 🛠️ **CLI** (`@gati-framework/cli@1.0.7`) — Development server, build tools, deployment
- 🎯 **GatiC** (`gatic@0.1.6`) — Project scaffolding command
- 📘 **Core Types** (`@gati-framework/core@0.4.3`) — TypeScript definitions, interfaces
- ☁️ **AWS Plugin** (`@gati-framework/cloud-aws@1.0.0`) — AWS EKS deployment (NEW!)
- 🎮 **Playground** (`@gati-framework/playground@1.0.0`) — Visual debugging (NEW!)
- 🎨 **Control Panel** — Web UI for monitoring and management (planned)

## Current Status

🚀 **Production Ready** — Core runtime (v2.0.3) and CLI (v1.0.7) are stable

| Feature | Status |
|---------|--------|
| Handler Execution | ✅ Stable (v2.0.3) |
| Structured Logging | ✅ Stable (Pino) |
| CORS Middleware | ✅ Stable |
| Hot Reload (Dev) | ✅ Stable |
| Docker Support | ✅ Stable |
| Kubernetes Manifests | ✅ Stable |
| Local K8s Deployment | ✅ Stable (kind) |
| AWS EKS Deployment | ✅ Stable (v1.0.0) |
| Visual Debugging | ✅ Stable (Playground v1.0.0) |
| GCP/Azure Deployment | 🚧 In Progress (M2) |
| API Versioning | 📅 Planned (Q1 2026) |
| SDK Generation | 📅 Planned (Q2 2026) |
| Control Panel | 📅 Planned (Q2 2026) |

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
