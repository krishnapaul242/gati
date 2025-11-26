# Hooks Guide

## Overview

Hooks allow you to execute code at specific points in the request lifecycle. Gati automatically records hook definitions and execution traces for debugging and visualization.

## Hook Types

### Before Hooks

Execute before the handler runs.

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  lctx.before(async () => {
    // Validate authentication
    const token = req.headers.authorization;
    if (!token) throw new Error('Unauthorized');
  }, { id: 'auth-check', level: 'global' });

  res.json({ message: 'Success' });
};
```

### After Hooks

Execute after the handler completes.

```typescript
lctx.after(() => {
  console.log('Request completed');
}, { id: 'log-completion', level: 'local' });
```

### Catch Hooks

Execute when errors occur.

```typescript
lctx.catch((error) => {
  console.error('Handler failed:', error);
}, { id: 'error-logger', level: 'global' });
```

## Hook Levels

- **global** - Runs for all requests
- **route** - Runs for specific route patterns
- **local** - Runs only for this handler

## Hook Manifest Recording

Gati automatically extracts hook definitions during build time and stores them in manifests. This enables:

- Runtime introspection
- Debugging and visualization
- Performance analysis
- Execution order verification

### Manifest Structure

Each handler's hooks are recorded in a manifest:

```json
{
  "handlerId": "users-[id]",
  "hooks": [
    {
      "id": "auth-check",
      "type": "before",
      "level": "global",
      "isAsync": true,
      "timeout": 5000
    }
  ],
  "createdAt": 1706140800000,
  "version": "1.0.0"
}
```

### Accessing Manifests

```typescript
import { createManifestStore } from '@gati-framework/runtime';

const store = createManifestStore();
const manifest = store.getHookManifest('users-[id]');

console.log(`Handler has ${manifest?.hooks.length} hooks`);
```

## Runtime Recording

Enable hook execution recording for debugging:

```typescript
import { HookOrchestrator } from '@gati-framework/runtime';

const orchestrator = new HookOrchestrator();
const playback = orchestrator.enablePlayback();

// Hooks are now recorded during execution
```

### Analyzing Execution

```typescript
playback.startRequest(requestId);
// ... request executes ...
playback.endRequest(requestId);

const trace = playback.getHookTrace(requestId);
trace?.traces.forEach(hook => {
  console.log(`${hook.hookId}: ${hook.duration}ms`);
});
```

## Configuration

### Timeout

Set maximum execution time:

```typescript
lctx.before(async () => {
  await fetchData();
}, { id: 'fetch', timeout: 3000 });
```

### Retries

Configure retry attempts:

```typescript
lctx.before(async () => {
  await unreliableOperation();
}, { id: 'retry-op', retries: 3 });
```

## Best Practices

1. **Use meaningful IDs** - Makes debugging easier
2. **Set appropriate timeouts** - Prevent hanging requests
3. **Keep hooks focused** - Single responsibility per hook
4. **Use correct levels** - Global for auth, local for specific logic
5. **Handle errors gracefully** - Use catch hooks for cleanup

## See Also

- [Manifest API Reference](/api-reference/manifest)
- [Playground Guide](/guides/playground)
- [Handler Guide](/guides/handlers)
