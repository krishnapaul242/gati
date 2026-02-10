/**
 * @module runtime/middleware/logging
 * @description Request/response logging and tracing middleware
 */

import type { Middleware } from '../types/middleware.js';
import type { Request, Response, GlobalContext, LocalContext } from '../types/index.js';
import { logger } from '../logger.js';

/**
 * Request logging configuration
 */
export interface RequestLoggingConfig {
  /**
   * Log request body (default: false for security)
   */
  logRequestBody?: boolean;

  /**
   * Log response body (default: false for performance)
   */
  logResponseBody?: boolean;

  /**
   * Log headers (default: false for security)
   */
  logHeaders?: boolean;

  /**
   * Sensitive headers to redact (e.g., Authorization, Cookie)
   */
  sensitiveHeaders?: string[];

  /**
   * Log query parameters (default: true)
   */
  logQuery?: boolean;

  /**
   * Skip logging for specific paths
   */
  skipPaths?: string[];

  /**
   * Log level for successful requests
   */
  successLevel?: 'debug' | 'info';

  /**
   * Log level for error requests
   */
  errorLevel?: 'warn' | 'error';
}

/**
 * Create request/response logging middleware
 */
export function createLoggingMiddleware(config: RequestLoggingConfig = {}): Middleware {
  const {
    logRequestBody = false,
    logResponseBody = false,
    logHeaders = false,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'],
    logQuery = true,
    skipPaths = ['/health', '/metrics'],
    successLevel = 'info',
    errorLevel = 'error',
  } = config;

  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    // Check if path should skip logging
    if (skipPaths.some((path) => req.path?.startsWith(path))) {
      await next();
      return;
    }

    const startTime = Date.now();

    // Build request log data
    const requestLog: Record<string, unknown> = {
      requestId: lctx.requestId,
      traceId: lctx.traceId,
      method: req.method,
      path: req.path,
      ip: lctx.client.ip,
      userAgent: lctx.client.userAgent,
      userId: lctx.refs.userId,
    };

    if (logQuery && req.query) {
      requestLog.query = req.query;
    }

    if (logHeaders && req.headers) {
      requestLog.headers = redactHeaders(req.headers, sensitiveHeaders);
    }

    if (logRequestBody && req.body) {
      requestLog.body = req.body;
    }

    // Log incoming request
    logger[successLevel](requestLog, 'Incoming request');

    // Capture original response methods to log response
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;
    let responseData: unknown;

    // Wrap status method
    res.status = (code: number) => {
      statusCode = code;
      return originalStatus(code);
    };

    // Wrap json method to capture response
    res.json = (data: unknown) => {
      responseData = data;
      return originalJson(data);
    };

    try {
      // Execute handler
      await next();

      // Calculate duration
      const duration = Date.now() - startTime;

      // Build response log data
      const responseLog: Record<string, unknown> = {
        requestId: lctx.requestId,
        traceId: lctx.traceId,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        userId: lctx.refs.userId,
      };

      if (logResponseBody && responseData) {
        responseLog.response = responseData;
      }

      // Log response
      const level = statusCode >= 400 ? errorLevel : successLevel;
      logger[level](responseLog, 'Request completed');

      // Record metrics if available
      if (gctx.metrics) {
        gctx.metrics.recordHistogram('http_request_duration_ms', duration, {
          method: req.method,
          path: req.path || '',
          status: statusCode.toString(),
        });

        gctx.metrics.incrementCounter('http_requests_total', {
          method: req.method,
          path: req.path || '',
          status: statusCode.toString(),
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error(
        {
          requestId: lctx.requestId,
          traceId: lctx.traceId,
          method: req.method,
          path: req.path,
          duration,
          error,
        },
        'Request failed'
      );

      // Record error metrics
      if (gctx.metrics) {
        gctx.metrics.incrementCounter('http_errors_total', {
          method: req.method,
          path: req.path || '',
          error: (error as Error).name,
        });
      }

      throw error;
    }
  };
}

/**
 * Redact sensitive headers
 */
function redactHeaders(
  headers: Record<string, string | string[] | undefined>,
  sensitiveKeys: string[]
): Record<string, string | string[]> {
  const redacted: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;

    if (sensitiveKeys.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Distributed tracing middleware configuration
 */
export interface TracingConfig {
  /**
   * Service name for tracing
   */
  serviceName: string;

  /**
   * Extract trace context from headers
   */
  extractTraceContext?: (headers: Record<string, string | string[] | undefined>) => {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };

  /**
   * Inject trace context into response headers
   */
  injectTraceContext?: boolean;

  /**
   * Record span attributes
   */
  recordAttributes?: (req: Request, lctx: LocalContext) => Record<string, string | number | boolean>;
}

/**
 * Create distributed tracing middleware
 */
export function createTracingMiddleware(config: TracingConfig): Middleware {
  const {
    serviceName,
    extractTraceContext = defaultTraceExtractor,
    injectTraceContext = true,
    recordAttributes,
  } = config;

  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    // Extract trace context from headers
    const traceContext = extractTraceContext(req.headers || {});

    // Use existing trace ID or create new one
    if (traceContext.traceId) {
      lctx.traceId = traceContext.traceId;
    }

    // Start span if metrics client supports it
    const span = gctx.metrics?.createSpan?.();
    const startTime = Date.now();

    try {
      // Record span attributes
      if (span && recordAttributes) {
        const attributes = recordAttributes(req, lctx);
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute?.(key, value);
        }
      }

      // Set standard span attributes
      if (span) {
        span.setAttribute?.('service.name', serviceName);
        span.setAttribute?.('http.method', req.method);
        span.setAttribute?.('http.path', req.path || '');
        span.setAttribute?.('http.user_agent', lctx.client.userAgent || '');
        span.setAttribute?.('trace.id', lctx.traceId);
        span.setAttribute?.('request.id', lctx.requestId);
      }

      // Execute handler
      await next();

      // Record success
      if (span) {
        span.setStatus?.({ code: 1 }); // OK
      }

      // Inject trace context into response headers
      if (injectTraceContext) {
        res.setHeader('X-Trace-Id', lctx.traceId);
        res.setHeader('X-Request-Id', lctx.requestId);
      }
    } catch (error) {
      // Record error in span
      if (span) {
        span.setStatus?.({ code: 2, message: (error as Error).message }); // ERROR
        span.recordException?.(error as Error);
      }

      throw error;
    } finally {
      // End span
      if (span) {
        const duration = Date.now() - startTime;
        span.setAttribute?.('http.duration_ms', duration);
        span.end?.();
      }
    }
  };
}

/**
 * Default trace context extractor (W3C Trace Context format)
 */
function defaultTraceExtractor(
  headers: Record<string, string | string[] | undefined>
): { traceId?: string; spanId?: string; parentSpanId?: string } {
  const traceparent = headers.traceparent as string | undefined;

  if (traceparent) {
    // W3C Trace Context format: version-traceId-spanId-flags
    const parts = traceparent.split('-');
    if (parts.length === 4) {
      return {
        traceId: parts[1],
        spanId: parts[2],
      };
    }
  }

  // Fallback to common headers
  return {
    traceId: (headers['x-trace-id'] as string) || (headers['x-request-id'] as string),
  };
}

/**
 * Performance metrics middleware
 */
export function createPerformanceMiddleware(): Middleware {
  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      await next();
    } finally {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      // Calculate memory delta
      const memoryDelta = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
      };

      // Log performance data
      logger.debug(
        {
          requestId: lctx.requestId,
          path: req.path,
          duration,
          memoryDelta,
        },
        'Request performance'
      );

      // Record metrics
      if (gctx.metrics) {
        gctx.metrics.recordHistogram('request_duration_ms', duration, {
          path: req.path || '',
          method: req.method,
        });

        if (memoryDelta.heapUsed > 0) {
          gctx.metrics.recordHistogram('request_memory_bytes', memoryDelta.heapUsed, {
            path: req.path || '',
          });
        }
      }
    }
  };
}

