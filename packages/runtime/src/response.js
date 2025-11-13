export function createResponse(options) {
    const { raw } = options;
    let sent = false;
    const response = {
        status(code) {
            raw.statusCode = code;
            return response;
        },
        header(name, value) {
            raw.setHeader(name, value);
            return response;
        },
        headers(headers) {
            for (const [name, value] of Object.entries(headers)) {
                raw.setHeader(name, value);
            }
            return response;
        },
        json(data) {
            if (sent) {
                throw new Error('Response already sent');
            }
            const body = JSON.stringify(data);
            raw.setHeader('Content-Type', 'application/json');
            raw.setHeader('Content-Length', Buffer.byteLength(body));
            raw.end(body);
            sent = true;
        },
        text(data) {
            if (sent) {
                throw new Error('Response already sent');
            }
            raw.setHeader('Content-Type', 'text/plain');
            raw.setHeader('Content-Length', Buffer.byteLength(data));
            raw.end(data);
            sent = true;
        },
        send(data) {
            if (sent) {
                throw new Error('Response already sent');
            }
            if (Buffer.isBuffer(data)) {
                raw.setHeader('Content-Length', data.length);
            }
            else {
                raw.setHeader('Content-Length', Buffer.byteLength(data));
            }
            raw.end(data);
            sent = true;
        },
        end() {
            if (sent) {
                throw new Error('Response already sent');
            }
            raw.end();
            sent = true;
        },
        isSent() {
            return sent;
        },
        get headersSent() {
            return raw.headersSent;
        },
        raw,
    };
    return response;
}
