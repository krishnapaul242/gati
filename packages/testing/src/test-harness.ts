/**
 * @module @gati-framework/testing/test-harness
 * @description Test harness for Gati handlers
 */

import type { Handler, Request, Response } from '@gati-framework/runtime';
import { createFakeLocalContext } from './fake-local-context.js';
import { createFakeGlobalContext } from './fake-global-context.js';

export interface TestAppOptions {
  modules?: Record<string, any>;
  config?: Record<string, any>;
}

export interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export interface TestApp {
  request(path: string, options?: Partial<Request>): Promise<TestResponse>;
  get(path: string, handler: Handler): void;
  post(path: string, handler: Handler): void;
  put(path: string, handler: Handler): void;
  delete(path: string, handler: Handler): void;
  use(handler: Handler): void;
}

/**
 * Create test app for handler testing
 */
export function createTestApp(options: TestAppOptions = {}): TestApp {
  const handlers = new Map<string, Handler>();
  const middleware: Handler[] = [];

  const gctx = createFakeGlobalContext({
    modules: options.modules || {},
    config: options.config || {}
  });

  return {
    async request(path: string, reqOptions: Partial<Request> = {}): Promise<TestResponse> {
      const method = reqOptions.method || 'GET';
      const key = `${method}:${path}`;
      const handler = handlers.get(key);

      if (!handler) {
        return { status: 404, body: { error: 'Not found' }, headers: {} };
      }

      const lctx = createFakeLocalContext();
      const req: Request = {
        method,
        path,
        params: {},
        query: {},
        headers: {},
        body: null,
        ...reqOptions
      } as Request;

      let responseData: TestResponse = {
        status: 200,
        body: null,
        headers: {}
      };

      const res: Response = {
        status(code: number) {
          responseData.status = code;
          return this;
        },
        json(data: any) {
          responseData.body = data;
          responseData.headers['content-type'] = 'application/json';
          return this;
        },
        send(data: any) {
          responseData.body = data;
          return this;
        },
        header(name: string, value: string) {
          responseData.headers[name.toLowerCase()] = value;
          return this;
        }
      } as Response;

      try {
        // Run middleware
        for (const mw of middleware) {
          let nextCalled = false;
          const next = () => { nextCalled = true; };
          await mw(req, res, gctx, lctx, next);
          if (!nextCalled) return responseData;
        }

        // Run handler
        await handler(req, res, gctx, lctx);
      } catch (error: any) {
        responseData.status = 500;
        responseData.body = { error: error.message };
      }

      return responseData;
    },

    get(path: string, handler: Handler) {
      handlers.set(`GET:${path}`, handler);
    },

    post(path: string, handler: Handler) {
      handlers.set(`POST:${path}`, handler);
    },

    put(path: string, handler: Handler) {
      handlers.set(`PUT:${path}`, handler);
    },

    delete(path: string, handler: Handler) {
      handlers.set(`DELETE:${path}`, handler);
    },

    use(handler: Handler) {
      middleware.push(handler);
    }
  };
}
