# What is Gati?

**Gati** (Sanskrit: गति, meaning *motion*) is a next-generation TypeScript/Node.js framework for building **cloud-native, versioned APIs** with automatic scaling, deployment, and SDK generation.

## The Problem

Building production-ready APIs today involves:

- 🔧 **Infrastructure boilerplate** — Docker, Kubernetes, CI/CD, monitoring
- 🔄 **Manual versioning** — Creating `/v1`, `/v2` routes, maintaining backward compatibility
- 📦 **Client generation** — Writing SDKs by hand or dealing with OpenAPI complexity
- 🚀 **Deployment complexity** — Cloud provider configurations, scaling policies, SSL certificates
- 📊 **Observability setup** — Logging, metrics, tracing, alerting

You spend more time configuring infrastructure than writing business logic.

## The Solution

Gati handles **all the infrastructure** so you focus on **business logic**.

```typescript
// This is all you write
export const handler: Handler = (req, res) => {
  res.json({ message: 'Hello World' });
};
```

Gati automatically provides:
- ✅ HTTP routing
- ✅ Request parsing (body, query, headers)
- ✅ Structured logging
- ✅ Error handling
- ✅ Docker + Kubernetes configs
- ✅ Auto-scaling
- ✅ Type-safe SDKs
- ✅ API versioning

## Key Features

### ⚡ Zero Boilerplate

No Express routes, no middleware setup, no config files (unless you want them).

```bash
npx @gati-framework/cli create my-api  # Scaffolds a complete project
npx @gati-framework/cli dev           # Starts dev server with hot reload
npx @gati-framework/cli build         # Production build with validation
npx @gati-framework/cli deploy prod   # Deploys to Kubernetes
```

### 🧬 Built-in API Versioning

Clients can request **any version** of your API using timestamps:

```http
GET /users
X-API-Version: 2025-01-15T10:30:00Z
```

Gati routes the request to the handler code **as it existed on that date**. No breaking changes, ever.

### 🛠️ Auto-Generated SDKs

```bash
npx @gati-framework/cli generate  # Creates fully-typed TypeScript SDK
```

Your frontend team gets:

```typescript
import { MyAPIClient } from '@my-app/sdk';

const client = new MyAPIClient({ baseURL: 'https://api.example.com' });
const user = await client.users.get({ id: '123' }); // Fully typed!
```

### ☁️ Cloud-Native by Design

Gati generates production-ready:

