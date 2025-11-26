import * as Sentry from '@sentry/node';
import type { ILogger, ITracingProvider, ISpan } from '@gati-framework/contracts';

export interface SentryConfig {
  dsn: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

class SentrySpan implements ISpan {
  private span: any;

  constructor(span: any) {
    this.span = span;
  }

  get spanId(): string {
    return this.span.spanId || 'unknown';
  }

  get traceId(): string {
    return this.span.traceId || 'unknown';
  }

  setAttribute(key: string, value: any): void {
    this.span.setData(key, value);
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    Sentry.addBreadcrumb({ message: name, data: attributes });
  }

  recordException(error: Error): void {
    Sentry.captureException(error);
  }

  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    this.span.setStatus(status.code === 'OK' ? 'ok' : 'internal_error');
  }

  end(): void {
    this.span.finish();
  }
}

export class SentryAdapter implements ILogger, ITracingProvider {
  private context: Record<string, any> = {};

  constructor(config: SentryConfig) {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment || 'production',
      release: config.release,
      tracesSampleRate: config.tracesSampleRate ?? 1.0,
    });
  }

  debug(message: string, context?: Record<string, any>): void {
    Sentry.addBreadcrumb({ level: 'debug', message, data: { ...this.context, ...context } });
  }

  info(message: string, context?: Record<string, any>): void {
    Sentry.addBreadcrumb({ level: 'info', message, data: { ...this.context, ...context } });
  }

  warn(message: string, context?: Record<string, any>): void {
    Sentry.captureMessage(message, { level: 'warning', contexts: { custom: { ...this.context, ...context } } });
  }

  error(message: string, context?: Record<string, any>): void {
    Sentry.captureMessage(message, { level: 'error', contexts: { custom: { ...this.context, ...context } } });
  }

  child(context: Record<string, any>): ILogger {
    const child = new SentryAdapter({ dsn: '' });
    child.context = { ...this.context, ...context };
    return child;
  }

  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    const span = Sentry.startInactiveSpan({ name, op: name, ...attributes });
    return new SentrySpan(span || { spanId: 'unknown', traceId: 'unknown', setData: () => {}, finish: () => {} });
  }

  async withSpan<T>(
    name: string,
    fn: (span: ISpan) => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    return Sentry.startSpan({ name, op: name, ...attributes }, async (sentrySpan) => {
      const span = new SentrySpan(sentrySpan);
      try {
        return await fn(span);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 'ERROR', message: (error as Error).message });
        throw error;
      }
    });
  }

  getTraceContext(): string | undefined {
    const span = Sentry.getActiveSpan();
    return span ? `${(span as any).traceId}-${(span as any).spanId}` : undefined;
  }
}
