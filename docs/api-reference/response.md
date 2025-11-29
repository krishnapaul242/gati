# Response

The `Response` object is used to send HTTP responses back to the client.

## Overview

The `Response` object is the second parameter passed to every handler function. It provides methods to send responses, set status codes, headers, and more.

```typescript
export const handler: Handler = (req, res) => {
  res.json({ message: 'Hello World' });
};
```

## Methods

### `res.json(data)`

Send a JSON response. Automatically sets `Content-Type: application/json`.

```typescript
res.json({ user: { id: 1, name: 'John' } });
```

### `res.status(code)`

Set the HTTP status code. Chainable.

```typescript
res.status(201).json({ created: true });
res.status(404).json({ error: 'Not found' });
```

### `res.send(data)`

Send a response with any content type.

```typescript
res.send('Plain text');
res.send(Buffer.from('binary data'));
```

### `res.header(name, value)`

Set a response header. Chainable.

```typescript
res.header('X-Custom-Header', 'value')
   .header('Cache-Control', 'no-cache')
   .json({ ok: true });
```

### `res.redirect(url, [status])`

Redirect to a different URL.

```typescript
res.redirect('/new-url');
res.redirect('/login', 302);
```

## Common Status Codes

```typescript
// Success
res.status(200); // OK
res.status(201); // Created
res.status(204); // No Content

// Client Errors
res.status(400); // Bad Request
res.status(401); // Unauthorized
res.status(403); // Forbidden
res.status(404); // Not Found
res.status(422); // Unprocessable Entity

// Server Errors
res.status(500); // Internal Server Error
res.status(503); // Service Unavailable
```

## Examples

### JSON Response

```typescript
export const handler: Handler = (req, res) => {
  res.json({
    success: true,
    data: { id: 123 },
    timestamp: new Date().toISOString()
  });
};
```

### Error Response

```typescript
export const handler: Handler = (req, res) => {
  res.status(400).json({
    error: 'Validation failed',
    details: ['Email is required', 'Password too short']
  });
};
```

### Custom Headers

```typescript
export const handler: Handler = (req, res) => {
  res
    .header('X-API-Version', '1.0')
    .header('X-Rate-Limit-Remaining', '99')
    .json({ data: [] });
};
```

### File Download

```typescript
export const handler: Handler = (req, res) => {
  res
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', 'attachment; filename="report.pdf"')
    .send(pdfBuffer);
};
```

### Streaming Responses

```typescript
export const handler: Handler = async (req, res) => {
  res.header('Content-Type', 'text/event-stream');
  res.header('Cache-Control', 'no-cache');
  res.header('Connection', 'keep-alive');
  
  // Stream data
  for (let i = 0; i < 10; i++) {
    res.write(`data: ${JSON.stringify({ count: i })}\n\n`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  res.end();
};
```

### CORS Headers

```typescript
export const handler: Handler = (req, res) => {
  res
    .header('Access-Control-Allow-Origin', '*')
    .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    .json({ data: [] });
};
```

### Conditional Responses

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  const user = await fetchUser(req.params.id);
  
  if (!user) {
    res.status(404).json({ 
      error: 'User not found',
      requestId: lctx.requestId 
    });
    return;
  }
  
  if (!hasPermission(user)) {
    res.status(403).json({ 
      error: 'Forbidden',
      requestId: lctx.requestId 
    });
    return;
  }
  
  res.json({ user });
};
```

## Best Practices

### Always Set Appropriate Status Codes

```typescript
// ✅ Good - Explicit status codes
res.status(201).json({ created: true });
res.status(404).json({ error: 'Not found' });

// ❌ Bad - Implicit 200 for errors
res.json({ error: 'Not found' }); // Still returns 200!
```

### Use Consistent Response Format

```typescript
// ✅ Good - Consistent structure
res.json({
  success: true,
  data: { user },
  timestamp: new Date().toISOString()
});

res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: errors,
  timestamp: new Date().toISOString()
});
```

## Related

- [Handler API](/api-reference/handler) - Handler function signature
- [Request API](/api-reference/request) - Accessing request data
- [Context API](/api-reference/context) - Global and local context
- [Error Handling](/guides/error-handling) - Error response patterns
