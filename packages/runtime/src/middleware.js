import { logger } from './logger.js';
export class MiddlewareManager {
    middlewares = [];
    errorMiddlewares = [];
    use(middleware, options = {}) {
        const entry = {
            middleware,
            options: {
                path: options.path || '*',
                methods: options.methods || ['*'],
                priority: options.priority || 0,
            },
        };
        this.middlewares.push(entry);
        this.sortMiddlewares();
    }
    useError(middleware) {
        this.errorMiddlewares.push(middleware);
    }
    async execute(req, res, gctx, lctx, handler) {
        const applicableMiddlewares = this.getApplicableMiddlewares(req);
        let currentIndex = 0;
        const next = async () => {
            if (currentIndex >= applicableMiddlewares.length) {
                await handler();
                return;
            }
            const entry = applicableMiddlewares[currentIndex++];
            if (entry) {
                await entry.middleware(req, res, gctx, lctx, next);
            }
        };
        try {
            await next();
        }
        catch (error) {
            await this.handleError(error, req, res, gctx, lctx);
        }
    }
    async handleError(error, req, res, gctx, lctx) {
        for (const errorMiddleware of this.errorMiddlewares) {
            try {
                await errorMiddleware(error, req, res, gctx, lctx);
                if (res.headersSent) {
                    return;
                }
            }
            catch (middlewareError) {
                logger.error({ middlewareError }, 'Error in error middleware');
            }
        }
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message,
            });
        }
    }
    getApplicableMiddlewares(req) {
        return this.middlewares.filter((entry) => {
            const { path, methods } = entry.options;
            if (path && path !== '*' && !this.matchPath(req.path || '/', path)) {
                return false;
            }
            if (!methods?.includes('*') && !methods?.includes(req.method)) {
                return false;
            }
            return true;
        });
    }
    matchPath(requestPath, pattern) {
        if (pattern === '*') {
            return true;
        }
        if (pattern === requestPath) {
            return true;
        }
        if (pattern.endsWith('/*')) {
            const base = pattern.slice(0, -2);
            return requestPath.startsWith(base);
        }
        const regex = this.patternToRegex(pattern);
        return regex.test(requestPath);
    }
    patternToRegex(pattern) {
        const escaped = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/:(\w+)/g, '([^/]+)');
        return new RegExp(`^${escaped}$`);
    }
    sortMiddlewares() {
        this.middlewares.sort((a, b) => {
            const priorityA = a.options.priority || 0;
            const priorityB = b.options.priority || 0;
            return priorityB - priorityA;
        });
    }
    getMiddlewares() {
        return [...this.middlewares];
    }
    clear() {
        this.middlewares = [];
        this.errorMiddlewares = [];
    }
    size() {
        return this.middlewares.length;
    }
}
export function createMiddlewareManager() {
    return new MiddlewareManager();
}
