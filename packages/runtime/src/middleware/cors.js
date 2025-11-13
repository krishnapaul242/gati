export function createCorsMiddleware(options = {}) {
    const { origin = '*', methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders = ['Content-Type', 'Authorization'], exposedHeaders, credentials = false, maxAge = 86400, } = options;
    return async (req, res, _gctx, _lctx, next) => {
        const requestOrigin = req.headers['origin'];
        let allowedOrigin = '*';
        if (typeof origin === 'string') {
            allowedOrigin = origin;
        }
        else if (Array.isArray(origin)) {
            if (requestOrigin && origin.includes(requestOrigin)) {
                allowedOrigin = requestOrigin;
            }
            else if (origin.length > 0) {
                allowedOrigin = origin[0] ?? '*';
            }
        }
        else if (typeof origin === 'function' && requestOrigin) {
            if (origin(requestOrigin)) {
                allowedOrigin = requestOrigin;
            }
        }
        res.header('Access-Control-Allow-Origin', allowedOrigin);
        if (credentials) {
            res.header('Access-Control-Allow-Credentials', 'true');
        }
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', methods.join(', '));
            res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            if (exposedHeaders && exposedHeaders.length > 0) {
                res.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
            }
            res.header('Access-Control-Max-Age', maxAge.toString());
            return res.status(204).end();
        }
        if (exposedHeaders && exposedHeaders.length > 0) {
            res.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
        }
        await next();
    };
}
