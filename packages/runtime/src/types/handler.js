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
