# Observability Guide for Gati Applications

**Status**: Implementation Guide  
**Last Updated**: 2025-11-19

## Overview

Observability is critical for understanding, debugging, and optimizing Gati applications in production. This guide covers the comprehensive metrics, tracing, logging, and monitoring strategies that enable you to maintain Gati's performance-first architecture.

**Key Principles**:
- **Opt-In by Default**: Metrics collection is lightweight and disabled unless `GATI_METRICS=1`
- **Layer-Aware**: Metrics map directly to the 10-layer architecture model
- **Performance-First**: Instrumentation overhead <1ms per request
- **Production-Ready**: Supports Prometheus, OpenTelemetry, Datadog, CloudWatch

---

## Table of Contents

- [Metric Categories](#metric-categories)
- [Per-Request Metrics](#per-request-metrics)
- [System Metrics](#system-metrics)
- [Metric Collection Patterns](#metric-collection-patterns)
- [Dashboards](#dashboards)
- [Alert Rules](#alert-rules)
- [Platform Integration](#platform-integration)
- [Troubleshooting](#troubleshooting)

---

## Metric Categories

Gati exposes two primary metric categories aligned with the [10-layer architecture](../architecture/overview.md#layered-architecture-model):

### 1. Per-Request Metrics (18 metrics)

Track the lifecycle of individual HTTP requests through all runtime layers (2, 5-9):

| Metric | Type | Layer | Description | Target |
|--------|------|-------|-------------|--------|
| `total_latency` | Histogram | All | End-to-end request duration | p95 <100ms |
| `routing_time` | Histogram | 2 | Route lookup duration | <0.5ms |
| `middleware_latency` | Histogram | 6 | Middleware chain execution time | <5ms |
| `validation_input` | Histogram | 6/8 | Input validation duration | <0.5ms |
| `validation_output` | Histogram | 6/8 | Output validation duration | <0.5ms |
| `handler_execution` | Histogram | 8 | Handler function execution time | Variable |
| `db_query_time` | Histogram | 9 | Database query duration | Variable |
| `db_connection_time` | Histogram | 9 | DB connection acquisition time | <10ms |
| `external_api_time` | Histogram | 10 | Third-party API call duration | Variable |
| `bytes_in` | Counter | 5 | Request payload size | - |
| `bytes_out` | Counter | 5 | Response payload size | - |
| `status_code` | Counter | 5 | HTTP response status code | - |
| `error_type` | Counter | 8 | Error classification | - |
| `retry_count` | Counter | 9/10 | Number of retries | - |
| `cache_hit` | Counter | 9 | Cache hit events | - |
| `cache_miss` | Counter | 9 | Cache miss events | - |
| `rate_limited` | Counter | 6 | Rate limit trigger events | - |
| `context_creation` | Histogram | 7 | Context builder overhead | <0.2ms |

### 2. System Metrics (6 metrics)

Track application-wide health and resource usage:

| Metric | Type | Description | Target |
|--------|------|-------------|--------|
| `analyzer_recompile_time` | Histogram | Incremental analysis duration (Layer 3) | <100ms |
| `validator_generation_time` | Histogram | Validator compilation time (Layer 4) | <50ms |
| `memory_heap_used` | Gauge | Node.js heap memory usage | <80% |
| `memory_heap_total` | Gauge | Total allocated heap | - |
| `event_loop_latency` | Histogram | Event loop lag | <10ms |
| `gc_pause_duration` | Histogram | Garbage collection pause time | <50ms |

---

## Per-Request Metrics

### Metric: `total_latency`

**Type**: Histogram (milliseconds)  
**Labels**: `method`, `route`, `status_code`  
**Description**: End-to-end request duration from HTTP request reception to response delivery.

**Collection Pattern**:
```typescript
// packages/runtime/src/app-core.ts
const startTime = performance.now();

try {
  await this.handleRequest(incomingMessage, serverResponse);
} finally {
  const duration = performance.now() - startTime;
  
  if (process.env['GATI_METRICS'] === '1') {
    metrics.recordHistogram('gati.request.total_latency', duration, {
      method: req.method,
      route: lctx.meta.path,
      status_code: res.statusCode,
    });
  }
}
```

**Alert Thresholds**:
- Warning: p95 > 200ms
- Critical: p95 > 500ms

**Dashboard Query (Prometheus)**:
```promql
histogram_quantile(0.95, 
  sum(rate(gati_request_total_latency_bucket[5m])) by (le, route)
)
```

---

### Metric: `routing_time`

**Type**: Histogram (milliseconds)  
**Labels**: `method`, `matched` (boolean)  
**Description**: Route lookup duration (Layer 2).

**Collection Pattern**:
```typescript
// packages/runtime/src/route-manager.ts
match(method: string, path: string): RouteMatch | null {
  const startTime = performance.now();
  
  try {
    const match = this.findMatch(method, path);
    return match;
  } finally {
    const duration = performance.now() - startTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram('gati.routing.lookup_time', duration, {
        method,
        matched: match !== null,
      });
    }
  }
}
```

**Target**: <0.5ms  
**Alert Thresholds**:
- Warning: p95 > 1ms
- Critical: p95 > 5ms

---

### Metric: `middleware_latency`

**Type**: Histogram (milliseconds)  
**Labels**: `middleware_name`  
**Description**: Individual middleware execution time (Layer 6).

**Collection Pattern**:
```typescript
// packages/runtime/src/middleware.ts
async execute(req, res, gctx, lctx, finalHandler) {
  for (const mw of this.middlewares) {
    const startTime = performance.now();
    
    try {
      await mw(req, res, gctx, lctx, next);
    } finally {
      const duration = performance.now() - startTime;
      
      if (process.env['GATI_METRICS'] === '1') {
        metrics.recordHistogram('gati.middleware.execution_time', duration, {
          middleware_name: mw.name || 'anonymous',
        });
      }
    }
  }
}
```

**Target**: Full chain <5ms  
**Alert Thresholds**:
- Warning: Single middleware p95 > 2ms
- Critical: Full chain p95 > 10ms

---

### Metric: `validation_input` / `validation_output`

**Type**: Histogram (milliseconds)  
**Labels**: `handler_name`, `valid` (boolean)  
**Description**: Input/output validation duration (Layers 6/8).

**Collection Pattern**:
```typescript
// packages/runtime/src/handler-engine.ts (future)
export async function executeHandler(handler, req, res, gctx, lctx) {
  // Input validation
  if (handler.inputSchema) {
    const startTime = performance.now();
    const valid = validateInput(req.body, handler.inputSchema);
    const duration = performance.now() - startTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram('gati.validation.input_time', duration, {
        handler_name: handler.name,
        valid,
      });
    }
    
    if (!valid) throw new HandlerError('Validation failed', 400);
  }
  
  // Execute handler
  const result = await handler(req, res, gctx, lctx);
  
  // Output validation
  if (handler.outputSchema) {
    const startTime = performance.now();
    const valid = validateOutput(result, handler.outputSchema);
    const duration = performance.now() - startTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram('gati.validation.output_time', duration, {
        handler_name: handler.name,
        valid,
      });
    }
  }
}
```

**Target**: <0.5ms each  
**Alert Thresholds**:
- Warning: p95 > 1ms
- Critical: p95 > 5ms (indicates complex schema or inefficient validator)

---

### Metric: `handler_execution`

**Type**: Histogram (milliseconds)  
**Labels**: `handler_name`, `status` (success/error)  
**Description**: Handler function execution time (Layer 8).

**Collection Pattern**:
```typescript
// packages/runtime/src/handler-engine.ts
export async function executeHandler(handler, req, res, gctx, lctx) {
  const startTime = performance.now();
  let status = 'success';
  
  try {
    await handler(req, res, gctx, lctx);
  } catch (error) {
    status = 'error';
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram('gati.handler.execution_time', duration, {
        handler_name: handler.name || req.path,
        status,
      });
    }
  }
}
```

**Target**: Variable (business logic dependent)  
**Alert Thresholds**:
- Warning: p95 > 50ms (simple CRUD)
- Critical: p95 > 200ms (complex logic)

---

### Metric: `db_query_time` / `db_connection_time`

**Type**: Histogram (milliseconds)  
**Labels**: `operation` (select/insert/update/delete), `table`  
**Description**: Database query and connection acquisition time (Layer 9).

**Collection Pattern**:
```typescript
// Future: @gati-framework/db package
class GatiDbClient {
  async query(sql: string, params: unknown[]) {
    const connStartTime = performance.now();
    const conn = await this.pool.acquire();
    const connDuration = performance.now() - connStartTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram('gati.db.connection_time', connDuration);
    }
    
    const queryStartTime = performance.now();
    try {
      const result = await conn.execute(sql, params);
      return result;
    } finally {
      const queryDuration = performance.now() - queryStartTime;
      
      if (process.env['GATI_METRICS'] === '1') {
        metrics.recordHistogram('gati.db.query_time', queryDuration, {
          operation: this.extractOperation(sql),
          table: this.extractTable(sql),
        });
      }
      
      this.pool.release(conn);
    }
  }
}
```

**Target**: Query time variable, connection <10ms  
**Alert Thresholds**:
- Warning: Connection p95 > 20ms (pool exhaustion)
- Critical: Connection p95 > 50ms or query p95 > 1s

---

### Metric: `external_api_time`

**Type**: Histogram (milliseconds)  
**Labels**: `service_name`, `endpoint`, `status_code`  
**Description**: Third-party API call duration (Layer 10).

**Collection Pattern**:
```typescript
// User code or future HTTP client module
async function callExternalAPI(url: string) {
  const startTime = performance.now();
  let statusCode = 0;
  
  try {
    const response = await fetch(url);
    statusCode = response.status;
    return await response.json();
  } finally {
    const duration = performance.now() - startTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram('gati.external.api_time', duration, {
        service_name: new URL(url).hostname,
        endpoint: new URL(url).pathname,
        status_code: statusCode,
      });
    }
  }
}
```

**Target**: Variable (network dependent)  
**Alert Thresholds**:
- Warning: p95 > 500ms
- Critical: p95 > 2s or error rate > 5%

---

### Counter Metrics: `bytes_in`, `bytes_out`, `status_code`

**Type**: Counter  
**Labels**: `method`, `route`, `status_code`  
**Description**: Request/response size and HTTP status tracking (Layer 5).

**Collection Pattern**:
```typescript
// packages/runtime/src/app-core.ts
private async handleRequest(incomingMessage, serverResponse) {
  const bytesIn = parseInt(incomingMessage.headers['content-length'] || '0', 10);
  
  // ... request processing ...
  
  const bytesOut = res.getHeader('content-length') || 0;
  const statusCode = res.statusCode;
  
  if (process.env['GATI_METRICS'] === '1') {
    metrics.incrementCounter('gati.request.bytes_in', bytesIn, { method: req.method, route: lctx.meta.path });
    metrics.incrementCounter('gati.request.bytes_out', bytesOut, { method: req.method, route: lctx.meta.path });
    metrics.incrementCounter('gati.request.status_code', 1, { method: req.method, route: lctx.meta.path, status_code: statusCode });
  }
}
```

**Alert Thresholds**:
- Warning: Bytes in/out p95 > 1MB (large payloads)
- Critical: 5xx status code rate > 1%

---

### Error and Cache Metrics

**Metrics**: `error_type`, `cache_hit`, `cache_miss`, `rate_limited`, `retry_count`  
**Type**: Counter  
**Description**: Track errors, cache efficiency, rate limiting, and retries.

**Collection Pattern**:
```typescript
// Error tracking
catch (error) {
  if (process.env['GATI_METRICS'] === '1') {
    metrics.incrementCounter('gati.request.error_type', 1, {
      error_type: error instanceof HandlerError ? 'handler_error' : 'unknown',
      handler_name: handler.name,
    });
  }
  throw error;
}

// Cache tracking (user code or cache module)
const cachedValue = await cache.get(key);
if (cachedValue) {
  metrics.incrementCounter('gati.cache.hit', 1, { cache_name: 'user_cache' });
} else {
  metrics.incrementCounter('gati.cache.miss', 1, { cache_name: 'user_cache' });
}

// Rate limiting
if (isRateLimited(clientId)) {
  metrics.incrementCounter('gati.middleware.rate_limited', 1, { route: req.path });
  throw new HandlerError('Too many requests', 429);
}
```

---

## System Metrics

### Metric: `analyzer_recompile_time`

**Type**: Histogram (milliseconds)  
**Description**: Incremental analysis duration (Layer 3, dev/build only).

**Collection Pattern**:
```typescript
// Future: packages/cli/src/analyzer/file-watcher.ts
class FileWatcher {
  private async onFileChange(filePath: string) {
    const startTime = performance.now();
    
    try {
      await this.analyzer.analyzeFile(filePath);
    } finally {
      const duration = performance.now() - startTime;
      
      if (process.env['GATI_METRICS'] === '1') {
        metrics.recordHistogram('gati.analyzer.recompile_time', duration, {
          file_path: filePath,
        });
      }
    }
  }
}
```

**Target**: <100ms incremental  
**Alert Thresholds**:
- Warning: p95 > 200ms (dev experience degradation)

---

### Metric: `memory_heap_used` / `memory_heap_total`

**Type**: Gauge (bytes)  
**Description**: Node.js heap memory usage.

**Collection Pattern**:
```typescript
// packages/runtime/src/app-core.ts or monitoring module
setInterval(() => {
  if (process.env['GATI_METRICS'] === '1') {
    const memUsage = process.memoryUsage();
    metrics.recordGauge('gati.system.memory_heap_used', memUsage.heapUsed);
    metrics.recordGauge('gati.system.memory_heap_total', memUsage.heapTotal);
  }
}, 10000); // Every 10 seconds
```

**Alert Thresholds**:
- Warning: Heap used > 80% of total
- Critical: Heap used > 90% of total

---

### Metric: `event_loop_latency`

**Type**: Histogram (milliseconds)  
**Description**: Event loop lag (indicates blocking operations).

**Collection Pattern**:
```typescript
// Using perf_hooks module
import { monitorEventLoopDelay } from 'perf_hooks';

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() => {
  if (process.env['GATI_METRICS'] === '1') {
    metrics.recordHistogram('gati.system.event_loop_latency', h.mean / 1e6); // Convert to ms
  }
  h.reset();
}, 10000);
```

**Target**: <10ms  
**Alert Thresholds**:
- Warning: p95 > 100ms (blocking detected)
- Critical: p95 > 500ms (severe blocking)

---

### Metric: `gc_pause_duration`

**Type**: Histogram (milliseconds)  
**Description**: Garbage collection pause time.

**Collection Pattern**:
```typescript
// Using perf_hooks module
import { PerformanceObserver } from 'perf_hooks';

const obs = new PerformanceObserver((items) => {
  if (process.env['GATI_METRICS'] === '1') {
    items.getEntries().forEach((entry) => {
      if (entry.entryType === 'gc') {
        metrics.recordHistogram('gati.system.gc_pause_duration', entry.duration);
      }
    });
  }
});
obs.observe({ entryTypes: ['gc'] });
```

**Target**: <50ms  
**Alert Thresholds**:
- Warning: p95 > 100ms
- Critical: p95 > 500ms (memory pressure)

---

## Metric Collection Patterns

### Pattern 1: performance.now() Wrapper

```typescript
// packages/runtime/src/utils/metrics.ts
export function measureAsync<T>(
  metricName: string,
  fn: () => Promise<T>,
  labels?: Record<string, string | number>
): Promise<T> {
  const startTime = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - startTime;
    
    if (process.env['GATI_METRICS'] === '1') {
      metrics.recordHistogram(metricName, duration, labels);
    }
  });
}

// Usage
const user = await measureAsync(
  'gati.db.query_time',
  () => db.query('SELECT * FROM users WHERE id = ?', [userId]),
  { operation: 'select', table: 'users' }
);
```

---

### Pattern 2: Histogram Implementation

```typescript
// packages/runtime/src/utils/histogram.ts
export class Histogram {
  private samples: number[] = [];
  
  record(value: number): void {
    this.samples.push(value);
  }
  
  percentile(p: number): number {
    if (this.samples.length === 0) return 0;
    
    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
  
  mean(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }
  
  reset(): void {
    this.samples = [];
  }
}

// Usage
const routingTimeHistogram = new Histogram();
routingTimeHistogram.record(0.3);
routingTimeHistogram.record(0.5);
console.log('p95:', routingTimeHistogram.percentile(95));
```

---

### Pattern 3: Counter Implementation

```typescript
// packages/runtime/src/utils/counter.ts
export class Counter {
  private value = 0;
  
  increment(amount = 1): void {
    this.value += amount;
  }
  
  get(): number {
    return this.value;
  }
  
  reset(): void {
    this.value = 0;
  }
}

// Usage
const cacheHits = new Counter();
cacheHits.increment();
console.log('Cache hits:', cacheHits.get());
```

---

### Pattern 4: Metric Registry

```typescript
// packages/runtime/src/utils/metric-registry.ts
export class MetricRegistry {
  private histograms = new Map<string, Histogram>();
  private counters = new Map<string, Counter>();
  private gauges = new Map<string, number>();
  
  recordHistogram(name: string, value: number, labels?: Record<string, any>): void {
    const key = this.buildKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, new Histogram());
    }
    
    this.histograms.get(key)!.record(value);
  }
  
  incrementCounter(name: string, amount: number, labels?: Record<string, any>): void {
    const key = this.buildKey(name, labels);
    
    if (!this.counters.has(key)) {
      this.counters.set(key, new Counter());
    }
    
    this.counters.get(key)!.increment(amount);
  }
  
  recordGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }
  
  private buildKey(name: string, labels?: Record<string, any>): string {
    if (!labels) return name;
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }
  
  export(): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Export histograms
    this.histograms.forEach((histogram, key) => {
      result[key] = {
        mean: histogram.mean(),
        p50: histogram.percentile(50),
        p95: histogram.percentile(95),
        p99: histogram.percentile(99),
      };
    });
    
    // Export counters
    this.counters.forEach((counter, key) => {
      result[key] = counter.get();
    });
    
    // Export gauges
    this.gauges.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }
}

// Global singleton
export const metrics = new MetricRegistry();
```

---

## Dashboards

### Grafana Dashboard: Request Latency

**Panel 1: Request Latency Percentiles**

```json
{
  "title": "Request Latency (p50, p95, p99)",
  "targets": [
    {
      "expr": "histogram_quantile(0.50, sum(rate(gati_request_total_latency_bucket[5m])) by (le, route))",
      "legendFormat": "{{route}} p50"
    },
    {
      "expr": "histogram_quantile(0.95, sum(rate(gati_request_total_latency_bucket[5m])) by (le, route))",
      "legendFormat": "{{route}} p95"
    },
    {
      "expr": "histogram_quantile(0.99, sum(rate(gati_request_total_latency_bucket[5m])) by (le, route))",
      "legendFormat": "{{route}} p99"
    }
  ],
  "yAxis": {
    "format": "ms",
    "label": "Latency"
  }
}
```

**Panel 2: Request Rate**

```json
{
  "title": "Request Rate (req/s)",
  "targets": [
    {
      "expr": "sum(rate(gati_request_status_code[5m])) by (route, status_code)",
      "legendFormat": "{{route}} {{status_code}}"
    }
  ],
  "yAxis": {
    "format": "ops",
    "label": "Requests/sec"
  }
}
```

**Panel 3: Error Rate**

```json
{
  "title": "Error Rate (%)",
  "targets": [
    {
      "expr": "100 * sum(rate(gati_request_status_code{status_code=~\"5..\"}[5m])) / sum(rate(gati_request_status_code[5m]))",
      "legendFormat": "5xx Error Rate"
    },
    {
      "expr": "100 * sum(rate(gati_request_status_code{status_code=~\"4..\"}[5m])) / sum(rate(gati_request_status_code[5m]))",
      "legendFormat": "4xx Error Rate"
    }
  ],
  "yAxis": {
    "format": "percent",
    "label": "Error %"
  }
}
```

**Panel 4: Resource Utilization**

```json
{
  "title": "Memory & Event Loop",
  "targets": [
    {
      "expr": "100 * gati_system_memory_heap_used / gati_system_memory_heap_total",
      "legendFormat": "Heap Used %"
    },
    {
      "expr": "gati_system_event_loop_latency",
      "legendFormat": "Event Loop Lag (ms)"
    }
  ]
}
```

---

## Alert Rules

### Prometheus Alerting Rules

```yaml
# prometheus/alerts/gati.yml
groups:
  - name: gati_performance
    interval: 30s
    rules:
      # Latency alerts
      - alert: GatiHighLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(gati_request_total_latency_bucket[5m])) by (le, route)
          ) > 200
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High p95 latency on {{ $labels.route }}"
          description: "p95 latency is {{ $value }}ms (threshold: 200ms)"
      
      - alert: GatiCriticalLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(gati_request_total_latency_bucket[5m])) by (le, route)
          ) > 500
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical p95 latency on {{ $labels.route }}"
          description: "p95 latency is {{ $value }}ms (threshold: 500ms)"
      
      # Error rate alerts
      - alert: GatiHighErrorRate
        expr: |
          100 * sum(rate(gati_request_status_code{status_code=~"5.."}[5m])) 
          / sum(rate(gati_request_status_code[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High 5xx error rate"
          description: "5xx error rate is {{ $value }}% (threshold: 1%)"
      
      - alert: GatiCriticalErrorRate
        expr: |
          100 * sum(rate(gati_request_status_code{status_code=~"5.."}[5m])) 
          / sum(rate(gati_request_status_code[5m])) > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical 5xx error rate"
          description: "5xx error rate is {{ $value }}% (threshold: 5%)"
      
      # Memory alerts
      - alert: GatiHighMemoryUsage
        expr: |
          100 * gati_system_memory_heap_used / gati_system_memory_heap_total > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Heap usage is {{ $value }}% (threshold: 80%)"
      
      - alert: GatiCriticalMemoryUsage
        expr: |
          100 * gati_system_memory_heap_used / gati_system_memory_heap_total > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical memory usage"
          description: "Heap usage is {{ $value }}% (threshold: 90%)"
      
      # Event loop alerts
      - alert: GatiEventLoopLag
        expr: |
          histogram_quantile(0.95, 
            sum(rate(gati_system_event_loop_latency_bucket[5m])) by (le)
          ) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Event loop lag detected"
          description: "Event loop lag is {{ $value }}ms (threshold: 100ms)"
      
      - alert: GatiCriticalEventLoopLag
        expr: |
          histogram_quantile(0.95, 
            sum(rate(gati_system_event_loop_latency_bucket[5m])) by (le)
          ) > 500
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical event loop lag"
          description: "Event loop lag is {{ $value }}ms (threshold: 500ms)"
      
      # Database connection pool alerts
      - alert: GatiDBPoolExhausted
        expr: |
          gati_db_connection_pool_active >= gati_db_connection_pool_max
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool exhausted"
          description: "All {{ $value }} connections in use"
```

---

## Platform Integration

### Prometheus Integration

**1. Install Prometheus Exporter**

```typescript
// packages/observability/src/prometheus-exporter.ts
import express from 'express';
import { register, Histogram, Counter, Gauge } from 'prom-client';

export function createPrometheusExporter(port = 9090) {
  const app = express();
  
  // Define metrics
  const requestDuration = new Histogram({
    name: 'gati_request_total_latency',
    help: 'Request duration in milliseconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  });
  
  const requestCount = new Counter({
    name: 'gati_request_status_code',
    help: 'HTTP status code count',
    labelNames: ['method', 'route', 'status_code'],
  });
  
  const memoryUsage = new Gauge({
    name: 'gati_system_memory_heap_used',
    help: 'Heap memory used in bytes',
  });
  
  // Update memory metric every 10s
  setInterval(() => {
    memoryUsage.set(process.memoryUsage().heapUsed);
  }, 10000);
  
  // Expose metrics endpoint
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  
  app.listen(port, () => {
    console.log(`Prometheus metrics exposed on :${port}/metrics`);
  });
  
  return { requestDuration, requestCount, memoryUsage };
}
```

**2. Configure Prometheus Scrape**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'gati-app'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:9090']
```

---

### OpenTelemetry Integration

**1. Install OpenTelemetry SDK**

```bash
pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

**2. Configure Tracing**

```typescript
// packages/observability/src/otel-setup.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initializeOpenTelemetry() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
    serviceName: 'gati-app',
  });
  
  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown().then(
      () => console.log('OpenTelemetry shut down'),
      (err) => console.error('Error shutting down OpenTelemetry', err)
    );
  });
}
```

**3. Custom Spans**

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('gati-handler');

export const handler: Handler = async (req, res, gctx, lctx) => {
  const span = tracer.startSpan('getUserHandler', {
    attributes: {
      'http.method': req.method,
      'http.route': req.path,
      'user.id': req.params.id,
    },
  });
  
  try {
    const user = await gctx.modules['database']?.findUser(req.params.id);
    span.setAttribute('user.found', !!user);
    res.json({ user });
  } catch (error) {
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
};
```

---

### Datadog Integration

**1. Install Datadog APM**

```bash
pnpm add dd-trace
```

**2. Initialize Tracer**

```typescript
// gati.config.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'gati-app',
  env: process.env['NODE_ENV'] || 'development',
  logInjection: true,
});

export default {
  // ... Gati config
};
```

**3. Custom Metrics**

```typescript
import { metrics } from 'dd-trace';

metrics.gauge('gati.request.latency', duration, {
  route: req.path,
  method: req.method,
});

metrics.increment('gati.request.count', 1, {
  status_code: res.statusCode,
});
```

---

### AWS CloudWatch Integration

**1. Install AWS SDK**

```bash
pnpm add @aws-sdk/client-cloudwatch
```

**2. Publish Custom Metrics**

```typescript
// packages/observability/src/cloudwatch-publisher.ts
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const client = new CloudWatchClient({ region: process.env['AWS_REGION'] || 'us-east-1' });

export async function publishMetric(
  metricName: string,
  value: number,
  unit: 'Milliseconds' | 'Count' | 'Percent' = 'Milliseconds',
  dimensions: Record<string, string> = {}
) {
  const command = new PutMetricDataCommand({
    Namespace: 'Gati/Application',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
      },
    ],
  });
  
  await client.send(command);
}

// Usage
await publishMetric('RequestLatency', duration, 'Milliseconds', { Route: req.path });
```

**3. CloudWatch Alarms**

```typescript
import { CloudWatchClient, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';

const command = new PutMetricAlarmCommand({
  AlarmName: 'GatiHighLatency',
  MetricName: 'RequestLatency',
  Namespace: 'Gati/Application',
  Statistic: 'Average',
  Period: 300, // 5 minutes
  EvaluationPeriods: 2,
  Threshold: 200,
  ComparisonOperator: 'GreaterThanThreshold',
  ActionsEnabled: true,
  AlarmActions: [process.env['SNS_TOPIC_ARN']],
});

await client.send(command);
```

---

## Troubleshooting

### Issue: High Latency (p95 > 200ms)

**Diagnosis Steps**:

1. **Check layer breakdown**:
   ```promql
   # Which layer is slow?
   gati_routing_lookup_time  # Layer 2
   gati_middleware_execution_time  # Layer 6
   gati_validation_input_time + gati_validation_output_time  # Layers 6/8
   gati_handler_execution_time  # Layer 8
   gati_db_query_time  # Layer 9
   ```

2. **Identify bottleneck**:
   - Routing >1ms → Too many routes or complex patterns
   - Middleware >5ms → Expensive middleware (auth, validation)
   - Validation >1ms → Complex schemas or inefficient validators
   - Handler variable → Business logic, database, external APIs
   - DB query >100ms → Slow queries, missing indexes, connection pool exhaustion

3. **Common Fixes**:
   - Routing: Reduce route count, simplify patterns
   - Middleware: Cache auth results, use Redis for sessions
   - Validation: Optimize schemas, use compiled validators
   - Handler: Add database indexes, cache external API calls
   - Database: Optimize queries, increase connection pool size

---

### Issue: High Memory Usage (>80%)

**Diagnosis Steps**:

1. **Check heap growth**:
   ```typescript
   setInterval(() => {
     const mem = process.memoryUsage();
     console.log('Heap:', (mem.heapUsed / 1024 / 1024).toFixed(2), 'MB');
   }, 5000);
   ```

2. **Identify leaks**:
   - Unclosed database connections
   - Event listener accumulation
   - Large in-memory caches
   - Unreleased closures in long-lived contexts

3. **Common Fixes**:
   - Ensure `lctx.lifecycle.executeCleanup()` runs
   - Limit cache sizes (LRU eviction)
   - Use database connection pooling
   - Remove unused event listeners
   - Enable GC logging: `node --trace-gc app.js`

---

### Issue: Event Loop Lag (>100ms)

**Diagnosis Steps**:

1. **Identify blocking operations**:
   - Synchronous file I/O
   - Heavy CPU computation (crypto, JSON parsing)
   - Infinite loops or long-running synchronous code

2. **Use profiling**:
   ```bash
   node --prof app.js
   node --prof-process isolate-*.log > processed.txt
   ```

3. **Common Fixes**:
   - Use async file operations (`fs.promises`)
   - Offload CPU work to worker threads
   - Break long loops with `setImmediate()`
   - Use streaming parsers for large JSON

---

### Issue: Database Connection Pool Exhausted

**Diagnosis Steps**:

1. **Check pool metrics**:
   ```promql
   gati_db_connection_pool_active
   gati_db_connection_pool_idle
   gati_db_connection_time  # Should be <10ms
   ```

2. **Identify causes**:
   - Connections not released (missing `finally` blocks)
   - Pool size too small for request volume
   - Long-running transactions blocking pool

3. **Common Fixes**:
   - Ensure connections released in `finally`
   - Increase pool size (but watch for database limits)
   - Use read replicas for read-heavy workloads
   - Implement connection timeout and retry logic

---

## Summary

Gati's observability stack provides comprehensive insights into application performance across all 10 architectural layers:

- **18 per-request metrics** track request flow from routing to external APIs
- **6 system metrics** monitor Node.js health and resource usage
- **Opt-in collection** via `GATI_METRICS=1` prevents production overhead
- **Multi-platform support** for Prometheus, OpenTelemetry, Datadog, CloudWatch
- **Pre-configured dashboards** and alert rules for immediate value

**Next Steps**:
- Implement metric collection in runtime packages (see [Runtime Instrumentation Guide](./instrumentation.md))
- Set up Prometheus/Grafana stack for local development
- Configure alerts for production deployments
- Review [Performance Guide](./performance.md) for optimization techniques

**References**:
- [Performance Guide](./performance.md) - Latency budgets and optimization
- [Benchmarking Guide](./benchmarking.md) - Micro-benchmark specifications
- [Architecture Overview](../architecture/overview.md) - 10-layer architecture model
- [Runtime Instrumentation Guide](./instrumentation.md) - Implementation details (next)
