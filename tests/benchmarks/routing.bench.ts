/**
 * Routing Performance Benchmarks
 * 
 * Tests route lookup and parameter extraction performance.
 * Target: Route lookup <0.5ms, Static routes <0.1ms, Dynamic routes <0.3ms
 */

import { bench, describe } from 'vitest';

// Mock route manager (replace with actual Gati router when implemented)
interface Route {
  method: string;
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handler: () => void;
}

class SimpleRouter {
  private routes: Route[] = [];

  register(method: string, pattern: string, handler: () => void): void {
    const paramNames: string[] = [];
    const regexPattern = pattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    
    this.routes.push({
      method,
      pattern,
      regex: new RegExp(`^${regexPattern}$`),
      paramNames,
      handler,
    });
  }

  match(method: string, path: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      
      const match = path.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1] || '';
        });
        return { route, params };
      }
    }
    return null;
  }
}

const dummyHandler = () => {};

describe('Routing Performance', () => {
  describe('Static Routes', () => {
    const router = new SimpleRouter();
    router.register('GET', '/users', dummyHandler);
    router.register('GET', '/posts', dummyHandler);
    router.register('GET', '/comments', dummyHandler);

    bench('match static route (/users)', () => {
      router.match('GET', '/users');
    }, { iterations: 100000 });

    bench('match static route (first in list)', () => {
      router.match('GET', '/users');
    }, { iterations: 100000 });

    bench('match static route (last in list)', () => {
      router.match('GET', '/comments');
    }, { iterations: 100000 });
  });

  describe('Dynamic Routes (1 param)', () => {
    const router = new SimpleRouter();
    router.register('GET', '/users/:id', dummyHandler);
    router.register('GET', '/posts/:id', dummyHandler);
    router.register('GET', '/comments/:id', dummyHandler);

    bench('match 1 param route (/users/:id)', () => {
      router.match('GET', '/users/123');
    }, { iterations: 50000 });

    bench('extract params from 1 param route', () => {
      const result = router.match('GET', '/users/user_abc123');
      if (result) {
        const { params } = result;
        void params.id;
      }
    }, { iterations: 50000 });
  });

  describe('Dynamic Routes (2 params)', () => {
    const router = new SimpleRouter();
    router.register('GET', '/users/:userId/posts/:postId', dummyHandler);
    router.register('GET', '/posts/:postId/comments/:commentId', dummyHandler);

    bench('match 2 param route (/users/:userId/posts/:postId)', () => {
      router.match('GET', '/users/user_123/posts/post_456');
    }, { iterations: 25000 });

    bench('extract params from 2 param route', () => {
      const result = router.match('GET', '/users/user_abc/posts/post_xyz');
      if (result) {
        const { params } = result;
        void params.userId;
        void params.postId;
      }
    }, { iterations: 25000 });
  });

  describe('Route Not Found (404)', () => {
    const router = new SimpleRouter();
    router.register('GET', '/users', dummyHandler);
    router.register('GET', '/users/:id', dummyHandler);
    router.register('GET', '/posts', dummyHandler);
    router.register('GET', '/posts/:id', dummyHandler);
    router.register('POST', '/users', dummyHandler);

    bench('no match found (404)', () => {
      router.match('GET', '/nonexistent');
    }, { iterations: 10000 });

    bench('wrong method (405)', () => {
      router.match('DELETE', '/users');
    }, { iterations: 10000 });
  });

  describe('Large Route Set (100 routes)', () => {
    const router = new SimpleRouter();
    
    // Register 100 routes
    for (let i = 0; i < 100; i++) {
      router.register('GET', `/route${i}`, dummyHandler);
      router.register('GET', `/route${i}/:id`, dummyHandler);
    }

    bench('match route in large set (first)', () => {
      router.match('GET', '/route0');
    }, { iterations: 10000 });

    bench('match route in large set (middle)', () => {
      router.match('GET', '/route50/item_123');
    }, { iterations: 10000 });

    bench('match route in large set (last)', () => {
      router.match('GET', '/route99/item_xyz');
    }, { iterations: 10000 });
  });
});

// Performance expectations:
// - Static route match: < 0.1ms (100,000+ ops/sec)
// - 1 param route match: < 0.3ms (50,000+ ops/sec)
// - 2 param route match: < 0.3ms (25,000+ ops/sec)
// - 404 lookup: < 0.5ms (10,000+ ops/sec)
// - Overall target: Route lookup < 0.5ms
