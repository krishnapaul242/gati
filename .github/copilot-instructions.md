# GitHub Copilot Instructions for Gati

## Project Context

**Gati** is a next-generation TypeScript/Node.js framework for building cloud-native, versioned APIs with automatic scaling, deployment, and SDK generation.

### Core Concepts

- **Handlers**: Functions that process HTTP requests with signature `handler(req, res, gctx, lctx)`
- **Modules**: Reusable business logic loaded with dependency injection
- **Context**: Global (gctx) for shared resources, Local (lctx) for request-scoped data
- **Versioning**: Timestamp-based routing for backward compatibility
- **Cloud-Native**: Kubernetes deployment with multi-cloud support

---

## Code Style & Conventions

### TypeScript Standards

```typescript
// ✅ DO: Use strict type safety
const handler: Handler = (req, res, gctx, lctx) => {
  const userId: string = req.params.id;
  return res.json({ userId });
};

// ❌ DON'T: Use 'any'
const handler = (req: any, res: any) => {
  /* ... */
};
```

### Naming Conventions

```typescript
// Interfaces: PascalCase with descriptive names
interface HandlerContext {
  /* ... */
}
interface ModuleRegistry {
  /* ... */
}

// Functions: camelCase, verb-first
function executeHandler() {
  /* ... */
}
function registerModule() {
  /* ... */
}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_PORT = 3000;

// Files: kebab-case
// handler-engine.ts, module-loader.ts
```

### Import Order

```typescript
// 1. Node.js built-ins
import { createServer } from 'http';
import { resolve } from 'path';

// 2. External dependencies
import express from 'express';
import { z } from 'zod';

// 3. Internal modules (absolute imports via tsconfig paths)
import { Handler } from '@/runtime/types/handler';
import { Context } from '@/runtime/types/context';

// 4. Relative imports (same directory)
import { parseRoute } from './parser';
import { matchRoute } from './matcher';
```

### Functional Patterns Preferred

```typescript
// ✅ DO: Use functional composition
const processRequest = pipe(
  parseBody,
  validateInput,
  executeHandler,
  formatResponse
);

// ✅ DO: Pure functions when possible
function createContext(req: Request): Context {
  return {
    requestId: generateId(),
    timestamp: Date.now(),
  };
}

// ❌ AVOID: Classes unless necessary (e.g., errors, complex state)
class RequestProcessor {
  /* ... */
} // Only if truly needed
```

---

## Testing Requirements

### Framework: Vitest

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HandlerEngine', () => {
  beforeEach(() => {
    // Setup
    vi.clearAllMocks();
  });

  it('should execute handler with correct parameters', async () => {
    // Arrange
    const req = createMockRequest();
    const res = createMockResponse();
    const gctx = createMockGlobalContext();
    const lctx = createMockLocalContext();

    // Act
    await executeHandler(handler, req, res, gctx, lctx);

    // Assert
    expect(handler).toHaveBeenCalledWith(req, res, gctx, lctx);
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

### Coverage Requirements

- **Minimum:** 80% line coverage
- **Target:** 90% line coverage
- Test edge cases, errors, and async flows
- Mock external dependencies (DB, APIs, file system)

### Test Structure

```
tests/
├── unit/              # Unit tests (isolated functions)
├── integration/       # Integration tests (multiple components)
└── e2e/               # End-to-end tests (full request flow)
```

---

## Error Handling

### Custom Error Classes

```typescript
// Create typed errors
export class HandlerError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HandlerError';
  }
}

// Usage
throw new HandlerError('Invalid request body', 400, { field: 'email' });
```

### Error Handling Pattern

```typescript
try {
  await executeHandler(req, res, gctx, lctx);
} catch (error) {
  if (error instanceof HandlerError) {
    res.status(error.statusCode).json({
      error: error.message,
      context: error.context,
    });
  } else {
    // Log unknown errors
    logger.error('Unexpected error', { error, requestId: lctx.requestId });
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## File Organization

### Project Structure (Reference)

```
src/
├── runtime/
│   ├── app-core.ts           # Main HTTP server
│   ├── handler-engine.ts     # Handler execution
│   ├── module-loader.ts      # Module system
│   ├── route-manager.ts      # Route registration
│   ├── context-manager.ts    # Context lifecycle
│   └── types/
│       ├── request.ts
│       ├── response.ts
│       ├── context.ts
│       └── handler.ts
├── cli/
│   ├── index.ts
│   ├── commands/
│   │   ├── create.ts
│   │   ├── dev.ts
│   │   └── build.ts
│   └── utils/
└── plugins/
    ├── aws/
    ├── gcp/
    └── azure/
```

### File Template

```typescript
/**
 * @module runtime/handler-engine
 * @description Core handler execution engine for Gati framework
 */

import type { Handler, Request, Response, Context } from './types';

// Constants
const DEFAULT_TIMEOUT = 30_000; // 30 seconds

// Types
interface ExecutionOptions {
  timeout?: number;
}

// Main exports
export async function executeHandler(
  handler: Handler,
  req: Request,
  res: Response,
  gctx: Context,
  lctx: Context,
  options?: ExecutionOptions
): Promise<void> {
  // Implementation
}

// Helper functions (not exported)
function validateHandler(handler: unknown): handler is Handler {
  // Implementation
}
```

---

## Documentation Standards

### JSDoc Comments

````typescript
/**
 * Executes a handler function with the provided request context.
 *
 * @param handler - The handler function to execute
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param gctx - Global context (shared across requests)
 * @param lctx - Local context (request-scoped)
 * @returns Promise that resolves when handler completes
 *
 * @throws {HandlerError} If handler validation fails
 * @throws {TimeoutError} If execution exceeds timeout
 *
 * @example
 * ```typescript
 * const handler: Handler = (req, res) => res.json({ ok: true });
 * await executeHandler(handler, req, res, gctx, lctx);
 * ```
 */
export async function executeHandler(/* ... */) {
  /* ... */
}
````

### Inline Comments

```typescript
// ✅ DO: Explain WHY, not WHAT
// Using WeakMap to prevent memory leaks when modules are unloaded
const moduleCache = new WeakMap();

// ❌ DON'T: State the obvious
// Create a new variable for user ID
const userId = req.params.id;
```

---

## Performance Considerations

### Async Best Practices

```typescript
// ✅ DO: Run independent async operations in parallel
const [user, posts, comments] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchComments(userId),
]);

