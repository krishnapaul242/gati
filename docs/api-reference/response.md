# Response

The `Response` object is used to send HTTP responses back to the client.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

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

## Related

- [Handler API](/api-reference/handler) - Handler function signature
- [Request API](/api-reference/request) - Accessing request data
- [Context API](/api-reference/context) - Global and local context
