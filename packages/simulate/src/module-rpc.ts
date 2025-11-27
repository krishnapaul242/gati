export class SimulatedModuleRPC {
  private modules: Record<string, any>;
  private latency: number;
  private metrics = { calls: 0, errors: 0, totalLatency: 0 };

  constructor(modules: Record<string, any> = {}, latency = 0) {
    this.modules = modules;
    this.latency = latency;
  }

  getProxies(): Record<string, any> {
    const proxies: Record<string, any> = {};

    for (const [name, module] of Object.entries(this.modules)) {
      proxies[name] = this.createProxy(module);
    }

    return proxies;
  }

  private createProxy(module: any): any {
    const proxy: any = {};

    for (const [key, value] of Object.entries(module)) {
      if (typeof value === 'function') {
        proxy[key] = async (...args: any[]) => {
          const start = Date.now();
          this.metrics.calls++;

          try {
            if (this.latency > 0) {
              await new Promise(resolve => setTimeout(resolve, this.latency));
            }

            const result = await value(...args);
            this.metrics.totalLatency += Date.now() - start;
            return result;
          } catch (error) {
            this.metrics.errors++;
            this.metrics.totalLatency += Date.now() - start;
            throw error;
          }
        };
      } else {
        proxy[key] = value;
      }
    }

    return proxy;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  async cleanup() {
    // No-op for in-process simulation
  }
}
