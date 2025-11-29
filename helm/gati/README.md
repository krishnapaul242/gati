# Gati Helm Chart

Official Helm chart for deploying Gati Framework to Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Optional: Prometheus Operator (for ServiceMonitor)
- Optional: KEDA (for event-driven autoscaling)

## Installation

### Quick Start

```bash
# Add Gati Helm repository (when published)
helm repo add gati https://charts.gati.dev
helm repo update

# Install with default values
helm install gati gati/gati -n gati-system --create-namespace
```

### Install from Source

```bash
# Clone repository
git clone https://github.com/krishnapaul242/gati.git
cd gati/helm/gati

# Install
helm install gati . -n gati-system --create-namespace
```

### Environment-Specific Installation

```bash
# Development
helm install gati . -f values-dev.yaml -n gati-dev --create-namespace

# Staging
helm install gati . -f values-staging.yaml -n gati-staging --create-namespace

# Production
helm install gati . -f values-prod.yaml -n gati-production --create-namespace
```

## Configuration

### Core Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Kubernetes namespace | `gati-system` |
| `ingress.enabled` | Enable ingress component | `true` |
| `ingress.replicaCount` | Number of ingress replicas | `2` |
| `ingress.image.repository` | Ingress image repository | `gati/ingress` |
| `ingress.image.tag` | Ingress image tag | `0.4.5` |
| `routeManager.enabled` | Enable route manager | `true` |
| `routeManager.replicaCount` | Number of route manager replicas | `1` |

### Resource Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.resources.requests.cpu` | CPU request | `250m` |
| `ingress.resources.requests.memory` | Memory request | `256Mi` |
| `ingress.resources.limits.cpu` | CPU limit | `1000m` |
| `ingress.resources.limits.memory` | Memory limit | `512Mi` |

### Autoscaling

| Parameter | Description | Default |
|-----------|-------------|---------|
| `hpa.enabled` | Enable HPA | `true` |
| `hpa.minReplicas` | Minimum replicas | `2` |
| `hpa.maxReplicas` | Maximum replicas | `10` |
| `hpa.targetCPUUtilizationPercentage` | Target CPU % | `60` |
| `keda.enabled` | Enable KEDA (disables HPA) | `false` |
| `keda.scaleToZero` | Allow scaling to zero | `false` |

### Observability

| Parameter | Description | Default |
|-----------|-------------|---------|
| `serviceMonitor.enabled` | Enable Prometheus ServiceMonitor | `false` |
| `serviceMonitor.namespace` | ServiceMonitor namespace | `monitoring` |
| `serviceMonitor.interval` | Scrape interval | `15s` |

### High Availability

| Parameter | Description | Default |
|-----------|-------------|---------|
| `pdb.enabled` | Enable PodDisruptionBudget | `false` |
| `pdb.minAvailable` | Minimum available pods | `1` |
| `multiZone.enabled` | Enable multi-zone deployment | `false` |
| `rbac.create` | Create RBAC resources | `true` |

## Examples

### Custom Configuration

```yaml
# custom-values.yaml
ingress:
  replicaCount: 3
  config:
    FEATURE_PLAYGROUND: "true"
    LOG_LEVEL: "debug"

hpa:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70

serviceMonitor:
  enabled: true
```

```bash
helm install gati . -f custom-values.yaml
```

### KEDA-based Autoscaling

```yaml
# keda-values.yaml
hpa:
  enabled: false

keda:
  enabled: true
  minReplicaCount: 2
  maxReplicaCount: 50
  prometheus:
    serverAddress: "http://prometheus-server:9090"
    threshold: 100
```

### Production with Multi-Zone

```yaml
# prod-values.yaml
ingress:
  replicaCount: 5
  resources:
    requests:
      cpu: 1000m
      memory: 1Gi

pdb:
  enabled: true
  minAvailable: 3

multiZone:
  enabled: true
  zones:
    - us-east-1a
    - us-east-1b
    - us-east-1c
```

## Upgrading

```bash
# Upgrade to new version
helm upgrade gati . -n gati-system

# Upgrade with new values
helm upgrade gati . -f values-prod.yaml -n gati-production
```

## Uninstalling

```bash
helm uninstall gati -n gati-system
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n gati-system
kubectl describe pod <pod-name> -n gati-system
```

### View Logs

```bash
kubectl logs -n gati-system -l app.kubernetes.io/name=gati-ingress
```

### Validate Templates

```bash
helm template gati . --debug
helm lint .
```

## Support

- Documentation: https://krishnapaul242.github.io/gati/
- GitHub: https://github.com/krishnapaul242/gati
- Issues: https://github.com/krishnapaul242/gati/issues
