# Gati Performance Guide

This guide provides performance budgets, optimization strategies, and monitoring guidance for building high-performance Gati applications.

## Table of Contents

- [Performance Model](#performance-model)
- [Latency Budgets](#latency-budgets)
- [Layer-by-Layer Analysis](#layer-by-layer-analysis)
- [Optimization Strategies](#optimization-strategies)
- [Service Level Objectives (SLOs)](#service-level-objectives-slos)
- [Monitoring & Instrumentation](#monitoring--instrumentation)
- [Troubleshooting Performance Issues](#troubleshooting-performance-issues)

---

## Performance Model

### Request Flow & Timing

A typical Gati API request flows through multiple layers. Understanding the performance characteristics of each layer helps identify bottlenecks and optimize critical paths.

```
Client Request
    ↓
Protocol Adapter (HTTP/WS/RPC)     [0.5-2 ms]
    ↓
Route Resolution                    [0.1-0.5 ms]
    ↓
Middleware Chain                    [0.5-4 ms]
    ↓
Input Validation                    [0.1-2 ms]
    ↓
Handler Business Logic              [1-10 ms]
    ↓
Database Query                      [5-80+ ms] ← Dominant cost
    ↓
Output Validation (optional)        [0.1-2 ms]
    ↓
Response Serialization              [0.2-5 ms]
    ↓
Client Response
```

**Total Budget**: 7-100+ ms (95th percentile target: **<100 ms**)

---

## Latency Budgets

### Per-Request Budget (Typical Web API)

Assumes:
- Input validation
- 1 database read or write
- Minimal business logic

| Layer | Target (ms) | Notes |
|-------|------------|-------|
| Protocol adapter + routing | 0.5 - 2 | In-memory route lookup |
| Middleware chain | 0.5 - 4 | Auth, CORS, tracing |
| Input validation | 0.1 - 2 | Compiled validators |
| Handler logic | 1 - 10 | Business code |
| Database I/O | 5 - 80+ | Network + execution |
| Output validation | 0.1 - 2 | Optional response check |
| Serialization | 0.2 - 5 | JSON.stringify |
| **Total** | **~7 - 100+** | DB dominates in most cases |

### Percentile Targets

- **P50**: < 30 ms
- **P95**: < 100 ms
- **P99**: < 300 ms

> **Note**: Database I/O typically dominates latency. The runtime and validation overhead should be sub-millisecond to single-digit milliseconds.

---

## Layer-by-Layer Analysis

### 1. File-Based Router & Route Loader

**Performance Characteristics**:
- **Complexity**: O(#files) on initial scan; O(1) route lookup at runtime
- **Hot-path cost**: Route resolution via trie/hash map
- **Target**: < 0.2 ms per route lookup

**Bottlenecks**:
- Cold startup when scanning thousands of route files
- File watching overhead in development mode

**Optimizations**:
- ✅ Build fast route trie at startup
- ✅ Cache route metadata in memory
- ✅ Use incremental file watchers (chokidar)
- ✅ Precompute route metadata in production builds
- ✅ Warm start from serialized route cache

**Benchmark Target**: Route lookup + handler dispatch < 0.5 ms

---

### 2. Gati Analyzer & Type Registry

**Performance Characteristics**:
- **Role**: Heavy but offline/infrequent (runs in dev watch mode)
- **Complexity**: 
  - Full analysis: O(N types + AST complexity)
  - Incremental: O(changed files + dependents)
- **Target**: 
  - Incremental reanalysis: **< 100 ms** for small edits
  - Full reanalysis: Seconds for large monorepos

**Bottlenecks**:
- TypeScript compiler startup/parse overhead
- Complex recursive types, large union intersections
- Deep dependency graphs requiring re-analysis

**Optimizations**:
- ✅ Use TypeScript language service incremental API
- ✅ Cache ASTs and resolved types
- ✅ Perform targeted re-analysis for import-dependent files only
- ✅ Offload heavy tasks to worker threads/process pool
- ✅ Use binary cache (serialized schema) to speed restarts
- ✅ Debounce file change events (500ms default)

**Benchmark Target**: Incremental analysis for single endpoint edit: 30-150ms

---

### 3. Artifact Generators (Validators, TypeScript, SQL)

**Performance Characteristics**:
- **Complexity**: Linear in size of type tree
- **Runtime cost**: Validator execution should be O(N) in fields with small constants
- **Target**:
  - Simple objects (3-10 fields): **< 0.1 ms**
  - Nested objects (depth 3-5): **0.2-1 ms**
  - Large arrays (100 items): Tens of ms depending on checks

**Bottlenecks**:
- Deep recursion without tail optimization
- Large arrays or big JSON bodies
- Generic reflection-based validation

**Optimizations**:
- ✅ Compile validators to imperative code (no reflection)
- ✅ Inline common checks (type, null, bounds)
- ✅ Use SIMD-friendly algorithms for unique/dedupe
- ✅ Provide streaming/chunked validation for huge payloads
- ✅ Cache compiled validators in memory

**Benchmark Target**: 2-5× faster than Zod for common shapes; ~0.1-1 ms per validation

---

### 4. Protocol Gateways & Serialization

**Performance Characteristics**:
- **Complexity**: Low - parse headers, parse JSON/body
- **Latency**:
  - JSON parse (1 KB body): ~0.02-0.2 ms
  - Large bodies (100 KB): 2-6 ms
- **Target**: < 2 ms for typical small bodies (< 5 KB)

**Bottlenecks**:
- JSON parsing for large payloads
- Sync parsing blocking event loop

**Optimizations**:
- ✅ Use streaming parsers for large bodies
- ✅ Limit max body size; reject excessive requests
- ✅ Use native `JSON.parse` (fast in modern V8)
- ✅ Offload heavy parsing to worker threads if needed

---

### 5. Middleware Chain

**Performance Characteristics**:
- **Complexity**: Linear in number of middlewares
- **Latency per middleware**:
  - Lightweight (header checks): ~0.05-0.5 ms
  - Heavy (DB lookups): 1-10+ ms
- **Target**: Total middleware overhead < 5 ms for common stacks

**Bottlenecks**:
- Middlewares performing I/O synchronously
- Redundant session/auth lookups

**Optimizations**:
- ✅ Keep lightweight work on middleware (decode tokens locally)
- ✅ Use cache for sessions (Redis)
- ✅ Pre-warm caches and connection pools
- ✅ Compose middlewares to minimize duplication
- ✅ Parallelize independent async work (Promise.all)

**Instrumentation**:
- Per-middleware latency histogram
- Count of middleware runs and failures

---

### 6. Handler Execution Engine

**Performance Characteristics**:
- **Complexity**: Handler code-dependent
- **Overhead**:
  - Minimal handler (no DB): < 0.5-2 ms
  - Handler wiring (ctx preparation): ~0.2-1 ms
- **Target**: Handler invocation overhead < 1 ms

**Bottlenecks**:
- Deep copying context objects
- Heavy synchronous operations in handlers

**Optimizations**:
- ✅ Avoid deep copying ctx; use shallow copies
- ✅ Avoid heavy synchronous operations
- ✅ Provide lightweight helper libs for common DB ops
- ✅ Use async/await properly (avoid blocking)

---

### 7. Database Layer

**Performance Characteristics**:
- **Dominant cost** in most endpoints
- **Latency depends heavily on DB**:
  - Local cache / in-memory: < 1 ms
  - Single-row Postgres read (local network): 2-10 ms
  - Single-row Postgres write (commit): 5-50 ms
  - MongoDB single document read: 2-10 ms
- **Target**: < 50 ms for 95th percentile

**Bottlenecks**:
- Network latency to database
- Query complexity (missing indexes, sequential scans)
- Connection pool exhaustion
- Lock contention

**Optimizations**:
- ✅ Use prepared statements, connection pooling, batching
- ✅ Use read replicas for read-heavy workloads
- ✅ Use caching (Redis) for hotspot reads
- ✅ Use bulk writes for many items
- ✅ Optimize indices and schema
- ✅ Monitor slow query logs

**Benchmark Target**: Minimize DB calls per request (1-2 calls ideal)

---

## Optimization Strategies

### Practical Optimization Checklist

When you hit performance limits, follow this checklist:

1. **Profile First**
   - Use flamegraphs (clinic.js, 0x) to find hot functions
   - Identify actual bottlenecks before optimizing

2. **Reduce Validator Complexity**
   - Simplify checks for hot paths
   - Use lean serializers
   - Cache validation results where appropriate

3. **Add Strategic Caching**
   - Cache expensive derived data
   - Use Redis for shared state
   - Implement in-memory LRU caches for frequently accessed data

4. **Optimize Database Access**
   - Batch queries and reduce round trips
   - Add read replicas for read-heavy workloads
   - Use connection pooling (PgBouncer for Postgres)
   - Add indexes for common query patterns

5. **Offload Heavy Work**
   - Move analyzer/validator generation to background workers
   - Use worker threads for heavy CPU tasks
   - Consider async processing for non-critical paths

6. **Tune Node.js Runtime**
   - Adjust GC settings (`--max-old-space-size`)
   - Reduce large transient allocations
   - Monitor event loop latency

7. **Network Optimizations**
   - Use HTTP/2 or keep-alive
   - Enable compression at reverse proxy level
   - Consider CDN for static assets

8. **Scale Horizontally**
   - Add stateless server instances
   - Use load balancer
   - Maintain appropriate connection pool sizes per instance

---

## Service Level Objectives (SLOs)

### Suggested Production SLOs

| Metric | Target | Notes |
|--------|--------|-------|
| **Availability** | 99.95% | ~22 minutes downtime/month |
| **P50 Latency** | < 30 ms | Median response time |
| **P95 Latency** | < 100 ms | 95th percentile |
| **P99 Latency** | < 300 ms | 99th percentile |
| **Error Rate** | < 0.1% | Application errors only |
| **Analyzer Incremental** | < 150 ms | Dev mode, small edits |
| **Validator Generation** | < 50 ms | Per type |

### Capacity Planning

**Horizontal Scaling**:
- Deploy stateless server instances
- Scale by adding workers behind load balancer
- Maintain appropriate connection pool size per instance
- Use connection pooling proxies (PgBouncer) for many instances

**Concurrency Model**:
- Node.js event loop best for many lightweight requests
- Offload heavy CPU work to worker threads
- Consider clustering for multi-core utilization

**Caching Strategy**:
- Session lookups → Redis
- Feature flags → In-memory LRU
- Authentication token introspection → Short-lived cache
- Compiled validators → In-memory (per process)

**Fault Tolerance**:
- Circuit breakers around DB & external services
- Graceful degradation with cached stale data
- Retries + idempotency on writes
- Timeout all external calls

---

## Monitoring & Instrumentation

### Per-Request Metrics

Collect for every request:

| Metric | Description | Use Case |
|--------|-------------|----------|
| `request.total_latency` | End-to-end time | SLO tracking |
| `request.middleware_latency` | Per-middleware time | Identify slow middleware |
| `request.validation_input` | Input validation time | Validator performance |
| `request.validation_output` | Output validation time | Response overhead |
| `request.handler_execution` | Handler code time | Business logic cost |
| `request.db_time` | Database query time | DB bottleneck tracking |
| `request.bytes_in` | Request body size | Bandwidth tracking |
| `request.bytes_out` | Response body size | Bandwidth tracking |
| `request.status_code` | HTTP status | Error rate monitoring |
| `request.rate` | Requests per second | Throughput |

### System Metrics

Monitor at system level:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `analyzer.recompile_time` | Analyzer recompile duration | > 500ms in dev |
| `validator.generation_time` | Validator compilation time | > 100ms per type |
| `validator.cache_size` | Compiled validators in memory | N/A (monitor trend) |
| `process.memory_heap` | Heap usage per process | > 80% of limit |
| `process.event_loop_latency` | Event loop delay | > 50ms |
| `process.gc_pause` | Garbage collection pauses | > 100ms |

### Database Metrics

Track database performance:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `db.connections_active` | Active connections | > 80% of pool |
| `db.connections_idle` | Idle connections | N/A |
| `db.query_slow` | Queries > threshold | Any query > 1s |
| `db.locks_waiting` | Queries waiting on locks | > 5 concurrent |
| `db.throughput` | Queries per second | N/A (capacity planning) |

### Dashboards & Alerts

**Critical Alerts**:
- P95 latency > 200ms for 5 minutes
- Error rate > 1% for 5 minutes
- Database connection pool exhausted
- Event loop latency > 100ms

**Monitoring Dashboards**:
- Request latency percentiles (p50/p95/p99)
- Error rates by endpoint
- Throughput (RPS) by endpoint
- Database query performance
- Memory and CPU utilization
- Middleware performance breakdown

---

## Troubleshooting Performance Issues

### High Latency

**Symptoms**: P95/P99 latency exceeding targets

**Diagnosis**:
1. Check database query times (usually the culprit)
2. Review slow query logs
3. Profile request traces to identify bottleneck layer
4. Check for missing database indexes

**Solutions**:
- Add database indexes
- Optimize N+1 query patterns
- Add caching layer
- Scale database (read replicas)

### High Error Rate

**Symptoms**: Elevated 5xx response codes

**Diagnosis**:
1. Check application logs for errors
2. Review database connection pool status
3. Check external service timeouts
4. Monitor memory usage (OOM errors)

**Solutions**:
- Increase database connection pool
- Add circuit breakers for external services
- Increase timeout thresholds where appropriate
- Scale horizontally to reduce per-instance load

### Memory Leaks

**Symptoms**: Gradual memory growth, eventual OOM

**Diagnosis**:
1. Take heap snapshots over time
2. Use memory profiler (clinic.js, heapdump)
3. Check for unbounded caches
4. Review event listener cleanup

**Solutions**:
- Implement cache eviction policies (LRU)
- Clean up event listeners in lifecycle hooks
- Use weak references where appropriate
- Implement request-scoped cleanup

### Slow Development Server

**Symptoms**: Slow hot reload, analyzer taking too long

**Diagnosis**:
1. Check analyzer incremental time
2. Review file watcher events
3. Check for type complexity issues
4. Monitor CPU usage during analysis

**Solutions**:
- Increase debounce time (default 500ms)
- Simplify complex type definitions
- Use incremental TypeScript compilation
- Split large files into smaller modules

---

## Best Practices

### Do's

✅ **Profile before optimizing** - Measure to find actual bottlenecks  
✅ **Cache aggressively** - But with appropriate TTLs  
✅ **Use async/await properly** - Avoid blocking the event loop  
✅ **Batch database operations** - Reduce round trips  
✅ **Monitor continuously** - Set up alerts and dashboards  
✅ **Load test regularly** - Find breaking points before production  
✅ **Keep validators simple** - Complex validation hurts performance  
✅ **Use connection pooling** - Reuse database connections  

### Don'ts

❌ **Don't guess at bottlenecks** - Always profile first  
❌ **Don't over-cache** - Stale data can cause bugs  
❌ **Don't ignore event loop** - Monitor and keep it responsive  
❌ **Don't skip indexes** - Database performance depends on them  
❌ **Don't block on I/O** - Use async operations  
❌ **Don't deep copy unnecessarily** - Shallow copies are usually enough  
❌ **Don't skip error handling** - Failed requests still consume resources  
❌ **Don't forget cleanup** - Release resources in lifecycle hooks  

---

## Related Documentation

- [Benchmarking Guide](./benchmarking.md) - Running micro-benchmarks and load tests
- [Observability Guide](./observability.md) - Monitoring and tracing setup
- [Architecture Overview](../architecture/overview.md) - System architecture details
- [Handler Development](./handlers.md) - Writing efficient handlers
- [Middleware Guide](./middleware.md) - Optimizing middleware chains
- [Context Guide](./context.md) - Understanding context lifecycle

---

**Last Updated**: November 19, 2025  
**Maintainer**: Gati Framework Team