/**
 * Audit logging middleware
 */
export interface AuditConfig {
  /**
   * Events to audit
   */
  events?: string[];

  /**
   * Extract audit context from request
   */
  extractContext?: (req: Request, lctx: LocalContext) => Record<string, unknown>;

  /**
   * Audit log handler
   */
  logHandler?: (auditData: Record<string, unknown>) => Promise<void>;
}

/**
 * Create audit logging middleware
 */
export function createAuditMiddleware(config: AuditConfig = {}): Middleware {
  const { extractContext, logHandler } = config;

  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    const startTime = Date.now();

    try {
      await next();

      // Build audit log
      const auditData: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        requestId: lctx.requestId,
        traceId: lctx.traceId,
        userId: lctx.refs.userId,
        action: `${req.method} ${req.path}`,
        ip: lctx.client.ip,
        userAgent: lctx.client.userAgent,
        duration: Date.now() - startTime,
        success: true,
      };

      // Extract additional context
      if (extractContext) {
        Object.assign(auditData, extractContext(req, lctx));
      }

      // Log audit data
      if (logHandler) {
        await logHandler(auditData);
      } else {
        logger.info(auditData, 'Audit log');
      }

      // Record to metrics client if available
      if (gctx.metrics?.recordAudit) {
        gctx.metrics.recordAudit(auditData);
      }
    } catch (error) {
      // Log failed audit
      const auditData: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        requestId: lctx.requestId,
        userId: lctx.refs.userId,
        action: `${req.method} ${req.path}`,
        success: false,
        error: (error as Error).message,
      };

      if (logHandler) {
        await logHandler(auditData);
      } else {
        logger.warn(auditData, 'Audit log (failed)');
      }

      throw error;
    }
  };
}
