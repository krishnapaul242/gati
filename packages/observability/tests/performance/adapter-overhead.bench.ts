import { PrometheusAdapter } from '../../src/adapters/prometheus-adapter';
import { OpenTelemetryAdapter } from '../../src/adapters/opentelemetry-adapter';
import { PinoAdapter } from '../../src/adapters/pino-adapter';

describe('Adapter Overhead Benchmarks', () => {
  const iterations = 10000;

  it('baseline: no observability', () => {
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const data = { iteration: i, timestamp: Date.now() };
      // No-op
    }
    
    const duration = Date.now() - start;
    console.log(`Baseline: ${duration}ms for ${iterations} ops (${(duration/iterations).toFixed(3)}ms/op)`);
  });

  it('prometheus metrics recording', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'bench' });
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      metrics.incrementCounter('bench_counter');
    }
    
    const duration = Date.now() - start;
    const overhead = duration / iterations;
    
    console.log(`Prometheus: ${duration}ms for ${iterations} ops (${overhead.toFixed(3)}ms/op)`);
    expect(overhead).toBeLessThan(1);
  });

  it('opentelemetry span creation', async () => {
    const tracing = new OpenTelemetryAdapter({ serviceName: 'bench' });
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const span = tracing.startSpan('bench-op');
      span.end();
    }
    
    const duration = Date.now() - start;
    const overhead = duration / iterations;
    
    console.log(`OpenTelemetry: ${duration}ms for ${iterations} ops (${overhead.toFixed(3)}ms/op)`);
    expect(overhead).toBeLessThan(1);
    
    await tracing.shutdown();
  });

  it('pino logging', () => {
    const logging = new PinoAdapter({ level: 'info' });
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      logging.info('Benchmark message', { iteration: i });
    }
    
    const duration = Date.now() - start;
    const overhead = duration / iterations;
    
    console.log(`Pino: ${duration}ms for ${iterations} ops (${overhead.toFixed(3)}ms/op)`);
    expect(overhead).toBeLessThan(1);
  });

  it('combined stack', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'bench' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'bench' });
    const logging = new PinoAdapter({ level: 'info' });
    
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const span = tracing.startSpan('combined-op');
      metrics.incrementCounter('combined_ops');
      logging.info('Operation', { iteration: i });
      span.end();
    }
    
    const duration = Date.now() - start;
    const overhead = duration / iterations;
    
    console.log(`Combined: ${duration}ms for ${iterations} ops (${overhead.toFixed(3)}ms/op)`);
    expect(overhead).toBeLessThan(5);
    
    await tracing.shutdown();
  });
});
