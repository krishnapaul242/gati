/**
 * @module cli/analyzer/hook-extractor.test
 * @description Unit tests for hook extractor
 */

import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';
import { extractHooks } from './hook-extractor.js';

/**
 * Helper to parse TypeScript code
 */
function parseCode(code: string): ts.SourceFile {
  return ts.createSourceFile(
    'test.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );
}

describe('Hook Extractor', () => {
  describe('Before Hooks', () => {
    it('extracts before hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].type).toBe('before');
      expect(hooks[0].id).toBe('auth');
      expect(hooks[0].level).toBe('handler');
    });

    it('extracts multiple before hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {} });
          lctx.before({ id: 'validate', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(2);
      expect(hooks[0].id).toBe('auth');
      expect(hooks[1].id).toBe('validate');
    });
  });

  describe('After Hooks', () => {
    it('extracts after hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.after({ id: 'log', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].type).toBe('after');
      expect(hooks[0].id).toBe('log');
    });
  });

  describe('Catch Hooks', () => {
    it('extracts catch hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.catch({ id: 'errorHandler', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].type).toBe('catch');
      expect(hooks[0].id).toBe('errorHandler');
    });
  });

  describe('Async Detection', () => {
    it('detects async hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: async () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].isAsync).toBe(true);
    });

    it('detects sync hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].isAsync).toBe(false);
    });
  });

  describe('Configuration Extraction', () => {
    it('extracts timeout configuration', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {}, timeout: 5000 });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].timeout).toBe(5000);
    });

    it('extracts retry configuration', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {}, retries: 3 });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].retries).toBe(3);
    });

    it('extracts level configuration', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {}, level: 'global' });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].level).toBe('global');
    });
  });

  describe('Source Location', () => {
    it('captures source location', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].sourceLocation).toBeDefined();
      expect(hooks[0].sourceLocation.file).toBe('test.ts');
      expect(hooks[0].sourceLocation.line).toBeGreaterThan(0);
      expect(hooks[0].sourceLocation.column).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles handlers without hooks', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          res.json({ message: 'Hello' });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(0);
    });

    it('handles multiple hooks of different types', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ id: 'auth', fn: () => {} });
          lctx.after({ id: 'log', fn: () => {} });
          lctx.catch({ id: 'error', fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(3);
      expect(hooks[0].type).toBe('before');
      expect(hooks[1].type).toBe('after');
      expect(hooks[2].type).toBe('catch');
    });

    it('generates ID when not provided', () => {
      const code = `
        export const handler: Handler = (req, res, lctx, gctx) => {
          lctx.before({ fn: () => {} });
        };
      `;
      const hooks = extractHooks(parseCode(code));
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].id).toMatch(/^before_\d+$/);
    });
  });
});
