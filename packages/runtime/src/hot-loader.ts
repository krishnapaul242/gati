/**
 * @module runtime/hot-loader
 * @description Hot loading system for handlers
 */

import { watch } from 'chokidar';
import { resolve, relative } from 'path';
import { existsSync } from 'fs';
import type { GatiApp } from './app-core.js';

export interface HotLoaderOptions {
  srcDir: string;
  enabled: boolean;
}

export class HotLoader {
  private app: GatiApp;
  private srcDir: string;
  private watcher?: any;
  private handlerCache = new Map<string, any>();

  constructor(app: GatiApp, options: HotLoaderOptions) {
    this.app = app;
    this.srcDir = options.srcDir;
    
    if (options.enabled) {
      this.startWatching();
    }
  }

  private startWatching() {
    const handlersDir = resolve(this.srcDir, 'handlers');
    
    if (!existsSync(handlersDir)) return;

    this.watcher = watch(`${handlersDir}/**/*.{ts,js}`, {
      ignoreInitial: false,
      persistent: true
    });

    this.watcher.on('add', (filePath: string) => this.loadHandler(filePath));
    this.watcher.on('change', (filePath: string) => this.reloadHandler(filePath));
    this.watcher.on('unlink', (filePath: string) => this.unloadHandler(filePath));
  }

  private async loadHandler(filePath: string) {
    try {
      const relativePath = relative(this.srcDir, filePath);
      const route = this.pathToRoute(relativePath);
      
      // Clear module cache for hot reload
      delete require.cache[require.resolve(filePath)];
      
      const module = await import(`file://${filePath}?t=${Date.now()}`);
      const method = module.METHOD || 'GET';
      const customRoute = module.ROUTE;
      const handler = this.findHandler(module);
      
      if (handler) {
        const finalRoute = customRoute ? this.buildFullRoute(relativePath, customRoute) : route;
        
        // Register/update route
        this.app.registerRoute(method, finalRoute, handler);
        this.handlerCache.set(filePath, { method, route: finalRoute, handler });
        
        console.log(`🔥 Loaded ${method} ${finalRoute}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load handler ${filePath}:`, error);
    }
  }

  private async reloadHandler(filePath: string) {
    console.log(`🔄 Reloading ${relative(this.srcDir, filePath)}`);
    await this.loadHandler(filePath);
  }

  private unloadHandler(filePath: string) {
    const cached = this.handlerCache.get(filePath);
    if (cached) {
      this.app.unregisterRoute(cached.method, cached.route);
      this.handlerCache.delete(filePath);
      console.log(`🗑️ Unloaded ${cached.method} ${cached.route}`);
    }
  }

  private findHandler(module: any): any {
    for (const [key, value] of Object.entries(module)) {
      if (key.toLowerCase().includes('handler') && typeof value === 'function') {
        return value;
      }
    }
    return null;
  }

  private pathToRoute(relativePath: string): string {
    let route = relativePath
      .replace(/\\/g, '/')
      .replace(/^handlers\//, '')
      .replace(/\.ts$/, '')
      .replace(/\.js$/, '')
      .replace(/\/index$/, '');
      
    route = route.replace(/\[([^\]]+)\]/g, ':$1');
    
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    
    return route === '/' ? '/' : route;
  }

  private buildFullRoute(relativePath: string, customRoute: string): string {
    const parentPath = relativePath
      .replace(/\\/g, '/')
      .replace(/^handlers\//, '')
      .replace(/\/[^/]*$/, '')
      .replace(/\/index$/, '');
      
    if (!parentPath) {
      return customRoute;
    }
    
    return `/${parentPath}${customRoute}`;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}