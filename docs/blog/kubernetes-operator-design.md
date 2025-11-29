---
title: "Building a Kubernetes Operator for Gati"
date: 2025-11-22
author: Krishna Paul
tags: [kubernetes, operator, infrastructure]
---

# Building a Kubernetes Operator for Gati

How Gati's Kubernetes operator automates deployment, scaling, and version management.

## Why an Operator?

Manual Kubernetes management is error-prone. Gati's operator automates:

- Handler deployment
- Auto-scaling configuration
- Version lifecycle management
- Health monitoring

## Custom Resource Definitions

### GatiHandler CRD

```yaml
apiVersion: gati.dev/v1
kind: GatiHandler
metadata:
  name: users-api
spec:
  path: /users/:id
  replicas: 3
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPU: 70
```

### GatiVersion CRD

```yaml
apiVersion: gati.dev/v1
kind: GatiVersion
metadata:
  name: users-v2
spec:
  handler: users-api
  timestamp: "2025-11-22T10:00:00Z"
  active: true
  traffic: 100
```

## Operator Logic

### Reconciliation Loop

```typescript
async reconcile(handler: GatiHandler) {
  // 1. Ensure deployment exists
  await ensureDeployment(handler);
  
  // 2. Configure HPA
  if (handler.spec.autoscaling.enabled) {
    await ensureHPA(handler);
  }
  
  // 3. Update service
  await ensureService(handler);
  
  // 4. Monitor health
  await checkHealth(handler);
}
```

### Version Management

```typescript
async manageVersions(handler: GatiHandler) {
  const versions = await getVersions(handler);
  
  // Deactivate cold versions
  for (const v of versions) {
    if (isCold(v)) {
      await deactivateVersion(v);
    }
  }
  
  // Update traffic split
  await updateTrafficSplit(versions);
}
```

## Benefits

1. **Declarative** - Describe desired state, operator handles it
2. **Self-healing** - Automatic recovery from failures
3. **Version-aware** - Manages multiple versions automatically
4. **Observable** - Built-in metrics and events

## Deployment

```bash
# Install operator
kubectl apply -f https://gati.dev/operator.yaml

# Deploy handler
kubectl apply -f handler.yaml

# Operator handles the rest
```

## Related

- [Kubernetes Guide](/guides/kubernetes)
- [HPA and Ingress](/guides/hpa-ingress)
- [Deployment Guide](/guides/deployment)
