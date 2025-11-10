# Multi-Cloud Deployment Guide

This guide shows how to deploy Gati applications to AWS, GCP, and Azure using the unified cloud provider abstraction.

## Prerequisites

- Gati application created with `gati create`
- Cloud provider credentials configured
- kubectl installed
- Cloud CLI tools (aws-cli, gcloud, or az)

## AWS Deployment

### 1. Install AWS Plugin

```bash
pnpm add @gati-framework/cloud-aws
```

### 2. Configure AWS Credentials

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

### 3. Deploy to AWS EKS

```typescript
import { AWSCloudProvider } from '@gati-framework/cloud-aws';
import { CloudProviderFactory } from '@gati-framework/core/cloud-provider';

// Register provider
CloudProviderFactory.register('aws', () => new AWSCloudProvider());

// Initialize
const aws = CloudProviderFactory.create('aws');
await aws.initialize({
  region: 'us-east-1',
});

// Create EKS cluster
const result = await aws.createCluster({
  name: 'my-gati-cluster',
  version: '1.28',
  nodePools: [
    {
      name: 'default',
      instanceType: 't3.medium',
      minNodes: 2,
      maxNodes: 10,
      desiredNodes: 3,
    },
  ],
});

// Get kubeconfig
const kubeconfig = await aws.getKubeconfig('my-gati-cluster');
console.log('Cluster ready:', result.clusterEndpoint);
```

## GCP Deployment

### 1. Install GCP Plugin

```bash
pnpm add @gati-framework/cloud-gcp
```

### 2. Configure GCP Credentials

```bash
export GCP_PROJECT=your-project-id
gcloud auth application-default login
```

### 3. Deploy to GCP GKE

```typescript
import { GCPCloudProvider } from '@gati-framework/cloud-gcp';
import { CloudProviderFactory } from '@gati-framework/core/cloud-provider';

// Register provider
CloudProviderFactory.register('gcp', () => new GCPCloudProvider());

// Initialize
const gcp = CloudProviderFactory.create('gcp');
await gcp.initialize({
  region: 'us-central1',
  credentials: {
    projectId: process.env.GCP_PROJECT,
  },
});

// Create GKE cluster
const result = await gcp.createCluster({
  name: 'my-gati-cluster',
  version: '1.28',
  nodePools: [
    {
      name: 'default',
      instanceType: 'n1-standard-2',
      minNodes: 2,
      maxNodes: 10,
      desiredNodes: 3,
    },
  ],
});
```

## Azure Deployment

### 1. Install Azure Plugin

```bash
pnpm add @gati-framework/cloud-azure
```

### 2. Configure Azure Credentials

```bash
export AZURE_SUBSCRIPTION_ID=your-subscription-id
az login
```

### 3. Deploy to Azure AKS

```typescript
import { AzureCloudProvider } from '@gati-framework/cloud-azure';
import { CloudProviderFactory } from '@gati-framework/core/cloud-provider';

// Register provider
CloudProviderFactory.register('azure', () => new AzureCloudProvider());

// Initialize
const azure = CloudProviderFactory.create('azure');
await azure.initialize({
  region: 'eastus',
  credentials: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    resourceGroup: 'gati-rg',
  },
});

// Create AKS cluster
const result = await azure.createCluster({
  name: 'my-gati-cluster',
  version: '1.28',
  nodePools: [
    {
      name: 'default',
      instanceType: 'Standard_D2s_v3',
      minNodes: 2,
      maxNodes: 10,
      desiredNodes: 3,
    },
  ],
});
```

## Add Observability

### 1. Install Observability Package

```bash
pnpm add @gati-framework/observability
```

### 2. Configure Observability Stack

```typescript
import { ObservabilityStack } from '@gati-framework/observability';

const observability = new ObservabilityStack({
  serviceName: 'my-gati-app',
  serviceVersion: '1.0.0',
  environment: 'production',
  prometheus: true,
  loki: {
    host: 'http://loki:3100',
  },
  tracing: {
    serviceName: 'my-gati-app',
    autoInstrument: true,
  },
});

// Apply middleware
app.use(...observability.getMiddleware());

// Expose metrics
app.get('/metrics', await observability.getMetricsHandler());
```

### 3. Deploy Monitoring Stack

```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
---
# Prometheus deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
---
# Grafana deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
---
# Loki deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
    spec:
      containers:
      - name: loki
        image: grafana/loki:latest
        ports:
        - containerPort: 3100
```

Deploy with:
```bash
kubectl apply -f monitoring-stack.yaml
```

## Production Hardening

### 1. Install Production Hardening Package

```bash
pnpm add @gati-framework/production-hardening
```

### 2. Validate Configuration

```typescript
import { ProductionHardeningSuite } from '@gati-framework/production-hardening';

const hardening = new ProductionHardeningSuite(process.env.ENCRYPTION_KEY);

// Check production readiness
const readiness = await hardening.checkProductionReadiness({
  appName: 'my-app',
  environment: 'production',
  region: 'us-east-1',
  cloudProvider: 'aws',
  // ... rest of config
});

if (!readiness.ready) {
  console.error('Not ready for production!');
  process.exit(1);
}
```

