import { watch } from 'chokidar';
import { resolve, relative } from 'path';
import { existsSync } from 'fs';
export class HotLoader {
    app;
    srcDir;
    watcher;
    handlerCache = new Map();
    constructor(app, options) {
        this.app = app;
        this.srcDir = options.srcDir;
        if (options.enabled) {
            this.startWatching();
        }
    }
    startWatching() {
        const handlersDir = resolve(this.srcDir, 'handlers');
        if (!existsSync(handlersDir))
            return;
        this.watcher = watch(`${handlersDir}/**/*.{ts,js}`, {
            ignoreInitial: false,
            persistent: true
        });
        this.watcher.on('add', (filePath) => this.loadHandler(filePath));
        this.watcher.on('change', (filePath) => this.reloadHandler(filePath));
        this.watcher.on('unlink', (filePath) => this.unloadHandler(filePath));
    }
    async loadHandler(filePath) {
        try {
            const relativePath = relative(this.srcDir, filePath);
            const route = this.pathToRoute(relativePath);
            delete require.cache[require.resolve(filePath)];
            const module = await import(`file://${filePath}?t=${Date.now()}`);
            const method = module.METHOD || 'GET';
            const customRoute = module.ROUTE;
            const handler = this.findHandler(module);
            if (handler) {
                const finalRoute = customRoute ? this.buildFullRoute(relativePath, customRoute) : route;
                this.app.registerRoute(method, finalRoute, handler);
                this.handlerCache.set(filePath, { method, route: finalRoute, handler });
                console.log(`🔥 Loaded ${method} ${finalRoute}`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to load handler ${filePath}:`, error);
        }
    }
    async reloadHandler(filePath) {
        console.log(`🔄 Reloading ${relative(this.srcDir, filePath)}`);
        await this.loadHandler(filePath);
    }
    unloadHandler(filePath) {
        const cached = this.handlerCache.get(filePath);
        if (cached) {
            this.app.unregisterRoute(cached.method, cached.route);
            this.handlerCache.delete(filePath);
            console.log(`🗑️ Unloaded ${cached.method} ${cached.route}`);
        }
    }
    findHandler(module) {
        for (const [key, value] of Object.entries(module)) {
            if (key.toLowerCase().includes('handler') && typeof value === 'function') {
                return value;
            }
        }
        return null;
    }
    pathToRoute(relativePath) {
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
    buildFullRoute(relativePath, customRoute) {
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
