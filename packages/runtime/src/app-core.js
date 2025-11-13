import { createServer } from 'http';
import { createRequest } from './request.js';
import { createResponse } from './response.js';
import { createGlobalContext, createLocalContext } from './context-manager.js';
import { createRouteManager } from './route-manager.js';
import { createMiddlewareManager } from './middleware.js';
import { executeHandler } from './handler-engine.js';
import { createLogger } from './logger.js';
function generateInstanceId() {
    return process.env['INSTANCE_ID'] ||
        process.env['HOSTNAME'] ||
        `instance_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
}
export class GatiApp {
    server = null;
    router;
    middleware;
    gctx;
    config;
    isShuttingDown = false;
    activeRequests = 0;
    logger;
    constructor(config = {}) {
        this.config = {
            port: config.port || 3000,
            host: config.host || 'localhost',
            timeout: config.timeout || 30000,
            logging: config.logging !== false,
            logger: config.logger,
            cluster: config.cluster,
            performance: config.performance,
            tracing: config.tracing,
            services: config.services,
            instance: config.instance,
        };
        this.logger = createLogger({
            name: 'gati-app',
            ...this.config.logger,
        });
        this.gctx = createGlobalContext({
            instance: {
                id: this.config.instance?.id || generateInstanceId(),
                region: this.config.instance?.region || process.env['AWS_REGION'] || 'local',
                zone: this.config.instance?.zone || process.env['AWS_AVAILABILITY_ZONE'] || 'local-a',
            },
            config: this.config,
            services: {},
        });
        this.router = createRouteManager();
        this.middleware = createMiddlewareManager();
        if (this.config.logging) {
            this.use(this.createLoggingMiddleware());
        }
        this.useError(this.createDefaultErrorHandler());
    }
    use(middleware) {
        this.middleware.use(middleware);
    }
    useError(middleware) {
        this.middleware.useError(middleware);
    }
    get(path, handler) {
        this.router.get(path, handler);
    }
    post(path, handler) {
        this.router.post(path, handler);
    }
    put(path, handler) {
        this.router.put(path, handler);
    }
    patch(path, handler) {
        this.router.patch(path, handler);
    }
    delete(path, handler) {
        this.router.delete(path, handler);
    }
    registerRoute(method, path, handler) {
        const methodUpper = method.toUpperCase();
        switch (methodUpper) {
            case 'GET':
                this.router.get(path, handler);
                break;
            case 'POST':
                this.router.post(path, handler);
                break;
            case 'PUT':
                this.router.put(path, handler);
                break;
            case 'PATCH':
                this.router.patch(path, handler);
                break;
            case 'DELETE':
                this.router.delete(path, handler);
                break;
        }
    }
    unregisterRoute(method, path) {
        this.router.unregister(method.toUpperCase(), path);
    }
    async listen() {
        if (this.server) {
            throw new Error('Server is already running');
        }
        return new Promise((resolve, reject) => {
            try {
                this.server = createServer((req, res) => {
                    void this.handleRequest(req, res);
                });
                this.server.timeout = this.config.timeout;
                this.server.listen(this.config.port, this.config.host, () => {
                    if (this.config.logging) {
                        this.logger.info({ port: this.config.port, host: this.config.host }, 'Gati server listening');
                    }
                    resolve();
                });
                this.server.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async close() {
        if (!this.server) {
            return;
        }
        this.isShuttingDown = true;
        const maxWaitMs = 10000;
        const checkIntervalMs = 100;
        const startTime = Date.now();
        while (this.activeRequests > 0 && Date.now() - startTime < maxWaitMs) {
            await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
        }
        if (this.activeRequests > 0 && this.config.logging) {
            this.logger.warn({ activeRequests: this.activeRequests }, 'Server shutting down with active requests still pending');
        }
        return new Promise((resolve, reject) => {
            this.server?.close((error) => {
                if (error) {
                    reject(error);
                }
                else {
                    this.server = null;
                    this.isShuttingDown = false;
                    if (this.config.logging) {
                        this.logger.info('Gati server shut down successfully');
                    }
                    resolve();
                }
            });
        });
    }
    async parseRequestBody(req) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            req.on('data', (chunk) => {
                chunks.push(chunk);
            });
            req.on('end', () => {
                try {
                    const rawBody = Buffer.concat(chunks);
                    if (rawBody.length === 0) {
                        resolve({ body: undefined, rawBody: '' });
                        return;
                    }
                    const contentType = req.headers['content-type'] || '';
                    if (contentType.includes('application/json')) {
                        const bodyString = rawBody.toString('utf-8');
                        try {
                            const parsed = JSON.parse(bodyString);
                            resolve({ body: parsed, rawBody: bodyString });
                        }
                        catch (error) {
                            resolve({ body: undefined, rawBody: bodyString });
                        }
                        return;
                    }
                    if (contentType.includes('application/x-www-form-urlencoded')) {
                        const bodyString = rawBody.toString('utf-8');
                        const params = new URLSearchParams(bodyString);
                        const parsed = {};
                        params.forEach((value, key) => {
                            parsed[key] = value;
                        });
                        resolve({ body: parsed, rawBody: bodyString });
                        return;
                    }
                    if (contentType.includes('text/')) {
                        const bodyString = rawBody.toString('utf-8');
                        resolve({ body: bodyString, rawBody: bodyString });
                    }
                    else {
                        resolve({ body: rawBody, rawBody });
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
            req.on('error', (error) => {
                reject(error);
            });
        });
    }
    async handleRequest(incomingMessage, serverResponse) {
        if (this.isShuttingDown) {
            serverResponse.statusCode = 503;
            serverResponse.end('Service Unavailable');
            return;
        }
        this.activeRequests++;
        const requestTimeout = setTimeout(() => {
            if (!serverResponse.headersSent) {
                serverResponse.statusCode = 408;
                serverResponse.setHeader('Content-Type', 'application/json');
                serverResponse.end(JSON.stringify({
                    error: 'Request Timeout',
                    message: 'Request exceeded configured timeout',
                }));
            }
        }, this.config.timeout);
        let lctx = null;
        try {
            const { body, rawBody } = await this.parseRequestBody(incomingMessage);
            const req = createRequest({
                raw: incomingMessage,
                method: (incomingMessage.method || 'GET'),
                path: incomingMessage.url || '/',
                body,
                rawBody,
            });
            const res = createResponse({ raw: serverResponse });
            const traceId = incomingMessage.headers['x-trace-id'] || generateTraceId();
            const parentSpanId = incomingMessage.headers['x-parent-span-id'];
            const clientIp = incomingMessage.socket.remoteAddress || 'unknown';
            const userAgent = incomingMessage.headers['user-agent'] || 'unknown';
            const clientIdentifier = `${clientIp}:${userAgent}`;
            let hash = 0;
            for (let i = 0; i < clientIdentifier.length; i++) {
                const char = clientIdentifier.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            const clientId = `client_${Math.abs(hash).toString(36)}`;
            const sessionId = incomingMessage.headers['x-session-id'] ||
                this.extractSessionFromCookie(incomingMessage.headers.cookie);
            const userId = incomingMessage.headers['x-user-id'];
            const tenantId = incomingMessage.headers['x-tenant-id'];
            lctx = createLocalContext({
                traceId,
                parentSpanId,
                clientId,
                refs: {
                    sessionId,
                    userId,
                    tenantId,
                },
                client: {
                    ip: clientIp,
                    userAgent,
                    region: this.gctx.instance.region,
                },
                meta: {
                    timestamp: Date.now(),
                    instanceId: this.gctx.instance.id,
                    region: this.gctx.instance.region,
                    method: req.method,
                    path: req.path || '/',
                },
            });
            try {
                await this.middleware.execute(req, res, this.gctx, lctx, async () => {
                    const match = this.router.match(req.method, req.path || '/');
                    if (!match) {
                        res.status(404).json({
                            error: 'Not Found',
                            message: `Cannot ${req.method} ${req.path}`,
                        });
                        return;
                    }
                    req.params = match.params;
                    await executeHandler(match.route.handler, req, res, this.gctx, lctx);
                });
            }
            catch (error) {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Internal Server Error',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
        }
        finally {
            if (lctx) {
                try {
                    await lctx.lifecycle.executeCleanup();
                }
                catch (cleanupError) {
                    console.error('Request cleanup failed:', cleanupError);
                }
            }
            clearTimeout(requestTimeout);
            this.activeRequests--;
        }
    }
    createLoggingMiddleware() {
        return async (req, _res, _gctx, lctx, next) => {
            const start = Date.now();
            const requestId = lctx.requestId || 'unknown';
            this.logger.info({ requestId, method: req.method, path: req.path }, 'Incoming request');
            await next();
            const duration = Date.now() - start;
            this.logger.info({ requestId, method: req.method, path: req.path, duration }, 'Request completed');
        };
    }
    createDefaultErrorHandler() {
        return (error, _req, res, _gctx, lctx) => {
            const requestId = lctx.requestId || 'unknown';
            this.logger.error({ requestId, error: error.message, stack: error.stack }, 'Request error');
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: this.config.logging ? error.message : 'An error occurred',
                    ...(this.config.logging && { requestId }),
                });
            }
        };
    }
    getConfig() {
        return { ...this.config };
    }
    isRunning() {
        return this.server !== null && !this.isShuttingDown;
    }
    getGlobalContext() {
        return this.gctx;
    }
    getRouteManager() {
        return this.router;
    }
    extractSessionFromCookie(cookieHeader) {
        if (!cookieHeader)
            return undefined;
        const cookies = cookieHeader.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'sessionId' || name === 'session_id') {
                return value;
            }
        }
        return undefined;
    }
}
export function createApp(config) {
    return new GatiApp(config);
}
