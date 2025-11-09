/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiddlewareManager } from './middleware';
import type { Request, Response, GlobalContext, LocalContext } from './types';
import type { Middleware, ErrorMiddleware } from './types/middleware';

describe('MiddlewareManager', () => {
  let manager: MiddlewareManager;
  let mockReq: Request;
  let mockRes: Response;
  let mockGctx: GlobalContext;
  let mockLctx: LocalContext;

  beforeEach(() => {
    manager = new MiddlewareManager();

    mockReq = {
      method: 'GET',
      path: '/test',
      headers: {},
      params: {},
      query: {},
      body: null,
    } as Request;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      headersSent: false,
    } as unknown as Response;

    mockGctx = {
      modules: {},
      startedAt: Date.now(),
      config: {},
      state: {},
      lifecycle: {
        onShutdown: vi.fn(),
        isShuttingDown: vi.fn(() => false),
      },
    } as GlobalContext;

    mockLctx = {
      requestId: 'test-123',
      timestamp: Date.now(),
      state: {},
      lifecycle: {
        onCleanup: vi.fn(),
        isCleaningUp: vi.fn(() => false),
      },
    } as LocalContext;

    vi.clearAllMocks();
  });

  describe('use', () => {
    it('should register middleware', () => {
      // Arrange
      const middleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      // Act
      manager.use(middleware);

      // Assert
      expect(manager.size()).toBe(1);
      expect(manager.getMiddlewares()).toHaveLength(1);
    });

    it('should sort middlewares by priority', () => {
      // Arrange
      const mw1: Middleware = vi.fn();
      const mw2: Middleware = vi.fn();
      const mw3: Middleware = vi.fn();

      // Act
      manager.use(mw1, { priority: 5 });
      manager.use(mw2, { priority: 10 });
      manager.use(mw3, { priority: 1 });

      // Assert
      const middlewares = manager.getMiddlewares();
      expect(middlewares[0]?.options.priority).toBe(10); // mw2 first
      expect(middlewares[1]?.options.priority).toBe(5); // mw1 second
      expect(middlewares[2]?.options.priority).toBe(1); // mw3 last
    });

    it('should default priority to 0', () => {
      // Arrange
      const middleware: Middleware = vi.fn();

      // Act
      manager.use(middleware);

      // Assert
      const middlewares = manager.getMiddlewares();
      expect(middlewares[0]?.options.priority).toBe(0);
    });
  });

  describe('execute', () => {
    it('should execute middlewares in priority order', async () => {
      // Arrange
      const executionOrder: number[] = [];

      const mw1: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        executionOrder.push(1);
        await next();
      });

      const mw2: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        executionOrder.push(2);
        await next();
      });

      const mw3: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        executionOrder.push(3);
        await next();
      });

      manager.use(mw1, { priority: 5 });
      manager.use(mw2, { priority: 10 });
      manager.use(mw3, { priority: 1 });

      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(executionOrder).toEqual([2, 1, 3]); // By priority: 10, 5, 1
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should execute handler after all middlewares', async () => {
      // Arrange
      const calls: string[] = [];

      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        calls.push('middleware');
        await next();
      };

      manager.use(middleware);

      const handler = vi.fn(() => {
        calls.push('handler');
      });

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(calls).toEqual(['middleware', 'handler']);
    });

    it('should stop execution if middleware does not call next', async () => {
      // Arrange
      const mw1: Middleware = vi.fn(async () => {
        // Does not call next()
      });

      const mw2: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      manager.use(mw1, { priority: 10 });
      manager.use(mw2, { priority: 5 });

      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(mw1).toHaveBeenCalled();
      expect(mw2).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should filter middlewares by path pattern', async () => {
      // Arrange
      const apiMiddleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      const rootMiddleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      manager.use(apiMiddleware, { path: '/api' });
      manager.use(rootMiddleware, { path: '*' });

      const handler = vi.fn();

      // Act
      mockReq.path = '/api';
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(apiMiddleware).toHaveBeenCalled();
      expect(rootMiddleware).toHaveBeenCalled(); // '*' matches everything
    });

    it('should filter middlewares by HTTP method', async () => {
      // Arrange
      const getMiddleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      const postMiddleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      manager.use(getMiddleware, { methods: ['GET'] });
      manager.use(postMiddleware, { methods: ['POST'] });

      const handler = vi.fn();

      // Act
      mockReq.method = 'GET';
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(getMiddleware).toHaveBeenCalled();
      expect(postMiddleware).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to middleware', async () => {
      // Arrange
      const middleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      manager.use(middleware);
      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(middleware).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        mockGctx,
        mockLctx,
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should catch errors and invoke error middleware', async () => {
      // Arrange
      const testError = new Error('Test error');
      const faultyMiddleware: Middleware = vi.fn(() => {
        throw testError;
      });

      const errorHandler: ErrorMiddleware = vi.fn();

      manager.use(faultyMiddleware);
      manager.useError(errorHandler);

      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(errorHandler).toHaveBeenCalledWith(
        testError,
        mockReq,
        mockRes,
        mockGctx,
        mockLctx
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should send generic error if no error middleware handles it', async () => {
      // Arrange
      const testError = new Error('Test error');
      const faultyMiddleware: Middleware = vi.fn(() => {
        throw testError;
      });

      manager.use(faultyMiddleware);

      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Test error',
      });
    });

    it('should not send response if already sent by error middleware', async () => {
      // Arrange
      const testError = new Error('Test error');
      const faultyMiddleware: Middleware = vi.fn(() => {
        throw testError;
      });

      const errorHandler: ErrorMiddleware = vi.fn((_error, _req, res) => {
        res.status(400).json({ custom: 'error' });
        // Mark headers as sent
        Object.defineProperty(res, 'headersSent', { value: true });
      });

      manager.use(faultyMiddleware);
      manager.useError(errorHandler);

      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(errorHandler).toHaveBeenCalled();
      // Generic error should not override custom response
      expect(mockRes.json).toHaveBeenCalledWith({ custom: 'error' });
    });

    it('should handle errors in error middleware gracefully', async () => {
      // Arrange
      const testError = new Error('Test error');
      const faultyMiddleware: Middleware = vi.fn(() => {
        throw testError;
      });

      const faultyErrorHandler: ErrorMiddleware = vi.fn(() => {
        throw new Error('Error handler failed');
      });

      manager.use(faultyMiddleware);
      manager.useError(faultyErrorHandler);

      const handler = vi.fn();

      // Act & Assert - should not throw
      await expect(
        manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler)
      ).resolves.not.toThrow();

      // Should still send generic error
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('clear', () => {
    it('should remove all middlewares', () => {
      // Arrange
      const mw1: Middleware = vi.fn();
      const mw2: Middleware = vi.fn();
      const errorMw: ErrorMiddleware = vi.fn();

      manager.use(mw1);
      manager.use(mw2);
      manager.useError(errorMw);

      expect(manager.size()).toBe(2);

      // Act
      manager.clear();

      // Assert
      expect(manager.size()).toBe(0);
      expect(manager.getMiddlewares()).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty middleware chain', async () => {
      // Arrange
      const handler = vi.fn();

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should handle async middleware with delays', async () => {
      // Arrange
      const delays: number[] = [];

      const mw1: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        delays.push(1);
        await next();
      };

      const mw2: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        delays.push(2);
        await next();
      };

      manager.use(mw1, { priority: 10 });
      manager.use(mw2, { priority: 5 });

      const handler = vi.fn(() => {
        delays.push(3);
      });

      // Act
      await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);

      // Assert
      expect(delays).toEqual([1, 2, 3]); // Sequential execution
    });

    it('should handle wildcard method matching', async () => {
      // Arrange
      const middleware: Middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        await next();
      });

      manager.use(middleware, { methods: ['*'] });
      const handler = vi.fn();

      // Act & Assert
      for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
        vi.clearAllMocks();
        mockReq.method = method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        await manager.execute(mockReq, mockRes, mockGctx, mockLctx, handler);
        expect(middleware).toHaveBeenCalled();
      }
    });
  });
});
