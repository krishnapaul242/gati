# Gati Kubernetes Deployment Guide

Complete guide for deploying Gati to Kubernetes using Helm or Docker Compose.

## Quick Start

### Helm Deployment

```bash
# Install with default values
helm install gati ./helm/gati -n gati-system --create-namespace

# Install for specific environment
helm install gati ./helm/gati -f ./helm/gati/values-dev.yaml -n gati-dev --create-namespace
helm install gati ./helm/gati -f ./helm/gati/values-staging.yaml -n gati-staging --create-namespace
helm install gati ./helm/gati -f ./helm/gati/values-prod.yaml -n gati-production --create-namespace
```

### Docker Compose Deployment

```bash
# Create config directory
mkdir -p config

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Configurations

### Development (values-dev.yaml)
- **Replicas**: 1 ingress, 1 route-manager
- **Resources**: Minimal (100m CPU, 128Mi RAM)
- **Features**: Playground enabled, debug logging, KEDA with scale-to-zero
- **Use Case**: Local development and testing

### Staging (values-staging.yaml)
- **Replicas**: 2 ingress, 1 route-manager
- **Resources**: Moderate (250m CPU, 256Mi RAM)
- **Features**: HPA enabled (2-8 replicas), ServiceMonitor enabled
- **Use Case**: Pre-production testing

### Production (values-prod.yaml)
- **Replicas**: 3 ingress, 2 route-manager
- **Resources**: High (500m CPU, 512Mi RAM)
- **Features**: HPA (3-20 replicas), PDB, multi-zone affinity
- **Use Case**: Production workloads

## Verification

### Check Deployment Status

```bash
# List all resources
kubectl get all -n gati-system

# Check pod status
kubectl get pods -n gati-system

# View pod logs
kubectl logs -n gati-system -l app.kubernetes.io/name=gati-ingress

# Check HPA status
kubectl get hpa -n gati-system

# Check PDB status
kubectl get pdb -n gati-system
```

### Test Connectivity

```bash
# Port-forward to ingress
kubectl port-forward -n gati-system svc/gati-ingress 8080:80

# Test endpoint
curl http://localhost:8080/healthz
```

## Upgrade

```bash
# Upgrade to new version
helm upgrade gati ./helm/gati -n gati-system

# Upgrade with new values
helm upgrade gati ./helm/gati -f ./helm/gati/values-prod.yaml -n gati-production
```

## Rollback

```bash
# View release history
helm history gati -n gati-system

# Rollback to previous version
helm rollback gati -n gati-system

# Rollback to specific revision
helm rollback gati 1 -n gati-system
```

## Uninstall

```bash
# Helm
helm uninstall gati -n gati-system

# Docker Compose
docker-compose down -v
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n gati-system

# Check events
kubectl get events -n gati-system --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# Verify image exists
docker pull gati/ingress:0.4.5
docker pull gati/route-manager:0.4.5
```

### Resource Constraints

```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n gati-system
```

## Advanced Configuration

### Enable KEDA Autoscaling

```yaml
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

### Enable Multi-Zone Deployment

```yaml
multiZone:
  enabled: true
  zones:
    - us-east-1a
    - us-east-1b
    - us-east-1c

pdb:
  enabled: true
  minAvailable: 2
```

### Custom Annotations

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

labels:
  team: platform
  environment: production
```

## Monitoring

### Prometheus Integration

```yaml
serviceMonitor:
  enabled: true
  namespace: monitoring
  interval: 15s
  path: /metrics
```

### View Metrics

```bash
# Port-forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus-server 9090:9090

# Access Prometheus UI
open http://localhost:9090
```

## Support

- Documentation: https://krishnapaul242.github.io/gati/
- GitHub: https://github.com/krishnapaul242/gati
- Issues: https://github.com/krishnapaul242/gati/issues
