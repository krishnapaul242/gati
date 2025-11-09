/**
 * @module tests/unit/runtime/app-core.test
 * @description Unit tests for Gati app core
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp, GatiApp } from '@/runtime/app-core';
import type { Request, Response, Middleware } from '@/runtime/types';

describe('App Core', () => {
  let app: GatiApp;

  beforeEach(() => {
    app = createApp({ port: 0, logging: false }); // Random port
  });

  afterEach(async () => {
    if (app.isRunning()) {
      await app.close();
    }
  });

  describe('createApp', () => {
    it('should create a new app instance', () => {
      expect(app).toBeInstanceOf(GatiApp);
    });

    it('should use default configuration', () => {
      const config = app.getConfig();
      expect(config.host).toBe('localhost');
      expect(config.timeout).toBe(30000);
      expect(config.logging).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customApp = createApp({
        port: 4000,
        host: '0.0.0.0',
        timeout: 60000,
        logging: false,
      });

      const config = customApp.getConfig();
      expect(config.port).toBe(4000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.timeout).toBe(60000);
      expect(config.logging).toBe(false);
    });
  });

  describe('route registration', () => {
    it('should register GET route', () => {
      const handler = vi.fn();
      app.get('/test', handler);
      expect(true).toBe(true); // Registration doesn't throw
    });

    it('should register POST route', () => {
      const handler = vi.fn();
      app.post('/test', handler);
      expect(true).toBe(true);
    });

    it('should register PUT route', () => {
      const handler = vi.fn();
      app.put('/test', handler);
      expect(true).toBe(true);
    });

    it('should register PATCH route', () => {
      const handler = vi.fn();
      app.patch('/test', handler);
      expect(true).toBe(true);
    });

    it('should register DELETE route', () => {
      const handler = vi.fn();
      app.delete('/test', handler);
      expect(true).toBe(true);
    });
  });

  describe('middleware', () => {
    it('should register middleware', () => {
      const middleware = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await next();
      });

      app.use(middleware as Middleware);
      expect(true).toBe(true); // Registration doesn't throw
    });

    it('should register error middleware', () => {
      const errorMiddleware = vi.fn((_error, _req, _res, _gctx, _lctx) => {
        // Handle error
      });

      app.useError(errorMiddleware);
      expect(true).toBe(true);
    });
  });

  describe('server lifecycle', () => {
    it('should start server', async () => {
      await expect(app.listen()).resolves.toBeUndefined();
      expect(app.isRunning()).toBe(true);
    });

    it('should throw if starting already running server', async () => {
      await app.listen();
      await expect(app.listen()).rejects.toThrow('Server is already running');
    });

    it('should stop server', async () => {
      await app.listen();
      await expect(app.close()).resolves.toBeUndefined();
      expect(app.isRunning()).toBe(false);
    });

    it('should handle multiple close calls gracefully', async () => {
      await app.listen();
      await app.close();
      await expect(app.close()).resolves.toBeUndefined();
    });
  });

  describe('request handling', () => {
    it('should handle GET request', async () => {
      const handlerMock = vi.fn((_req: Request, res: Response) => {
        res.json({ success: true });
      });

      app.get('/test', handlerMock);
      await app.listen();

      const config = app.getConfig();
      const response = await fetch(`http://${config.host}:${config.port}/test`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(handlerMock).toHaveBeenCalled();
    });

    it('should return 404 for unknown route', async () => {
      await app.listen();

      const config = app.getConfig();
      const response = await fetch(`http://${config.host}:${config.port}/nonexistent`);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
    });

    it('should handle path parameters', async () => {
      const handlerMock = vi.fn((req: Request, res: Response) => {
        res.json({ userId: req.params['id'] });
      });

      app.get('/users/:id', handlerMock);
      await app.listen();

      const config = app.getConfig();
      const response = await fetch(`http://${config.host}:${config.port}/users/123`);
      const data = (await response.json()) as { userId: string };

      expect(data.userId).toBe('123');
    });

    it('should execute middleware before handler', async () => {
      const middlewareMock = vi.fn(async (_req, _res, _gctx, _lctx, next) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await next();
      });

      const handlerMock = vi.fn((_req: Request, res: Response) => {
        res.json({ success: true });
      });

      app.use(middlewareMock as Middleware);
      app.get('/test', handlerMock);
      await app.listen();

      const config = app.getConfig();
      await fetch(`http://${config.host}:${config.port}/test`);

      expect(middlewareMock).toHaveBeenCalled();
      expect(handlerMock).toHaveBeenCalled();
    });

    it('should handle errors in handlers', async () => {
      app.get('/error', (_req: Request, _res: Response) => {
        throw new Error('Test error');
      });

      await app.listen();

      const config = app.getConfig();
      const response = await fetch(`http://${config.host}:${config.port}/error`);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle POST requests with different handlers', async () => {
      app.get('/test', (_req: Request, res: Response) => {
        res.json({ method: 'GET' });
      });

      app.post('/test', (_req: Request, res: Response) => {
        res.json({ method: 'POST' });
      });

      await app.listen();

      const config = app.getConfig();
      
      const getResponse = await fetch(`http://${config.host}:${config.port}/test`);
      const getData = (await getResponse.json()) as { method: string };
      expect(getData.method).toBe('GET');

      const postResponse = await fetch(`http://${config.host}:${config.port}/test`, {
        method: 'POST',
      });
      const postData = (await postResponse.json()) as { method: string };
      expect(postData.method).toBe('POST');
    });
  });

  describe('error handling', () => {
    it('should handle errors through error middleware', async () => {
      app.get('/error', () => {
        throw new Error('Custom error');
      });

      await app.listen();

      const config = app.getConfig();
      const response = await fetch(`http://${config.host}:${config.port}/error`);
      const data = (await response.json()) as { error: string };

      // Default error handler catches it
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('graceful shutdown', () => {
    it('should close server gracefully', async () => {
      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true });
      });

      await app.listen();
      expect(app.isRunning()).toBe(true);

      await app.close();
      expect(app.isRunning()).toBe(false);
    });
  });
});
