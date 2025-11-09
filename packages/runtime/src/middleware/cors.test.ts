/**
 * @module runtime/middleware/cors.test
 * @description Tests for CORS middleware
 */

import { describe, it, expect } from 'vitest';
import { createCorsMiddleware } from './cors';
import { createRequest } from '../request';
import { createResponse } from '../response';
import { createGlobalContext } from '../global-context';
import { createLocalContext } from '../local-context';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import type { HttpMethod } from '../types/request';

describe('CORS Middleware', () => {
  function createMockRequest(method: string, headers: Record<string, string> = {}) {
    const socket = new Socket();
    const incomingMsg = new IncomingMessage(socket);
    incomingMsg.url = '/test';
    incomingMsg.method = method;
    incomingMsg.headers = headers;
    return createRequest({ method: method as HttpMethod, path: '/test', raw: incomingMsg });
  }

  function createMockResponse() {
    const socket = new Socket();
    const incomingMsg = new IncomingMessage(socket);
    const serverRes = new ServerResponse(incomingMsg);
    return createResponse({ raw: serverRes });
  }

  describe('default configuration', () => {
    it('should set Access-Control-Allow-Origin to *', async () => {
      const middleware = createCorsMiddleware();
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      let nextCalled = false;
      await middleware(req, res, gctx, lctx, () => {
        nextCalled = true;
        return Promise.resolve();
      });

      expect(nextCalled).toBe(true);
      expect(res.raw.getHeader('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should handle OPTIONS preflight request', async () => {
      const middleware = createCorsMiddleware();
      const req = createMockRequest('OPTIONS');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      let nextCalled = false;
      await middleware(req, res, gctx, lctx, () => {
        nextCalled = true;
        return Promise.resolve();
      });

      expect(nextCalled).toBe(false); // Should not call next for OPTIONS
      expect(res.raw.statusCode).toBe(204);
      expect(res.raw.getHeader('Access-Control-Allow-Methods')).toContain('GET');
      expect(res.raw.getHeader('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('specific origin', () => {
    it('should set Access-Control-Allow-Origin to specific origin', async () => {
      const middleware = createCorsMiddleware({ origin: 'https://example.com' });
      const req = createMockRequest('GET', { origin: 'https://example.com' });
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Origin')).toBe('https://example.com');
    });
  });

  describe('multiple origins', () => {
    it('should allow matching origin from array', async () => {
      const middleware = createCorsMiddleware({ 
        origin: ['https://app1.com', 'https://app2.com'] 
      });
      const req = createMockRequest('GET', { origin: 'https://app2.com' });
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Origin')).toBe('https://app2.com');
    });

    it('should use first origin if request origin not in array', async () => {
      const middleware = createCorsMiddleware({ 
        origin: ['https://app1.com', 'https://app2.com'] 
      });
      const req = createMockRequest('GET', { origin: 'https://other.com' });
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Origin')).toBe('https://app1.com');
    });
  });

  describe('dynamic origin validation', () => {
    it('should allow origin matching function criteria', async () => {
      const middleware = createCorsMiddleware({ 
        origin: (origin) => origin.endsWith('.example.com') 
      });
      const req = createMockRequest('GET', { origin: 'https://app.example.com' });
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Origin')).toBe('https://app.example.com');
    });

    it('should not allow origin not matching function criteria', async () => {
      const middleware = createCorsMiddleware({ 
        origin: (origin) => origin.endsWith('.example.com') 
      });
      const req = createMockRequest('GET', { origin: 'https://other.com' });
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('credentials', () => {
    it('should set Access-Control-Allow-Credentials when enabled', async () => {
      const middleware = createCorsMiddleware({ credentials: true });
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should not set Access-Control-Allow-Credentials when disabled', async () => {
      const middleware = createCorsMiddleware({ credentials: false });
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Allow-Credentials')).toBeUndefined();
    });
  });

  describe('custom headers', () => {
    it('should set custom allowed headers in preflight', async () => {
      const middleware = createCorsMiddleware({ 
        allowedHeaders: ['X-Custom-Header', 'Authorization'] 
      });
      const req = createMockRequest('OPTIONS');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      const headers = res.raw.getHeader('Access-Control-Allow-Headers');
      expect(headers).toContain('X-Custom-Header');
      expect(headers).toContain('Authorization');
    });

    it('should set exposed headers', async () => {
      const middleware = createCorsMiddleware({ 
        exposedHeaders: ['X-Total-Count', 'X-Page-Number'] 
      });
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      const headers = res.raw.getHeader('Access-Control-Expose-Headers');
      expect(headers).toContain('X-Total-Count');
      expect(headers).toContain('X-Page-Number');
    });
  });

  describe('custom methods', () => {
    it('should set custom allowed methods in preflight', async () => {
      const middleware = createCorsMiddleware({ 
        methods: ['GET', 'POST'] 
      });
      const req = createMockRequest('OPTIONS');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      const methods = res.raw.getHeader('Access-Control-Allow-Methods');
      expect(methods).toBe('GET, POST');
    });
  });

  describe('max age', () => {
    it('should set Access-Control-Max-Age in preflight', async () => {
      const middleware = createCorsMiddleware({ maxAge: 7200 });
      const req = createMockRequest('OPTIONS');
      const res = createMockResponse();
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await middleware(req, res, gctx, lctx, async () => {});

      expect(res.raw.getHeader('Access-Control-Max-Age')).toBe('7200');
    });
  });
});
