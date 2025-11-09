/**
 * @module runtime/app-core.test
 * @description Tests for GatiApp HTTP server and request handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from './app-core';
import type { Handler } from './types';
import http from 'http';

describe('app-core', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({ port: 0, logging: false }); // Random port
  });

  afterEach(async () => {
    if (app.isRunning()) {
      await app.close();
    }
  });

  describe('createApp', () => {
    it('should create app with default config', () => {
      const defaultApp = createApp();
      expect(defaultApp).toBeDefined();
      expect(defaultApp.isRunning()).toBe(false);
    });

    it('should create app with custom config', () => {
      const customApp = createApp({
        port: 4000,
        host: '0.0.0.0',
        timeout: 60000,
        logging: true,
      });
      expect(customApp).toBeDefined();
      expect(customApp.getConfig().port).toBe(4000);
      expect(customApp.getConfig().host).toBe('0.0.0.0');
      expect(customApp.getConfig().timeout).toBe(60000);
      expect(customApp.getConfig().logging).toBe(true);
    });
  });

  describe('route registration', () => {
    it('should register GET handler', async () => {
      const handler: Handler = (_req, res) => {
        res.json({ method: 'GET' });
      };

      app.get('/test', handler);
      await app.listen();

      const response = await makeRequest(app, 'GET', '/test');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ method: 'GET' });
    });

    it('should register POST handler', async () => {
      const handler: Handler = (_req, res) => {
        res.json({ method: 'POST' });
      };

      app.post('/test', handler);
      await app.listen();

      const response = await makeRequest(app, 'POST', '/test');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ method: 'POST' });
    });

    it('should register PUT handler', async () => {
      const handler: Handler = (_req, res) => {
        res.json({ method: 'PUT' });
      };

      app.put('/test', handler);
      await app.listen();

      const response = await makeRequest(app, 'PUT', '/test');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ method: 'PUT' });
    });

    it('should register PATCH handler', async () => {
      const handler: Handler = (_req, res) => {
        res.json({ method: 'PATCH' });
      };

      app.patch('/test', handler);
      await app.listen();

      const response = await makeRequest(app, 'PATCH', '/test');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ method: 'PATCH' });
    });

    it('should register DELETE handler', async () => {
      const handler: Handler = (_req, res) => {
        res.json({ method: 'DELETE' });
      };

      app.delete('/test', handler);
      await app.listen();

      const response = await makeRequest(app, 'DELETE', '/test');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ method: 'DELETE' });
    });

    it('should handle 404 for unregistered routes', async () => {
      await app.listen();

      const response = await makeRequest(app, 'GET', '/nonexistent');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('middleware', () => {
    it('should execute middleware before handler', async () => {
      const order: string[] = [];

      app.use((_req, _res, _gctx, _lctx, next) => {
        order.push('middleware');
        void next();
      });

      app.get('/test', (_req, res) => {
        order.push('handler');
        res.json({ ok: true });
      });

      await app.listen();
      await makeRequest(app, 'GET', '/test');

      expect(order).toEqual(['middleware', 'handler']);
    });

    it('should execute multiple middlewares in order', async () => {
      const order: string[] = [];

      app.use((_req, _res, _gctx, _lctx, next) => {
        order.push('middleware1');
        void next();
      });

      app.use((_req, _res, _gctx, _lctx, next) => {
        order.push('middleware2');
        void next();
      });

      app.get('/test', (_req, res) => {
        order.push('handler');
        res.json({ ok: true });
      });

      await app.listen();
      await makeRequest(app, 'GET', '/test');

      expect(order).toEqual(['middleware1', 'middleware2', 'handler']);
    });

    it('should apply middleware to specific path', async () => {
      const executed: string[] = [];

      const apiMiddleware = (_req: unknown, _res: unknown, _gctx: unknown, _lctx: unknown, next: () => void) => {
        executed.push('api-middleware');
        void next();
      };

      app.use(apiMiddleware);

      app.get('/api/users', (_req, res) => {
        res.json({ ok: true });
      });

      app.get('/other', (_req, res) => {
        res.json({ ok: true });
      });

      await app.listen();

      executed.length = 0;
      await makeRequest(app, 'GET', '/api/users');
      expect(executed).toContain('api-middleware');

      executed.length = 0;
      await makeRequest(app, 'GET', '/other');
      expect(executed).toContain('api-middleware');
    });
  });

  describe('error handling', () => {
    it('should catch handler errors', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      await app.listen();
      const response = await makeRequest(app, 'GET', '/error');

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as { error: string };
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('request body parsing', () => {
    it('should parse JSON body', async () => {
      app.post('/json', (req, res) => {
        res.json(req.body);
      });

      await app.listen();

      const response = await makeRequest(app, 'POST', '/json', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test', value: 123 }),
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ name: 'test', value: 123 });
    });

    it('should parse URL-encoded body', async () => {
      app.post('/form', (req, res) => {
        res.json(req.body);
      });

      await app.listen();

      const response = await makeRequest(app, 'POST', '/form', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'name=test&value=123',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ name: 'test', value: '123' });
    });

    it('should parse text body', async () => {
      app.post('/text', (req, res) => {
        res.json({ received: req.body });
      });

      await app.listen();

      const response = await makeRequest(app, 'POST', '/text', {
        headers: { 'Content-Type': 'text/plain' },
        body: 'Hello World',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ received: 'Hello World' });
    });
  });

  describe('server lifecycle', () => {
    it('should start server on listen()', async () => {
      expect(app.isRunning()).toBe(false);
      await app.listen();
      expect(app.isRunning()).toBe(true);
    });

    it('should stop server on close()', async () => {
      await app.listen();
      expect(app.isRunning()).toBe(true);

      await app.close();
      expect(app.isRunning()).toBe(false);
    });
  });

  describe('request timeout', () => {
    it('should timeout long-running requests', async () => {
      const shortTimeoutApp = createApp({ port: 0, timeout: 100, logging: false });

      shortTimeoutApp.get('/slow', async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        res.json({ ok: true });
      });

      await shortTimeoutApp.listen();

      const response = await makeRequest(shortTimeoutApp, 'GET', '/slow');
      expect(response.statusCode).toBe(408);

      await shortTimeoutApp.close();
    });
  });

  describe('context management', () => {
    it('should provide local context with request ID', async () => {
      app.get('/lctx', (_req, res, _gctx, lctx) => {
        res.json({ requestId: lctx.requestId });
      });

      await app.listen();
      const response = await makeRequest(app, 'GET', '/lctx');

      const body = JSON.parse(response.body) as { requestId: string };
      expect(body.requestId).toBeDefined();
      expect(typeof body.requestId).toBe('string');
    });
  });
});

/**
 * Helper function to make HTTP requests to the app
 */
async function makeRequest(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  options?: { headers?: Record<string, string>; body?: string }
): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
  const config = app.getConfig();
  const port = config.port;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: options?.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            body,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);

    if (options?.body) {
      req.write(options.body);
    }

    req.end();
  });
}
