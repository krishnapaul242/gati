# @gati-framework/playground

> Visual debugging and request flow inspection for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/playground.svg)](https://www.npmjs.com/package/@gati-framework/playground)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Real-time visual debugging interface with request replay, trace inspection, and debug gates. See your API in action.

## Installation

```bash
npm install @gati-framework/playground
```

## Quick Start

```bash
# Start dev server with playground
gati dev --playground

# Access playground
open http://localhost:3000/__playground
```

## Features

- ✅ **3 Visualization Modes** - API, Network, Tracking
- ✅ **Request Replay** - Time-travel debugging
- ✅ **Trace Inspection** - Distributed tracing visualization
- ✅ **Debug Gates** - Conditional breakpoints
- ✅ **WebSocket Integration** - Real-time updates
- ✅ **Snapshot Inspection** - Request/response snapshots

## Visualization Modes

### API Mode

View handlers, modules, and request flow.

```
┌─────────────────────────────────┐
│         Handlers (3)            │
├─────────────────────────────────┤
│ GET  /users/:id                 │
│ POST /users                     │
│ GET  /health                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│         Modules (2)             │
├─────────────────────────────────┤
│ database                        │
│ logger                          │
└─────────────────────────────────┘
```

### Network Mode

Visualize request/response flow with timing.

```
Request → Handler → Module → Response
  2ms      5ms       3ms      1ms
```

### Tracking Mode

Distributed tracing with request/trace/client IDs.

```
Request ID:  req-123
Trace ID:    trace-456
Client ID:   client-789
Duration:    11ms
Status:      200 OK
```

## Integration

### Automatic (Dev Server)

```bash
gati dev --playground
```

Playground automatically available at `/__playground`.

### Manual Integration

```typescript
import { PlaygroundEngine } from '@gati-framework/playground';

const playground = new PlaygroundEngine({
  port: 3001,
  enableReplay: true,
  enableDebugGates: true
});

await playground.start();
```

### Runtime Integration

```typescript
import { createE2EIntegration } from '@gati-framework/runtime';
import { PlaygroundEngine } from '@gati-framework/playground';

const integration = createE2EIntegration({ handlers, modules });
const playground = new PlaygroundEngine({ integration });

await playground.start();
```

## Request Replay

Replay any request with original context.

```typescript
// Capture request
playground.captureRequest({
  id: 'req-123',
  method: 'GET',
  path: '/users/123',
  headers: {},
  timestamp: Date.now()
});

// Replay later
await playground.replayRequest('req-123');
```

### UI Usage

1. Click request in history
2. Click "Replay" button
3. View replayed response
4. Compare with original

## Debug Gates

Conditional breakpoints for debugging.

```typescript
import { DebugGateManager } from '@gati-framework/playground';

const gates = new DebugGateManager();

// Add debug gate
gates.addGate({
  id: 'user-check',
  condition: (req) => req.params.id === '123',
  action: 'pause' // or 'log', 'snapshot'
});

// Check in handler
export const handler: Handler = async (req, res, gctx, lctx) => {
  if (gates.shouldPause(req)) {
    // Execution paused, inspect in playground
  }
  
  const user = await gctx.modules['db'].users.findById(req.params.id);
  res.json({ user });
};
```

### UI Usage

1. Open Debug Gates panel
2. Add condition: `req.params.id === '123'`
3. Select action: Pause/Log/Snapshot
4. Make request matching condition
5. Inspect paused state

## Trace Inspection

View distributed tracing data.

```typescript
// Traces automatically captured
playground.getTrace('trace-456');

// View in UI
{
  traceId: 'trace-456',
  spans: [
    { name: 'handler', duration: 5ms },
    { name: 'database', duration: 3ms },
    { name: 'response', duration: 1ms }
  ],
  totalDuration: 11ms
}
```

## Snapshot Inspection

Capture request/response snapshots.

```typescript
// Automatic snapshots
playground.enableSnapshots({
  maxSnapshots: 100,
  captureBody: true,
  captureHeaders: true
});

// Manual snapshot
playground.captureSnapshot({
  requestId: 'req-123',
  request: req,
  response: res,
  context: { gctx, lctx }
});
```

## WebSocket API

Real-time communication with playground UI.

```typescript
// Server-side
playground.broadcast({
  type: 'request',
  data: { id: 'req-123', method: 'GET', path: '/users/123' }
});

// Client-side
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === 'request') {
    console.log('New request:', data);
  }
};
```

## Configuration

```typescript
interface PlaygroundConfig {
  port?: number;                    // Default: 3001
  enableReplay?: boolean;           // Default: true
  enableDebugGates?: boolean;       // Default: true
  enableSnapshots?: boolean;        // Default: true
  maxSnapshots?: number;            // Default: 100
  maxTraces?: number;               // Default: 1000
  wsPath?: string;                  // Default: '/ws'
}
```

## UI Features

### Request History

- View all requests
- Filter by method/path/status
- Sort by timestamp/duration
- Search by request ID

### Handler Inspector

- View handler code
- See registered routes
- Check middleware
- View lifecycle hooks

### Module Inspector

- View module state
- Check dependencies
- See RPC calls
- Monitor lifecycle

### Performance Metrics

- Request duration
- Handler execution time
- Module call time
- Response time

## Examples

### Basic Setup

```typescript
import { PlaygroundEngine } from '@gati-framework/playground';

const playground = new PlaygroundEngine({
  port: 3001,
  enableReplay: true
});

await playground.start();
console.log('Playground: http://localhost:3001');
```

### With Debug Gates

```typescript
const playground = new PlaygroundEngine({
  enableDebugGates: true
});

playground.debugGates.addGate({
  id: 'slow-requests',
  condition: (req, res, duration) => duration > 100,
  action: 'log'
});
```

### With Custom Snapshots

```typescript
const playground = new PlaygroundEngine({
  enableSnapshots: true,
  maxSnapshots: 50
});

playground.on('request', (req) => {
  if (req.path.startsWith('/api/admin')) {
    playground.captureSnapshot({ request: req });
  }
});
```

## Development

```bash
pnpm install
pnpm build
pnpm dev          # Watch mode
pnpm test:e2e     # E2E tests
pnpm test:e2e:ui  # E2E tests with UI
```

## E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test('playground loads', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('h1')).toContainText('Gati Playground');
});

test('request replay works', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.click('[data-testid="request-123"]');
  await page.click('[data-testid="replay-button"]');
  await expect(page.locator('[data-testid="response"]')).toBeVisible();
});
```

## Troubleshooting

**Playground not loading**:
- Check port availability
- Verify WebSocket connection
- Check browser console

**Requests not appearing**:
- Verify runtime integration
- Check WebSocket connection
- Enable debug logging

**Replay fails**:
- Check request ID exists
- Verify handler still registered
- Check module availability

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/cli](../cli) - CLI tools
- [@gati-framework/testing](../testing) - Test utilities

## Documentation

- [Playground Guide](https://krishnapaul242.github.io/gati/guides/playground)
- [Visual Debugging](https://krishnapaul242.github.io/gati/blog/visual-debugging-playground)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
