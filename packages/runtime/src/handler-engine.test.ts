/**
 * @module runtime/handler-engine.test
 * @description Tests for handler execution engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeHandler } from './handler-engine';
import type { Handler, Request, Response, GlobalContext, LocalContext } from './types';
import { HandlerError } from './types';

describe('handler-engine', () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockGctx: GlobalContext;
  let mockLctx: LocalContext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/test',
      query: {},
      params: {},
      headers: {},
      body: undefined,
      rawBody: undefined,
    } as Request;

    let sent = false;
    const capturedStatus = { code: 200 };
    let headersSent = false;

    mockRes = {
      status: (code: number) => {
        capturedStatus.code = code;
        return mockRes;
      },
      header: () => mockRes,
      json: () => {
        sent = true;
        headersSent = true;
        return mockRes;
      },
      text: () => {
        sent = true;
        headersSent = true;
        return mockRes;
      },
      send: () => {
        sent = true;
        headersSent = true;
        return mockRes;
      },
      isSent: () => sent,
      headersSent,
      _testGetStatus: () => capturedStatus.code,
    } as unknown as Response;

    mockGctx = {
      modules: new Map(),
      config: {},
      startedAt: new Date(),
      state: {},
      lifecycle: {
        onShutdown: () => {},
        onError: () => {},
      },
    } as unknown as GlobalContext;

    mockLctx = {
      requestId: 'test-request-id',
      data: {},
      timestamp: Date.now(),
      state: {},
      lifecycle: {
        onComplete: () => {},
        onError: () => {},
      },
    } as unknown as LocalContext;
  });

  describe('executeHandler', () => {
    it('should execute handler successfully', async () => {
      const handler: Handler = (_req, res) => {
        res.json({ success: true });
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      expect(mockRes.isSent()).toBe(true);
    });

    it('should pass correct parameters to handler', async () => {
      const handler: Handler = (req, res, gctx, lctx) => {
        expect(req).toBe(mockReq);
        expect(res).toBe(mockRes);
        expect(gctx).toBe(mockGctx);
        expect(lctx).toBe(mockLctx);
        res.json({ ok: true });
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);
    });

    it('should handle async handlers', async () => {
      const handler: Handler = async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.json({ async: true });
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      expect(mockRes.isSent()).toBe(true);
    });

    it('should handle HandlerError', async () => {
      const handler: Handler = () => {
        throw new HandlerError('Custom error', 400, { field: 'test' });
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRes as any)._testGetStatus()).toBe(400);
    });

    it('should handle generic errors', async () => {
      const handler: Handler = () => {
        throw new Error('Generic error');
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRes as any)._testGetStatus()).toBe(500);
    });

    it('should not send response if already sent', async () => {
      // Simulate response already sent
      mockRes.json({ first: true });

      const handler: Handler = () => {
        throw new Error('Should not send');
      };

      // Should not throw, just log error
      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      expect(mockRes.isSent()).toBe(true);
    });

    it('should execute handler with timeout', async () => {
      const handler: Handler = async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.json({ ok: true });
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx, {
        timeout: 100,
      });

      expect(mockRes.isSent()).toBe(true);
    });

    it('should timeout slow handlers', async () => {
      const handler: Handler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx, {
        timeout: 50,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRes as any)._testGetStatus()).toBe(500);
    });

    it('should handle errors in production mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const handler: Handler = () => {
        throw new Error('Production error');
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRes as any)._testGetStatus()).toBe(500);

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should handle errors in development mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const handler: Handler = () => {
        throw new Error('Development error');
      };

      await executeHandler(handler, mockReq, mockRes, mockGctx, mockLctx);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRes as any)._testGetStatus()).toBe(500);

      process.env['NODE_ENV'] = originalEnv;
    });
  });
});
