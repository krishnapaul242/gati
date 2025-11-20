# Gati Benchmarking Guide

This guide covers running micro-benchmarks, load tests, and performance regression detection for Gati applications.

## Table of Contents

- [Overview](#overview)
- [Micro-Benchmark Suites](#micro-benchmark-suites)
- [Running Benchmarks](#running-benchmarks)
- [Baseline Management](#baseline-management)
- [Continuous Integration](#continuous-integration)
- [Load Testing](#load-testing)
- [Performance Regression Detection](#performance-regression-detection)
- [Best Practices](#best-practices)

---

## Overview

Gati uses a comprehensive benchmarking strategy to ensure performance targets are met:

1. **Micro-Benchmarks**: Isolated tests for specific components (validators, routing, middleware)
2. **Integration Benchmarks**: End-to-end request processing
3. **Load Tests**: Sustained throughput and concurrency testing
4. **Regression Detection**: Automated checks on PRs to prevent performance degradation

**Framework**: Vitest benchmark runner (compatible with test infrastructure)

**Location**: `tests/benchmarks/`

---

## Micro-Benchmark Suites

### 1. Validator Benchmarks

**File**: `tests/benchmarks/validator.bench.ts`

**Purpose**: Measure validator execution performance for different type shapes

**Scenarios**:

```typescript
import { bench, describe } from 'vitest';
import { validateSimpleObject, validateNestedObject, validateLargeArray } from '../fixtures/validators';

describe('Validator Performance', () => {
  // Simple object (3-10 fields)
  bench('validate simple user object', () => {
    const data = { 
      id: 'user_123', 
      email: 'test@example.com', 
      age: 25 
    };
    validateSimpleObject(data);
  });

  // Nested object (depth 3-5)
  bench('validate nested order object', () => {
    const data = {
      id: 'order_456',
      user: { id: 'user_123', name: 'John' },
      items: [
        { id: 'item_1', price: 29.99, quantity: 2 },
        { id: 'item_2', price: 49.99, quantity: 1 }
      ]
    };
    validateNestedObject(data);
  });

  // Large array (100 items)
  bench('validate large array', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: `item_${i}`,
      value: i * 10
    }));
    validateLargeArray(data);
  });
});
```

**Targets**:
- Simple objects: < 0.1 ms
- Nested objects: 0.2-1 ms
- Large arrays (100 items): < 10 ms

---

### 2. Routing Benchmarks

**File**: `tests/benchmarks/routing.bench.ts`

**Purpose**: Measure route resolution performance

**Scenarios**:

```typescript
import { bench, describe } from 'vitest';
import { createRouteManager } from '@gati-framework/runtime';

describe('Routing Performance', () => {
  const router = createRouteManager();
  
  // Register routes
  router.register('GET', '/users', handler);
  router.register('GET', '/users/:id', handler);
  router.register('GET', '/users/:id/posts', handler);
  router.register('POST', '/users', handler);
  
  // Static route lookup
  bench('static route lookup', () => {
    router.match('GET', '/users');
  });

  // Dynamic route lookup (1 param)
  bench('dynamic route lookup (1 param)', () => {
    router.match('GET', '/users/123');
  });

  // Dynamic route lookup (2 params)
  bench('dynamic route lookup (2 params)', () => {
    router.match('GET', '/users/123/posts');
  });

  // Route not found
  bench('route not found', () => {
    router.match('GET', '/nonexistent');
  });
});
```

**Targets**:
- Route lookup: < 0.5 ms
- 95th percentile: < 1 ms

---

### 3. Middleware Benchmarks

**File**: `tests/benchmarks/middleware.bench.ts`

**Purpose**: Measure middleware execution overhead

**Scenarios**:

```typescript
import { bench, describe } from 'vitest';
import { createMiddlewareManager } from '@gati-framework/runtime';

describe('Middleware Performance', () => {
  const middleware = createMiddlewareManager();
  
  // Lightweight middleware (header checks)
  bench('lightweight middleware (header checks)', async () => {
    await middleware.execute(req, res, gctx, lctx, async () => {
      // No-op handler
    });
  });

  // Auth middleware (token decode)
  bench('auth middleware (token decode)', async () => {
    await authMiddleware(req, res, gctx, lctx, async () => {});
  });

  // Full stack (auth + CORS + tracing)
  bench('full middleware stack', async () => {
    await middleware.execute(req, res, gctx, lctx, async () => {});
  });
});
```

**Targets**:
- Single lightweight middleware: < 0.1 ms
- Full stack (3-5 middlewares): < 5 ms

---

### 4. Startup Benchmarks

**File**: `tests/benchmarks/startup.bench.ts`

**Purpose**: Measure cold start and module initialization time

**Scenarios**:

```typescript
import { bench, describe } from 'vitest';
import { createApp } from '@gati-framework/runtime';

describe('Startup Performance', () => {
  // Cold start (app creation + module init)
  bench('cold start (no routes)', async () => {
    const app = createApp();
    await app.listen();
    await app.close();
  });

  // With routes
  bench('cold start (100 routes)', async () => {
    const app = createApp();
    
    for (let i = 0; i < 100; i++) {
      app.get(`/route${i}`, handler);
    }
    
    await app.listen();
    await app.close();
  });

  // With modules
  bench('cold start (with DB module)', async () => {
    const app = createApp();
    // Initialize DB module
    await app.listen();
    await app.close();
  });
});
```

**Targets**:
- Cold start (no routes): < 100 ms
- Cold start (100 routes): < 200 ms

---

### 5. Analyzer Incremental Benchmarks

**File**: `tests/benchmarks/analyzer-incremental.bench.ts`

**Purpose**: Measure analyzer recompilation time for incremental changes

**Scenarios**:

```typescript
import { bench, describe } from 'vitest';
import { analyzeFile } from '@gati/cli';

describe('Analyzer Performance', () => {
  // Single file analysis
  bench('analyze single handler file', () => {
    analyzeFile('./fixtures/handlers/users.ts', './fixtures');
  });

  // Incremental reanalysis (small edit)
  bench('incremental reanalysis (small edit)', () => {
    // Simulate file change
    analyzeFile('./fixtures/handlers/users-modified.ts', './fixtures');
  });

  // Full project analysis
  bench('full project analysis (100 files)', () => {
    // Analyze all files
    for (let i = 0; i < 100; i++) {
      analyzeFile(`./fixtures/handlers/route${i}.ts`, './fixtures');
    }
  });
});
```

**Targets**:
- Single file: < 50 ms
- Incremental (small edit): < 100 ms
- Full project (100 files): < 5s

---

### 6. RPS Smoke Test

**File**: `tests/benchmarks/rps-smoke.bench.ts`

**Purpose**: Quick throughput sanity check

**Scenarios**:

```typescript
import { bench, describe } from 'vitest';
import { createApp } from '@gati-framework/runtime';

describe('Throughput Smoke Test', () => {
  const app = createApp();
  
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  // Concurrent requests
  bench('1000 concurrent requests', async () => {
    const requests = Array.from({ length: 1000 }, () => 
      fetch('http://localhost:3000/health')
    );
    await Promise.all(requests);
  });
});
```

**Targets**:
- 1000 concurrent requests: < 1s (1000+ RPS)

---

## Running Benchmarks

### Local Development

Run all benchmarks:

```bash
pnpm bench
```

Run specific benchmark suite:

```bash
pnpm bench tests/benchmarks/validator.bench.ts
```

Run with verbose output:

```bash
pnpm bench --reporter verbose
```

Generate JSON output:

```bash
pnpm bench --reporter json > benchmark-results.json
```

### Environment Setup

Set environment variables for consistent benchmarks:

```bash
# Disable JIT optimizations for predictable results
NODE_ENV=production

# Increase heap size
NODE_OPTIONS="--max-old-space-size=4096"

# Run benchmarks
pnpm bench
```

---

## Baseline Management

### Creating Baselines

After implementing a feature or optimization, capture a baseline:

```bash
pnpm bench --reporter json > tests/benchmarks/baselines/baseline-$(date +%Y%m%d).json
```

Baseline storage structure:

```
tests/benchmarks/baselines/
  baseline-20250119.json    # Initial baseline
  baseline-20250201.json    # After optimization X
  baseline-20250215.json    # After feature Y
  current.json              # Symlink to latest
```

### Updating Baselines

Update baseline when intentional changes affect performance:

```bash
# Run benchmarks
pnpm bench --reporter json > /tmp/new-baseline.json

# Compare with current baseline
pnpm bench:compare tests/benchmarks/baselines/current.json /tmp/new-baseline.json

# If acceptable, update baseline
cp /tmp/new-baseline.json tests/benchmarks/baselines/baseline-$(date +%Y%m%d).json
ln -sf baseline-$(date +%Y%m%d).json tests/benchmarks/baselines/current.json
```

### Baseline Format

```json
{
  "benchmarks": [
    {
      "name": "validate simple user object",
      "mean": 0.045,
      "stdDev": 0.003,
      "p95": 0.052,
      "p99": 0.058,
      "ops": 22222
    }
  ],
  "metadata": {
    "timestamp": "2025-01-19T12:00:00Z",
    "nodeVersion": "20.10.0",
    "platform": "linux",
    "cpu": "Intel i9-12900K"
  }
}
```

---

## Continuous Integration

### CI Benchmark Workflow

**File**: `.github/workflows/benchmarks.yml`

Runs benchmarks on schedule and manual trigger:

```yaml
name: Benchmarks

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  benchmark:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      
      - name: Run benchmarks
        run: pnpm bench --reporter json > benchmark-results.json
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results-${{ github.sha }}
          path: benchmark-results.json
      
      - name: Compare with baseline
        run: |
          pnpm bench:compare \
            tests/benchmarks/baselines/current.json \
            benchmark-results.json
```

### Performance Guard Workflow

**File**: `.github/workflows/perf-guard.yml`

Checks for performance regressions on PRs:

```yaml
name: Performance Guard

on:
  pull_request:
    branches: [main]

jobs:
  perf-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch baseline
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      
      - name: Run benchmarks
        run: pnpm bench --reporter json > pr-results.json
      
      - name: Check for regressions
        run: |
          pnpm bench:regression \
            tests/benchmarks/baselines/current.json \
            pr-results.json \
            --threshold 10  # Fail if >10% slower
      
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ Performance regression detected. Check benchmark results.'
            })
```

### Artifact Storage & Tracking

Store benchmark results as artifacts for trend analysis:

```yaml
- name: Upload benchmark results
  uses: actions/upload-artifact@v4
  with:
    name: benchmark-results-${{ github.sha }}
    path: benchmark-results.json
    retention-days: 90
```

Track trends over time using external tools:
- **GitHub Actions Cache**: Store recent baselines
- **External DB**: Push results to TimescaleDB or InfluxDB
- **Visualization**: Grafana dashboards for trend analysis

---

## Load Testing

For sustained load and stress testing, use external tools:

### Artillery (Recommended)

**Installation**:

```bash
pnpm add -D artillery
```

**Config**: `tests/load/basic.yml`

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests/sec
      name: Warm-up
    - duration: 300
      arrivalRate: 100  # 100 requests/sec
      name: Sustained load
    - duration: 60
      arrivalRate: 200  # 200 requests/sec
      name: Peak load

scenarios:
  - name: Health check
    flow:
      - get:
          url: '/health'
  
  - name: User CRUD
    flow:
      - post:
          url: '/users'
          json:
            email: 'test@example.com'
            name: 'Test User'
      - get:
          url: '/users/{{ id }}'
```

**Run**:

```bash
pnpm artillery run tests/load/basic.yml
```

### k6 (Alternative)

**Installation**:

```bash
# macOS
brew install k6

# Windows
choco install k6
```

**Script**: `tests/load/basic.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '5m', target: 100 },  // Sustained
    { duration: '1m', target: 200 },  // Peak
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],  // 95% < 100ms
    http_req_failed: ['rate<0.01'],    // < 1% errors
  },
};

export default function () {
  const res = http.get('http://localhost:3000/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 100ms': (r) => r.timings.duration < 100,
  });
  sleep(0.1);
}
```

**Run**:

```bash
k6 run tests/load/basic.js
```

---

## Performance Regression Detection

### Regression Criteria

A performance regression occurs when:

1. **Mean latency increases >10%** vs. baseline
2. **P95 latency increases >15%** vs. baseline
3. **Throughput decreases >10%** vs. baseline
4. **Memory usage increases >20%** vs. baseline

### Automated Detection

**Script**: `scripts/bench-regression.ts`

```typescript
import { readFileSync } from 'fs';

interface BenchmarkResult {
  name: string;
  mean: number;
  p95: number;
  ops: number;
}

function detectRegressions(
  baseline: BenchmarkResult[],
  current: BenchmarkResult[],
  threshold: number = 0.10
): string[] {
  const regressions: string[] = [];

  for (const curr of current) {
    const base = baseline.find(b => b.name === curr.name);
    if (!base) continue;

    const meanDiff = (curr.mean - base.mean) / base.mean;
    const p95Diff = (curr.p95 - base.p95) / base.p95;
    const opsDiff = (base.ops - curr.ops) / base.ops;

    if (meanDiff > threshold) {
      regressions.push(
        `${curr.name}: Mean latency increased ${(meanDiff * 100).toFixed(1)}%`
      );
    }

    if (p95Diff > threshold * 1.5) {
      regressions.push(
        `${curr.name}: P95 latency increased ${(p95Diff * 100).toFixed(1)}%`
      );
    }

    if (opsDiff > threshold) {
      regressions.push(
        `${curr.name}: Throughput decreased ${(opsDiff * 100).toFixed(1)}%`
      );
    }
  }

  return regressions;
}

// Usage
const baseline = JSON.parse(readFileSync('baselines/current.json', 'utf-8'));
const current = JSON.parse(readFileSync('pr-results.json', 'utf-8'));

const regressions = detectRegressions(baseline.benchmarks, current.benchmarks);

if (regressions.length > 0) {
  console.error('Performance regressions detected:');
  regressions.forEach(r => console.error(`  - ${r}`));
  process.exit(1);
} else {
  console.log('No performance regressions detected.');
}
```

---

## Best Practices

### Do's

✅ **Run benchmarks in CI** - Catch regressions early  
✅ **Use consistent hardware** - Cloud runners or dedicated machines  
✅ **Warm up before measuring** - Run several iterations before timing  
✅ **Use production builds** - Benchmark optimized code  
✅ **Store baselines** - Track performance over time  
✅ **Set thresholds** - Fail CI on significant regressions  
✅ **Benchmark hot paths** - Focus on critical code paths  
✅ **Isolate tests** - Each benchmark should be independent  

### Don'ts

❌ **Don't benchmark in development mode** - JIT optimizations differ  
❌ **Don't ignore variance** - Report mean, stddev, and percentiles  
❌ **Don't micro-optimize prematurely** - Profile first  
❌ **Don't run single iterations** - Use statistical samples  
❌ **Don't benchmark on shared hardware** - Results will be inconsistent  
❌ **Don't skip warming up** - Cold starts skew results  
❌ **Don't forget to update baselines** - After intentional changes  

---

## Troubleshooting

### Benchmarks are slow

**Cause**: Running too many iterations

**Solution**: Reduce iterations or use sampling:

```typescript
bench('expensive operation', () => {
  // ...
}, { iterations: 100 });  // Limit iterations
```

### Inconsistent results

**Cause**: Background processes, thermal throttling, or shared hardware

**Solution**:
- Close unnecessary applications
- Run on dedicated hardware
- Use cloud runners with consistent specs
- Increase sample size

### Baseline drift

**Cause**: Platform or dependency changes

**Solution**:
- Regenerate baseline after Node.js upgrades
- Regenerate after major dependency updates
- Track platform metadata in baselines

---

## Related Documentation

- [Performance Guide](./performance.md) - Performance targets and optimization strategies
- [Observability Guide](./observability.md) - Monitoring and tracing
- [Handler Development](./handlers.md) - Writing efficient handlers
- [Architecture Overview](../architecture/overview.md) - System architecture

---

**Last Updated**: November 19, 2025  
**Maintainer**: Gati Framework Team
