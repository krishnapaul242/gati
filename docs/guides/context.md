# Context (gctx & lctx)

Understanding Global and Local Context in Gati.

::: warning Work in Progress
This page is under construction. More detailed documentation coming soon.
:::

## Overview

Gati provides two context objects to manage state:

- **Global Context (gctx)** - Application-wide shared state
- **Local Context (lctx)** - Request-scoped data

```typescript
export const handler: Handler = (req, res, gctx, lctx) => {
  // Global: modules, config, app-wide logger
  const db = gctx.modules.database;
  
  // Local: request ID, request-scoped logger
  lctx.logger.info('Processing request');
};
```

## When to Use Which

### Use Global Context (gctx) for:
- Database connections
- Shared services (email, SMS, etc.)
- Configuration values
- Application-wide state

### Use Local Context (lctx) for:
- Request tracking
- Request-scoped logging
- Performance timing
- User session data

## Examples

See the [Context API Reference](/api/context) for detailed examples.

## Related

- [Context API](/api/context) - Full API reference
- [Modules Guide](/guide/modules) - Creating modules
- [Logging Guide](/guide/logging) - Structured logging
