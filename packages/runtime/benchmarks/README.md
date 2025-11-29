# Runtime Benchmarks

Performance benchmarks for the Gati runtime.

## Running Benchmarks

```bash
# Run all benchmarks
pnpm bench

# Run specific benchmark
pnpm bench microbenchmarks

# Run with iterations
pnpm bench --iterations 1000
```

## Benchmark Suites

### Microbenchmarks (`microbenchmarks.bench.ts`)
Component-level performance tests:
- Route matching
- Context creation
- Hook execution
- GType validation

### Integration (`integration.bench.ts`)
Full pipeline performance tests:
- Simple handler
- Handler with module access
- Handler with lifecycle hooks

## Interpreting Results

```
✓ Route Matching > simple route 0.08ms
✓ Route Matching > nested route 0.12ms
✓ Context Creation > LocalContext creation 0.45ms
```

**Target Metrics:**
- Route matching: <0.1ms
- Context creation: <0.5ms
- Hook execution: <1ms
- Simple handler E2E: <5ms

## CI Integration

Benchmarks run on every PR to detect performance regressions.
Alert threshold: 50% slower than baseline.

## See Also

- [BENCHMARKING_STRATEGY.md](../BENCHMARKING_STRATEGY.md) - Full strategy
- [Performance Guide](../docs/PERFORMANCE.md) - Optimization tips