- 🐳 **Dockerfiles** — Multi-stage builds, optimized layers
- ☸️ **Kubernetes manifests** — Deployments, Services, HPA, Ingress
- 📈 **Auto-scaling** — Based on CPU, memory, or custom metrics
- 🔐 **SSL/TLS** — Automatic certificate provisioning (Let's Encrypt, ACM)

Deploy to **AWS EKS**, **GCP GKE**, **Azure AKS**, or any Kubernetes cluster.

### 📦 Modular Architecture

Three core concepts:

1. **Handlers** — HTTP route logic (like Express route handlers)
2. **Modules** — Reusable business logic (database, auth, etc.)
3. **Effects** — Async background tasks (emails, notifications)

All with **dependency injection** and **isolation**.

### 🔍 Production Observability

Out of the box:

- 📝 **Structured logging** with [Pino](https://getpino.io)
- 🆔 **Request tracking** with correlation IDs
- ⏱️ **Request timeouts** and graceful shutdown
- 🌐 **CORS** middleware helpers
- 📊 **Health checks** and readiness probes

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Your Handlers (src/handlers)    │
│  ┌──────────┐  ┌──────────┐            │
│  │ users.ts │  │ posts.ts │  ...       │
│  └──────────┘  └──────────┘            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Gati Runtime (@gati-framework)    │
│  • Handler Engine  • Module Loader     │
│  • Request Parser  • Middleware        │
│  • Context Manager • Error Handler     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Cloud Infrastructure            │
│  • Kubernetes  • Docker  • Load Balancer│
│  • Auto-scaling  • SSL  • Monitoring    │
└─────────────────────────────────────────┘
```

## Philosophy

### 1. Convention over Configuration

Gati follows sensible defaults:

- Handlers in `src/handlers/` are auto-discovered
- Routes match file paths (`src/handlers/users/list.ts` → `GET /users/list`)
- Environment variables override config

### 2. Progressive Enhancement

Start simple, add complexity only when needed:

```typescript
// Simple handler
export const handler: Handler = (req, res) => {
  res.json({ ok: true });
};

// With modules (when you need them)
export const handler: Handler = (req, res, gctx) => {
  const db = gctx.modules.database;
  const users = await db.users.findAll();
  res.json({ users });
};

// With local context (for request-scoped data)
export const handler: Handler = (req, res, gctx, lctx) => {
  lctx.logger.info('Processing request', { userId: req.query.id });
  // ...
};
```

### 3. Cloud-Native First

Gati is built for Kubernetes from day one:

- Manifests generated automatically
- Health checks built-in
- Graceful shutdown on SIGTERM
- Environment-based configuration

But it also runs anywhere Node.js does (Docker, serverless, bare metal).

## When to Use Gati

### ✅ Great For

- **REST APIs** — CRUD operations, microservices, backend-for-frontend
- **Versioned APIs** — Products requiring long-term backward compatibility
- **Cloud-native apps** — Deploying to Kubernetes or multi-cloud
- **TypeScript projects** — Teams wanting full type safety
- **Startups & prototypes** — Get to production fast

### ❌ Not Ideal For

- **Server-rendered web apps** — Use Next.js, Remix, SvelteKit
- **GraphQL APIs** — Use Apollo Server, Pothos
- **Real-time apps** — Use Socket.io, Mercurius (though Gati can complement these)
- **Extremely low-level control** — Use Fastify, Hono

## Comparison

| Feature | Gati | Express | NestJS | Fastify |
|---------|------|---------|--------|---------|
| **Setup Time** | 30 seconds | 10 mins | 30 mins | 15 mins |
| **Built-in Deployment** | ✅ K8s + Docker | ❌ | ❌ | ❌ |
| **API Versioning** | ✅ Automatic | ❌ Manual | ❌ Manual | ❌ Manual |
| **SDK Generation** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Type Safety** | ✅ Full | ⚠️ Partial | ✅ Full | ✅ Full |
| **Performance** | 🔥 Fast | 🐢 Slow | 🔥 Fast | ⚡ Fastest |
| **Learning Curve** | 📈 Low | 📈 Low | 📈 High | 📈 Medium |

## What Makes Gati Different?

1. **Opinionated about infrastructure** — Other frameworks are routing libraries. Gati is a complete platform.

2. **Versioning is a first-class citizen** — Not an afterthought or plugin.

3. **Developer experience** — One CLI, zero config, instant productivity.

4. **Cloud-native DNA** — Kubernetes manifests aren't bolted on, they're generated from your code.

## Current Status (November 2025)

- 🟢 **Runtime (v1.3.0)** — Production-ready, 78% test coverage
- 🟢 **CLI (v0.3.0)** — Stable, supports create/dev/build/deploy
- 🟡 **Deployment** — Local K8s works, cloud providers in progress
- 🔴 **Versioning** — Planned for Q2 2025
- 🔴 **SDK Generation** — Planned for Q3 2025

See the [Roadmap](https://github.com/krishnapaul242/gati/blob/main/ROADMAP.MD) for details.

## Next Steps

Ready to try Gati?

- 📖 [Getting Started Guide](/guide/getting-started) — Install and create your first project
- 🚀 [Quick Start Tutorial](/guide/quick-start) — Build a REST API in 10 minutes
- 📚 [Core Concepts](/guide/handlers) — Learn about Handlers, Modules, and Context
- 💡 [Examples](/examples/hello-world) — See real-world code

---

Questions? [Join the Discussion](https://github.com/krishnapaul242/gati/discussions) 💬
