import pino from 'pino';
export function createLogger(options = {}) {
    const isDevelopment = process.env['NODE_ENV'] !== 'production';
    const level = options.level || (isDevelopment ? 'debug' : 'info');
    const pretty = options.pretty ?? isDevelopment;
    const config = {
        level,
        ...(options.name && { name: options.name }),
    };
    if (pretty) {
        try {
            return pino({
                ...config,
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:HH:MM:ss',
                        ignore: 'pid,hostname',
                    },
                },
            });
        }
        catch {
            return pino(config);
        }
    }
    return pino(config);
}
export const logger = createLogger({ name: 'gati-runtime' });
