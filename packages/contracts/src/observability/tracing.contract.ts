/**
 * @module contracts/observability/tracing
 * @description Tracing provider contract for distributed tracing
 */

/**
 * Span interface for distributed tracing
 */
export interface ISpan {
  /** Unique span identifier */
  spanId: string;
  
  /** Trace identifier */
  traceId: string;
  
  /**
   * Set an attribute on the span
   */
  setAttribute(key: string, value: any): void;
  
  /**
   * Add an event to the span
   */
  addEvent(name: string, attributes?: Record<string, any>): void;
  
  /**
   * Record an exception in the span
   */
  recordException(error: Error): void;
  
  /**
   * Set the span status
   */
  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void;
  
  /**
   * End the span
   */
  end(): void;
}

/**
 * Tracing Provider Contract
 */
export interface ITracingProvider {
  /**
   * Create a new span
   */
  createSpan(name: string, attributes?: Record<string, any>): ISpan;
  
  /**
   * Execute function within span context
   */
  withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T>;
  
  /**
   * Get current trace context as string
   */
  getTraceContext(): string | undefined;
}

/**
 * Tracing Configuration
 */
export interface TracingConfig {
  /** Provider type */
  provider: 'opentelemetry' | 'jaeger' | 'zipkin' | 'mock';
  
  /** Service name */
  serviceName: string;
  
  /** Service version */
  serviceVersion?: string;
  
  /** Export endpoint URL */
  exportEndpoint?: string;
}
