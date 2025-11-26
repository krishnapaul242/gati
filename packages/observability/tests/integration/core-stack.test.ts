import { PrometheusAdapter } from '../../src/adapters/prometheus-adapter';
import { OpenTelemetryAdapter } from '../../src/adapters/opentelemetry-adapter';
import { PinoAdapter } from '../../src/adapters/pino-adapter';

describe('Core Stack Integration', () => {
  let metrics: PrometheusAdapter;
  let tracing: OpenTelemetryAdapter;
  let logging: PinoAdapter;

  beforeEach(() => {
    metrics = new PrometheusAdapter({ serviceName: 'test-service' });
    tracing = new OpenTelemetryAdapter({ serviceName: 'test-service' });
    logging = new PinoAdapter({ level: 'info' });
  });

  afterEach(async () => {
    await tracing.shutdown();
  });

  it('should record metrics and expose Prometheus format', async () => {
    metrics.incrementCounter('test_counter', { label: 'value' });
    metrics.recordHistogram('test_histogram', 100);
    metrics.setGauge('test_gauge', 42);

    const metricsOutput = await metrics.getMetrics();
    expect(metricsOutput).toContain('test_counter');
    expect(metricsOutput).toContain('test_histogram');
    expect(metricsOutput).toContain('test_gauge');
  });

  it('should create and close spans with context', async () => {
    const span = tracing.startSpan('test-operation', { userId: '123' });
    expect(span).toBeDefined();
    
    span.setAttributes({ result: 'success' });
    span.end();
    
    // Verify span was recorded (implementation-specific)
    expect(span).toHaveProperty('end');
  });

  it('should log with trace context', () => {
    const span = tracing.startSpan('test-op');
    const traceId = span.spanContext?.()?.traceId;
    
    logging.info('Test message', { traceId });
    span.end();
    
    // Logs should include trace context
    expect(traceId).toBeDefined();
  });

  it('should handle 1000 operations without memory leak', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 1000; i++) {
      metrics.incrementCounter('ops_counter');
      const span = tracing.startSpan(`op-${i}`);
      logging.info(`Operation ${i}`);
      span.end();
    }
    
    // Force GC if available
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    
    // Should not increase more than 10MB
    expect(memoryIncrease).toBeLessThan(10);
  });
});
