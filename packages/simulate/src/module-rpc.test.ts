import { describe, it, expect } from 'vitest';
import { SimulatedModuleRPC } from './module-rpc.js';

describe('SimulatedModuleRPC', () => {
  it('should proxy module methods', async () => {
    const rpc = new SimulatedModuleRPC({
      db: {
        findUser: async (id: string) => ({ id, name: 'Alice' })
      }
    });

    const proxies = rpc.getProxies();
    const user = await proxies.db.findUser('123');

    expect(user).toEqual({ id: '123', name: 'Alice' });
  });

  it('should track method calls', async () => {
    const rpc = new SimulatedModuleRPC({
      db: { findUser: async () => ({}) }
    });

    const proxies = rpc.getProxies();
    await proxies.db.findUser('123');
    await proxies.db.findUser('456');

    const metrics = rpc.getMetrics();

    expect(metrics.calls).toBe(2);
  });

  it('should simulate latency', async () => {
    const rpc = new SimulatedModuleRPC({
      db: { findUser: async () => ({}) }
    }, 50);

    const proxies = rpc.getProxies();
    const start = Date.now();
    await proxies.db.findUser('123');
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(50);
  });

  it('should track errors', async () => {
    const rpc = new SimulatedModuleRPC({
      db: { findUser: async () => { throw new Error('DB error'); } }
    });

    const proxies = rpc.getProxies();

    await expect(proxies.db.findUser('123')).rejects.toThrow('DB error');

    const metrics = rpc.getMetrics();

    expect(metrics.errors).toBe(1);
  });

  it('should preserve non-function properties', () => {
    const rpc = new SimulatedModuleRPC({
      config: { apiKey: 'secret', timeout: 5000 }
    });

    const proxies = rpc.getProxies();

    expect(proxies.config.apiKey).toBe('secret');
    expect(proxies.config.timeout).toBe(5000);
  });
});
