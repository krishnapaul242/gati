import { describe, it, expect } from 'vitest';
import { SimulatedRouteManager } from './route-manager.js';

describe('SimulatedRouteManager', () => {
  it('should match exact routes', () => {
    const rm = new SimulatedRouteManager([
      { path: '/users', handler: 'listUsers', method: 'GET' }
    ]);

    const match = rm.match('GET', '/users');

    expect(match).toBeDefined();
    expect(match?.handler).toBe('listUsers');
    expect(match?.params).toEqual({});
  });

  it('should match parameterized routes', () => {
    const rm = new SimulatedRouteManager([
      { path: '/users/[id]', handler: 'getUser' }
    ]);

    const match = rm.match('GET', '/users/123');

    expect(match).toBeDefined();
    expect(match?.handler).toBe('getUser');
    expect(match?.params).toEqual({ id: '123' });
  });

  it('should match multiple parameters', () => {
    const rm = new SimulatedRouteManager([
      { path: '/users/[userId]/posts/[postId]', handler: 'getPost' }
    ]);

    const match = rm.match('GET', '/users/123/posts/456');

    expect(match).toBeDefined();
    expect(match?.params).toEqual({ userId: '123', postId: '456' });
  });

  it('should return null for non-matching routes', () => {
    const rm = new SimulatedRouteManager([
      { path: '/users', handler: 'listUsers' }
    ]);

    const match = rm.match('GET', '/posts');

    expect(match).toBeNull();
  });

  it('should respect HTTP method', () => {
    const rm = new SimulatedRouteManager([
      { path: '/users', handler: 'listUsers', method: 'GET' }
    ]);

    const match = rm.match('POST', '/users');

    expect(match).toBeNull();
  });

  it('should track metrics', () => {
    const rm = new SimulatedRouteManager([
      { path: '/users', handler: 'listUsers' }
    ]);

    rm.match('GET', '/users');
    rm.match('GET', '/users');

    const metrics = rm.getMetrics();

    expect(metrics.total).toBe(2);
    expect(metrics.byRoute['/users']).toBe(2);
  });
});