### 3. Configure Auto-scaling

```typescript
const { scaling } = hardening;

// Get recommended policy for API workload
const policy = scaling.getRecommendedPolicy('api');

// Generate HPA manifest
const hpa = scaling.generateHPAManifest('my-app', 'production', policy);

// Save and apply
fs.writeFileSync('hpa.yaml', hpa);
// kubectl apply -f hpa.yaml
```

### 4. Configure Zero-downtime Deployment

```typescript
const { deployment } = hardening;

// Get rolling update config
const rollingConfig = deployment.getRecommendedRollingConfig('production');

// Generate deployment with health checks
const healthChecks = deployment.getRecommendedHealthChecks();
const manifest = deployment.generateRollingUpdateManifest(
  'my-app',
  'production',
  rollingConfig
);

// Run smoke tests after deployment
const smokeTests = [
  {
    name: 'Health check',
    endpoint: '/health',
    expectedStatus: 200,
  },
  {
    name: 'API ready',
    endpoint: '/api/status',
    expectedStatus: 200,
  },
];

const results = await deployment.runSmokeTests(
  'https://my-app.example.com',
  smokeTests
);

if (!results.passed) {
  console.error('Smoke tests failed - rolling back');
  // Trigger rollback
}
```

## Secret Management

### Store Secrets Securely

```typescript
const { secrets } = hardening;

// Generate and store API key
const apiKey = secrets.generateSecret(32);

secrets.storeSecret({
  name: 'api-key',
  value: apiKey,
  rotationDays: 90,
}, './secrets/api-key.json');

// Store in cloud provider
await cloudProvider.storeSecret({
  name: 'my-app/api-key',
  values: {
    API_KEY: apiKey,
  },
  tags: {
    Environment: 'production',
    App: 'my-app',
  },
});
```

## Complete Deployment Script

```typescript
import { CloudProviderFactory } from '@gati-framework/core/cloud-provider';
import { AWSCloudProvider } from '@gati-framework/cloud-aws';
import { ObservabilityStack } from '@gati-framework/observability';
import { ProductionHardeningSuite } from '@gati-framework/production-hardening';

async function deploy() {
  // 1. Initialize hardening suite
  const hardening = new ProductionHardeningSuite(process.env.ENCRYPTION_KEY);

  // 2. Validate configuration
  const config = loadDeploymentConfig();
  const readiness = await hardening.checkProductionReadiness(config);
  
  if (!readiness.ready) {
    throw new Error('Production readiness check failed');
  }

  // 3. Initialize cloud provider
  CloudProviderFactory.register('aws', () => new AWSCloudProvider());
  const provider = CloudProviderFactory.create('aws');
  await provider.initialize({ region: 'us-east-1' });

  // 4. Create cluster
  console.log('Creating cluster...');
  const cluster = await provider.createCluster({
    name: config.appName,
    version: '1.28',
    nodePools: [{
      name: 'default',
      instanceType: 't3.medium',
      minNodes: 2,
      maxNodes: 10,
      desiredNodes: 3,
    }],
  });

  // 5. Store secrets
  console.log('Storing secrets...');
  await provider.storeSecret({
    name: `${config.appName}/secrets`,
    values: config.secrets,
  });

  // 6. Deploy application with auto-scaling
  const hpa = hardening.scaling.generateHPAManifest(
    config.appName,
    'production',
    hardening.scaling.getRecommendedPolicy('api')
  );

  // 7. Verify deployment
  const health = await hardening.deployment.verifyDeploymentHealth(
    cluster.clusterEndpoint + '/health'
  );

  if (!health.healthy) {
    throw new Error('Deployment health check failed');
  }

  console.log('Deployment successful!');
  console.log('Cluster endpoint:', cluster.clusterEndpoint);
}

deploy().catch(console.error);
```

## Best Practices

1. **Always validate before deploying** - Use production hardening checks
2. **Use auto-scaling** - Configure HPA for all production workloads
3. **Enable observability** - Deploy with metrics, logs, and tracing
4. **Secure secrets** - Never commit secrets, use cloud secret managers
5. **Test deployments** - Run smoke tests after every deployment
6. **Monitor health** - Set up liveness and readiness probes
7. **Plan for rollback** - Test rollback procedures before production

## Troubleshooting

### Cluster Creation Fails

Check cloud provider credentials and permissions:
```bash
# AWS
aws sts get-caller-identity

# GCP
gcloud auth list

# Azure
az account show
```

### Deployment Not Healthy

Check pod status:
```bash
kubectl get pods -n production
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production
```

### Metrics Not Showing

Verify Prometheus is scraping:
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090/targets
```

## Next Steps

- Set up CI/CD pipeline for automated deployments
- Configure DNS and SSL certificates
- Set up alerting with Prometheus AlertManager
- Implement backup and disaster recovery
- Configure cost monitoring and optimization
