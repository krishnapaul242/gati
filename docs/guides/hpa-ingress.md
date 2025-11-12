# HPA and Ingress Configuration

## Overview

Gati now supports automatic generation of Kubernetes HPA (Horizontal Pod Autoscaler) and Ingress manifests for production deployments.

## Horizontal Pod Autoscaler (HPA)

HPA automatically scales the number of pod replicas based on CPU and memory utilization.

### Basic Usage

```typescript
// gati.config.ts
export default {
  environments: {
    production: {
      replicas: 3,
      autoscaling: {
        enabled: true,
        minReplicas: 2,
        maxReplicas: 10,
        targetCPUUtilization: 70,
        targetMemoryUtilization: 80
      }
    }
  }
};
```

### Generated HPA Features

- **CPU-based scaling** - Scales based on average CPU utilization
- **Memory-based scaling** - Optional memory-based scaling
- **Smart scaling policies** - Configurable scale-up/scale-down behavior
- **Stabilization windows** - Prevents flapping during scaling

### Scaling Behavior

The generated HPA includes intelligent scaling policies:

**Scale Up:**
- 100% increase or 4 pods (whichever is greater) every 15 seconds
- No stabilization window (immediate scaling)

**Scale Down:**
- 50% decrease or 2 pods (whichever is smaller) every 15 seconds
- 5-minute stabilization window (prevents premature scale-down)

### Example HPA Manifest

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
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

---

## Ingress Configuration

Ingress provides HTTP(S) routing to your Gati application with support for multiple ingress controllers.

### Basic Usage

```typescript
// gati.config.ts
export default {
  environments: {
    production: {
      ingress: {
        enabled: true,
        host: 'api.example.com',
        className: 'nginx', // or 'alb' for AWS
        tls: {
          enabled: true,
          secretName: 'my-app-tls'
        }
      }
    }
  }
};
```

### Supported Ingress Controllers

#### NGINX Ingress Controller

Default annotations included:
- `nginx.ingress.kubernetes.io/rewrite-target: /`
- `nginx.ingress.kubernetes.io/ssl-redirect: "true"`

```typescript
{
  ingressClassName: 'nginx',
  host: 'api.example.com'
}
```

#### AWS ALB Ingress Controller

Pre-configured with AWS-specific annotations:
- `alb.ingress.kubernetes.io/scheme: internet-facing`
- `alb.ingress.kubernetes.io/target-type: ip`
- Health check configuration
- Success/failure thresholds

```typescript
{
  ingressClassName: 'alb',
  host: 'api.example.com'
}
```

### TLS/SSL Configuration

Enable HTTPS with TLS:

```typescript
{
  enableIngress: true,
  ingressHost: 'api.example.com',
  enableTLS: true,
  tlsSecretName: 'my-tls-cert' // Kubernetes secret with TLS cert
}
```

**Using cert-manager for automatic certificates:**

```yaml
# Add custom annotation
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
```

### Multiple Paths

Ingress supports multiple paths to different services:

```typescript
// Advanced configuration via generateIngress()
const ingress = generateIngress({
  name: 'multi-service-ingress',
  namespace: 'default',
  ingressClassName: 'nginx',
  rules: [
    {
      host: 'api.example.com',
      paths: [
        {
          path: '/v1',
          pathType: 'Prefix',
          serviceName: 'my-app-v1',
          servicePort: 80
        },
        {
          path: '/v2',
          pathType: 'Prefix',
          serviceName: 'my-app-v2',
          servicePort: 80
        }
      ]
    }
  ]
});
```

### Example Ingress Manifest

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: my-app-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app
            port:
              number: 80
```

---

## CLI Usage

### Generate Manifests with HPA

```bash
# Generate with autoscaling enabled
gatic deploy production \
  --enable-autoscaling \
  --min-replicas 3 \
  --max-replicas 15 \
  --target-cpu 75
```

### Generate Manifests with Ingress

```bash
# Generate with Ingress and TLS
gatic deploy production \
  --enable-ingress \
  --ingress-host api.example.com \
  --ingress-class nginx \
  --enable-tls \
  --tls-secret my-tls-cert
