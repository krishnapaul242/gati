import { PrometheusAdapter } from '../../src/adapters/prometheus-adapter';
import { OpenTelemetryAdapter } from '../../src/adapters/opentelemetry-adapter';
import { PinoAdapter } from '../../src/adapters/pino-adapter';

describe('Mixed Providers Integration', () => {
  it('should work with different providers per concern', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'mixed-test' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'mixed-test' });
    const logging = new PinoAdapter({ level: 'info' });

    // Simulate request handling
    const startTime = Date.now();
    const span = tracing.startSpan('http-request');
    
    metrics.incrementCounter('http_requests_total', { method: 'GET' });
    logging.info('Request received', { method: 'GET', path: '/api/test' });
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const duration = Date.now() - startTime;
    metrics.recordHistogram('http_request_duration_ms', duration);
    
    span.end();
    logging.info('Request completed', { duration });

    // Verify no conflicts
    const metricsOutput = await metrics.getMetrics();
    expect(metricsOutput).toContain('http_requests_total');
    expect(metricsOutput).toContain('http_request_duration_ms');

    await tracing.shutdown();
  });

  it('should maintain data isolation between providers', async () => {
    const metrics1 = new PrometheusAdapter({ serviceName: 'service-1' });
    const metrics2 = new PrometheusAdapter({ serviceName: 'service-2' });

    metrics1.incrementCounter('requests', { service: 'service-1' });
    metrics2.incrementCounter('requests', { service: 'service-2' });

    const output1 = await metrics1.getMetrics();
    const output2 = await metrics2.getMetrics();

    expect(output1).toContain('service-1');
    expect(output2).toContain('service-2');
  });

  it('should have acceptable overhead (<5ms per operation)', async () => {
    const metrics = new PrometheusAdapter({ serviceName: 'perf-test' });
    const tracing = new OpenTelemetryAdapter({ serviceName: 'perf-test' });
    const logging = new PinoAdapter({ level: 'info' });

    const iterations = 100;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      const span = tracing.startSpan('operation');
      metrics.incrementCounter('operations');
      logging.info('Operation executed');
      span.end();
    }

    const duration = Date.now() - start;
    const avgOverhead = duration / iterations;

    expect(avgOverhead).toBeLessThan(5);

    await tracing.shutdown();
  });
});
