/**
 * @module @gati-framework/testing/helpers
 * @description Test helper functions
 */

import type { Request } from '@gati-framework/runtime';

/**
 * Request builder for creating test requests
 */
export class RequestBuilder {
  private req: Partial<Request> = {
    method: 'GET',
    path: '/',
    params: {},
    query: {},
    headers: {},
    body: null
  };

  method(method: string): this {
    this.req.method = method;
    return this;
  }

  path(path: string): this {
    this.req.path = path;
    return this;
  }

  get(path: string): this {
    this.req.method = 'GET';
    this.req.path = path;
    return this;
  }

  post(path: string): this {
    this.req.method = 'POST';
    this.req.path = path;
    return this;
  }

  put(path: string): this {
    this.req.method = 'PUT';
    this.req.path = path;
    return this;
  }

  delete(path: string): this {
    this.req.method = 'DELETE';
    this.req.path = path;
    return this;
  }

  body(body: any): this {
    this.req.body = body;
    return this;
  }

  json(data: any): this {
    this.req.body = data;
    this.req.headers!['content-type'] = 'application/json';
    return this;
  }

  header(name: string, value: string): this {
    this.req.headers![name] = value;
    return this;
  }

  auth(token: string): this {
    this.req.headers!['authorization'] = token;
    return this;
  }

  query(params: Record<string, string>): this {
    this.req.query = params;
    return this;
  }

  params(params: Record<string, string>): this {
    this.req.params = params;
    return this;
  }

  build(): Partial<Request> {
    return this.req;
  }
}
