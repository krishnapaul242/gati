import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { logger } from './logger.js';
export async function discoverHandlers(dir) {
    const handlers = [];
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            const fullPath = join(dir, file);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                const nestedHandlers = await discoverHandlers(fullPath);
                handlers.push(...nestedHandlers);
            }
            else if (stat.isFile() && ['.ts', '.js', '.mts', '.mjs'].includes(extname(file))) {
                handlers.push(fullPath);
            }
        }
    }
    catch (error) {
        logger.warn({ dir, error: error instanceof Error ? error.message : 'Unknown error' }, 'Could not discover handlers');
    }
    return handlers;
}
export async function loadHandlers(app, handlersDir, options = {}) {
    const { basePath = '', verbose = false } = options;
    const handlerPaths = await discoverHandlers(handlersDir);
    if (verbose) {
        logger.info({ count: handlerPaths.length }, 'Found handler files');
    }
    for (const handlerPath of handlerPaths) {
        try {
            const mod = await import(handlerPath);
            const modRecord = mod;
            let possible = modRecord['handler'];
            if (possible === undefined) {
                const maybeDefault = modRecord['default'];
                if (typeof maybeDefault === 'function') {
                    possible = maybeDefault;
                }
                else if (maybeDefault && typeof maybeDefault === 'object') {
                    const h = maybeDefault['handler'];
                    if (typeof h === 'function')
                        possible = h;
                }
            }
            const handlerFn = typeof possible === 'function' ? possible : undefined;
            if (!handlerFn) {
                logger.warn({ handlerPath }, 'No valid handler function found, skipping');
                continue;
            }
            const metadata = extractMetadata(handlerPath, mod);
            const method = (metadata.method || 'GET').toUpperCase();
            const route = basePath + (metadata.route || inferRouteFromPath(handlerPath, handlersDir));
            switch (method) {
                case 'GET':
                    app.get(route, handlerFn);
                    break;
                case 'POST':
                    app.post(route, handlerFn);
                    break;
                case 'PUT':
                    app.put(route, handlerFn);
                    break;
                case 'PATCH':
                    app.patch(route, handlerFn);
                    break;
                case 'DELETE':
                    app.delete(route, handlerFn);
                    break;
                default:
                    logger.warn({ method, handlerPath }, 'Unknown HTTP method');
            }
        }
        catch (error) {
            logger.error({ handlerPath, error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to load handler');
        }
    }
}
function extractMetadata(_filePath, module) {
    const m = module;
    let meta = m['metadata'];
    if (meta === undefined) {
        const def = m['default'];
        if (def && typeof def === 'object' && 'metadata' in def) {
            meta = def['metadata'];
        }
    }
    if (meta && typeof meta === 'object') {
        const result = {};
        const mm = meta;
        if (typeof mm['method'] === 'string')
            result.method = mm['method'];
        if (typeof mm['route'] === 'string')
            result.route = mm['route'];
        return result;
    }
    return {};
}
function inferRouteFromPath(filePath, baseDir) {
    let route = filePath
        .replace(baseDir, '')
        .replace(/\\/g, '/')
        .replace(/\.(ts|js|mts|mjs)$/, '');
    if (route.startsWith('/')) {
        route = route.slice(1);
    }
    return '/' + route;
}
