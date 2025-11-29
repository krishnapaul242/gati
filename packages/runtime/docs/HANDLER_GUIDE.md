# Handler Development Guide

## Handler Signature

```typescript
type Handler = (
  req: Request,
  res: Response,
  gctx: GlobalContext,
  lctx: LocalContext
) => void | Promise<void>;
```

## Basic Handler

```typescript
export const handler: Handler = (req, res) => {
  res.json({ message: 'Hello, World!' });
};
```

## Accessing Request Data

```typescript
export const handler: Handler = (req, res) => {
  const { id } = req.params;
  const { name } = req.query;
  const data = req.body;
  const auth = req.headers.authorization;
  
  res.json({ id, name, data });
};
```

## Using Modules

```typescript
export const handler: Handler = async (req, res, gctx) => {
  const db = gctx.modules['db'];
  const user = await db.getUser(req.params.id);
  res.json({ user });
};
```

## Lifecycle Hooks

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  lctx.lifecycle.onCleanup(async () => {
    await closeConnection();
  });

  lctx.lifecycle.onError(async (error) => {
    await logError(error);
  });

  res.json({ ok: true });
};
```

## Error Handling

```typescript
export const handler: Handler = async (req, res, gctx) => {
  const user = await gctx.modules['db'].getUser(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
};
```
