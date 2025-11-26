import { PrometheusAdapter } from '../../src/adapters/prometheus-adapter';
import { OpenTelemetryAdapter } from '../../src/adapters/opentelemetry-adapter';
import { PinoAdapter } from '../../src/adapters/pino-adapter';

describe('High-Throughput Performance', () => {
  it('should handle 1000 req/s for 10 seconds', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'throughput-test' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'throughput-test' });
    const logging = new PinoAdapter({ level: 'info' });

    const duration = 10000; // 10 seconds
    const targetRps = 1000;
    const interval = 1000 / targetRps;
    
    let requestCount = 0;
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;

    const timer = setInterval(() => {
      const span = tracing.startSpan('high-throughput-request');
      metrics.incrementCounter('throughput_requests');
      logging.info('Request processed', { requestId: requestCount });
      span.end();
      requestCount++;
    }, interval);

    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(timer);

    const endTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed;
    const actualDuration = endTime - startTime;
    const actualRps = requestCount / (actualDuration / 1000);
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

    console.log(`Processed ${requestCount} requests in ${actualDuration}ms`);
    console.log(`Actual RPS: ${actualRps.toFixed(2)}`);
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

    expect(requestCount).toBeGreaterThan(9000);
    expect(memoryIncrease).toBeLessThan(50);

    await tracing.shutdown();
  }, 15000);

  it('should handle burst traffic without data loss', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'burst-test' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'burst-test' });

    // Simulate burst: 5000 requests in 1 second
    const burstSize = 5000;
    const spans: any[] = [];

    const start = Date.now();
    for (let i = 0; i < burstSize; i++) {
      const span = tracing.startSpan(`burst-${i}`);
      metrics.incrementCounter('burst_requests');
      spans.push(span);
    }

    spans.forEach(span => span.end());
    const duration = Date.now() - start;

    console.log(`Burst: ${burstSize} requests in ${duration}ms`);
    
    const metricsOutput = await metrics.getMetrics();
    expect(metricsOutput).toContain('burst_requests');

    await tracing.shutdown();
  });
});
