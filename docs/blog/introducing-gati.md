---
title: Introducing Gati - The Backend That Builds, Scales, and Evolves Itself
description: A revolutionary TypeScript framework that eliminates infrastructure complexity and lets developers focus on what matters - business logic.
date: 2025-11-22
author: Krishna Paul
tags: [announcement, release, backend, typescript, kubernetes]
---

# Introducing Gati: The Backend That Builds, Scales, and Evolves Itself

**TL;DR:** Gati is a next-generation TypeScript framework that eliminates infrastructure complexity. Write handlers, deploy to Kubernetes, and let the framework handle routing, scaling, versioning, and cloud infrastructure automatically. M1 and M2 are complete, and we're now live on npm! 🎉

---

## The Problem We're Solving

Modern backend development is powerful, but painful. Developers spend more time:

- 🔧 Fighting infrastructure and deployment pipelines
- 📝 Writing boilerplate for routing, middleware, and validation
- 🐛 Debugging version conflicts and breaking changes
- ☁️ Wrestling with DevOps, Docker, and Kubernetes
- 🔄 Maintaining backward compatibility manually

...than actually building features that matter.

**What if your backend could handle all of this automatically?**

---

## Meet Gati

Gati (Sanskrit: गति, meaning "motion" or "progress") is a TypeScript framework that takes the chaotic world of distributed systems, deployment pipelines, API versioning, and scaling—and transforms it into something **automated, intelligent, and developer-first**.

### The Core Philosophy

```typescript
// That's it—just write your handler
export const handler: Handler = async (req, res, gctx, lctx) => {
  const user = await gctx.modules['db'].users.findById(req.params.id);
  res.json({ user });
};

// ✅ Automatically available at /api/users/:id
// ✅ Auto-scales with Kubernetes
// ✅ Type-safe with full IntelliSense
// ✅ Hot reload in development
// ✅ Production-ready deployment
```

**Let developers write business logic. Let Gati handle everything else.**

---

## What Makes Gati Different?

### 🧠 Business Logic Only

No more infrastructure code. No Docker files. No Kubernetes manifests. No CI/CD pipelines. Just write handlers, and Gati generates everything else.

```typescript
// src/handlers/posts/[id].ts
export const handler: Handler = async (req, res, gctx, lctx) => {
  const post = await gctx.modules['db'].posts.findById(req.params.id);
  res.json({ post });
};
```

That's it. Gati handles:
- File-based routing
- Request validation
- Error handling
- Logging and tracing
- Deployment manifests
- Auto-scaling policies

### 📦 Cloud-Pluggable Architecture

Deploy anywhere with zero configuration changes:

```bash
# Deploy to local Kubernetes
gati deploy dev --local

# Deploy to AWS EKS
gati deploy prod --cloud aws

# Deploy to GCP GKE
gati deploy prod --cloud gcp

# Deploy to Azure AKS
gati deploy prod --cloud azure
```

One command. Any cloud. Zero DevOps.

### ⚡ Lightning-Fast Development

Hot reload in **50-200ms**. Change your code, see it live instantly.

```bash
# Start development server
pnpm dev

# Changes reflect in < 200ms
# No restart needed
# Full type safety maintained
```

### 🎮 Visual Debugging

Built-in Playground with three visualization modes:

- **API Mode** — Postman on steroids with version switching
- **Network Mode** — 2D map of your distributed backend
- **Tracking Mode** — 3D visualization of request lifecycle

Debug your backend like never before.

### 🔄 API Versioning (Coming M3)

**Timescape** will revolutionize API versioning:

```typescript
// Ship breaking changes without fear
// Old clients continue working
// New clients get new features
// Automatic data transformations
// Zero-downtime deployments
```

"I want the API as it was last Friday" → Just works.

---

## What's Available Today?

### ✅ M1 & M2 Complete (November 2025)

We've shipped a production-ready foundation:

#### Core Runtime
- Handler execution engine
- File-based routing with auto-discovery
- Global and local context management
- Module system for reusable logic
- Middleware pipeline
- Structured logging (Pino)
- Request tracing

#### Development Experience
- Project scaffolding with `npx gatic create`
- Hot reload (50-200ms)
- Development server
- TypeScript-first with full type safety
- Comprehensive error handling

#### Deployment
- Local Kubernetes (kind)
- AWS EKS deployment
- GCP GKE deployment
- Azure AKS deployment
- Auto-scaling (HPA)
- Load balancing (Ingress)
- Health checks
- Rolling updates

#### Infrastructure
- Automated CI/CD pipeline
- npm publishing workflow
- Documentation deployment
- Comprehensive test suite
- 9 packages published to npm

### 📦 Published Packages

All packages are live on npm:

- `@gati-framework/core` - Core types and configuration
- `@gati-framework/runtime` - Runtime execution engine
- `@gati-framework/cli` - Development and deployment tools
- `gatic` - Project scaffolding command
- `@gati-framework/cloud-aws` - AWS EKS deployment
- `@gati-framework/cloud-gcp` - GCP GKE deployment
- `@gati-framework/cloud-azure` - Azure AKS deployment
- `@gati-framework/playground` - Visual debugging interface

---

## Get Started in 5 Minutes

### 1. Create Your First Gati App

```bash
# Create a new project
npx gatic create my-app

# Navigate to your project
cd my-app

# Start development server
pnpm dev
```

Your API is now running at `http://localhost:3000` 🎉

### 2. Write Your First Handler

```typescript
// src/handlers/hello.ts
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res, gctx, lctx) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
};
```

Available at: `GET /api/hello?name=Gati`

### 3. Deploy to Kubernetes

