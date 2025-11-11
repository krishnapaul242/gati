# Request

The `Request` object provides access to incoming HTTP request data.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

## Overview

The `Request` object is the first parameter passed to every handler function. It provides access to all incoming request data including headers, body, query parameters, path parameters, and more.

```typescript
export const handler: Handler = (req, res) => {
  // Access request data via req object
  const method = req.method;
  const url = req.url;
  const body = req.body;
};
```

## Properties

### `req.method`

The HTTP method of the request.

```typescript
const method: string = req.method; // 'GET', 'POST', 'PUT', etc.
```

### `req.url`

The full request URL.

```typescript
const url: string = req.url; // '/users/123?sort=desc'
```

### `req.headers`

HTTP request headers as a key-value object.

```typescript
const headers: Record<string, string> = req.headers;
const contentType = req.headers['content-type'];
const auth = req.headers['authorization'];
```

### `req.params`

URL path parameters extracted from the route pattern.

```typescript
// Route: GET /users/:id
export const handler: Handler = (req, res) => {
  const userId = req.params.id; // '123' from /users/123
};
```

### `req.query`

Query string parameters parsed as an object.

```typescript
// URL: /search?q=gati&limit=10
export const handler: Handler = (req, res) => {
  const searchTerm = req.query.q;      // 'gati'
  const limit = req.query.limit;        // '10'
};
```

### `req.body`

Parsed request body. Automatically parsed based on `Content-Type`.

```typescript
// JSON body
export const handler: Handler = (req, res) => {
  const { email, password } = req.body;
};
```

Supported content types:
- `application/json` - Parsed as JSON object
- `application/x-www-form-urlencoded` - Parsed as form data
- `text/plain` - Raw text string
- `multipart/form-data` - Form data with files

### `req.cookies`

Request cookies parsed as an object.

```typescript
const cookies: Record<string, string> = req.cookies;
const sessionId = req.cookies.sessionId;
```

## Examples

### Accessing Headers

```typescript
export const handler: Handler = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  // Verify token...
};
```

### Using Query Parameters

```typescript
export const handler: Handler = (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  
  const offset = (page - 1) * limit;
  
  res.json({ page, limit, offset });
};
```

### Processing Request Body

```typescript
export const handler: Handler = (req, res) => {
  const { title, content, tags } = req.body;
  
  // Validation
  if (!title || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  // Process...
};
```

## Related

- [Handler API](/api-reference/handler) - Handler function signature
- [Response API](/api-reference/response) - Sending responses
- [Context API](/api-reference/context) - Global and local context
