/**
 * @module tests/unit/runtime/request.test
 * @description Unit tests for Request object factory
 */

import { describe, it, expect } from 'vitest';
import { createRequest } from '@/runtime/request';
import type { IncomingMessage } from 'http';

describe('Request', () => {
  describe('createRequest', () => {
    it('should create a request with required fields', () => {
      const mockRaw = {} as IncomingMessage;

      const req = createRequest({
        method: 'GET',
        path: '/api/users',
        raw: mockRaw,
      });

      expect(req.method).toBe('GET');
      expect(req.path).toBe('/api/users');
      expect(req.query).toEqual({});
      expect(req.params).toEqual({});
      expect(req.headers).toEqual({});
      expect(req.body).toBeUndefined();
      expect(req.rawBody).toBeUndefined();
      expect(req.raw).toBe(mockRaw);
    });

    it('should create a request with all optional fields', () => {
      const mockRaw = {} as IncomingMessage;
      const body = { name: 'Alice' };
      const rawBody = JSON.stringify(body);

      const req = createRequest({
        method: 'POST',
        path: '/api/users/123',
        query: { filter: 'active' },
        params: { id: '123' },
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer token',
        },
        body,
        rawBody,
        raw: mockRaw,
      });

      expect(req.method).toBe('POST');
      expect(req.path).toBe('/api/users/123');
      expect(req.query).toEqual({ filter: 'active' });
      expect(req.params).toEqual({ id: '123' });
      expect(req.headers).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token',
      });
      expect(req.body).toEqual(body);
      expect(req.rawBody).toBe(rawBody);
      expect(req.raw).toBe(mockRaw);
    });

    it('should handle query parameters with multiple values', () => {
      const req = createRequest({
        method: 'GET',
        path: '/api/search',
        query: {
          tags: ['javascript', 'typescript'],
          limit: '10',
        },
        raw: {} as IncomingMessage,
      });

      expect(req.query['tags']).toEqual(['javascript', 'typescript']);
      expect(req.query['limit']).toBe('10');
    });

    it('should handle headers with multiple values', () => {
      const req = createRequest({
        method: 'GET',
        path: '/api/users',
        headers: {
          'accept': ['application/json', 'text/html'],
          'user-agent': 'Mozilla/5.0',
        },
        raw: {} as IncomingMessage,
      });

      expect(req.headers['accept']).toEqual(['application/json', 'text/html']);
      expect(req.headers['user-agent']).toBe('Mozilla/5.0');
    });

    it('should support all HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

      methods.forEach((method) => {
        const req = createRequest({
          method,
          path: '/api/test',
          raw: {} as IncomingMessage,
        });

        expect(req.method).toBe(method);
      });
    });

    it('should handle Buffer rawBody', () => {
      const rawBody = Buffer.from('binary data');

      const req = createRequest({
        method: 'POST',
        path: '/api/upload',
        rawBody,
        raw: {} as IncomingMessage,
      });

      expect(req.rawBody).toBe(rawBody);
      expect(Buffer.isBuffer(req.rawBody)).toBe(true);
    });
  });
});