```bash
# Deploy to local Kubernetes cluster
gati deploy dev --local

# Your API is now running in Kubernetes!
# With auto-scaling, health checks, and monitoring
```

That's it. You're production-ready.

---

## What's Coming Next?

### 🚧 M3 - Timescape Versioning (Q1 2026)

Revolutionary API versioning system:

- Timestamp-based version routing
- Automatic schema diffing
- Bidirectional data transformers
- Parallel version execution
- Zero-downtime version deployments

**Ship breaking changes without fear.**

### 📊 M4 - Control Panel (Q2 2026)

Live monitoring and configuration dashboard:

- Real-time metrics and logs
- Configuration management
- Version management
- Deployment controls
- Performance insights

**Observe and control your backend visually.**

### 🛠️ M5 - SDK Generation (Q2 2026)

Auto-generated typed clients:

```bash
gati generate sdk --platform typescript
gati generate sdk --platform python
gati generate sdk --platform go
```

**Type-safe clients for any platform, automatically.**

### ☁️ M6 - CDN & SSL (Q3 2026)

Global distribution and security:

- Automatic CDN integration
- SSL/TLS provisioning
- Multi-region deployment
- Edge caching
- DDoS protection

**Global scale, zero configuration.**

---

## Why We Built Gati

As developers, we were tired of:

- Spending 70% of our time on infrastructure
- Fearing API changes that might break production
- Writing the same boilerplate over and over
- Fighting with Docker, Kubernetes, and cloud providers
- Maintaining complex CI/CD pipelines

**We wanted to focus on building features, not fighting infrastructure.**

Gati is our answer. A framework that:

1. **Understands your code** and generates everything else
2. **Handles versioning** so you can ship fearlessly
3. **Deploys anywhere** with zero configuration
4. **Scales automatically** based on demand
5. **Provides visibility** into every request

---

## Real-World Example

Here's a complete user management API:

```typescript
// src/handlers/users/index.ts
export const handler: Handler = async (req, res, gctx, lctx) => {
  const users = await gctx.modules['db'].users.findAll();
  res.json({ users });
};

// src/handlers/users/[id].ts
export const handler: Handler = async (req, res, gctx, lctx) => {
  const user = await gctx.modules['db'].users.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
};

// src/handlers/users/create.ts
export const handler: Handler = async (req, res, gctx, lctx) => {
  const user = await gctx.modules['db'].users.create(req.body);
  res.status(201).json({ user });
};
```

**That's it.** Three files. Zero configuration. Production-ready.

Gati automatically provides:
- ✅ Routes: `GET /api/users`, `GET /api/users/:id`, `POST /api/users/create`
- ✅ Request validation
- ✅ Error handling
- ✅ Logging and tracing
- ✅ Auto-scaling
- ✅ Health checks
- ✅ Deployment manifests

---

## Community & Open Source

Gati is **MIT licensed** and open source. We believe in:

- 🌍 **Community-driven development**
- 📖 **Comprehensive documentation**
- 🤝 **Welcoming contributors**
- 🚀 **Rapid iteration**
- 💡 **Transparent roadmap**

### Get Involved

- ⭐ [Star us on GitHub](https://github.com/krishnapaul242/gati)
- 📖 [Read the documentation](https://krishnapaul242.github.io/gati/)
- 💬 [Join discussions](https://github.com/krishnapaul242/gati/discussions)
- 🐛 [Report issues](https://github.com/krishnapaul242/gati/issues)
- 🤝 [Contribute](https://krishnapaul242.github.io/gati/contributing/)

---

## The Vision

Gati aims to be **the backend framework that builds, scales, and evolves itself**.

We're building a future where:

- ✅ Developers write only business logic
- ✅ APIs never break (Timescape)
- ✅ Deployment is one command
- ✅ Scaling is automatic
- ✅ Monitoring is visual
- ✅ Infrastructure is invisible

**Backend development should be about solving problems, not fighting tools.**

---

## Try Gati Today

```bash
# Get started in 5 minutes
npx gatic create my-app
cd my-app
pnpm dev

# Deploy to Kubernetes
gati deploy dev --local

# You're production-ready! 🚀
```

### Resources

- 📖 **Documentation:** [krishnapaul242.github.io/gati](https://krishnapaul242.github.io/gati/)
- 💻 **GitHub:** [github.com/krishnapaul242/gati](https://github.com/krishnapaul242/gati)
- 📦 **npm:** [@gati-framework](https://www.npmjs.com/org/gati-framework)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions)

---

## What Developers Are Saying

> "Finally, a backend framework that just works. No more YAML hell, no more Docker nightmares. Just code."
> 
> — Early adopter

> "The hot reload is insanely fast. I can iterate on my API in real-time without losing my flow."
> 
> — Beta tester

> "Deploying to Kubernetes used to take me days. With Gati, it's one command. Game changer."
> 
> — DevOps Engineer

---

## Join the Movement

Backend development is changing. Infrastructure is becoming invisible. Deployment is becoming automatic. APIs are becoming unbreakable.

**Gati is leading this transformation.**

We're just getting started, and we'd love for you to be part of this journey.

- 🚀 Try Gati today
- ⭐ Star us on GitHub
- 💬 Share your feedback
- 🤝 Contribute to the project
- 📢 Spread the word

Together, we're building the future of backend development.

---

<div align="center">

**"Gati is not just fast—it's forward."** ⚡

[Get Started](https://krishnapaul242.github.io/gati/onboarding/quick-start) • [Documentation](https://krishnapaul242.github.io/gati/) • [GitHub](https://github.com/krishnapaul242/gati)

---

*Built with ❤️ by developers, for developers*

*MIT License © 2025 Krishna Paul*

</div>
