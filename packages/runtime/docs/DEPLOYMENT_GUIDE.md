# Deployment Guide

## Local Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build
```

## Kubernetes Deployment

### Using Operator

```yaml
apiVersion: gati.dev/v1
kind: GatiHandler
metadata:
  name: my-handler
spec:
  handlerId: users.getUser
  replicas: 3
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
```

Apply with:
```bash
kubectl apply -f handler.yaml
```

### Manual Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gati-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gati-app
  template:
    metadata:
      labels:
        app: gati-app
    spec:
      containers:
      - name: app
        image: my-gati-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
```

## Environment Variables

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 3
```

## Scaling

```bash
# Manual scaling
kubectl scale deployment gati-app --replicas=5

# Auto-scaling
kubectl autoscale deployment gati-app --min=2 --max=10 --cpu-percent=80
```
