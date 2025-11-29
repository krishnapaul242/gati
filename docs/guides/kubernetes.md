# Kubernetes Deployment

Deploy Gati applications to Kubernetes clusters with automatic manifest generation and scaling.

## Overview

Gati generates production-ready Kubernetes manifests automatically, including:
- Deployment configurations with health checks
- Service definitions for load balancing
- Horizontal Pod Autoscalers (HPA)
- Ingress controllers for external access
- ConfigMaps and Secrets management

## Quick Start

### Local Development (kind)

```bash
# Install kind (Kubernetes in Docker)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create local cluster
kind create cluster --name gati-dev

# Deploy Gati app
gati deploy dev --local

# Verify deployment
kubectl get pods
kubectl get services
```

### Production Deployment

```bash
# Generate manifests (dry run)
gati deploy prod --dry-run

# Review generated manifests in .gati/k8s/
ls -la .gati/k8s/

# Deploy to production cluster
gati deploy prod

# Monitor rollout
kubectl rollout status deployment/gati-app
```

## Generated Manifests

Gati creates:
- `deployment.yaml` - Pod deployment configuration
- `service.yaml` - Service configuration
- `hpa.yaml` - Horizontal Pod Autoscaler
- `ingress.yaml` - Ingress configuration (optional)

## Configuration

```typescript
// gati.config.ts
export default {
  environments: {
    dev: {
      replicas: 1,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '200m', memory: '256Mi' }
      }
    },
    prod: {
      replicas: 3,
      resources: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '1000m', memory: '1Gi' }
      }
    }
  }
};
```

## Health Checks

Gati automatically configures liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

## Horizontal Pod Autoscaling

Automatic scaling based on CPU and memory:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gati-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gati-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Secrets Management

### Using Kubernetes Secrets

```bash
# Create secret from file
kubectl create secret generic gati-secrets \
  --from-file=.env.production

# Create secret from literals
kubectl create secret generic gati-secrets \
  --from-literal=DATABASE_URL=postgresql://... \
  --from-literal=API_KEY=secret123
```

### Reference in Deployment

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: gati-secrets
        key: DATABASE_URL
```

## Monitoring and Logging

### View Logs

```bash
# Stream logs from all pods
kubectl logs -f deployment/gati-app

# View logs from specific pod
kubectl logs -f gati-app-7d8f9c5b6-abc12

# View logs from previous container (after crash)
kubectl logs --previous gati-app-7d8f9c5b6-abc12
```

### Metrics

```bash
# View resource usage
kubectl top pods
kubectl top nodes

# Describe pod for events
kubectl describe pod gati-app-7d8f9c5b6-abc12
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods

# View pod events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>
```

### Service Not Accessible

```bash
# Check service
kubectl get svc
kubectl describe svc gati-app

# Check endpoints
kubectl get endpoints gati-app

# Port forward for testing
kubectl port-forward svc/gati-app 3000:3000
```

### Rolling Back Deployment

```bash
# View rollout history
kubectl rollout history deployment/gati-app

# Rollback to previous version
kubectl rollout undo deployment/gati-app

# Rollback to specific revision
kubectl rollout undo deployment/gati-app --to-revision=2
```

## Best Practices

### Resource Limits

Always set resource requests and limits:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Multiple Replicas

Run at least 2 replicas for high availability:

```yaml
replicas: 2  # Minimum for HA
```

### Pod Disruption Budgets

Prevent too many pods from being down:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: gati-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: gati-app
```

## Related

- [AWS EKS Deployment](./aws-eks-deployment.md) - Deploy to AWS
- [HPA and Ingress](./hpa-ingress.md) - Auto-scaling and load balancing
- [Configuration](./configuration.md) - Environment configuration
- [Observability](./observability.md) - Monitoring and logging
