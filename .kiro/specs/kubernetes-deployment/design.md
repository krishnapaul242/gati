# Design Document

## Overview

The Gati Kubernetes Deployment system provides production-ready Helm charts for deploying Gati components to Kubernetes clusters. The Helm chart includes deployments for the Ingress Layer and Route Manager, along with supporting resources such as Services, ConfigMaps, Horizontal Pod Autoscalers, ServiceMonitors for Prometheus Operator, and optional KEDA ScaledObjects for advanced autoscaling. The deployment system supports multi-environment configurations, multi-zone high availability, TLS certificate management, and comprehensive observability integration.

## Architecture

### Helm Chart Structure

```
helm/gati/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── templates/
│   ├── namespace.yaml
│   ├── configmap-ingress.yaml
│   ├── deployment-ingress.yaml
│   ├── service-ingress.yaml
│   ├── hpa-ingress.yaml
│   ├── servicemonitor-ingress.yaml
│   ├── deployment-route-manager.yaml
│   ├── service-route-manager.yaml
│   ├── pdb-ingress.yaml
│   ├── rbac.yaml
│   └── NOTES.txt
└── README.md
```

### Component Relationships

```
[External Traffic]
    ↓
[Ingress/LoadBalancer] (optional)
    ↓
[Ingress Service]
    ↓
[Ingress Pods] (HPA/KEDA scaled)
    ↓ gRPC
[Route Manager Service]
    ↓
[Route Manager Pods]
```

## Components

### 1. Chart Metadata

#### Chart.yaml

```yaml
apiVersion: v2
name: gati
description: Gati platform components (ingress + route-manager)
version: 0.1.0
appVersion: "0.1.0"
keywords:
  - gati
  - ingress
  - route-manager
  - api-gateway
maintainers:
  - name: Gati Team
```

### 2. Default Values

#### values.yaml

```yaml
global:
  namespace: gati

ingress:
  enabled: true
  name: gati-ingress
  image:
    repository: ghcr.io/your-org/gati-ingress
    tag: latest
    pullPolicy: IfNotPresent
  replicaCount: 2
  resources:
    requests:
      cpu: "250m"
      memory: "256Mi"
    limits:
      cpu: "1000m"
      memory: "512Mi"
  service:
    port: 80
    targetPort: 8080
  hpa:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    cpuUtilization: 60
  prometheus:
    scrape: true
    path: /metrics
    port: 8080
  config:
    ROUTE_MANAGER_ADDR: "http://route-manager.gati.svc:50051"
    TIMESCAPE_ADDR: "http://timescape.gati.svc:8080"
    FEATURE_PLAYGROUND: "true"

routeManager:
  enabled: true
  name: route-manager
  image:
    repository: gati/route-manager-mock
    tag: latest
    pullPolicy: IfNotPresent
  replicaCount: 1
  resources:
    requests:
      cpu: "100m"
      memory: "128Mi"
    limits:
      cpu: "500m"
      memory: "256Mi"
  service:
    port: 50051
    targetPort: 50051

prometheusOperator:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: monitoring

keda:
  enabled: false
  scaleToZero: false
  requestsPerSecond: 100

pdb:
  enabled: true
  minAvailable: 1

rbac:
  create: true

affinity: {}
tolerations: []
nodeSelector: {}
```

### 3. Ingress Deployment

#### templates/deployment-ingress.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.ingress.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.ingress.name }}
    version: {{ .Chart.AppVersion }}
