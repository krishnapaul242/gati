/**
 * @module tests/unit/runtime/route-manager.test
 * @description Unit tests for route manager
 */

import { describe, it, expect, vi } from 'vitest';
import { createRouteManager, RouteManager } from '@/runtime/route-manager';
import type { Handler } from '@/runtime/types';

describe('Route Manager', () => {
  function createMockHandler(name: string): Handler {
    const handler: Handler = vi.fn((_req, res) => {
      res.json({ handler: name });
    });
    return handler;
  }

  describe('constructor', () => {
    it('should create a new route manager', () => {
      const manager = new RouteManager();

      expect(manager).toBeInstanceOf(RouteManager);
      expect(manager.size()).toBe(0);
    });

    it('should accept configuration', () => {
      const manager = new RouteManager({
        strict: true,
        caseSensitive: true,
      });

      expect(manager).toBeInstanceOf(RouteManager);
    });
  });

  describe('register', () => {
    it('should register a route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.register('GET', '/users', handler);

      expect(manager.size()).toBe(1);
    });

    it('should register multiple routes', () => {
      const manager = new RouteManager();

      manager.register('GET', '/users', createMockHandler('getUsers'));
      manager.register('POST', '/users', createMockHandler('createUser'));
      manager.register('GET', '/posts', createMockHandler('getPosts'));

      expect(manager.size()).toBe(3);
    });

    it('should normalize paths when registering', () => {
      const manager = new RouteManager();

      manager.register('GET', '//users//', createMockHandler('test'));

      const routes = manager.getRoutes();
      expect(routes[0]?.path).toBe('/users');
    });
  });

  describe('HTTP method shortcuts', () => {
    it('should register GET route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.get('/users', handler);

      const match = manager.match('GET', '/users');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('GET');
    });

    it('should register POST route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.post('/users', handler);

      const match = manager.match('POST', '/users');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('POST');
    });

    it('should register PUT route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.put('/users/:id', handler);

      const match = manager.match('PUT', '/users/123');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('PUT');
    });

    it('should register PATCH route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.patch('/users/:id', handler);

      const match = manager.match('PATCH', '/users/123');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('PATCH');
    });

    it('should register DELETE route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.delete('/users/:id', handler);

      const match = manager.match('DELETE', '/users/123');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('DELETE');
    });

    it('should register HEAD route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.head('/users', handler);

      const match = manager.match('HEAD', '/users');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('HEAD');
    });

    it('should register OPTIONS route', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.options('/users', handler);

      const match = manager.match('OPTIONS', '/users');
      expect(match).not.toBeNull();
      expect(match?.route.method).toBe('OPTIONS');
    });
  });

  describe('match', () => {
    it('should match exact path', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.get('/users', handler);

      const match = manager.match('GET', '/users');
      
      expect(match).not.toBeNull();
      expect(match?.route.handler).toBe(handler);
      expect(match?.params).toEqual({});
    });

    it('should match path with parameters', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.get('/users/:id', handler);

      const match = manager.match('GET', '/users/123');
      
      expect(match).not.toBeNull();
      expect(match?.route.handler).toBe(handler);
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should match path with multiple parameters', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.get('/users/:userId/posts/:postId', handler);

      const match = manager.match('GET', '/users/123/posts/456');
      
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ userId: '123', postId: '456' });
    });

    it('should return null for non-matching path', () => {
      const manager = new RouteManager();

      manager.get('/users', createMockHandler('test'));

      const match = manager.match('GET', '/posts');
      
      expect(match).toBeNull();
    });

    it('should return null for wrong HTTP method', () => {
      const manager = new RouteManager();

      manager.get('/users', createMockHandler('test'));

      const match = manager.match('POST', '/users');
      
      expect(match).toBeNull();
    });

    it('should match first matching route', () => {
      const manager = new RouteManager();
      const handler1 = createMockHandler('handler1');
      const handler2 = createMockHandler('handler2');

      manager.get('/users/:id', handler1);
      manager.get('/users/:name', handler2);

      const match = manager.match('GET', '/users/123');
      
      expect(match?.route.handler).toBe(handler1);
    });

    it('should differentiate between methods', () => {
      const manager = new RouteManager();
      const getHandler = createMockHandler('get');
      const postHandler = createMockHandler('post');

      manager.get('/users', getHandler);
      manager.post('/users', postHandler);

      const getMatch = manager.match('GET', '/users');
      const postMatch = manager.match('POST', '/users');
      
      expect(getMatch?.route.handler).toBe(getHandler);
      expect(postMatch?.route.handler).toBe(postHandler);
    });

    it('should handle trailing slashes', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.get('/users', handler);

      const match = manager.match('GET', '/users/');
      
      expect(match).not.toBeNull();
    });

    it('should handle duplicate slashes', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('test');

      manager.get('/users/:id', handler);

      const match = manager.match('GET', '//users//123//');
      
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ id: '123' });
    });
  });

  describe('getRoutes', () => {
    it('should return all registered routes', () => {
      const manager = new RouteManager();

      manager.get('/users', createMockHandler('getUsers'));
      manager.post('/users', createMockHandler('createUser'));
      manager.get('/posts', createMockHandler('getPosts'));

      const routes = manager.getRoutes();
      
      expect(routes).toHaveLength(3);
      expect(routes[0]?.method).toBe('GET');
      expect(routes[0]?.path).toBe('/users');
      expect(routes[1]?.method).toBe('POST');
      expect(routes[1]?.path).toBe('/users');
      expect(routes[2]?.method).toBe('GET');
      expect(routes[2]?.path).toBe('/posts');
    });

    it('should return a copy of routes array', () => {
      const manager = new RouteManager();

      manager.get('/users', createMockHandler('test'));

      const routes1 = manager.getRoutes();
      const routes2 = manager.getRoutes();
      
      expect(routes1).not.toBe(routes2);
      expect(routes1).toEqual(routes2);
    });
  });

  describe('clear', () => {
    it('should remove all routes', () => {
      const manager = new RouteManager();

      manager.get('/users', createMockHandler('getUsers'));
      manager.post('/users', createMockHandler('createUser'));

      expect(manager.size()).toBe(2);

      manager.clear();

      expect(manager.size()).toBe(0);
      expect(manager.getRoutes()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return number of registered routes', () => {
      const manager = new RouteManager();

      expect(manager.size()).toBe(0);

      manager.get('/users', createMockHandler('test'));
      expect(manager.size()).toBe(1);

      manager.post('/users', createMockHandler('test'));
      expect(manager.size()).toBe(2);

      manager.clear();
      expect(manager.size()).toBe(0);
    });
  });

  describe('createRouteManager', () => {
    it('should create a new route manager', () => {
      const manager = createRouteManager();

      expect(manager).toBeInstanceOf(RouteManager);
    });

    it('should pass configuration to manager', () => {
      const manager = createRouteManager({
        strict: true,
        caseSensitive: true,
      });

      expect(manager).toBeInstanceOf(RouteManager);
    });
  });

  describe('complex routing scenarios', () => {
    it('should handle nested routes', () => {
      const manager = new RouteManager();

      manager.get('/api/v1/users/:userId/posts/:postId/comments/:commentId', 
        createMockHandler('test'));

      const match = manager.match('GET', '/api/v1/users/1/posts/2/comments/3');
      
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({
        userId: '1',
        postId: '2',
        commentId: '3',
      });
    });

    it('should handle route priority (first match wins)', () => {
      const manager = new RouteManager();
      const specificHandler = createMockHandler('specific');
      const genericHandler = createMockHandler('generic');

      manager.get('/users/:id', specificHandler);
      manager.get('/users/admin', genericHandler);

      // First route matches
      const match = manager.match('GET', '/users/admin');
      expect(match?.route.handler).toBe(specificHandler);
    });

    it('should handle empty path', () => {
      const manager = new RouteManager();
      const handler = createMockHandler('root');

      manager.get('/', handler);

      const match = manager.match('GET', '/');
      
      expect(match).not.toBeNull();
      expect(match?.route.handler).toBe(handler);
    });
  });
});
