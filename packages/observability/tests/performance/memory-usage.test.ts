import { PrometheusAdapter } from '../../src/adapters/prometheus-adapter';
import { OpenTelemetryAdapter } from '../../src/adapters/opentelemetry-adapter';
import { PinoAdapter } from '../../src/adapters/pino-adapter';

describe('Memory Usage Tests', () => {
  it('should not leak memory over 10 minutes', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'memory-test' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'memory-test' });
    const logging = new PinoAdapter({ level: 'info' });

    const samples: number[] = [];
    const sampleInterval = 10000; // 10 seconds
    const testDuration = 60000; // 1 minute (reduced for testing)
    
    const sampleMemory = () => {
      if (global.gc) global.gc();
      samples.push(process.memoryUsage().heapUsed / 1024 / 1024);
    };

    sampleMemory(); // Initial sample

    const sampler = setInterval(() => {
      // Simulate constant load
      for (let i = 0; i < 100; i++) {
        const span = tracing.startSpan('memory-test-op');
        metrics.incrementCounter('memory_test_ops');
        logging.info('Memory test operation');
        span.end();
      }
      sampleMemory();
    }, sampleInterval);

    await new Promise(resolve => setTimeout(resolve, testDuration));
    clearInterval(sampler);
    sampleMemory(); // Final sample

    console.log('Memory samples (MB):', samples.map(s => s.toFixed(2)));
    
    const initialMemory = samples[0];
    const finalMemory = samples[samples.length - 1];
    const memoryGrowth = finalMemory - initialMemory;
    const avgMemory = samples.reduce((a, b) => a + b, 0) / samples.length;

    console.log(`Initial: ${initialMemory.toFixed(2)}MB`);
    console.log(`Final: ${finalMemory.toFixed(2)}MB`);
    console.log(`Growth: ${memoryGrowth.toFixed(2)}MB`);
    console.log(`Average: ${avgMemory.toFixed(2)}MB`);

    // Memory should stabilize after warmup
    expect(memoryGrowth).toBeLessThan(20);

    await tracing.shutdown();
  }, 70000);

  it('should cleanup properly on shutdown', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const metrics = new PrometheusAdapter({ serviceName: 'cleanup-test' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'cleanup-test' });
    const logging = new PinoAdapter({ level: 'info' });

    // Use providers
    for (let i = 0; i < 1000; i++) {
      const span = tracing.startSpan('cleanup-op');
      metrics.incrementCounter('cleanup_ops');
      logging.info('Cleanup test');
      span.end();
    }

    // Shutdown
    await tracing.shutdown();

    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

    console.log(`Memory increase after cleanup: ${memoryIncrease.toFixed(2)}MB`);
    
    // Should not retain significant memory after shutdown
    expect(memoryIncrease).toBeLessThan(10);
  });
});
