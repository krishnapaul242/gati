---
title: "From Idea to Production in 5 Minutes"
description: "How Gati enables rapid development with instant scaffolding, hot reload, and one-command deployment"
date: 2025-11-25
author: Krishna Paul
tags: [developer-experience, workflow, deployment, productivity]
---

# From Idea to Production in 5 Minutes

![Rapid Development](../public/gati.png)

Traditional backend development is slow. You spend hours setting up projects, configuring build tools, writing Dockerfiles, creating Kubernetes manifests, and setting up CI/CD pipelines. By the time you're ready to write code, you've lost momentum.

**Gati changes this.** From idea to production in 5 minutes. Let me show you how.

## The Traditional Way

Here's what you typically do to build and deploy a simple API:

```bash
# 1. Project setup (10 minutes)
mkdir my-api && cd my-api
npm init -y
npm install express typescript @types/node @types/express
npx tsc --init
# Configure tsconfig.json, package.json scripts...

# 2. Write code (20 minutes)
# Create src/, write handlers, setup routing...

# 3. Containerization (15 minutes)
# Write Dockerfile, .dockerignore, docker-compose.yml...

# 4. Kubernetes manifests (20 minutes)
# Write deployment.yaml, service.yaml, ingress.yaml...

# 5. CI/CD setup (30 minutes)
# Configure GitHub Actions, AWS credentials...

# 6. Deploy (10 minutes)
# Push to registry, apply manifests, debug issues...

# Total: ~105 minutes (1.75 hours)
```

And that's for a **simple** API. Add authentication, database, caching, and you're looking at days.

## The Gati Way

Watch this:

```bash
# 1. Create project (30 seconds)
npx gatic create my-api
cd my-api

# 2. Start development (10 seconds)
pnpm dev

# 3. Write handler (2 minutes)
# Edit src/handlers/users/[id].ts

# 4. Test locally (instant)
# Hot reload, test in browser

# 5. Deploy to production (2 minutes)
gati deploy prod --cloud aws

# Total: ~5 minutes
```

Let's break down each step.

## Step 1: Project Scaffolding (30 seconds)

```bash
npx gatic create my-api
```

This single command:
- Creates project structure
- Installs dependencies
- Configures TypeScript
- Sets up development scripts
- Initializes git repository
- Generates example handler

**Output**:
```
✓ Created project structure
✓ Installed dependencies (15s)
✓ Configured TypeScript
✓ Generated example handler
✓ Initialized git repository

🎉 Project created successfully!

Next steps:
  cd my-api
  pnpm dev
```

**What you get**:
```
my-api/
├── src/
│   ├── handlers/
│   │   └── hello.ts          # Example handler
│   └── modules/
│       └── logger.ts          # Example module
├── gati.config.ts             # Configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # Quick start guide
```

## Step 2: Development Server (10 seconds)

```bash
cd my-api
pnpm dev
```

**Output**:
```
🚀 Gati development server starting...

✓ Loaded 1 handler
✓ Loaded 1 module
✓ Hot reload enabled (50-200ms)
✓ Playground enabled

🌐 Server running at http://localhost:3000
🎮 Playground at http://localhost:3000/__playground

Ready in 8.2s
```

**What you get**:
- HTTP server running
- Hot reload active
- Playground UI available
- Type checking enabled
- Automatic manifest generation

## Step 3: Write Handler (2 minutes)

Create `src/handlers/users/[id].ts`:

```typescript
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  
  // Access database module
  const db = gctx.modules['database'];
  const user = await db.users.findById(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
};
```

**Save the file** → **Automatic reload** (50-100ms) → **Test immediately**

No build step. No restart. Just save and test.

## Step 4: Test Locally (instant)

```bash
# Test in browser
open http://localhost:3000/api/users/123

# Or with curl
curl http://localhost:3000/api/users/123
```

**Response**:
```json
{
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Playground**:
- View request/response
- Inspect trace
- Replay request
- Check performance

## Step 5: Deploy to Production (2 minutes)

```bash
gati deploy prod --cloud aws --region us-east-1
```

**What happens**:
1. Builds application (TypeScript → JavaScript)
2. Generates Docker image
3. Pushes to AWS ECR
4. Creates/updates EKS cluster
5. Deploys to Kubernetes
6. Configures load balancer
7. Sets up auto-scaling

**Output**:
```
🚀 Deploying to AWS EKS...

✓ Built application (12s)
✓ Created Docker image (8s)
✓ Pushed to ECR (15s)
✓ Updated EKS cluster (45s)
✓ Deployed to Kubernetes (20s)
✓ Configured load balancer (10s)
✓ Enabled auto-scaling (5s)

🎉 Deployment successful!

📍 Endpoint: https://my-api.example.com
📊 Dashboard: https://console.aws.amazon.com/eks
📝 Logs: kubectl logs -f deployment/my-api

