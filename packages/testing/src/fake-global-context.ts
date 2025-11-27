/**
 * @module testing/fake-global-context
 * @description Fake GlobalContext builder for testing
 */

import type { GlobalContext } from '@gati-framework/runtime';
import { createGlobalContext } from '@gati-framework/runtime';

/**
 * Options for creating a fake GlobalContext
 */
export interface FakeGlobalContextOptions {
  modules?: Record<string, unknown>;
  config?: Record<string, unknown>;
  instanceId?: string;
  region?: string;
}

/**
 * Builder for creating fake GlobalContext instances
 */
export class FakeGlobalContextBuilder {
  private options: FakeGlobalContextOptions = {};

  withModule(name: string, module: unknown): this {
    if (!this.options.modules) {
      this.options.modules = {};
    }
    this.options.modules[name] = module;
    return this;
  }

  withConfig(config: Record<string, unknown>): this {
    this.options.config = { ...this.options.config, ...config };
    return this;
  }

  withInstanceId(id: string): this {
    this.options.instanceId = id;
    return this;
  }

  withRegion(region: string): this {
    this.options.region = region;
    return this;
  }

  build(): GlobalContext {
    return createFakeGlobalContext(this.options);
  }
}

/**
 * Create a fake GlobalContext with sensible test defaults
 */
export function createFakeGlobalContext(options: FakeGlobalContextOptions = {}): GlobalContext {
  return createGlobalContext({
    modules: options.modules || {},
    config: options.config || {},
    instance: {
      id: options.instanceId || 'test-instance',
      region: options.region || 'test-region',
      zone: 'test-zone',
    },
  });
}
