import type { HookConfig } from './types.js';

export class SimulatedLCC {
  private hooks: HookConfig;
  private timeout: number;
  private metrics = { executions: 0, timeouts: 0, errors: 0 };

  constructor(hooks: HookConfig = {}, timeout = 5000) {
    this.hooks = hooks;
    this.timeout = timeout;
  }

  async execute(handler: () => Promise<any>, req?: any, res?: any): Promise<void> {
    this.metrics.executions++;

    try {
      await this.runHooks(this.hooks.before || [], req, res);
      await handler();
      await this.runHooks(this.hooks.after || [], req, res);
    } catch (error) {
      if (this.hooks.catch) {
        await this.runHooks(this.hooks.catch, error);
      }
      throw error;
    } finally {
      if (this.hooks.finally) {
        await this.runHooks(this.hooks.finally);
      }
    }
  }

  private async runHooks(hooks: Array<(...args: any[]) => void | Promise<void>>, ...args: any[]): Promise<void> {
    for (const hook of hooks) {
      await this.runWithTimeout(hook, args);
    }
  }

  private async runWithTimeout(fn: (...args: any[]) => void | Promise<void>, args: any[]): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.metrics.timeouts++;
        reject(new Error('Hook timeout'));
      }, this.timeout);
    });

    try {
      await Promise.race([fn(...args), timeoutPromise]);
    } catch (error) {
      if ((error as Error).message === 'Hook timeout') {
        this.metrics.errors++;
      }
      throw error;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}
