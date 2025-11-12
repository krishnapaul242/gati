/**
 * @module tests/unit/runtime/handler-engine.test
 * @description Unit tests for handler execution engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeHandler } from '@gati-framework/runtime/handler-engine';
import { HandlerError } from '@gati-framework/runtime/types';
import type { Handler, Request, Response, GlobalContext, LocalContext } from '@gati-framework/runtime/types';
import type { IncomingMessage, ServerResponse } from 'http';
import { logger } from '@gati-framework/runtime/logger';

describe('Handler Engine', () => {
  function createMockRequest(): Request {
    return {
      method: 'GET',
      path: '/api/test',
      query: {},
      params: {},
      headers: {},
      body: undefined,
      raw: {} as IncomingMessage,
    };
  }

  function createMockResponse(): Response {
    const mock = {
      statusCode: 200,
      headers: {} as Record<string, string | string[] | number>,
      sent: false,
      body: undefined as unknown,
    };

    const response: Response = {
      status: (code: number): Response => {
        mock.statusCode = code;
        return response;
      },
      header: (name: string, value: string | string[] | number): Response => {
        mock.headers[name] = value;
        return response;
      },
      headers: (headers: Record<string, string | string[] | number>): Response => {
        Object.assign(mock.headers, headers);
        return response;
      },
      json: (data: unknown): void => {
        mock.body = data;
        mock.sent = true;
      },
      text: (data: string): void => {
        mock.body = data;
        mock.sent = true;
      },
      send: (data: string | Buffer): void => {
        mock.body = data;
        mock.sent = true;
      },
      end: (): void => {
        mock.sent = true;
      },
      isSent: (): boolean => mock.sent,
      headersSent: false,
      raw: {} as ServerResponse,
    };

    // Spy on methods
    vi.spyOn(response, 'status');
    vi.spyOn(response, 'header');
    vi.spyOn(response, 'headers');
    vi.spyOn(response, 'json');
    vi.spyOn(response, 'text');
    vi.spyOn(response, 'send');
    vi.spyOn(response, 'end');
    vi.spyOn(response, 'isSent');

    return response;
  }

  function createMockGlobalContext(): GlobalContext {
    return {
      modules: {},
      config: {},
      state: {},
      startedAt: Date.now(),
      lifecycle: {
        onShutdown: vi.fn(),
        isShuttingDown: () => false,
      },
    };
  }

  function createMockLocalContext(): LocalContext {
    return {
      requestId: 'req_123',
      timestamp: Date.now(),
      state: {},
      lifecycle: {
        onCleanup: vi.fn(),
        isCleaningUp: () => false,
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeHandler', () => {
    it('should execute a synchronous handler', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = vi.fn((_req, res) => {
        res.json({ ok: true });
      });

      await executeHandler(handler, req, res, gctx, lctx);

      expect(handler).toHaveBeenCalledWith(req, res, gctx, lctx);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should execute an asynchronous handler', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = vi.fn(async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.json({ ok: true });
      });

      await executeHandler(handler, req, res, gctx, lctx);

      expect(handler).toHaveBeenCalledWith(req, res, gctx, lctx);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should pass all parameters to handler', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = vi.fn((_req, _res, _gctx, _lctx) => {
        // Empty handler for testing
      });

      await executeHandler(handler, req, res, gctx, lctx);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(req, res, gctx, lctx);
    });

    it('should throw HandlerError if handler is not a function', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const invalidHandler = 'not a function' as unknown as Handler;

      await expect(
        executeHandler(invalidHandler, req, res, gctx, lctx)
      ).rejects.toThrow(HandlerError);

      await expect(
        executeHandler(invalidHandler, req, res, gctx, lctx)
      ).rejects.toThrow('Invalid handler: must be a function');
    });
  });

  describe('error handling', () => {
    it('should handle HandlerError', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = () => {
        throw new HandlerError('User not found', 404);
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should include context in HandlerError response', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = () => {
        throw new HandlerError('Validation failed', 400, {
          field: 'email',
          message: 'Invalid format',
        });
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        context: {
          field: 'email',
          message: 'Invalid format',
        },
      });
    });

    it('should handle generic Error', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = () => {
        throw new Error('Database connection failed');
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          message: 'Database connection failed',
        })
      );
    });

    it('should handle unknown errors', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = () => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'string error';
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should not send error if response already sent', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      // Mock logger.error to avoid cluttering test output
      const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

      const handler: Handler = (_req, res) => {
        res.json({ ok: true });
        throw new Error('After response sent');
      };

      await executeHandler(handler, req, res, gctx, lctx);

      // Should not call status/json again after response sent
      expect(res.status).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Handler error after response sent'
      );

      loggerErrorSpy.mockRestore();
    });

    it('should rethrow error if catchErrors is false', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const error = new Error('Test error');
      const handler: Handler = () => {
        throw error;
      };

      await expect(
        executeHandler(handler, req, res, gctx, lctx, { catchErrors: false })
      ).rejects.toThrow(error);
    });
  });

  describe('timeout', () => {
    it('should timeout after specified duration', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      };

      await executeHandler(handler, req, res, gctx, lctx, { timeout: 100 });

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          message: expect.stringMatching(/timed out/) as string,
        })
      );
    }, 10000);

    it('should use default timeout of 30 seconds', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.json({ ok: true });
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should allow custom timeout', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.json({ ok: true });
      };

      await executeHandler(handler, req, res, gctx, lctx, { timeout: 100 });

      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('handler execution flow', () => {
    it('should support handlers that return void', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = (_req, res) => {
        res.json({ ok: true });
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should support handlers that return Promise<void>', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      const handler: Handler = async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.json({ ok: true });
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should support handlers accessing gctx modules', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      gctx.modules['db'] = { users: { findById: vi.fn() } };

      const handler: Handler = (_req, res, gctx) => {
        const db = gctx.modules['db'] as { users: { findById: () => void } };
        db.users.findById();
        res.json({ ok: true });
      };

      await executeHandler(handler, req, res, gctx, lctx);

      const dbModule = gctx.modules['db'] as { users: { findById: unknown } };
      expect(dbModule.users.findById).toHaveBeenCalled();
    });

    it('should support handlers accessing lctx state', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const gctx = createMockGlobalContext();
      const lctx = createMockLocalContext();

      lctx.state['userId'] = '123';

      const handler: Handler = (_req, res, _gctx, lctx) => {
        const userId = lctx.state['userId'];
        res.json({ userId });
      };

      await executeHandler(handler, req, res, gctx, lctx);

      expect(res.json).toHaveBeenCalledWith({ userId: '123' });
    });
  });
});
