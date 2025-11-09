# Hello World Example

The simplest possible Gati application.

## Overview

This example shows the absolute minimum needed to create a working Gati API:

- Single handler that responds to GET requests
- No database, no authentication, no complexity
- Perfect starting point for learning Gati

## Project Structure

```
hello-world/
├── src/
│   └── handlers/
│       └── hello.ts      # Single handler
├── gati.config.ts        # Configuration
├── package.json
└── tsconfig.json
```

## Source Code

### Handler

`src/handlers/hello.ts`:

```typescript
/**
 * @handler GET /hello
 * @description Simple hello world handler
 */
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res, gctx, lctx) => {
  const name = req.query.name || 'World';
  
  lctx.logger.info('Greeting request received', { name });
  
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    requestId: lctx.requestId,
  });
};
```

### Configuration

`gati.config.ts`:

```typescript
export default {
  port: 3000,
  handlers: './src/handlers',
};
```

### Package.json

```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
  "dev": "gatic dev",
  "build": "gatic build",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@gati-framework/core": "^0.4.1",
    "@gati-framework/runtime": "^1.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
```

## Try It

### Create Project

```bash
# Clone the Gati repository
git clone https://github.com/krishnapaul242/gati.git
cd gati/examples/hello-world

# Install dependencies
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Output:

```
🚀 Gati Development Server

✓ Loaded 1 handler
✓ Server running at http://localhost:3000
👁 Watching for file changes...
```

### Test the Handler

```bash
# Basic request
curl http://localhost:3000/hello
```

Response:

```json
{
  "message": "Hello, World!",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "requestId": "req_abc123"
}
```

### With Query Parameter

```bash
curl "http://localhost:3000/hello?name=Gati"
```

Response:

```json
{
  "message": "Hello, Gati!",
  "timestamp": "2025-11-10T12:00:01.000Z",
  "requestId": "req_abc124"
}
```

## Understanding the Code

### Handler Signature

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  // ...
};
```

The handler receives four parameters:

1. **`req`** - Request object (query params, body, headers, etc.)
2. **`res`** - Response object (send JSON, set status, etc.)
3. **`gctx`** - Global context (shared across requests)
4. **`lctx`** - Local context (specific to this request)

### Accessing Query Parameters

```typescript
const name = req.query.name || 'World';
```

Query parameters are automatically parsed from the URL:
- `?name=Gati` → `req.query.name === 'Gati'`
- `?name=Gati&age=25` → `req.query` is `{ name: 'Gati', age: '25' }`

### Logging with Local Context

```typescript
lctx.logger.info('Greeting request received', { name });
```

The local context logger automatically includes:
- Request ID for tracing
- Timestamp
- Contextual metadata

### Sending JSON Response

```typescript
res.json({
  message: `Hello, ${name}!`,
  timestamp: new Date().toISOString(),
  requestId: lctx.requestId,
});
```

`res.json()` automatically:
- Sets `Content-Type: application/json`
- Stringifies the object
- Sends the response with status 200

## Next Steps

### Add More Handlers

Create `src/handlers/goodbye.ts`:

```typescript
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res) => {
  res.json({ message: 'Goodbye!' });
};
```

Access at: `http://localhost:3000/goodbye`

### Add POST Handler

Create `src/handlers/greet.ts`:

```typescript
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res) => {
  const { name, greeting } = req.body;
  
  res.json({
    message: `${greeting || 'Hello'}, ${name || 'stranger'}!`
  });
};
```

Test:

```bash
curl -X POST http://localhost:3000/greet \
  -H "Content-Type: application/json" \
  -d '{"name":"Gati","greeting":"Welcome"}'
```

### Add Error Handling

```typescript
export const handler: Handler = (req, res) => {
  const { name } = req.query;
  
  if (!name) {
    res.status(400).json({ 
      error: 'Name parameter is required' 
    });
    return;
  }
  
  res.json({ message: `Hello, ${name}!` });
};
```

## Learn More

- [Quick Start Guide](/guide/quick-start) - Build a REST API
- [Handler API Reference](/api/handler) - Full handler documentation
- [Request API](/api/request) - Access request data
- [Response API](/api/response) - Send responses

## Source Code

View the complete source code on GitHub:
[examples/hello-world](https://github.com/krishnapaul242/gati/tree/main/examples/hello-world)