// ❌ DON'T: Sequential awaits when not needed
const user = await fetchUser(userId);
const posts = await fetchPosts(userId);
const comments = await fetchComments(userId);
```

### Memory Management

```typescript
// ✅ DO: Clean up resources
function createContext(): Context {
  const cleanupFns: (() => void)[] = [];

  return {
    cleanup: () => cleanupFns.forEach((fn) => fn()),
    onCleanup: (fn) => cleanupFns.push(fn),
  };
}

// Usage
lctx.onCleanup(() => dbConnection.close());
```

---

## Security Guidelines

### Input Validation

```typescript
import { z } from 'zod';

// Define schemas
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
});

// Validate in handlers
const handler: Handler = (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) {
    throw new HandlerError('Invalid input', 400, result.error);
  }
  // Use result.data (typed correctly)
};
```

### Avoid Common Pitfalls

```typescript
// ❌ DON'T: Expose internal errors
catch (error) {
  res.json({ error: error.stack });
}

// ✅ DO: Log internally, return generic message
catch (error) {
  logger.error('Database error', { error, userId });
  res.status(500).json({ error: 'Service temporarily unavailable' });
}
```

---

## Git Commit Standards

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```
feat(runtime): implement handler execution pipeline

- Add Request and Response type definitions
- Create context manager for gctx and lctx
- Implement handler execution flow with error handling

Closes #1
```

```
fix(router): handle path params with special characters

Path params containing dots were not being parsed correctly.
Updated regex to support alphanumeric + dots + dashes.

Fixes #45
```

---

## Dependencies & Versions

### Preferred Libraries

```json
{
  "typescript": "^5.x",
  "vitest": "^1.x",
  "zod": "^3.x",
  "pino": "^8.x" // Logging
}
```

### Adding New Dependencies

Before adding a dependency:

1. Check if functionality can be implemented in ~50 lines
2. Verify package is actively maintained (updated in last 6 months)
3. Check bundle size impact
4. Prefer zero-dependency packages

---

## Issue Workflow

When working on an issue:

1. **Read Acceptance Criteria** in issue description
2. **Check Dependencies** in MILESTONES.md
3. **Create Branch**: `feat/issue-<number>-<short-description>`
4. **Implement** with tests
5. **Update Documentation** if needed
6. **Open PR** with:
   - Reference to issue: "Closes #X"
   - Description of changes
   - Screenshots/examples (if UI/CLI)

---

## Common Patterns

### Handler Definition

```typescript
export const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;

  // Business logic
  const user = await gctx.modules.db.users.findById(userId);

  if (!user) {
    throw new HandlerError('User not found', 404);
  }

  res.json({ user });
};
```

### Module Registration

```typescript
export function registerModule(
  name: string,
  module: Module,
  gctx: GlobalContext
): void {
  if (gctx.modules.has(name)) {
    throw new Error(`Module ${name} already registered`);
  }

  gctx.modules.set(name, module);

  // Initialize if needed
  if (module.init) {
    module.init(gctx);
  }
}
```

---

## Questions & Clarifications

If requirements are unclear:

1. Check MILESTONES.md for context
2. Review related issues
3. Look at examples/ directory
4. Ask human developer in PR comments

---

**Last Updated:** 2025-11-09  
**Maintained By:** Krishna Paul (@krishnapaul242)
