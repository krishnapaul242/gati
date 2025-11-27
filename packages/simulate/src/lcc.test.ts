import { describe, it, expect } from 'vitest';
import { SimulatedLCC } from './lcc.js';

describe('SimulatedLCC', () => {
  it('should execute hooks in correct order', async () => {
    const order: string[] = [];
    const lcc = new SimulatedLCC({
      before: [async () => { order.push('before'); }],
      after: [async () => { order.push('after'); }],
      finally: [async () => { order.push('finally'); }]
    });

    await lcc.execute(async () => { order.push('handler'); });

    expect(order).toEqual(['before', 'handler', 'after', 'finally']);
  });

  it('should execute catch hooks on error', async () => {
    let catchExecuted = false;
    const lcc = new SimulatedLCC({
      catch: [async () => { catchExecuted = true; }]
    });

    await expect(
      lcc.execute(async () => { throw new Error('test'); })
    ).rejects.toThrow('test');

    expect(catchExecuted).toBe(true);
  });

  it('should execute finally hooks even on error', async () => {
    let finallyExecuted = false;
    const lcc = new SimulatedLCC({
      finally: [async () => { finallyExecuted = true; }]
    });

    await expect(
      lcc.execute(async () => { throw new Error('test'); })
    ).rejects.toThrow();

    expect(finallyExecuted).toBe(true);
  });

  it('should timeout slow hooks', async () => {
    const lcc = new SimulatedLCC({
      before: [async () => { await new Promise(r => setTimeout(r, 200)); }]
    }, 100);

    await expect(
      lcc.execute(async () => {})
    ).rejects.toThrow('Hook timeout');
  });

  it('should track metrics', async () => {
    const lcc = new SimulatedLCC({
      before: [async () => {}]
    });

    await lcc.execute(async () => {});

    const metrics = lcc.getMetrics();

    expect(metrics.executions).toBe(1);
  });
});
