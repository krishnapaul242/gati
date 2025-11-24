/**
 * @module runtime/observability-factory.test
 * @description Tests for observability factory
 */

import { describe, it, expect } from 'vitest';
import { MetricsClientAdapter, createMetricsClient } from './observability-factory.js';
import type { IMetricsProvider } from '@gati-framework/contracts';

describe('ObservabilityFactory', () => {
  describe('MetricsClientAdapter', () => {
    it('should delegate incrementCounter to provider', () => {
      let called = false;
      const provider: IMetricsProvider = {
        incrementCounter: (name, labels, value) => {
          called = true;
          expect(name).toBe('test_counter');
          expect(labels).toEqual({ service: 'test' });
          expect(value).toBe(5);
        },
        setGauge: () => {},
        recordHistogram: () => {},
        getMetrics: async () => '',
      };

      const adapter = new MetricsClientAdapter(provider);
      adapter.incrementCounter('test_counter', { service: 'test' }, 5);
      expect(called).toBe(true);
    });

    it('should delegate setGauge to provider', () => {
      let called = false;
      const provider: IMetricsProvider = {
        incrementCounter: () => {},
        setGauge: (name, value, labels) => {
          called = true;
          expect(name).toBe('test_gauge');
          expect(value).toBe(42);
          expect(labels).toEqual({ status: 'active' });
        },
        recordHistogram: () => {},
        getMetrics: async () => '',
      };

      const adapter = new MetricsClientAdapter(provider);
      adapter.setGauge('test_gauge', 42, { status: 'active' });
      expect(called).toBe(true);
    });

    it('should delegate recordHistogram to provider', () => {
      let called = false;
      const provider: IMetricsProvider = {
        incrementCounter: () => {},
        setGauge: () => {},
        recordHistogram: (name, value, labels) => {
          called = true;
          expect(name).toBe('test_histogram');
          expect(value).toBe(1.5);
          expect(labels).toEqual({ method: 'GET' });
        },
        getMetrics: async () => '',
      };

      const adapter = new MetricsClientAdapter(provider);
      adapter.recordHistogram('test_histogram', 1.5, { method: 'GET' });
      expect(called).toBe(true);
    });
  });

  describe('createMetricsClient', () => {
    it('should return undefined when no config provided', () => {
      const client = createMetricsClient();
      expect(client).toBeUndefined();
    });

    it('should return undefined when no provider in config', () => {
      const client = createMetricsClient({});
      expect(client).toBeUndefined();
    });

    it('should create adapter when provider is configured', () => {
      const provider: IMetricsProvider = {
        incrementCounter: () => {},
        setGauge: () => {},
        recordHistogram: () => {},
        getMetrics: async () => '',
      };

      const client = createMetricsClient({
        metrics: { provider },
      });

      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(MetricsClientAdapter);
    });
  });
});
