/**
 * @module tests/unit/runtime/route-parser.test
 * @description Unit tests for route parser
 */

import { describe, it, expect } from 'vitest';
import { parseRoute, normalizePath, extractParams, matchPath } from '@/runtime/route-parser';

describe('Route Parser', () => {
  describe('normalizePath', () => {
    it('should add leading slash if missing', () => {
      expect(normalizePath('users')).toBe('/users');
      expect(normalizePath('api/users')).toBe('/api/users');
    });

    it('should keep leading slash', () => {
      expect(normalizePath('/users')).toBe('/users');
      expect(normalizePath('/api/users')).toBe('/api/users');
    });

    it('should remove trailing slash except for root', () => {
      expect(normalizePath('/users/')).toBe('/users');
      expect(normalizePath('/api/users/')).toBe('/api/users');
      expect(normalizePath('/')).toBe('/');
    });

    it('should remove duplicate slashes', () => {
      expect(normalizePath('//users')).toBe('/users');
      expect(normalizePath('/users//posts')).toBe('/users/posts');
      expect(normalizePath('///api///users///')).toBe('/api/users');
    });

    it('should handle empty path', () => {
      expect(normalizePath('')).toBe('/');
    });

    it('should handle complex paths', () => {
      expect(normalizePath('//api//v1//users//:id//')).toBe('/api/v1/users/:id');
    });
  });

  describe('parseRoute', () => {
    it('should parse simple path without parameters', () => {
      const pattern = parseRoute('/users');

      expect(pattern.path).toBe('/users');
      expect(pattern.paramNames).toEqual([]);
      expect(pattern.regex.test('/users')).toBe(true);
      expect(pattern.regex.test('/posts')).toBe(false);
    });

    it('should parse path with single parameter', () => {
      const pattern = parseRoute('/users/:id');

      expect(pattern.path).toBe('/users/:id');
      expect(pattern.paramNames).toEqual(['id']);
      expect(pattern.regex.test('/users/123')).toBe(true);
      expect(pattern.regex.test('/users/abc')).toBe(true);
      expect(pattern.regex.test('/users')).toBe(false);
      expect(pattern.regex.test('/users/123/posts')).toBe(false);
    });

    it('should parse path with multiple parameters', () => {
      const pattern = parseRoute('/users/:userId/posts/:postId');

      expect(pattern.path).toBe('/users/:userId/posts/:postId');
      expect(pattern.paramNames).toEqual(['userId', 'postId']);
      expect(pattern.regex.test('/users/123/posts/456')).toBe(true);
      expect(pattern.regex.test('/users/abc/posts/def')).toBe(true);
      expect(pattern.regex.test('/users/123')).toBe(false);
    });

    it('should handle parameter names with underscores', () => {
      const pattern = parseRoute('/api/:user_id/posts/:post_id');

      expect(pattern.paramNames).toEqual(['user_id', 'post_id']);
      expect(pattern.regex.test('/api/123/posts/456')).toBe(true);
    });

    it('should handle parameters at start', () => {
      const pattern = parseRoute('/:id');

      expect(pattern.paramNames).toEqual(['id']);
      expect(pattern.regex.test('/123')).toBe(true);
      expect(pattern.regex.test('/')).toBe(false);
    });

    it('should handle root path', () => {
      const pattern = parseRoute('/');

      expect(pattern.path).toBe('/');
      expect(pattern.paramNames).toEqual([]);
      expect(pattern.regex.test('/')).toBe(true);
      expect(pattern.regex.test('/users')).toBe(false);
    });

    it('should normalize path before parsing', () => {
      const pattern = parseRoute('//users//:id//');

      expect(pattern.path).toBe('/users/:id');
      expect(pattern.paramNames).toEqual(['id']);
    });
  });

  describe('extractParams', () => {
    it('should extract single parameter', () => {
      const pattern = parseRoute('/users/:id');
      const params = extractParams('/users/123', pattern);

      expect(params).toEqual({ id: '123' });
    });

    it('should extract multiple parameters', () => {
      const pattern = parseRoute('/users/:userId/posts/:postId');
      const params = extractParams('/users/123/posts/456', pattern);

      expect(params).toEqual({ userId: '123', postId: '456' });
    });

    it('should return null for non-matching path', () => {
      const pattern = parseRoute('/users/:id');
      const params = extractParams('/posts/123', pattern);

      expect(params).toBeNull();
    });

    it('should decode URI components', () => {
      const pattern = parseRoute('/users/:name');
      const params = extractParams('/users/John%20Doe', pattern);

      expect(params).toEqual({ name: 'John Doe' });
    });

    it('should handle special characters in params', () => {
      const pattern = parseRoute('/search/:query');
      const params = extractParams('/search/hello%2Bworld', pattern);

      expect(params).toEqual({ query: 'hello+world' });
    });

    it('should handle empty parameter (no match)', () => {
      const pattern = parseRoute('/users/:id');
      const params = extractParams('/users/', pattern);

      expect(params).toBeNull();
    });

    it('should extract params from normalized paths', () => {
      const pattern = parseRoute('/users/:id');
      const params = extractParams('//users//123//', pattern);

      expect(params).toEqual({ id: '123' });
    });
  });

  describe('matchPath', () => {
    it('should match exact paths', () => {
      const pattern = parseRoute('/users');

      expect(matchPath('/users', pattern)).toBe(true);
      expect(matchPath('/posts', pattern)).toBe(false);
    });

    it('should match paths with parameters', () => {
      const pattern = parseRoute('/users/:id');

      expect(matchPath('/users/123', pattern)).toBe(true);
      expect(matchPath('/users/abc', pattern)).toBe(true);
      expect(matchPath('/users', pattern)).toBe(false);
      expect(matchPath('/users/123/posts', pattern)).toBe(false);
    });

    it('should match root path', () => {
      const pattern = parseRoute('/');

      expect(matchPath('/', pattern)).toBe(true);
      expect(matchPath('/users', pattern)).toBe(false);
    });

    it('should handle trailing slashes', () => {
      const pattern = parseRoute('/users');

      expect(matchPath('/users/', pattern)).toBe(true);
      expect(matchPath('/users', pattern)).toBe(true);
    });

    it('should handle duplicate slashes', () => {
      const pattern = parseRoute('/users/:id');

      expect(matchPath('//users//123//', pattern)).toBe(true);
    });
  });
});