Deployed in 115s
```

**That's it.** Your API is live in production.

## The Magic Behind It

### 1. Smart Scaffolding

GatiC generates a complete, production-ready project:

```typescript
// gati.config.ts - Generated automatically
export default {
  name: 'my-api',
  version: '1.0.0',
  
  dev: {
    port: 3000,
    hotReload: true,
    playground: true
  },
  
  cloud: {
    provider: 'aws',
    region: 'us-east-1',
    kubernetes: {
      clusterName: 'my-api-cluster',
      namespace: 'production'
    }
  }
};
```

No manual configuration needed.

### 2. Hot Reload (50-200ms)

File watcher detects changes and reloads instantly:

```
File changed: src/handlers/users/[id].ts
↓
Recompile TypeScript (30ms)
↓
Reload handler (20ms)
↓
Update manifest (10ms)
↓
Ready to test (60ms total)
```

**No restart. No rebuild. Just save and test.**

### 3. Automatic Manifest Generation

Gati analyzes your handlers and generates manifests:

```typescript
// src/handlers/users/[id].ts
export const METHOD = 'GET';
export const ROUTE = '/users/:id';
export const handler: Handler = ...
```

Generates `.gati/manifests/users_[id].json`:

```json
{
  "id": "users_[id]",
  "route": "/users/:id",
  "method": "GET",
  "filePath": "./src/handlers/users/[id].ts",
  "exportName": "handler"
}
```

**No manual routing configuration.**

### 4. One-Command Deployment

`gati deploy` handles everything:

```bash
# Local Kubernetes (kind)
gati deploy dev --local

# AWS EKS
gati deploy prod --cloud aws

# GCP GKE
gati deploy prod --cloud gcp

# Azure AKS
gati deploy prod --cloud azure
```

**No Dockerfiles. No Kubernetes manifests. No CI/CD setup.**

## Real-World Example

Let's build a complete CRUD API in 5 minutes.

### Minute 1: Create Project

```bash
npx gatic create todo-api --template api
cd todo-api
pnpm dev
```

### Minute 2: Create Handler

```typescript
// src/handlers/todos/index.ts
export const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules['database'];
  const todos = await db.todos.findAll();
  res.json({ todos });
};
```

### Minute 3: Create Handler

```typescript
// src/handlers/todos/[id].ts
export const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules['database'];
  const todo = await db.todos.findById(req.params.id);
  res.json({ todo });
};
```

### Minute 4: Test Locally

```bash
curl http://localhost:3000/api/todos
curl http://localhost:3000/api/todos/1
```

### Minute 5: Deploy

```bash
gati deploy prod --cloud aws
```

**Done.** Full CRUD API in production.

## Developer Experience Features

### 1. Instant Feedback

```
Save file → 50ms → Test
```

No waiting. No context switching.

### 2. Visual Debugging

Playground shows:
- Request/response flow
- Handler execution time
- Module calls
- Distributed tracing

### 3. Type Safety

Full TypeScript support:
- IntelliSense in handlers
- Type-safe module access
- Compile-time error checking

### 4. Zero Configuration

Everything works out of the box:
- Routing (file-based)
- Hot reload
- TypeScript
- Deployment

## Comparison

| Task | Traditional | Gati | Speedup |
|------|-------------|------|---------|
| Project setup | 10 min | 30 sec | 20x |
| Write handler | 20 min | 2 min | 10x |
| Local testing | 5 min | Instant | ∞ |
| Containerization | 15 min | 0 min | ∞ |
| K8s manifests | 20 min | 0 min | ∞ |
| CI/CD setup | 30 min | 0 min | ∞ |
| Deployment | 10 min | 2 min | 5x |
| **Total** | **110 min** | **5 min** | **22x** |

## What About...?

### "What about complex applications?"

Gati scales with your needs:

```bash
# Add database module
gati generate module database

# Add authentication
gati generate module auth

# Add caching
gati generate module redis
```

### "What about testing?"

Built-in test utilities:

```typescript
import { createTestHarness } from '@gati-framework/testing';

const harness = createTestHarness();
const result = await harness.executeHandler(handler, {
  method: 'GET',
  path: '/todos/1'
});

expect(result.status).toBe(200);
```

### "What about production?"

Production-ready features:
- Auto-scaling (HPA)
- Load balancing (ALB/NLB)
- Secrets management
- Monitoring (CloudWatch)
- Logging (structured)
- Tracing (distributed)

## The Philosophy

**Gati's goal**: Let developers write business logic, not infrastructure.

```typescript
// This is all you write
export const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules['db'].users.findById(req.params.id);
  res.json({ user });
};

// Gati handles:
// ✓ Routing
// ✓ Middleware
// ✓ Error handling
// ✓ Logging
// ✓ Tracing
// ✓ Deployment
// ✓ Scaling
// ✓ Monitoring
```

## Try It Yourself

```bash
# Install
npx gatic create my-api

# Develop
cd my-api
pnpm dev

# Deploy
gati deploy prod --cloud aws
```

**5 minutes from idea to production.**

## What's Next?

- **M4**: Module Marketplace (Feb 2026)
- **M5**: Control Panel (Q1 2026)
- **M6**: SDK Generation (Q1 2026)

## Conclusion

Backend development doesn't have to be slow. With Gati:

- **30 seconds** to create project
- **Instant** hot reload
- **2 minutes** to deploy

**5 minutes total.** From idea to production.

**Ready to try?** [Get started now](../onboarding/quick-start.md)

**Have questions?** [Join the discussion](https://github.com/krishnapaul242/gati/discussions)

---

## Resources

- [Quick Start Guide](../onboarding/quick-start.md)
- [GatiC Documentation](../guides/gatic.md)
- [Deployment Guide](../guides/deployment.md)
- [Hot Reload Guide](../guides/hot-reloading.md)

**Published**: November 25, 2025  
**Author**: Krishna Paul  
**Tags**: developer-experience, workflow, deployment, productivity
