import { parseRoute, normalizePath, extractParams } from './route-parser.js';
export class RouteManager {
    routes = [];
    constructor(_config = {}) {
    }
    register(method, path, handler) {
        const pattern = parseRoute(path);
        const route = {
            method,
            path: pattern.path,
            handler,
            pattern,
        };
        this.routes.push(route);
    }
    get(path, handler) {
        this.register('GET', path, handler);
    }
    post(path, handler) {
        this.register('POST', path, handler);
    }
    put(path, handler) {
        this.register('PUT', path, handler);
    }
    patch(path, handler) {
        this.register('PATCH', path, handler);
    }
    delete(path, handler) {
        this.register('DELETE', path, handler);
    }
    head(path, handler) {
        this.register('HEAD', path, handler);
    }
    options(path, handler) {
        this.register('OPTIONS', path, handler);
    }
    match(method, path) {
        const normalizedPath = normalizePath(path);
        for (const route of this.routes) {
            if (route.method !== method) {
                continue;
            }
            if (!route.pattern) {
                continue;
            }
            const params = extractParams(normalizedPath, route.pattern);
            if (params !== null) {
                return {
                    route,
                    params,
                };
            }
        }
        return null;
    }
    getRoutes() {
        return [...this.routes];
    }
    unregister(method, path) {
        const normalizedPath = normalizePath(path);
        this.routes = this.routes.filter(route => !(route.method === method && route.path === normalizedPath));
    }
    clear() {
        this.routes = [];
    }
    size() {
        return this.routes.length;
    }
}
export function createRouteManager(config) {
    return new RouteManager(config);
}
