import { parse as parseUrl } from 'url';
export function createRequest(options) {
    let query = options.query ?? {};
    let path = options.path;
    if (!options.query && options.raw.url) {
        const parsed = parseUrl(options.raw.url, true);
        const parsedQuery = parsed.query;
        query = Object.entries(parsedQuery).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        path = parsed.pathname || path;
    }
    const headers = options.headers ?? options.raw.headers;
    return {
        method: options.method,
        path,
        query,
        params: options.params ?? {},
        headers,
        body: options.body,
        rawBody: options.rawBody,
        raw: options.raw,
    };
}
