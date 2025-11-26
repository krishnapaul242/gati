import { describe, it, expect, beforeEach } from 'vitest';
import { PrometheusAdapter, OpenTelemetryAdapter, PinoAdapter } from '@gati-framework/observability';
import type { IMetricsProvider, ITracingProvider, ILogger } from '@gati-framework/contracts';

describe('Observability Providers Integration', () => {
  describe('Prometheus + OpenTelemetry + Pino Stack', () => {
    let metrics: IMetricsProvider;
    let tracing: ITracingProvider;
    let logger: ILogger;

    beforeEach(() => {
      metrics = new PrometheusAdapter();
      tracing = new OpenTelemetryAdapter({ serviceName: 'test-app' });
      logger = new PinoAdapter({ level: 'info' });
    });

    it('should collect metrics', async () => {
      metrics.incrementCounter('test_counter', { label: 'value' });
      metrics.setGauge('test_gauge', 42);
      metrics.recordHistogram('test_histogram', 123.45);

      const metricsText = await metrics.getMetrics();
      expect(metricsText).toContain('test_counter');
      expect(metricsText).toContain('test_gauge');
      expect(metricsText).toContain('test_histogram');
    });

    it('should create and manage spans', async () => {
      const span = tracing.createSpan('test-span', { attr: 'value' });
      
      span.setAttribute('custom', 'attribute');
      span.setStatus('ok');
      span.end();

      expect(span).toBeDefined();
    });

    it('should execute function within span', async () => {
      const result = await tracing.withSpan('test-operation', async (span) => {
        span.setAttribute('test', 'value');
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should log at different levels', () => {
      expect(() => {
        logger.debug('Debug message', { context: 'test' });
        logger.info('Info message', { context: 'test' });
        logger.warn('Warning message', { context: 'test' });
        logger.error('Error message', { context: 'test' });
      }).not.toThrow();
    });

    it('should work together in a realistic scenario', async () => {
      const requestId = 'req-123';
      
      logger.info('Request started', { requestId });
      metrics.incrementCounter('requests_total', { endpoint: '/test' });

      const result = await tracing.withSpan('handle-request', async (span) => {
        span.setAttribute('request.id', requestId);
        
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const duration = Date.now() - start;
        metrics.recordHistogram('request_duration_ms', duration);
        
        span.setStatus('ok');
        logger.info('Request completed', { requestId, duration });
        
        return { success: true };
      });

      expect(result).toEqual({ success: true });
      
      const metricsText = await metrics.getMetrics();
      expect(metricsText).toContain('requests_total');
      expect(metricsText).toContain('request_duration_ms');
    });
  });

  describe('Provider Interface Compliance', () => {
    it('PrometheusAdapter implements IMetricsProvider', () => {
      const adapter = new PrometheusAdapter();
      
      expect(typeof adapter.incrementCounter).toBe('function');
      expect(typeof adapter.setGauge).toBe('function');
      expect(typeof adapter.recordHistogram).toBe('function');
      expect(typeof adapter.getMetrics).toBe('function');
    });

    it('OpenTelemetryAdapter implements ITracingProvider', () => {
      const adapter = new OpenTelemetryAdapter({ serviceName: 'test' });
      
      expect(typeof adapter.createSpan).toBe('function');
      expect(typeof adapter.withSpan).toBe('function');
      expect(typeof adapter.getTraceContext).toBe('function');
    });

    it('PinoAdapter implements ILogger', () => {
      const adapter = new PinoAdapter({ level: 'info' });
      
      expect(typeof adapter.debug).toBe('function');
      expect(typeof adapter.info).toBe('function');
      expect(typeof adapter.warn).toBe('function');
      expect(typeof adapter.error).toBe('function');
      expect(typeof adapter.fatal).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle span errors gracefully', async () => {
      const tracing = new OpenTelemetryAdapter({ serviceName: 'test' });
      
      try {
        await tracing.withSpan('error-span', async (span) => {
          span.setAttribute('will', 'fail');
          throw new Error('Test error');
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Test error');
      }
    });

    it('should handle logging errors gracefully', () => {
      const logger = new PinoAdapter({ level: 'info' });
      
      expect(() => {
        logger.error('Error occurred', { 
          error: new Error('Test error'),
          stack: 'stack trace'
        });
      }).not.toThrow();
    });
  });
});
