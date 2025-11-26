# Observability Performance Guide

Performance characteristics and optimization guidelines for Gati's observability system.

## Overhead Benchmarks

### Per-Operation Overhead (p95)

| Provider | Metrics | Tracing | Logging | Combined |
|----------|---------|---------|---------|----------|
| Prometheus + OTel + Pino | <0.1ms | <0.5ms | <0.1ms | <1ms |
| CloudWatch + X-Ray | <1ms | <2ms | <1ms | <3ms |
| Datadog | <0.5ms | <1ms | <0.5ms | <2ms |

### Memory Usage

| Stack | Baseline | Per 10k Ops | Steady State |
|-------|----------|-------------|--------------|
| Core (Prom+OTel+Pino) | ~50MB | +5MB | ~60MB |
| AWS (CW+X-Ray) | ~60MB | +8MB | ~75MB |

## Performance Targets

- **p95 Latency**: <1ms overhead per request
- **Throughput**: 1,000+ requests/second sustained
- **Memory Growth**: <10MB per 10k operations
- **No memory leaks**: Stable over 24+ hours

## Optimization Tips

### Metrics
```typescript
// ✅ Good: Bounded labels
metrics.incrementCounter('requests', { userType: getUserType(req.userId) });

// ❌ Bad: Unbounded labels
metrics.incrementCounter('requests', { userId: req.userId });
```

### Tracing
```typescript
// Sample high-frequency operations
const tracing = new OpenTelemetryAdapter({
  serviceName: 'app',
  samplingRate: 0.1, // 10% sampling
});
```

### Logging
```typescript
// Use appropriate log levels
const logging = new PinoAdapter({ 
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' 
});
```

## Production Recommendations

| Scale | Stack | Cost/Month | Overhead |
|-------|-------|------------|----------|
| Startup | Self-hosted | $0 | <1ms |
| Growth | Prom + Jaeger + Sentry | $26 | <2ms |
| Scale | CloudWatch + X-Ray | $100-500 | <3ms |
| Enterprise | Datadog/New Relic | $500-5000 | <2ms |

## Benchmarking

```bash
pnpm test:performance
```
