# @gati-framework/production-hardening

Production hardening utilities for Gati framework - secret management, config validation, auto-scaling, and zero-downtime deployments.

## Features

- ✅ **Secret Management** - Encrypted secret storage with rotation
- ✅ **Config Validation** - Schema-based configuration validation
- ✅ **Auto-scaling** - Intelligent scaling policies and HPA generation
- ✅ **Zero-downtime Deployment** - Rolling updates and health checks
- ✅ **Production Readiness Checks** - Comprehensive pre-deployment validation

## Installation

```bash
pnpm add @gati-framework/production-hardening
```

## Quick Start

```typescript
import { ProductionHardeningSuite } from '@gati-framework/production-hardening';

const hardening = new ProductionHardeningSuite(process.env.ENCRYPTION_KEY);

// Check production readiness
const readiness = await hardening.checkProductionReadiness(deploymentConfig);

if (!readiness.ready) {
  console.error('Production readiness check failed:');
  readiness.checks.forEach(check => {
    if (!check.passed) {
      console.error(`- ${check.category}:`, check.details);
    }
  });
  process.exit(1);
}
```

## Secret Management

### Encrypt and Store Secrets

```typescript
const { secrets } = hardening;

// Generate a secure secret
const apiKey = secrets.generateSecret(32);

// Store encrypted secret
secrets.storeSecret({
  name: 'api-key',
  value: apiKey,
  rotationDays: 90,
}, '/path/to/secrets/api-key.json');

// Load and decrypt
const secret = secrets.loadSecret('/path/to/secrets/api-key.json');
console.log('Decrypted value:', secret.value);

// Check if rotation needed
if (secrets.needsRotation(secret)) {
  const newKey = secrets.generateSecret(32);
  secrets.storeSecret({
    ...secret,
    value: newKey,
    lastRotated: new Date(),
  }, '/path/to/secrets/api-key.json');
}
```

### Validate Secret Strength

```typescript
import { SecretValidator } from '@gati-framework/production-hardening';

const strength = SecretValidator.checkStrength('myPassword123!');

if (!strength.strong) {
  console.warn('Weak secret detected:');
  strength.feedback.forEach(msg => console.warn(`- ${msg}`));
}

console.log('Strength score:', strength.score);
```

### Validate Required Secrets

```typescript
SecretValidator.validateRequired([
  'DATABASE_URL',
  'API_KEY',
  'JWT_SECRET',
]);
```

## Configuration Validation

### Validate Deployment Config

```typescript
const { validator } = hardening;

const config = {
  appName: 'my-app',
  environment: 'production',
  region: 'us-east-1',
  cloudProvider: 'aws',
  kubernetes: {
    clusterName: 'prod-cluster',
    namespace: 'default',
    version: '1.28',
  },
  resources: {
    replicas: 3,
    cpu: { request: '500m', limit: '1000m' },
    memory: { request: '512Mi', limit: '1Gi' },
  },
  autoscaling: {
    enabled: true,
    minReplicas: 2,
    maxReplicas: 10,
    targetCPU: 70,
  },
  networking: {
    port: 3000,
    protocol: 'HTTPS',
    ingress: {
      enabled: true,
      host: 'api.example.com',
      tls: true,
    },
  },
};

const result = validator.validateDeploymentConfig(config);

if (!result.valid) {
  console.error('Configuration errors:', result.errors);
} else {
  console.log('Configuration is valid');
}
```

### Pre-deployment Checks

```typescript
const preCheck = await validator.preDeploymentCheck(validatedConfig);

console.log('Pre-deployment check:', preCheck.passed ? 'PASSED' : 'FAILED');

preCheck.checks.forEach(check => {
  console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
  if (!check.passed && check.message) {
    console.log(`  ${check.message}`);
  }
});
```

## Auto-scaling

### Get Recommended Policy

```typescript
const { scaling } = hardening;

// Get policy for your workload type
const policy = scaling.getRecommendedPolicy('api');

console.log('Recommended policy:', policy);
// {
//   metric: 'requests',
//   targetValue: 1000,
//   minReplicas: 3,
//   maxReplicas: 20,
//   scaleUpCooldown: 30,
//   scaleDownCooldown: 180
// }
```

### Generate HPA Manifest

```typescript
const hpaManifest = scaling.generateHPAManifest(
  'my-app',
  'production',
  policy
);

console.log(hpaManifest);
// Output: Kubernetes HPA YAML
```

### Get Scaling Recommendations

```typescript
const recommendations = scaling.getScalingRecommendations({
  cpuUsage: 85,
  memoryUsage: 70,
  requestRate: 1500,
  currentReplicas: 3,
});

console.log('Recommendations:', recommendations.recommendations);
if (recommendations.suggestedPolicy) {
  console.log('Suggested policy:', recommendations.suggestedPolicy);
}
```

## Zero-downtime Deployment

### Rolling Update Configuration

```typescript
const { deployment } = hardening;

// Get recommended config for environment
const rollingConfig = deployment.getRecommendedRollingConfig('production');

// Generate deployment manifest
const manifest = deployment.generateRollingUpdateManifest(
  'my-app',
  'production',
  rollingConfig
);
```

### Health Checks

```typescript
const healthChecks = deployment.getRecommendedHealthChecks();

const probes = deployment.generateHealthProbes(
  healthChecks.liveness,
  healthChecks.readiness
);

console.log(probes);
```

### Run Smoke Tests

```typescript
const smokeTests = [
  {
    name: 'Health check',
    endpoint: '/health',
    expectedStatus: 200,
  },
  {
    name: 'API version',
    endpoint: '/api/version',
    expectedStatus: 200,
    expectedBody: /"version":/,
  },
];

const results = await deployment.runSmokeTests(
  'https://my-app.example.com',
  smokeTests
);

if (!results.passed) {
  console.error('Smoke tests failed:');
  results.results.forEach(r => {
    if (!r.passed) {
      console.error(`- ${r.test}: ${r.error}`);
    }
  });
}
```

### Verify Deployment Health

```typescript
const health = await deployment.verifyDeploymentHealth(
  'https://my-app.example.com/health',
  60000 // 60 second timeout
);

if (!health.healthy) {
  console.error('Deployment is unhealthy:', health.message);
  
  // Rollback
  const rollbackCmd = deployment.generateRollbackCommand('my-app', 'production');
  console.log('Rollback command:', rollbackCmd);
}
```

## Best Practices

### 1. Always Validate Before Deployment

```typescript
const readiness = await hardening.checkProductionReadiness(config);
if (!readiness.ready) {
  throw new Error('Production readiness check failed');
}
```

### 2. Use Secret Rotation

```typescript
// Check and rotate secrets regularly
const secret = secrets.loadSecret('path/to/secret.json');
if (secrets.needsRotation(secret)) {
  // Rotate the secret
  const newValue = secrets.generateSecret();
  // ... update in cloud provider
}
```

### 3. Monitor Scaling Metrics

```typescript
// Get recommendations based on current metrics
const recommendations = scaling.getScalingRecommendations(currentMetrics);
// Apply recommendations
```

### 4. Run Smoke Tests After Deployment

```typescript
const smokeTestResults = await deployment.runSmokeTests(endpoint, tests);
if (!smokeTestResults.passed) {
  // Rollback deployment
  await rollback();
}
```

## Environment Variables

- `ENCRYPTION_KEY` - Key for encrypting secrets (required)
- `GATI_SECRET_KEY` - Alternative secret key name

## API Reference

See [TypeScript definitions](./src/index.ts) for complete API documentation.

## License

MIT © Krishna Paul
