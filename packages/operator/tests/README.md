# Operator Tests

Minimal test suite for @gati-framework/operator.

## Test Coverage

- **manifest-generator.test.ts** - ManifestGenerator unit tests
- **scaling.test.ts** - ScalingController unit tests  
- **decommissioner.test.ts** - VersionDecommissioner unit tests

## Running Tests

Tests require a test framework (Jest/Vitest) to be configured.

```bash
npm test
```

## Test Structure

Tests use fake implementations of IDeploymentTarget to avoid Kubernetes dependencies.
