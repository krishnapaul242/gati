# Deployment Guide

Comprehensive guide for deploying Gati applications to various environments.

## Overview

Gati supports deployment to multiple platforms with automatic manifest generation and zero-configuration deployment.

## Quick Start

### Local Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Deploy to Kubernetes

```bash
# Deploy to local cluster (kind)
gati deploy dev --local

# Deploy to production
gati deploy prod
```

## Build Process

### Production Build

```bash
# Build optimized bundle
pnpm build

# Output: dist/
# - index.js (entry point)
# - handlers/ (compiled handlers)
# - modules/ (compiled modules)
# - manifest.json (handler metadata)
```

### Build Configuration

```typescript
// gati.config.ts
export default {
  build: {
    target: 'node18',
    minify: true,
    sourcemap: true,
    outDir: 'dist'
  }
};
```

## Deployment Targets

### 1. Local Kubernetes (kind)

**Setup**:
```bash
# Install kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name gati-dev
```

**Deploy**:
```bash
gati deploy dev --local
```

**Features**:
- Automatic Docker image build
- Local registry setup
- Manifest generation
- Hot reload support

---

### 2. AWS EKS

**Prerequisites**:
- AWS CLI configured
- kubectl installed
- EKS cluster created

**Deploy**:
```bash
# Configure AWS credentials
aws configure

# Deploy to EKS
gati deploy prod --provider aws --cluster my-cluster --region us-east-1
```

**See**: [AWS EKS Deployment Guide](./aws-eks-deployment.md)

---

### 3. GCP GKE

**Prerequisites**:
- gcloud CLI configured
- kubectl installed
- GKE cluster created

**Deploy**:
```bash
# Configure GCP credentials
gcloud auth login

# Deploy to GKE
gati deploy prod --provider gcp --cluster my-cluster --region us-central1
```

---

### 4. Azure AKS

**Prerequisites**:
- Azure CLI configured
- kubectl installed
- AKS cluster created

**Deploy**:
```bash
# Configure Azure credentials
az login

# Deploy to AKS
gati deploy prod --provider azure --cluster my-cluster --resource-group my-rg
```

---

### 5. Docker

**Build Image**:
```bash
# Build Docker image
docker build -t my-gati-app:latest .

# Run locally
docker run -p 3000:3000 my-gati-app:latest
```

**Dockerfile**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/index.js"]
```

---

### 6. Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://db:5432/gati
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=gati
      - POSTGRES_USER=gati
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy**:
```bash
docker-compose up -d
```

---

## Environment Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
```

### Configuration File

```typescript
// gati.config.ts
export default {
  environments: {
    development: {
      port: 3000,
      replicas: 1,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '200m', memory: '256Mi' }
      }
    },
    production: {
      port: 3000,
      replicas: 3,
      resources: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '1000m', memory: '1Gi' }
      },
      autoscaling: {
        enabled: true,
        minReplicas: 3,
        maxReplicas: 20,
        targetCPUUtilization: 70
      }
    }
  }
};
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      
      - name: Deploy to Kubernetes
        run: |
          gati deploy prod \
            --provider aws \
            --cluster production \
            --region us-east-1
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - pnpm install
    - pnpm build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - pnpm test

deploy:
  stage: deploy
  script:
    - gati deploy prod --provider gcp
  only:
    - main
```

## Deployment Strategies

### Blue-Green Deployment

```bash
# Deploy new version (green)
gati deploy prod --version v2 --label color=green

# Test green deployment
curl https://green.api.example.com/health

# Switch traffic to green
kubectl patch service my-app -p '{"spec":{"selector":{"color":"green"}}}'

# Remove blue deployment
kubectl delete deployment my-app-blue
```

### Canary Deployment

```bash
# Deploy canary (10% traffic)
gati deploy prod --canary --traffic-split 10

# Monitor metrics
kubectl top pods

# Increase traffic gradually
gati deploy prod --canary --traffic-split 50

# Full rollout
gati deploy prod --canary --traffic-split 100
```

### Rolling Update

```bash
# Default strategy - rolling update
gati deploy prod

# Configure rolling update
kubectl set image deployment/my-app \
  app=my-app:v2 \
  --record

# Monitor rollout
kubectl rollout status deployment/my-app
```

## Rollback

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/my-app

# Rollback to previous version
kubectl rollout undo deployment/my-app

# Rollback to specific revision
kubectl rollout undo deployment/my-app --to-revision=2
```

### Docker Rollback

```bash
# Tag previous version
docker tag my-app:v1 my-app:latest

# Push to registry
docker push my-app:latest

# Restart containers
docker-compose up -d
```

## Monitoring Deployment

### Check Deployment Status

```bash
# Kubernetes
kubectl get deployments
kubectl get pods
kubectl describe deployment my-app

# Docker
docker ps
docker logs my-app
```

### Health Checks

```bash
# Check health endpoint
curl https://api.example.com/health

# Check readiness
curl https://api.example.com/ready
```

### View Logs

```bash
# Kubernetes
kubectl logs -f deployment/my-app

# Docker
docker logs -f my-app

# Docker Compose
docker-compose logs -f app
```

## Troubleshooting

### Deployment Fails

**Check logs**:
```bash
kubectl logs deployment/my-app
kubectl describe pod <pod-name>
```

**Common issues**:
- Image pull errors (check registry credentials)
- Resource limits (increase CPU/memory)
- Configuration errors (check environment variables)

### Application Not Responding

**Check service**:
```bash
kubectl get svc
kubectl describe svc my-app
```

**Check endpoints**:
```bash
kubectl get endpoints my-app
```

**Port forward for testing**:
```bash
kubectl port-forward svc/my-app 3000:80
curl http://localhost:3000/health
```

### High Memory Usage

**Check resource usage**:
```bash
kubectl top pods
```

**Increase limits**:
```yaml
resources:
  limits:
    memory: 2Gi
```

## Best Practices

### 1. Use Multi-Stage Builds

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### 2. Set Resource Limits

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### 3. Use Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 4. Enable Auto-Scaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilization: 70
```

### 5. Use Secrets for Sensitive Data

```bash
# Never commit secrets to git
echo ".env*" >> .gitignore

# Use Kubernetes secrets
kubectl create secret generic my-secrets \
  --from-literal=DATABASE_URL=postgresql://...
```

## Related

- [Kubernetes Guide](./kubernetes.md) - K8s deployment
- [AWS EKS Deployment](./aws-eks-deployment.md) - AWS deployment
- [HPA and Ingress](./hpa-ingress.md) - Auto-scaling
- [Production Guide](./production.md) - Production hardening
