import { describe, it, expect } from 'vitest';
import { 
  createTestRequest, 
  createTestResponse, 
  testHandler, 
  assertStatus, 
  assertBody 
} from './helpers';
import type { Handler } from '@gati-framework/core';

describe('createTestRequest', () => {
  it('creates request with defaults', () => {
    const req = createTestRequest();
    
    expect(req.method).toBe('GET');
    expect(req.path).toBe('/');
    expect(req.query).toEqual({});
    expect(req.params).toEqual({});
  });

  it('accepts custom options', () => {
    const req = createTestRequest({
      method: 'POST',
      path: '/users',
      headers: { 'content-type': 'application/json' },
      body: { name: 'test' }
    });
    
    expect(req.method).toBe('POST');
    expect(req.path).toBe('/users');
    expect(req.headers['content-type']).toBe('application/json');
    expect(req.body).toEqual({ name: 'test' });
  });
});

describe('createTestResponse', () => {
  it('creates response with defaults', () => {
    const res = createTestResponse();
    
    expect(res.statusCode).toBe(200);
  });

  it('has json method', () => {
    const res = createTestResponse();
    res.json({ message: 'test' });
    
    expect(res.body).toEqual({ message: 'test' });
  });

  it('has status method', () => {
    const res = createTestResponse();
    const result = res.status(404);
    
    expect(res.statusCode).toBe(404);
    expect(result).toBe(res); // chainable
  });

  it('has send method', () => {
    const res = createTestResponse();
    res.send('text response');
    
    expect(res.body).toBe('text response');
  });
});

describe('testHandler', () => {
  it('executes handler with defaults', async () => {
    const handler: Handler = (req, res) => {
      res.json({ ok: true });
    };

    const result = await testHandler(handler);
    expect(result.response.statusCode).toBe(200);
  });

  it('accepts custom request', async () => {
    const handler: Handler = (req, res) => {
      res.json({ path: req.path });
    };

    const result = await testHandler(handler, { path: '/test' });
    expect(result.response.statusCode).toBe(200);
  });

  it('accepts custom modules', async () => {
    const mockDb = { query: () => 'result' };
    const handler: Handler = (req, res, gctx) => {
      const data = gctx.modules['db'].query();
      res.json({ data });
    };

    const result = await testHandler(handler, {}, { db: mockDb });
    expect(result.response.statusCode).toBe(200);
  });
});

describe('assertStatus', () => {
  it('passes for matching status', () => {
    const res = createTestResponse();
    res.status(200);
    
    expect(() => assertStatus(res, 200)).not.toThrow();
  });

  it('throws for non-matching status', () => {
    const res = createTestResponse();
    res.status(404);
    
    expect(() => assertStatus(res, 200)).toThrow('Expected status 200, got 404');
  });
});

describe('assertBody', () => {
  it('passes for matching body', () => {
    const res = createTestResponse();
    res.json({ message: 'test' });
    
    expect(() => assertBody(res, { message: 'test' })).not.toThrow();
  });

  it('throws for non-matching body', () => {
    const res = createTestResponse();
    res.json({ message: 'test' });
    
    expect(() => assertBody(res, { message: 'other' })).toThrow();
  });

  it('handles string bodies', () => {
    const res = createTestResponse();
    res.send('text');
    
    expect(() => assertBody(res, 'text')).not.toThrow();
  });
});
