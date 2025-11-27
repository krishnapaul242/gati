import { describe, it, expect } from 'vitest';
import { testHandler, createTestHarness, createMockModule } from './index.js';
import type { Handler } from '@gati-framework/core';

describe('Integration Tests', () => {
  describe('Database Module Mock', () => {
    it('handles CRUD operations', async () => {
      const mockDb = createMockModule({
        findById: async (id: string) => ({ id, name: 'User' }),
        create: async (data: any) => ({ id: '1', ...data }),
        update: async (id: string, data: any) => ({ id, ...data }),
        delete: async (id: string) => true
      });

      const handler: Handler = async (req, res, gctx) => {
        const user = await gctx.modules['db'].findById('123');
        res.json({ user });
      };

      const result = await testHandler(handler, {}, { db: mockDb.module });
      
      expect(result.response.statusCode).toBe(200);
      expect(mockDb.calls.findById).toHaveLength(1);
      expect(mockDb.calls.findById[0].args).toEqual(['123']);
    });
  });

  describe('Before/After Hooks', () => {
    it('executes handler successfully', async () => {
      const handler: Handler = (req, res) => {
        res.json({ ok: true });
      };

      const harness = createTestHarness();
      const result = await harness.executeHandler(handler);

      expect(result.response.statusCode).toBe(200);
      await harness.cleanup();
    });
  });

  describe('Error Handling', () => {
    it('captures handler errors', async () => {
      const handler: Handler = () => {
        throw new Error('Handler failed');
      };

      const result = await testHandler(handler);
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Handler failed');
    });
  });

  describe('Concurrent Executions', () => {
    it('handles multiple concurrent requests', async () => {
      const handler: Handler = async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        res.json({ id: req.params.id });
      };

      const results = await Promise.all([
        testHandler(handler, { params: { id: '1' } }),
        testHandler(handler, { params: { id: '2' } }),
        testHandler(handler, { params: { id: '3' } })
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].response.statusCode).toBe(200);
      expect(results[1].response.statusCode).toBe(200);
      expect(results[2].response.statusCode).toBe(200);
    });
  });

  describe('State Isolation', () => {
    it('isolates state between executions', async () => {
      const handler: Handler = (req, res, gctx, lctx) => {
        lctx.state.counter = (lctx.state.counter || 0) + 1;
        res.json({ counter: lctx.state.counter });
      };

      const result1 = await testHandler(handler);
      const result2 = await testHandler(handler);
      const result3 = await testHandler(handler);

      expect(result1.lctx.state.counter).toBe(1);
      expect(result2.lctx.state.counter).toBe(1);
      expect(result3.lctx.state.counter).toBe(1);
    });
  });

  describe('Real-World Scenarios', () => {
    it('handles user authentication flow', async () => {
      const mockAuth = createMockModule({
        validateToken: async (token: string) => ({ userId: '123', valid: true }),
        getUser: async (id: string) => ({ id, email: 'test@example.com' })
      });

      const handler: Handler = async (req, res, gctx) => {
        const auth = await gctx.modules['auth'].validateToken(req.headers?.authorization);
        if (!auth.valid) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        const user = await gctx.modules['auth'].getUser(auth.userId);
        res.json({ user });
      };

      const result = await testHandler(
        handler,
        { headers: { authorization: 'Bearer token123' } },
        { auth: mockAuth.module }
      );

      expect(result.response.statusCode).toBe(200);
      expect(mockAuth.calls.validateToken).toHaveLength(1);
      expect(mockAuth.calls.getUser).toHaveLength(1);
    });

    it('handles validation errors', async () => {
      const handler: Handler = (req, res) => {
        if (!req.body?.email) {
          res.status(400).json({ error: 'Email required' });
          return;
        }
        res.json({ ok: true });
      };

      const result = await testHandler(handler, { body: {} });
      
      expect(result.response.statusCode).toBe(400);
    });

    it('handles database transaction rollback', async () => {
      const mockDb = createMockModule({
        beginTransaction: async () => ({ id: 'tx1' }),
        commit: async (tx: any) => true,
        rollback: async (tx: any) => true,
        insert: async (tx: any, data: any) => ({ id: '1', ...data })
      });

      const handler: Handler = async (req, res, gctx) => {
        const tx = await gctx.modules['db'].beginTransaction();
        try {
          await gctx.modules['db'].insert(tx, req.body);
          await gctx.modules['db'].commit(tx);
          res.json({ ok: true });
        } catch (err) {
          await gctx.modules['db'].rollback(tx);
          throw err;
        }
      };

      const result = await testHandler(
        handler,
        { body: { name: 'Test' } },
        { db: mockDb.module }
      );

      expect(result.response.statusCode).toBe(200);
      expect(mockDb.calls.beginTransaction).toHaveLength(1);
      expect(mockDb.calls.commit).toHaveLength(1);
    });
  });
});
