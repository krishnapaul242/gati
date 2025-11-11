# What is Gati?

**Gati** (meaning "motion" or "progress" in Sanskrit) is a next-generation TypeScript/Node.js framework designed for building cloud-native, versioned APIs with automatic scaling, deployment, and SDK generation.

## The Problem

Modern backend development involves significant complexity:

- **Infrastructure Management**: Setting up servers, load balancers, SSL certificates
- **Scaling Challenges**: Configuring auto-scaling, handling traffic spikes
- **API Versioning**: Maintaining backward compatibility across releases
- **Deployment Complexity**: Managing Kubernetes manifests, Docker images, CI/CD pipelines
- **Type Safety**: Keeping frontend and backend types in sync

Most frameworks make you handle all of this manually.

## The Gati Solution

Gati abstracts away infrastructure concerns, letting you focus purely on business logic:

```typescript
// That's it! Just write your handler
export const handler: Handler = (req, res) => {
  const userId = req.params.id;
  res.json({ userId, message: 'Hello from Gati!' });
};
```

Gati automatically handles:
- ✅ HTTP routing
- ✅ Kubernetes deployment
- ✅ Auto-scaling
- ✅ SSL provisioning
- ✅ Load balancing
- ✅ Type-safe API clients
- ✅ Multi-cloud support

## Core Philosophy

### 1. **Business Logic First**

Write only what matters - your business logic. Everything else is automated.

### 2. **Cloud-Native by Default**

Built for Kubernetes from the ground up. Deploy to AWS, GCP, Azure, or your own infrastructure.

### 3. **Type-Safe Everything**

Full TypeScript support with automatic SDK generation for frontend applications.

### 4. **Version-Aware**

Built-in API versioning ensures backward compatibility forever (coming in M3).

### 5. **Developer Experience**

One command to create, develop, and deploy:

```bash
npx gatic create my-app    # Create
cd my-app && pnpm dev       # Develop
gati deploy dev --local     # Deploy
```

## Key Features

### Current (v2.0.0)

- ✅ **Handler System** - Express.js-compatible request/response handling
- ✅ **Module System** - Reusable, dependency-injected modules
- ✅ **Middleware Pipeline** - Composable middleware support
- ✅ **Context Management** - Global and local context
- ✅ **CLI Tools** - Project scaffolding and development tools
- ✅ **Kubernetes Deployment** - Local and cloud deployment
- ✅ **Auto-Scaling** - Horizontal Pod Autoscaler support
- ✅ **Health Checks** - Built-in health endpoints

### Coming Soon

- ⏳ **API Versioning** (M3) - Timestamp-based routing
- ⏳ **Control Panel** (M4) - Live monitoring dashboard
- ⏳ **SDK Generation** (M5) - Auto-generated typed clients
- ⏳ **CDN Integration** (M6) - Global content delivery
- ⏳ **Effects System** (M7) - Async task processing

## Architecture at a Glance

```
┌─────────────────────────────────────┐
│         Client Application          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     CDN + SSL (Coming in M6)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Kubernetes Cluster             │
│  ┌────────────────────────────────┐ │
│  │    Gati Application Pods       │ │
│  │  - Handler Execution           │ │
│  │  - Module Loading              │ │
│  │  - Context Management          │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Use Cases

### Perfect For

- **RESTful APIs** - Build type-safe REST APIs with automatic scaling
- **Microservices** - Deploy independent, scalable services
- **Backend for Frontend** - Type-safe API layer for web/mobile apps
- **Serverless Alternative** - Cloud-native without vendor lock-in
- **Internal Tools** - Rapidly build internal APIs and services

### Not Ideal For

- **Static Websites** - Use Next.js, Gatsby, or similar
- **Real-time Games** - Use dedicated game servers
- **Heavy Data Processing** - Use specialized data processing frameworks
- **Existing Applications** - Gati is for new projects (migration tools coming later)

## How It Works

### 1. Create Project

```bash
npx gatic create my-blog-api
cd my-blog-api
```

### 2. Write Handlers

```typescript
// src/handlers/posts.ts
export const handler: Handler = async (req, res) => {
  const posts = await gctx.modules.db.posts.findAll();
  res.json({ posts });
};
```

### 3. Develop Locally

```bash
pnpm dev
# Server running at http://localhost:3000
# Hot reload enabled
```

### 4. Deploy

```bash
# Deploy to local Kubernetes
gati deploy dev --local

# Deploy to AWS EKS (Coming in M2)
gati deploy prod --provider aws
```

## Comparison

| Feature | Gati | Express.js | NestJS | Serverless |
|---------|------|------------|--------|------------|
| Learning Curve | Low | Low | Medium | Medium |
| Infrastructure Automation | ✅ Full | ❌ None | ⚠️ Partial | ✅ Full |
| Type Safety | ✅ Full | ⚠️ Partial | ✅ Full | ⚠️ Partial |
| Auto-Scaling | ✅ Built-in | ❌ Manual | ❌ Manual | ✅ Built-in |
| API Versioning | ⏳ Coming | ❌ Manual | ⚠️ Partial | ❌ Manual |
| SDK Generation | ⏳ Coming | ❌ None | ⚠️ Via Tools | ❌ None |
| Vendor Lock-in | ❌ None | ❌ None | ❌ None | ✅ High |
| Multi-Cloud | ✅ Yes | ⚠️ Manual | ⚠️ Manual | ❌ No |

## Getting Started

Ready to try Gati?

1. **[Quick Start](./quick-start.md)** - Get up and running in 5 minutes
2. **[Getting Started](./getting-started.md)** - Comprehensive setup guide
3. **[Handlers Guide](../guides/handlers.md)** - Learn to write handlers
4. **[Examples](../examples/hello-world.md)** - See real-world examples

## Community

- **GitHub**: [krishnapaul242/gati](https://github.com/krishnapaul242/gati)
- **Issues**: [Report bugs](https://github.com/krishnapaul242/gati/issues)
- **Discussions**: [Ask questions](https://github.com/krishnapaul242/gati/discussions)

## Philosophy

> *"The best code is the code you don't have to write."*

Gati embodies this philosophy by automating everything that isn't your core business logic. We believe developers should spend their time solving business problems, not managing infrastructure.

---

**Next Steps:**
- [Quick Start Guide](./quick-start.md) - Build your first Gati app
- [Architecture Overview](../architecture/overview.md) - Deep dive into the design
- [Roadmap](../architecture/roadmap.md) - See what's coming next

---

*Last Updated: November 12, 2025*
