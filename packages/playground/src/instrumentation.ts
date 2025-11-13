/**
 * @module playground/instrumentation
 * @description Middleware instrumentation for lifecycle event emission
 */

import type { Middleware, Handler } from '@gati-framework/runtime';
import type { PlaygroundModule } from './types.js';

/**
 * Enhanced middleware that tracks trace context globally for module instrumentation
 */
export function createGlobalTraceMiddleware(): Middleware {
  return async (_req, _res, gctx, lctx, next) => {
    // Store global context and trace ID for module tracking
    (global as any).__gatiGlobalContext = gctx;
    (global as any).__gatiCurrentTraceId = lctx.traceId;
    
    try {
      await next();
    } finally {
      // Clean up global references
      delete (global as any).__gatiCurrentTraceId;
    }
  };
}

/**
 * Create instrumentation middleware for playground
 * 
 * Emits lifecycle events when requests pass through middleware chain
 * 
 * @example
 * ```typescript
 * import { createApp } from '@gati-framework/runtime';
 * import { createInstrumentationMiddleware } from '@gati-framework/playground';
 * 
 * const app = createApp();
 * app.use(createInstrumentationMiddleware());
 * ```
 */
export function createInstrumentationMiddleware(): Middleware {
  return async (req, res, gctx, lctx, next) => {
    const playground = gctx.modules?.['playground'] as PlaygroundModule | undefined;

    if (!playground || !playground.config.enabled) {
      // Playground not enabled, skip instrumentation
      await next();
      return;
    }

    const traceId = lctx.traceId || 'unknown';
    const startTime = Date.now();

    // Emit request start event
    playground.emitEvent({
      type: 'request:start',
      timestamp: startTime,
      traceId,
      data: {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body,
      },
    });

    try {
      await next();

      // Emit request end event
      playground.emitEvent({
        type: 'request:end',
        timestamp: Date.now(),
        traceId,
        duration: Date.now() - startTime,
        data: {
          statusCode: (res as any).statusCode || 200,
          success: true,
        },
      });
    } catch (error) {
      // Emit error event
      playground.emitEvent({
        type: 'error:thrown',
        timestamp: Date.now(),
        traceId,
        duration: Date.now() - startTime,
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      
      // Also emit request end with error
      playground.emitEvent({
        type: 'request:end',
        timestamp: Date.now(),
        traceId,
        duration: Date.now() - startTime,
        data: {
          statusCode: 500,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error; // Re-throw
    }
  };
}

/**
 * Wrap a middleware with instrumentation
 * 
 * @param middleware - Middleware to instrument
 * @param name - Middleware name for identification
 * @returns Instrumented middleware
 */
export function instrumentMiddleware(
  middleware: Middleware,
  name: string
): Middleware {
  return async (req, res, gctx, lctx, next) => {
    const playground = gctx.modules?.['playground'] as PlaygroundModule | undefined;

    if (!playground || !playground.config.enabled) {
      await middleware(req, res, gctx, lctx, next);
      return;
    }

    const traceId = lctx.traceId || 'unknown';
    const nodeId = `middleware_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const startTime = Date.now();

    // Emit middleware enter event
    playground.emitEvent({
      type: 'middleware:enter',
      timestamp: startTime,
      traceId,
      nodeId,
      nodeType: 'middleware',
      data: { name },
    });

    try {
      await middleware(req, res, gctx, lctx, next);

      // Emit middleware exit event
      playground.emitEvent({
        type: 'middleware:exit',
        timestamp: Date.now(),
        traceId,
        nodeId,
        nodeType: 'middleware',
        duration: Date.now() - startTime,
        data: { name },
      });
    } catch (error) {
      playground.emitEvent({
        type: 'error:thrown',
        timestamp: Date.now(),
        traceId,
        nodeId,
        nodeType: 'middleware',
        duration: Date.now() - startTime,
        data: {
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  };
}

/**
 * Wrap a handler with instrumentation
 * 
 * @param handler - Handler to instrument
 * @param name - Handler name for identification
 * @returns Instrumented handler
 */
export function instrumentHandler(
  handler: Handler,
  name: string
): Handler {
  return async (req, res, gctx, lctx) => {
    const playground = gctx.modules?.['playground'] as PlaygroundModule | undefined;

    if (!playground || !playground.config.enabled) {
      await handler(req, res, gctx, lctx);
      return;
    }

    const traceId = lctx.traceId || 'unknown';
    const nodeId = `handler_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const startTime = Date.now();

    // Emit handler enter event
    playground.emitEvent({
      type: 'handler:enter',
      timestamp: startTime,
      traceId,
      nodeId,
      nodeType: 'handler',
      data: { name },
    });

    try {
      await handler(req, res, gctx, lctx);

      // Emit handler exit event
      playground.emitEvent({
        type: 'handler:exit',
        timestamp: Date.now(),
        traceId,
        nodeId,
        nodeType: 'handler',
        duration: Date.now() - startTime,
        data: { name },
      });
    } catch (error) {
      playground.emitEvent({
        type: 'error:thrown',
        timestamp: Date.now(),
        traceId,
        nodeId,
        nodeType: 'handler',
        duration: Date.now() - startTime,
        data: {
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  };
}

/**
 * Create a module call tracker for instrumenting module method calls
 */
export function createModuleTracker(moduleName: string) {
  return {
    track<T extends (...args: any[]) => any>(method: T, methodName: string): T {
      return (async (...args: any[]) => {
        // Get playground from global context if available
        const gctx = (global as any).__gatiGlobalContext;
        const playground = gctx?.modules?.['playground'] as PlaygroundModule | undefined;
        
        if (!playground || !playground.config.enabled) {
          return await method(...args);
        }

        const traceId = (global as any).__gatiCurrentTraceId || 'unknown';
        const nodeId = `module_${moduleName}_${methodName}`.replace(/[^a-zA-Z0-9]/g, '_');
        const startTime = Date.now();

        // Emit module call event
        playground.emitEvent({
          type: 'module:call',
          timestamp: startTime,
          traceId,
          nodeId,
          nodeType: 'module',
          data: { moduleName, methodName },
        });

        try {
          const result = await method(...args);
          
          // Emit successful completion
          playground.emitEvent({
            type: 'module:call',
            timestamp: Date.now(),
            traceId,
            nodeId,
            nodeType: 'module',
            duration: Date.now() - startTime,
            data: { moduleName, methodName, success: true },
          });
          
          return result;
        } catch (error) {
          // Emit error event
          playground.emitEvent({
            type: 'error:thrown',
            timestamp: Date.now(),
            traceId,
            nodeId,
            nodeType: 'module',
            data: {
              moduleName,
              methodName,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
          throw error;
        }
      }) as T;
    },
  };
}