spec:
  replicas: {{ .Values.ingress.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Values.ingress.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.ingress.name }}
        version: {{ .Chart.AppVersion }}
      annotations:
        prometheus.io/scrape: "{{ .Values.ingress.prometheus.scrape }}"
        prometheus.io/port: "{{ .Values.ingress.prometheus.port }}"
        prometheus.io/path: "{{ .Values.ingress.prometheus.path }}"
    spec:
      containers:
        - name: {{ .Values.ingress.name }}
          image: "{{ .Values.ingress.image.repository }}:{{ .Values.ingress.image.tag }}"
          imagePullPolicy: {{ .Values.ingress.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.ingress.service.targetPort }}
              protocol: TCP
          env:
{{- range $k,$v := .Values.ingress.config }}
            - name: {{ $k }}
              value: {{ $v | quote }}
{{- end }}
          resources:
{{ toYaml .Values.ingress.resources | indent 12 }}
          readinessProbe:
            httpGet:
              path: /healthz
              port: {{ .Values.ingress.service.targetPort }}
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /livez
              port: {{ .Values.ingress.service.targetPort }}
            initialDelaySeconds: 10
            periodSeconds: 20
            timeoutSeconds: 2
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
      terminationGracePeriodSeconds: 30
      {{- with .Values.nodeSelector }}
      nodeSelector:
{{ toYaml . | indent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
{{ toYaml . | indent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
{{ toYaml . | indent 8 }}
      {{- end }}
```

**Design Rationale:**
- Annotations enable Prometheus scraping
- PreStop hook delays shutdown for graceful termination
- Resource limits prevent resource exhaustion
- Health probes enable proper traffic routing

### 4. HPA Configuration

#### templates/hpa-ingress.yaml

```yaml
{{- if .Values.ingress.hpa.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.ingress.name }}-hpa
  namespace: {{ .Values.global.namespace }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.ingress.name }}
  minReplicas: {{ .Values.ingress.hpa.minReplicas }}
  maxReplicas: {{ .Values.ingress.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.ingress.hpa.cpuUtilization }}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 2
          periodSeconds: 15
      selectPolicy: Max
{{- end }}
```

**Design Rationale:**
- Behavior policies prevent flapping
- Scale up quickly, scale down slowly
- Multiple policies for flexible scaling

### 5. KEDA ScaledObject (Optional)

#### templates/scaledobject-ingress.yaml

```yaml
{{- if .Values.keda.enabled }}
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: {{ .Values.ingress.name }}-keda
  namespace: {{ .Values.global.namespace }}
spec:
  scaleTargetRef:
    name: {{ .Values.ingress.name }}
  minReplicaCount: {{ if .Values.keda.scaleToZero }}0{{ else }}{{ .Values.ingress.hpa.minReplicas }}{{ end }}
  maxReplicaCount: {{ .Values.ingress.hpa.maxReplicas }}
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring.svc:9090
        metricName: gati_ingress_requests_per_second
        query: |
          sum(rate(gati_ingress_requests_total[1m]))
        threshold: "{{ .Values.keda.requestsPerSecond }}"
{{- end }}
```

**Design Rationale:**
- Prometheus-based scaling on request rate
- Optional scale-to-zero for dev environments
- More responsive than CPU-based scaling

### 6. ServiceMonitor

#### templates/servicemonitor-ingress.yaml

```yaml
{{- if and .Values.ingress.prometheus.scrape .Values.prometheusOperator.serviceMonitor.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ .Values.ingress.name }}-sm
  namespace: {{ .Values.prometheusOperator.serviceMonitor.namespace | default .Values.global.namespace }}
  labels:
    app: {{ .Values.ingress.name }}
    release: prometheus
spec:
  selector:
    matchLabels:
      app: {{ .Values.ingress.name }}
  endpoints:
    - port: http
      interval: 15s
      path: {{ .Values.ingress.prometheus.path }}
      honorLabels: true
  namespaceSelector:
    matchNames:
      - {{ .Values.global.namespace }}
{{- end }}
```

**Design Rationale:**
- Automatic Prometheus scraping configuration
- Honors existing labels from metrics
- Configurable scrape interval

### 7. PodDisruptionBudget

#### templates/pdb-ingress.yaml

```yaml
{{- if .Values.pdb.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ .Values.ingress.name }}-pdb
  namespace: {{ .Values.global.namespace }}
spec:
  minAvailable: {{ .Values.pdb.minAvailable }}
  selector:
    matchLabels:
      app: {{ .Values.ingress.name }}
{{- end }}
```

**Design Rationale:**
- Ensures minimum availability during disruptions
- Prevents all pods from being evicted simultaneously

## Testing Strategy

### Helm Lint

```bash
helm lint helm/gati
```

### Dry Run

```bash
helm install gati ./helm/gati --dry-run --debug
```

### Template Validation

```bash
helm template gati ./helm/gati | kubectl apply --dry-run=client -f -
```

### Integration Tests

1. **Install Chart**
   - Install to test cluster
   - Verify all resources created
   - Check pod status

2. **Scaling Tests**
   - Trigger HPA scaling
   - Verify replica count changes
   - Test KEDA scaling (if enabled)

3. **Upgrade Tests**
   - Upgrade chart version
   - Verify zero downtime
   - Check rollback functionality

## Deployment Strategies

### Development

```yaml
# values-dev.yaml
ingress:
  replicaCount: 1
  hpa:
    enabled: false
  config:
    FEATURE_DEBUG_LOGGING: "true"

keda:
  enabled: true
  scaleToZero: true
```

### Staging

```yaml
# values-staging.yaml
ingress:
  replicaCount: 2
  hpa:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
```

### Production

```yaml
# values-prod.yaml
ingress:
  replicaCount: 3
  hpa:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
  config:
    FEATURE_PLAYGROUND: "false"

pdb:
  enabled: true
  minAvailable: 2

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - gati-ingress
          topologyKey: topology.kubernetes.io/zone
```

## Security Considerations

1. **RBAC**: Minimal permissions for service accounts
2. **Network Policies**: Restrict pod-to-pod communication
3. **Pod Security Standards**: Enforce restricted PSS
4. **Secrets Management**: Use external secrets operator
5. **Image Scanning**: Scan images for vulnerabilities

## Future Enhancements

1. **Multi-Cluster**: Support for multi-cluster deployments
2. **Service Mesh**: Integration with Istio/Linkerd
3. **GitOps**: ArgoCD/Flux integration
4. **Backup/Restore**: Velero integration
5. **Cost Optimization**: Spot instance support
