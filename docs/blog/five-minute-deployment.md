---
title: "From Zero to Production in 5 Minutes"
date: 2025-11-22
author: Krishna Paul
tags: [deployment, developer-experience, quick-start]
---

# From Zero to Production in 5 Minutes

Deploy a production-ready Gati API in 5 minutes.

## Minute 1: Create Project

```bash
npx gatic create my-api
cd my-api
```

**Generated**:
- Handler structure
- Configuration
- Docker setup
- K8s manifests

## Minute 2: Write Handler

```typescript
// src/handlers/users/[id].ts
export const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules['db'].users.findById(req.params.id);
  res.json({ user });
};
```

**Auto-configured**:
- Routing: `GET /users/:id`
- Validation
- Error handling
- Logging

## Minute 3: Test Locally

```bash
pnpm dev
curl http://localhost:3000/users/123
```

**Includes**:
- Hot reload (50-200ms)
- Request tracking
- Debug playground

## Minute 4: Build

```bash
pnpm build
```

**Generates**:
- Optimized bundle
- Docker image
- K8s manifests
- Health checks

## Minute 5: Deploy

```bash
gati deploy prod --provider aws
```

**Automatic**:
- Container build
- Registry push
- K8s deployment
- Auto-scaling
- Load balancing

## What You Get

✅ **Production-ready**
- Health checks
- Metrics
- Logging
- Error tracking

✅ **Auto-scaling**
- HPA configured
- 2-10 replicas
- CPU-based scaling

✅ **Zero-config**
- No Dockerfile needed
- No K8s YAML needed
- No CI/CD setup needed

## Traditional vs Gati

### Traditional (2-3 days)

1. Write code
2. Write Dockerfile
3. Write K8s manifests
4. Setup CI/CD
5. Configure monitoring
6. Deploy

### Gati (5 minutes)

1. Write code
2. `gati deploy prod`

## Real Example

```bash
# Create
npx gatic create blog-api

# Add handler
cat > src/handlers/posts/[id].ts << EOF
export const handler: Handler = async (req, res, gctx) => {
  const post = await gctx.modules['db'].posts.findById(req.params.id);
  res.json({ post });
};
EOF

# Deploy
gati deploy prod --provider aws --cluster production

# Done! API live at https://api.example.com
```

## What's Happening Behind the Scenes

1. **Build**: Optimized bundle with tree-shaking
2. **Containerize**: Multi-stage Docker build
3. **Deploy**: Rolling update to K8s
4. **Configure**: HPA, Ingress, Service
5. **Monitor**: Metrics, logs, traces

## Next Steps

- Add more handlers
- Configure auto-scaling
- Setup custom domain
- Enable monitoring

## Related

- [Quick Start](/onboarding/quick-start)
- [Deployment Guide](/guides/deployment)
- [Kubernetes Guide](/guides/kubernetes)
