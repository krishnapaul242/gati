/**
 * @module tests/unit/runtime/response.test
 * @description Unit tests for Response object factory
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { describe, it, expect, vi } from 'vitest';
import { createResponse } from '@gati-framework/runtime/response';
import type { ServerResponse } from 'http';

describe('Response', () => {
  function createMockServerResponse(): ServerResponse {
    return {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;
  }

  describe('status', () => {
    it('should set status code', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.status(404);

      expect(mockRaw.statusCode).toBe(404);
    });

    it('should return response for chaining', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      const result = res.status(200);

      expect(result).toBe(res);
    });
  });

  describe('header', () => {
    it('should set a single header', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.header('Content-Type', 'application/json');

      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
    });

    it('should return response for chaining', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      const result = res.header('X-Custom', 'value');

      expect(result).toBe(res);
    });

    it('should handle numeric header values', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.header('Content-Length', 1234);

      expect(mockRaw.setHeader).toHaveBeenCalledWith('Content-Length', 1234);
    });

    it('should handle array header values', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.header('Set-Cookie', ['cookie1=value1', 'cookie2=value2']);

      expect(mockRaw.setHeader).toHaveBeenCalledWith('Set-Cookie', [
        'cookie1=value1',
        'cookie2=value2',
      ]);
    });
  });

  describe('headers', () => {
    it('should set multiple headers', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Length': 100,
      });

      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockRaw.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRaw.setHeader).toHaveBeenCalledWith('Content-Length', 100);
    });

    it('should return response for chaining', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      const result = res.headers({ 'X-Custom': 'value' });

      expect(result).toBe(res);
    });
  });

  describe('json', () => {
    it('should send JSON response', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });
      const data = { user: { id: '123', name: 'Alice' } };

      res.json(data);

      const expectedBody = JSON.stringify(data);
      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        Buffer.byteLength(expectedBody)
      );
      expect(mockRaw.end).toHaveBeenCalledWith(expectedBody);
    });

    it('should mark response as sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      expect(res.isSent()).toBe(false);

      res.json({ ok: true });

      expect(res.isSent()).toBe(true);
    });

    it('should throw if response already sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.json({ ok: true });

      expect(() => res.json({ error: 'test' })).toThrow('Response already sent');
    });
  });

  describe('text', () => {
    it('should send text response', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });
      const text = 'Hello, World!';

      res.text(text);

      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain'
      );
      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        Buffer.byteLength(text)
      );
      expect(mockRaw.end).toHaveBeenCalledWith(text);
    });

    it('should mark response as sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.text('test');

      expect(res.isSent()).toBe(true);
    });

    it('should throw if response already sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.text('test');

      expect(() => res.text('error')).toThrow('Response already sent');
    });
  });

  describe('send', () => {
    it('should send string data', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });
      const data = '<html>test</html>';

      res.send(data);

      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        Buffer.byteLength(data)
      );
      expect(mockRaw.end).toHaveBeenCalledWith(data);
    });

    it('should send Buffer data', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });
      const buffer = Buffer.from('binary data');

      res.send(buffer);

      expect(mockRaw.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        buffer.length
      );
      expect(mockRaw.end).toHaveBeenCalledWith(buffer);
    });

    it('should mark response as sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.send('test');

      expect(res.isSent()).toBe(true);
    });

    it('should throw if response already sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.send('test');

      expect(() => res.send('error')).toThrow('Response already sent');
    });
  });

  describe('end', () => {
    it('should end response without data', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.end();

      expect(mockRaw.end).toHaveBeenCalledWith();
    });

    it('should mark response as sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.end();

      expect(res.isSent()).toBe(true);
    });

    it('should throw if response already sent', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.end();

      expect(() => res.end()).toThrow('Response already sent');
    });
  });

  describe('method chaining', () => {
    it('should support chaining status and headers', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res
        .status(201)
        .header('X-Request-Id', '123')
        .headers({ 'Cache-Control': 'no-cache' })
        .json({ created: true });

      expect(mockRaw.statusCode).toBe(201);
      expect(mockRaw.setHeader).toHaveBeenCalledWith('X-Request-Id', '123');
      expect(mockRaw.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    });

    it('should support status + json', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.status(404).json({ error: 'Not found' });

      expect(mockRaw.statusCode).toBe(404);
      expect(mockRaw.end).toHaveBeenCalled();
    });
  });

  describe('isSent', () => {
    it('should return false initially', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      expect(res.isSent()).toBe(false);
    });

    it('should return true after json', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.json({});

      expect(res.isSent()).toBe(true);
    });

    it('should return true after text', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.text('test');

      expect(res.isSent()).toBe(true);
    });

    it('should return true after send', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.send('test');

      expect(res.isSent()).toBe(true);
    });

    it('should return true after end', () => {
      const mockRaw = createMockServerResponse();
      const res = createResponse({ raw: mockRaw });

      res.end();

      expect(res.isSent()).toBe(true);
    });
  });
});
