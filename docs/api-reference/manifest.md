# Manifest API Reference

## Overview

The Manifest API provides types and interfaces for storing and retrieving handler and hook metadata. This enables runtime introspection, debugging, and Playground visualization.

## Types

### HookDefinition

Represents a single hook definition extracted from handler code.

```typescript
interface HookDefinition {
  id: string;
  type: 'before' | 'after' | 'catch';
  level: 'global' | 'route' | 'local';
  isAsync: boolean;
  timeout?: number;
  retries?: number;
  sourceLocation?: {
    file: string;
    line: number;
    column: number;
  };
}
```

**Fields:**

- `id` - Unique identifier for the hook
- `type` - Hook type: `before`, `after`, or `catch`
- `level` - Execution level: `global`, `route`, or `local`
- `isAsync` - Whether the hook function is async
- `timeout` - Optional timeout in milliseconds
- `retries` - Optional number of retry attempts
- `sourceLocation` - Optional source code location

**Example:**

```json
{
  "id": "auth-check",
  "type": "before",
  "level": "global",
  "isAsync": true,
  "timeout": 5000,
  "retries": 2,
  "sourceLocation": {
    "file": "src/handlers/users/[id].ts",
    "line": 10,
    "column": 5
  }
}
```

---

### HookManifest

Contains all hook definitions for a specific handler.

```typescript
interface HookManifest {
  handlerId: string;
  hooks: HookDefinition[];
  createdAt: number;
  version: string;
}
```

**Fields:**

- `handlerId` - Unique identifier for the handler
- `hooks` - Array of hook definitions
- `createdAt` - Timestamp when manifest was created
- `version` - Manifest schema version

**Example:**

```json
{
  "handlerId": "users-[id]",
  "hooks": [
    {
      "id": "auth-check",
      "type": "before",
      "level": "global",
      "isAsync": true
    },
    {
      "id": "log-response",
      "type": "after",
      "level": "local",
      "isAsync": false
    }
  ],
  "createdAt": 1706140800000,
  "version": "1.0.0"
}
```

---

### HookExecutionTrace

Records runtime execution details for a hook.

```typescript
interface HookExecutionTrace {
  hookId: string;
  type: 'before' | 'after' | 'catch';
  level: 'global' | 'route' | 'local';
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: Error;
  order: number;
}
```

**Fields:**

- `hookId` - Hook identifier
- `type` - Hook type
- `level` - Execution level
- `startTime` - Execution start timestamp
- `endTime` - Execution end timestamp
- `duration` - Execution duration in milliseconds
- `success` - Whether execution succeeded
- `error` - Error object if execution failed
- `order` - Execution order index

---

### RequestHookTrace

Contains all hook execution traces for a single request.

```typescript
interface RequestHookTrace {
  requestId: string;
  traces: HookExecutionTrace[];
  startTime: number;
  endTime?: number;
}
```

**Fields:**

- `requestId` - Unique request identifier
- `traces` - Array of hook execution traces
- `startTime` - Request start timestamp
- `endTime` - Request end timestamp (optional)

---

## ManifestStore Interface

### Methods

#### `storeHookManifest(manifest: HookManifest): void`

Stores a hook manifest.

```typescript
const manifest: HookManifest = {
  handlerId: 'users-[id]',
  hooks: [...],
  createdAt: Date.now(),
  version: '1.0.0'
};

store.storeHookManifest(manifest);
```

#### `getHookManifest(handlerId: string): HookManifest | null`

Retrieves a hook manifest by handler ID.

```typescript
const manifest = store.getHookManifest('users-[id]');
if (manifest) {
  console.log(`Found ${manifest.hooks.length} hooks`);
}
```

#### `listHookManifests(): HookManifest[]`

Lists all stored hook manifests.

```typescript
const manifests = store.listHookManifests();
console.log(`Total manifests: ${manifests.length}`);
```

---

## HookPlayback Class

### Methods

#### `enable(): void`

Enables hook execution recording.

```typescript
const playback = new HookPlayback();
playback.enable();
```

#### `disable(): void`

Disables hook execution recording.

```typescript
playback.disable();
```

#### `isEnabled(): boolean`

Checks if recording is enabled.

```typescript
if (playback.isEnabled()) {
  console.log('Recording active');
}
```

#### `startRequest(requestId: string): void`

Starts recording for a request.

```typescript
playback.startRequest('req-123');
```

#### `endRequest(requestId: string): void`

Ends recording for a request.

```typescript
playback.endRequest('req-123');
```

#### `recordHookExecution(...): void`

Records a hook execution.

```typescript
playback.recordHookExecution(
  'req-123',
  'auth-check',
  'before',
  'global',
  Date.now(),
  Date.now() + 50,
  true
);
```

#### `getHookTrace(requestId: string): RequestHookTrace | undefined`

Retrieves hook trace for a request.

```typescript
const trace = playback.getHookTrace('req-123');
console.log(`Executed ${trace?.traces.length} hooks`);
```

#### `getAllTraces(): RequestHookTrace[]`

Gets all recorded traces.

```typescript
const allTraces = playback.getAllTraces();
```

#### `clear(): void`

Clears all recorded traces.

```typescript
playback.clear();
```

#### `clearRequest(requestId: string): void`

Clears traces for a specific request.

```typescript
playback.clearRequest('req-123');
```

---

## Usage Examples

### Recording Hooks in Production

```typescript
import { HookOrchestrator } from '@gati-framework/runtime';

const orchestrator = new HookOrchestrator();
const playback = orchestrator.enablePlayback();

// Hooks are now automatically recorded
```

### Analyzing Hook Performance

```typescript
const trace = playback.getHookTrace(requestId);

trace?.traces.forEach(hook => {
  console.log(`${hook.hookId}: ${hook.duration}ms`);
  if (!hook.success) {
    console.error(`Failed: ${hook.error?.message}`);
  }
});
```

### Debugging Hook Execution Order

```typescript
const trace = playback.getHookTrace(requestId);

const sortedHooks = trace?.traces
  .sort((a, b) => a.order - b.order)
  .map(h => `${h.order}. ${h.hookId} (${h.type})`);

console.log('Execution order:', sortedHooks);
```

---

## See Also

- [Hooks Guide](/guides/hooks)
- [Playground Guide](/guides/playground)
- [Handler API](/api-reference/handler)
