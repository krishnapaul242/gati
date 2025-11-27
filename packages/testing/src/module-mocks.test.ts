import { describe, it, expect, beforeEach } from 'vitest';
import { createMockModule, createStubModule } from './module-mocks';

describe('createMockModule', () => {
  it('creates mock with methods', () => {
    const mock = createMockModule({
      query: async (sql: string) => ({ rows: [] }),
      insert: async (data: any) => ({ id: 1 })
    });

    expect(mock.module.query).toBeDefined();
    expect(mock.module.insert).toBeDefined();
    expect(mock.calls).toEqual({ query: [], insert: [] });
  });

  it('tracks method calls', async () => {
    const mock = createMockModule({
      query: async (sql: string) => ({ rows: [] })
    });

    await mock.module.query('SELECT * FROM users');
    
    expect(mock.calls.query).toHaveLength(1);
    expect(mock.calls.query[0].args).toEqual(['SELECT * FROM users']);
  });

  it('tracks multiple calls', async () => {
    const mock = createMockModule({
      get: async (key: string) => 'value'
    });

    await mock.module.get('key1');
    await mock.module.get('key2');
    
    expect(mock.calls.get).toHaveLength(2);
    expect(mock.calls.get[0].args).toEqual(['key1']);
    expect(mock.calls.get[1].args).toEqual(['key2']);
  });

  it('tracks return values', async () => {
    const mock = createMockModule({
      calculate: async (x: number) => x * 2
    });

    await mock.module.calculate(5);
    
    expect(mock.calls.calculate[0].result).toBe(10);
  });

  it('tracks errors', async () => {
    const mock = createMockModule({
      failing: async () => {
        throw new Error('test error');
      }
    });

    await expect(mock.module.failing()).rejects.toThrow('test error');
    
    expect(mock.calls.failing[0].error).toBeDefined();
    expect(mock.calls.failing[0].error?.message).toBe('test error');
  });

  it('tracks timestamps', async () => {
    const mock = createMockModule({
      action: async () => 'done'
    });

    const before = Date.now();
    await mock.module.action();
    const after = Date.now();
    
    const timestamp = mock.calls.action[0].timestamp;
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('resets call history', async () => {
    const mock = createMockModule({
      method: async () => 'result'
    });

    await mock.module.method();
    expect(mock.calls.method).toHaveLength(1);
    
    mock.reset();
    expect(mock.calls.method).toHaveLength(0);
  });

  it('handles synchronous methods', async () => {
    const mock = createMockModule({
      sync: (x: number) => x + 1
    });

    const result = await mock.module.sync(5);
    
    expect(result).toBe(6);
    expect(mock.calls.sync).toHaveLength(1);
    expect(mock.calls.sync[0].result).toBe(6);
  });
});

describe('createStubModule', () => {
  it('creates stub with values', () => {
    const stub = createStubModule({
      query: { rows: [{ id: 1 }] },
      count: 42
    });

    expect(stub.query()).toEqual({ rows: [{ id: 1 }] });
    expect(stub.count()).toBe(42);
  });

  it('returns predefined values', () => {
    const stub = createStubModule({
      getValue: 'test-value',
      getNumber: 123
    });

    expect(stub.getValue()).toBe('test-value');
    expect(stub.getNumber()).toBe(123);
  });
});
