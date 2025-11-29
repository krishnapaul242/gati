import { describe, it, expect } from 'vitest';
import { RequestBuilder } from './helpers.js';

describe('RequestBuilder', () => {
  it('should build GET request', () => {
    const req = new RequestBuilder()
      .get('/users')
      .query({ page: '1' })
      .build();

    expect(req.method).toBe('GET');
    expect(req.path).toBe('/users');
    expect(req.query).toEqual({ page: '1' });
  });

  it('should build POST request with JSON body', () => {
    const req = new RequestBuilder()
      .post('/users')
      .json({ name: 'John' })
      .build();

    expect(req.method).toBe('POST');
    expect(req.body).toEqual({ name: 'John' });
    expect(req.headers!['content-type']).toBe('application/json');
  });

  it('should add authorization header', () => {
    const req = new RequestBuilder()
      .get('/protected')
      .auth('Bearer token123')
      .build();

    expect(req.headers!['authorization']).toBe('Bearer token123');
  });

  it('should set custom headers', () => {
    const req = new RequestBuilder()
      .get('/test')
      .header('X-Custom', 'value')
      .build();

    expect(req.headers!['X-Custom']).toBe('value');
  });
});
