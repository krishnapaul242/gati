/**
 * @module runtime/request.test
 * @description Tests for request parsing functionality
 */

import { describe, it, expect } from 'vitest';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { createRequest } from './request';

describe('createRequest', () => {
  describe('query string parsing', () => {
    it('should parse query parameters from URL', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.url = '/api/users?name=john&age=30';
      req.method = 'GET';

      const request = createRequest({
        method: 'GET',
        path: '/api/users',
        raw: req,
      });

      expect(request.query).toEqual({
        name: 'john',
        age: '30',
      });
      expect(request.path).toBe('/api/users');
    });

    it('should handle array query parameters', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.url = '/api/users?tags=javascript&tags=typescript';
      req.method = 'GET';

      const request = createRequest({
        method: 'GET',
        path: '/api/users',
        raw: req,
      });

      expect(request.query['tags']).toEqual(['javascript', 'typescript']);
    });

    it('should handle URL without query parameters', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.url = '/api/users';
      req.method = 'GET';

      const request = createRequest({
        method: 'GET',
        path: '/api/users',
        raw: req,
      });

      expect(request.query).toEqual({});
    });

    it('should use provided query over parsed query', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.url = '/api/users?name=john';
      req.method = 'GET';

      const request = createRequest({
        method: 'GET',
        path: '/api/users',
        query: { name: 'jane' },
        raw: req,
      });

      expect(request.query).toEqual({ name: 'jane' });
    });
  });

  describe('header extraction', () => {
    it('should extract headers from IncomingMessage', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
        'x-custom-header': 'custom-value',
      };
      req.url = '/api/users';
      req.method = 'POST';

      const request = createRequest({
        method: 'POST',
        path: '/api/users',
        raw: req,
      });

      expect(request.headers).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
        'x-custom-header': 'custom-value',
      });
    });

    it('should use provided headers over IncomingMessage headers', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.headers = {
        'content-type': 'application/json',
      };
      req.url = '/api/users';
      req.method = 'GET';

      const request = createRequest({
        method: 'GET',
        path: '/api/users',
        headers: { 'content-type': 'text/plain' },
        raw: req,
      });

      expect(request.headers).toEqual({
        'content-type': 'text/plain',
      });
    });
  });

  describe('basic request properties', () => {
    it('should create request with all properties', () => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.url = '/api/users/123';
      req.method = 'GET';
      req.headers = { 'content-type': 'application/json' };

      const request = createRequest({
        method: 'GET',
        path: '/api/users/123',
        params: { id: '123' },
        body: { test: true },
        rawBody: '{"test":true}',
        raw: req,
      });

      expect(request.method).toBe('GET');
      expect(request.path).toBe('/api/users/123');
      expect(request.params).toEqual({ id: '123' });
      expect(request.body).toEqual({ test: true });
      expect(request.rawBody).toBe('{"test":true}');
      expect(request.raw).toBe(req);
    });
  });
});
