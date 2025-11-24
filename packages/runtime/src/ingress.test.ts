/**
 * @module runtime/ingress.test
 * @description Tests for Ingress component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IncomingMessage } from 'http';
import { Readable } from 'stream';
import type { Ingress } from './ingress.js';
import { createIngress } from './ingress.js';
import type {
  IngressConfig,
  QueueFabric,
  RequestDescriptor,
} from './types/ingress.js';

/**
 * Create a mock IncomingMessage for testing
 */
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[]>;
  body?: string;
}): IncomingMessage {
  const readable = new Readable({
    read() {
      if (options.body) {
        this.push(options.body);
      }
      this.push(null);
    },
  });

  const req = readable as unknown as IncomingMessage;
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = options.headers || {};

  return req;
}

/**
 * Create a mock QueueFabric for testing
 */
function createMockQueueFabric(): QueueFabric & {
  publishedMessages: RequestDescriptor[];
} {
  const publishedMessages: RequestDescriptor[] = [];

  return {
    publishedMessages,
    publish(topic: string, payload: RequestDescriptor): Promise<void> {
      publishedMessages.push(payload);
      return Promise.resolve();
    },
  };
}

describe('Ingress', () => {
  let config: IngressConfig;
  let queueFabric: ReturnType<typeof createMockQueueFabric>;
  let ingress: Ingress;

  beforeEach(() => {
    config = {
      authMethod: 'none',
      requireAuth: false,
      routingTopic: 'routing.requests',
    };
    queueFabric = createMockQueueFabric();
    ingress = createIngress(config, queueFabric);
  });

  describe('handleRequest', () => {
    it('should process a basic GET request', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users',
        headers: {
          'user-agent': 'test-agent',
        },
      });

      await ingress.handleRequest(req);

      expect(queueFabric.publishedMessages).toHaveLength(1);
      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.method).toBe('GET');
      expect(descriptor.path).toBe('/api/users');
      expect(descriptor.requestId).toMatch(/^req-/);
      expect(descriptor.headers['x-request-id']).toBe(descriptor.requestId);
    });

    it('should process a POST request with body', async () => {
      const body = JSON.stringify({ name: 'Test User' });
      const req = createMockRequest({
        method: 'POST',
        url: '/api/users',
        headers: {
          'content-type': 'application/json',
        },
        body,
      });

      await ingress.handleRequest(req);

      expect(queueFabric.publishedMessages).toHaveLength(1);
      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.method).toBe('POST');
      expect(descriptor.body.toString()).toBe(body);
    });

    it('should extract version preference from header', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users',
        headers: {
          'x-version': 'v2',
        },
      });

      await ingress.handleRequest(req);

      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.versionPreference).toBe('v2');
    });

    it('should extract version preference from query parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users?version=v3',
      });

      await ingress.handleRequest(req);

      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.versionPreference).toBe('v3');
    });

    it('should extract priority from header', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users',
        headers: {
          'x-priority': '8',
        },
      });

      await ingress.handleRequest(req);

      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.priority).toBe(8);
    });

    it('should default priority to 5', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users',
      });

      await ingress.handleRequest(req);

      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.priority).toBe(5);
    });

    it('should clamp priority to 0-10 range', async () => {
      const req1 = createMockRequest({
        method: 'GET',
        url: '/api/users',
        headers: { 'x-priority': '15' },
      });

      await ingress.handleRequest(req1);
      expect(queueFabric.publishedMessages[0].priority).toBe(10);

      queueFabric.publishedMessages.length = 0;

      const req2 = createMockRequest({
        method: 'GET',
        url: '/api/users',
        headers: { 'x-priority': '-5' },
      });

      await ingress.handleRequest(req2);
      expect(queueFabric.publishedMessages[0].priority).toBe(0);
    });

    it('should extract flags from header', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users',
        headers: {
          'x-flags': 'debug, trace, verbose',
        },
      });

      await ingress.handleRequest(req);

      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.flags).toEqual(['debug', 'trace', 'verbose']);
    });

    it('should include timestamp', async () => {
      const before = Date.now();
      const req = createMockRequest({
        method: 'GET',
        url: '/api/users',
      });

      await ingress.handleRequest(req);
      const after = Date.now();

      const descriptor = queueFabric.publishedMessages[0];
      expect(descriptor.timestamp).toBeGreaterThanOrEqual(before);
      expect(descriptor.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('authenticate', () => {
    it('should authenticate with none method', async () => {
      const req = createMockRequest({});
      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(true);
    });

    it('should authenticate with valid API key', async () => {
      config.authMethod = 'api-key';
      config.apiKeys = new Set(['test-key-123']);
      ingress = createIngress(config, queueFabric);

      const req = createMockRequest({
        headers: {
          'x-api-key': 'test-key-123',
        },
      });

      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(true);
      expect(result.clientId).toBe('test-key-123');
      expect(result.roles).toEqual(['api-user']);
    });

    it('should reject invalid API key', async () => {
      config.authMethod = 'api-key';
      config.apiKeys = new Set(['valid-key']);
      ingress = createIngress(config, queueFabric);

      const req = createMockRequest({
        headers: {
          'x-api-key': 'invalid-key',
        },
      });

      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should reject missing API key', async () => {
      config.authMethod = 'api-key';
      config.apiKeys = new Set(['valid-key']);
      ingress = createIngress(config, queueFabric);

      const req = createMockRequest({});

      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Missing API key');
    });

    it('should authenticate with JWT', async () => {
      config.authMethod = 'jwt';
      config.jwtSecret = 'test-secret';
      ingress = createIngress(config, queueFabric);

      // Create a simple JWT-like token (base64url encoded)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ sub: 'user-123', roles: ['admin', 'user'] })
      ).toString('base64url');
      const signature = 'fake-signature';
      const token = `${header}.${payload}.${signature}`;

      const req = createMockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(true);
      expect(result.clientId).toBe('user-123');
      expect(result.roles).toEqual(['admin', 'user']);
    });

    it('should reject invalid JWT format', async () => {
      config.authMethod = 'jwt';
      config.jwtSecret = 'test-secret';
      ingress = createIngress(config, queueFabric);

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toContain('Invalid JWT format');
    });

    it('should reject missing JWT', async () => {
      config.authMethod = 'jwt';
      config.jwtSecret = 'test-secret';
      ingress = createIngress(config, queueFabric);

      const req = createMockRequest({});

      const result = await ingress.authenticate(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Missing or invalid Authorization header');
    });

    it('should throw error when auth required and fails', async () => {
      config.authMethod = 'api-key';
      config.apiKeys = new Set(['valid-key']);
      config.requireAuth = true;
      ingress = createIngress(config, queueFabric);

      const req = createMockRequest({});

      await expect(ingress.handleRequest(req)).rejects.toThrow(
        'Authentication failed: Missing API key'
      );
    });
  });

  describe('normalizeHeaders', () => {
    it('should normalize header names to lowercase', () => {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'test-agent',
        'X-Custom-Header': 'value',
      };

      const normalized = ingress.normalizeHeaders(headers);

      expect(normalized['content-type']).toBe('application/json');
      expect(normalized['user-agent']).toBe('test-agent');
      expect(normalized['x-custom-header']).toBe('value');
    });

    it('should add x-forwarded-for if missing', () => {
      const headers = {};

      const normalized = ingress.normalizeHeaders(headers);

      expect(normalized['x-forwarded-for']).toBe('unknown');
    });

    it('should preserve x-forwarded-for if present', () => {
      const headers = {
        'x-forwarded-for': '192.168.1.1',
      };

      const normalized = ingress.normalizeHeaders(headers);

      expect(normalized['x-forwarded-for']).toBe('192.168.1.1');
    });
  });

  describe('assignRequestId', () => {
    it('should generate unique request IDs', () => {
      const metadata = {
        path: '/api/users',
        priority: 5,
        flags: [],
        timestamp: Date.now(),
      };

      const id1 = ingress.assignRequestId(metadata);
      const id2 = ingress.assignRequestId(metadata);

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req-[0-9a-f-]+$/);
      expect(id2).toMatch(/^req-[0-9a-f-]+$/);
    });

    it('should use custom prefix', () => {
      config.requestIdPrefix = 'custom';
      ingress = createIngress(config, queueFabric);

      const metadata = {
        path: '/api/users',
        priority: 5,
        flags: [],
        timestamp: Date.now(),
      };

      const id = ingress.assignRequestId(metadata);

      expect(id).toMatch(/^custom-[0-9a-f-]+$/);
    });
  });

  describe('publishToRoutingFabric', () => {
    it('should publish descriptor to configured topic', async () => {
      const descriptor: RequestDescriptor = {
        requestId: 'test-id',
        path: '/api/users',
        method: 'GET',
        headers: { 'x-request-id': 'test-id' },
        body: Buffer.from(''),
        priority: 5,
        flags: [],
        timestamp: Date.now(),
      };

      await ingress.publishToRoutingFabric(descriptor);

      expect(queueFabric.publishedMessages).toHaveLength(1);
      expect(queueFabric.publishedMessages[0]).toEqual(descriptor);
    });
  });
});
