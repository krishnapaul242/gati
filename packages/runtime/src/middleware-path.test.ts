/**
 * @module runtime/middleware-path.test
 * @description Tests for middleware path matching
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMiddlewareManager } from './middleware';
import type { Middleware } from './types/middleware';
import { createRequest } from './request';
import { createResponse } from './response';
import { createGlobalContext } from './global-context';
import { createLocalContext } from './local-context';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

describe('MiddlewareManager - Path Matching', () => {
  let manager: ReturnType<typeof createMiddlewareManager>;

  beforeEach(() => {
    manager = createMiddlewareManager();
  });

  describe('wildcard matching', () => {
    it('should match all paths with * pattern', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '*' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/any/path/here';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/any/path/here', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(true);
    });

    it('should match prefix with /api/* pattern', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '/api/*' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/api/users/123';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/api/users/123', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(true);
    });

    it('should not match non-prefix with /api/* pattern', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '/api/*' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/other/path';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/other/path', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(false);
    });
  });

  describe('parameter matching', () => {
    it('should match path with parameters', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '/api/:version/users' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/api/v1/users';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/api/v1/users', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(true);
    });

    it('should not match path with wrong parameter structure', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '/api/:version/users' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/api/users';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/api/users', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(false);
    });
  });

  describe('exact matching', () => {
    it('should match exact path', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '/api/users' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/api/users';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/api/users', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(true);
    });

    it('should not match different path', async () => {
      let called = false;
      const middleware: Middleware = async (_req, _res, _gctx, _lctx, next) => {
        called = true;
        await next();
      };

      manager.use(middleware, { path: '/api/users' });

      const socket = new Socket();
      const incomingMsg = new IncomingMessage(socket);
      incomingMsg.url = '/api/posts';
      const serverRes = new ServerResponse(incomingMsg);

      const req = createRequest({ method: 'GET', path: '/api/posts', raw: incomingMsg });
      const res = createResponse({ raw: serverRes });
      const gctx = createGlobalContext();
      const lctx = createLocalContext();

      await manager.execute(req, res, gctx, lctx, async () => {});

      expect(called).toBe(false);
    });
  });
});
