---
title: "Visual Debugging with Gati Playground"
date: 2025-11-22
author: Krishna Paul
tags: [debugging, playground, developer-experience]
---

# Visual Debugging with Gati Playground

Interactive debugging and request visualization for Gati applications.

## The Problem

Traditional debugging:
- Console.log everywhere
- No request history
- Hard to reproduce issues
- No visual flow

## Playground Features

### 1. Request Tracking

Every request is captured with:
- Full request/response data
- Execution timeline
- Module calls
- Error traces

### 2. Three Visualization Modes

**API Mode** - Request/response inspection
```
GET /users/123
├─ Headers
├─ Query params
├─ Response (200 OK)
└─ Duration: 45ms
```

**Network Mode** - Module interaction graph
```
Handler → Database → Cache → External API
  ↓         ↓         ↓          ↓
 5ms      12ms      2ms       28ms
```

**Tracking Mode** - Execution timeline
```
0ms    Parse request
5ms    Route matching
10ms   Middleware chain
15ms   Handler execution
60ms   Response sent
```

### 3. Request Replay

```typescript
// Replay any request
playground.replay('req-abc123');

// Modify and replay
playground.replay('req-abc123', {
  body: { email: 'new@example.com' }
});
```

### 4. Debug Gates

```typescript
// Conditional breakpoints
playground.gate('user-creation', {
  condition: (req) => req.body.email.includes('test'),
  action: 'pause' // or 'log', 'alert'
});
```

## Usage

### Enable Playground

```typescript
import { createApp } from '@gati-framework/runtime';
import { enablePlayground } from '@gati-framework/playground';

const app = createApp();

if (process.env.NODE_ENV === 'development') {
  enablePlayground(app, { port: 3001 });
}
```

### Access UI

```bash
# Start app
pnpm dev

# Open playground
open http://localhost:3001
```

### WebSocket Integration

```typescript
// Real-time request streaming
playground.on('request', (req) => {
  console.log('New request:', req.id);
});
```

## Real-World Example

### Debugging Slow Requests

1. **Identify slow request** in Tracking mode
2. **Inspect timeline** - Database query took 500ms
3. **Replay request** with different params
4. **Add index** to database
5. **Verify** - Now 50ms

### Debugging Errors

1. **Filter** by status code 500
2. **View error trace** in API mode
3. **Check module calls** in Network mode
4. **Replay** with fixes
5. **Confirm** error resolved

## Benefits

1. **Visual** - See request flow
2. **Interactive** - Replay and modify
3. **Real-time** - Live request streaming
4. **Integrated** - Works with existing code

## Status

- ✅ Core features: Complete
- ✅ Three visualization modes: Complete
- ✅ Request replay: Complete
- ✅ WebSocket streaming: Complete

## Related

- [Playground Guide](/guides/playground)
- [Error Handling](/guides/error-handling)
- [Observability](/guides/observability)
