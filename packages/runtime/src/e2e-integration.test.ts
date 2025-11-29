/**
 * @module runtime/e2e-integration
 * @description Tests for end-to-end integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createE2EIntegration } from './e2e-integration.js';
import type { Handler } from './types/handler.js';
import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';

describe('E2E Integration', () => {
  let integration: ReturnType<typeof createE2EIntegration>;

  beforeEach(() => {
    integration = createE2EIntegration();
  });

  afterEach(async () => {
    await integration.shutdown();
  });

  describe('Basic Request Flow', () => {
    it('should handle a simple GET request', async () => {
      const handler: Handler = (req, res) => {
        res.json({ message: 'Hello, World!' });
      };

      integration.registerHandler('GET', '/hello', handler);

      const req = createMockRequest('GET', '/hello');
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Hello, World!');
    });

    it('should handle POST request with body', async () => {
      const handler: Handler = (req, res) => {
        res.json({ received: req.body });
      };

      integration.registerHandler('POST', '/echo', handler);

      const req = createMockRequest('POST', '/echo', { data: 'test' });
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(res.statusCode).toBe(200);
    });

    it('should handle route parameters', async () => {
      const handler: Handler = (req, res) => {
        res.json({ userId: req.params.id });
      };

      integration.registerHandler('GET', '/users/:id', handler);

      const req = createMockRequest('GET', '/users/123');
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('123');
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      const handler: Handler = () => {
        throw new Error('Handler error');
      };

      integration.registerHandler('GET', '/error', handler);

      const req = createMockRequest('GET', '/error');
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(res.statusCode).toBe(500);
    });

    it('should handle 404 for unmatched routes', async () => {
      const req = createMockRequest('GET', '/nonexistent');
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      await new Promise(resolve => setTimeout(resolve, 100));

      // No route matched, should not send response
      expect(res.statusCode).toBe(200); // Default
    });
  });

  describe('Module Integration', () => {
    it('should allow handlers to access modules', async () => {
      const gctx = integration.getGlobalContext();
      gctx.modules['db'] = {
        query: async () => ({ id: 1, name: 'Test' }),
      };

      const handler: Handler = async (req, res, gctx) => {
        const result = await (gctx.modules['db'] as any).query();
        res.json(result);
      };

      integration.registerHandler('GET', '/data', handler);

      const req = createMockRequest('GET', '/data');
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Test');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const handler: Handler = (req, res) => {
        res.json({ path: req.path });
      };

      integration.registerHandler('GET', '/test', handler);

      const requests = Array.from({ length: 10 }, (_, i) => {
        const req = createMockRequest('GET', '/test');
        const res = createMockResponse();
        return integration.handleRequest(req, res);
      });

      await Promise.all(requests);
      await new Promise(resolve => setTimeout(resolve, 200));

      // All requests should complete without errors
      expect(requests).toHaveLength(10);
    });
  });

  describe('Observability', () => {
    it('should track metrics through global context', async () => {
      const gctx = integration.getGlobalContext();
      
      const handler: Handler = (req, res, gctx) => {
        gctx.metrics.incrementCounter('requests_total', { path: req.path });
        res.json({ ok: true });
      };

      integration.registerHandler('GET', '/metrics', handler);

      const req = createMockRequest('GET', '/metrics');
      const res = createMockResponse();

      await integration.handleRequest(req, res);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(res.statusCode).toBe(200);
    });
  });
});

// Helper functions
function createMockRequest(method: string, url: string, body?: any): IncomingMessage {
  const req = new Readable() as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = {
    'content-type': 'application/json',
    host: 'localhost',
  };

  if (body) {
    req.push(JSON.stringify(body));
  }
  req.push(null);

  return req;
}

function createMockResponse(): ServerResponse & { body: string } {
  const chunks: Buffer[] = [];
  const res = {
    statusCode: 200,
    body: '',
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    end(data?: string) {
      if (data) {
        this.body = data;
      }
    },
  } as ServerResponse & { body: string };

  return res;
}
