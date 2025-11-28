# Deployment Guide

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- RBAC permissions

## Installation

### 1. Install CRDs

```bash
kubectl apply -f crds/
```

### 2. Create RBAC

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gati-operator
  namespace: gati-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: gati-operator
rules:
  - apiGroups: ["gati.dev"]
    resources: ["gatihandlers", "gatimodules", "gativersions"]
    verbs: ["get", "list", "watch", "update", "patch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "create", "update", "delete"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list", "create", "update", "delete"]
```

### 3. Deploy Operator

```bash
kubectl apply -f operator.yaml
```

## Configuration

Set deployment target via environment variable:

```yaml
env:
  - name: DEPLOYMENT_TARGET
    value: "kubernetes"  # or "helm", "gitops"
```

## Verification

```bash
kubectl get pods -n gati-system
kubectl logs -n gati-system deployment/gati-operator
```
