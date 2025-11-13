import { HandlerError } from './types/index.js';
import { logger } from './logger.js';
const DEFAULT_TIMEOUT = 30_000;
export async function executeHandler(handler, req, res, gctx, lctx, options) {
    if (!isValidHandler(handler)) {
        throw new HandlerError('Invalid handler: must be a function', 500);
    }
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const catchErrors = options?.catchErrors ?? true;
    try {
        await executeWithTimeout(() => handler(req, res, gctx, lctx), timeout, `Handler execution timed out after ${timeout}ms`);
    }
    catch (error) {
        if (!catchErrors) {
            throw error;
        }
        handleExecutionError(error, res);
    }
}
function isValidHandler(handler) {
    return typeof handler === 'function';
}
async function executeWithTimeout(fn, timeoutMs, timeoutMessage) {
    return Promise.race([
        Promise.resolve(fn()),
        new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)),
    ]);
}
function handleExecutionError(error, res) {
    if (res.isSent()) {
        logger.error({ error }, 'Handler error after response sent');
        return;
    }
    const isDevelopment = process.env['NODE_ENV'] !== 'production';
    if (error instanceof HandlerError) {
        res.status(error.statusCode).json({
            error: error.message,
            ...(isDevelopment && error.context ? { context: error.context } : {}),
        });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({
            error: 'Internal server error',
            ...(isDevelopment && {
                message: error.message,
                stack: error.stack,
            }),
        });
        return;
    }
    res.status(500).json({
        error: 'Internal server error',
    });
}
