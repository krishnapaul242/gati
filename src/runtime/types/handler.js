/**
 * @module runtime/types/handler
 * @description Handler function signature for Gati framework
 */
/**
 * Handler error class for handler-specific errors
 */
export class HandlerError extends Error {
    statusCode;
    context;
    constructor(message, statusCode = 500, context) {
        super(message);
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'HandlerError';
        Error.captureStackTrace(this, HandlerError);
    }
}
//# sourceMappingURL=handler.js.map