```

### Dry Run

Preview generated manifests without deploying:

```bash
gatic deploy production --dry-run --enable-autoscaling --enable-ingress
```

---

## Programmatic API

### Generate HPA

```typescript
import { generateHPA } from '@gati-framework/cli/deployment/kubernetes';

const hpa = generateHPA({
  name: 'my-app-hpa',
  namespace: 'default',
  targetDeployment: 'my-app',
  minReplicas: 2,
  maxReplicas: 10,
  targetCPUUtilizationPercentage: 70,
  targetMemoryUtilizationPercentage: 80
});
```

### Generate Ingress

```typescript
import { generateIngress } from '@gati-framework/cli/deployment/kubernetes';

const ingress = generateIngress({
  name: 'my-app-ingress',
  namespace: 'default',
  ingressClassName: 'nginx',
  rules: [{
    host: 'api.example.com',
    paths: [{
      path: '/',
      pathType: 'Prefix',
      serviceName: 'my-app',
      servicePort: 80
    }]
  }],
  tls: [{
    hosts: ['api.example.com'],
    secretName: 'my-app-tls'
  }]
});
```

### Complete Manifests

```typescript
import { generateCompleteManifests } from '@gati-framework/cli/deployment/kubernetes';

const manifests = generateCompleteManifests(
  'my-app',
  'default',
  'production',
  {
    enableAutoscaling: true,
    minReplicas: 3,
    maxReplicas: 15,
    targetCPUUtilization: 70,
    enableIngress: true,
    ingressHost: 'api.example.com',
    ingressClassName: 'alb',
    enableTLS: true
  }
);

// manifests.hpa - HPA YAML (if enabled)
// manifests.ingress - Ingress YAML (if enabled)
// manifests.deployment - Deployment YAML
// manifests.service - Service YAML
```

---

## Environment-Specific Behavior

### Development
- HPA is **disabled** by default (even if autoscaling enabled)
- Ingress can be enabled for local testing
- Fixed replica count

### Staging
- HPA **enabled** when autoscaling is configured
- Moderate scaling limits (2-5 replicas typical)
- Ingress with staging domain

### Production
- HPA **enabled** for high-traffic workloads
- Aggressive scaling limits (3-20+ replicas)
- Ingress with production domain and TLS

---

## Best Practices

### HPA Configuration

1. **Set appropriate resource requests/limits** - HPA requires resource requests to calculate utilization
2. **Start conservative** - Begin with 70-80% CPU target, adjust based on metrics
3. **Monitor metrics** - Use Prometheus/Grafana to tune thresholds
4. **Test scaling behavior** - Load test to verify scaling works as expected

### Ingress Configuration

1. **Use TLS in production** - Always enable HTTPS for production
2. **Configure health checks** - Ensure your app responds to `/health`
3. **Set rate limits** - Use annotations to prevent abuse
4. **Use cert-manager** - Automate certificate renewal
5. **Multiple environments** - Use different domains per environment

---

## Troubleshooting

### HPA Not Scaling

**Issue:** Pods not scaling despite high CPU

**Solutions:**
- Verify resource requests are set on deployment
- Check HPA status: `kubectl describe hpa <name>`
- Ensure metrics-server is installed: `kubectl top nodes`
- Check for errors in HPA events

### Ingress Not Routing

**Issue:** 502/503 errors when accessing ingress

**Solutions:**
- Verify service exists and is healthy
- Check ingress controller logs
- Confirm DNS points to load balancer
- Validate TLS certificate if using HTTPS
- Check ingress class is correct for your cluster

### Certificate Issues

**Issue:** TLS certificate not working

**Solutions:**
- Verify secret exists: `kubectl get secret <name>`
- Check cert-manager logs if using auto-certs
- Ensure secret is in same namespace as ingress
- Validate certificate format (must be PEM)

---

## Related

- [Deployment Guide](./deployment.md)
- [Kubernetes Guide](./kubernetes.md)
- [Environment Configuration](./configuration.md)
- [Production Best Practices](./production.md)

---

**Last Updated:** November 12, 2025  
**Milestone:** M2 - Cloud Infrastructure & Deployment
