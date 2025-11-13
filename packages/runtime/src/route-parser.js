export function parseRoute(path) {
    const normalizedPath = normalizePath(path);
    const paramNames = [];
    const regexPattern = normalizedPath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
    });
    const regex = new RegExp(`^${regexPattern}$`);
    return {
        regex,
        paramNames,
        path: normalizedPath,
    };
}
export function normalizePath(path) {
    let normalized = path.startsWith('/') ? path : `/${path}`;
    normalized = normalized.replace(/\/+/g, '/');
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}
export function extractParams(path, pattern) {
    const normalizedPath = normalizePath(path);
    const match = pattern.regex.exec(normalizedPath);
    if (!match) {
        return null;
    }
    const params = {};
    pattern.paramNames.forEach((name, index) => {
        const value = match[index + 1];
        if (value !== undefined) {
            params[name] = decodeURIComponent(value);
        }
    });
    return params;
}
export function matchPath(path, pattern) {
    const normalizedPath = normalizePath(path);
    return pattern.regex.test(normalizedPath);
}
