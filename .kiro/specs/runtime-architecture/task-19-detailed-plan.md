# Task 19: Detailed Implementation Plan

## Comprehensive Task and Subtask List with Acceptance Criteria

---

## PHASE 1: Core Implementation

### Task 19.1: Create HandlerWorker Class Structure

**File**: `packages/runtime/src/handler-worker.ts`

#### Subtask 19.1.1: Define Configuration Interface
**Acceptance Criteria**:
- [ ] `HandlerWorkerConfig` interface defined with:
  - [ ] `defaultTimeout?: number` (default: 30000ms)
  - [ ] `enableMetrics?: boolean` (default: true)
  - [ ] `enableHealthCheck?: boolean` (default: true)
  - [ ] `orchestratorConfig?: HookOrchestratorConfig`
- [ ] JSDoc documentation for all config properties
- [ ] TypeScript types are correct and compile without errors

**Implementation**:
```typescript
export interface HandlerWorkerConfig {
  defaultTimeout?: number;
  enableMetrics?: boolean;
  enableHealthCheck?: boolean;
  orchestratorConfig?: HookOrchestratorConfig;
}
```

---

#### Subtask 19.1.2: Create HandlerWorker Class
**Acceptance Criteria**:
- [ ] `HandlerWorker` class defined with private properties:
  - [ ] `handlers: Map<string, Handler>`
  - [ ] `orchestrator: HookOrchestrator`
  - [ ] `gctx: GlobalContext`
  - [ ] `config: Required<HandlerWorkerConfig>`
  - [ ] `startTime: number`
  - [ ] `requestCount: number`
  - [ ] `errorCount: number`
- [ ] Constructor accepts `gctx: GlobalContext` and optional `config`
- [ ] Constructor initializes all properties with defaults
- [ ] Constructor creates HookOrchestrator instance
- [ ] Constructor sets startTime to Date.now()
- [ ] Constructor initializes counters to 0

**Implementation**:
```typescript
export class HandlerWorker {
  private handlers = new Map<string, Handler>();
  private orchestrator: HookOrchestrator;
  private gctx: GlobalContext;
  private config: Required<HandlerWorkerConfig>;
  private startTime: number;
  private requestCount = 0;
  private errorCount = 0;

  constructor(gctx: GlobalContext, config: HandlerWorkerConfig = {}) {
    this.gctx = gctx;
    this.config = {
      defaultTimeout: config.defaultTimeout ?? 30000,
      enableMetrics: config.enableMetrics ?? true,
      enableHealthCheck: config.enableHealthCheck ?? true,
      orchestratorConfig: config.orchestratorConfig ?? {},
    };
    this.orchestrator = new HookOrchestrator(this.config.orchestratorConfig);
    this.startTime = Date.now();
  }
}
```

---

### Task 19.2: Implement Handler Registration

#### Subtask 19.2.1: Implement registerHandler Method
**Acceptance Criteria**:
- [ ] `registerHandler(id: string, handler: Handler): void` method defined
- [ ] Validates `id` is non-empty string
- [ ] Validates `handler` is a function
- [ ] Validates handler has exactly 4 parameters (req, res, gctx, lctx)
- [ ] Throws error if handler with same ID already exists
- [ ] Stores handler in `handlers` Map
- [ ] JSDoc documentation with example

**Implementation**:
```typescript
registerHandler(id: string, handler: Handler): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Handler ID must be a non-empty string');
  }
  if (typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }
  if (handler.length !== 4) {
    throw new Error('Handler must accept exactly 4 parameters (req, res, gctx, lctx)');
  }
  if (this.handlers.has(id)) {
    throw new Error(`Handler with ID "${id}" already registered`);
  }
  this.handlers.set(id, handler);
}
```

**Tests**:
- [ ] Test: Registers valid handler successfully
- [ ] Test: Throws on empty ID
- [ ] Test: Throws on non-function handler
- [ ] Test: Throws on wrong parameter count
- [ ] Test: Throws on duplicate ID

---

#### Subtask 19.2.2: Implement unregisterHandler Method
**Acceptance Criteria**:
- [ ] `unregisterHandler(id: string): boolean` method defined
- [ ] Returns `true` if handler was removed
- [ ] Returns `false` if handler not found
- [ ] Removes handler from `handlers` Map
- [ ] JSDoc documentation

**Implementation**:
```typescript
unregisterHandler(id: string): boolean {
  return this.handlers.delete(id);
}
```

**Tests**:
- [ ] Test: Returns true when handler exists
- [ ] Test: Returns false when handler doesn't exist
- [ ] Test: Handler is actually removed

---

#### Subtask 19.2.3: Implement getHandlerCount Method
**Acceptance Criteria**:
- [ ] `getHandlerCount(): number` method defined
- [ ] Returns current number of registered handlers
- [ ] JSDoc documentation

**Implementation**:
```typescript
getHandlerCount(): number {
  return this.handlers.size;
}
```

**Tests**:
- [ ] Test: Returns 0 initially
- [ ] Test: Returns correct count after registrations
- [ ] Test: Returns correct count after unregistrations

---

### Task 19.3: Implement Handler Execution

#### Subtask 19.3.1: Implement executeHandler Method - Setup
**Acceptance Criteria**:
- [ ] `executeHandler(handlerId: string, req: Request, res: Response): Promise<void>` method defined
- [ ] Validates handler exists, throws if not found
- [ ] Creates fresh LocalContext using `createLocalContext()`
- [ ] Increments `requestCount` if metrics enabled
- [ ] Emits 'handler:start' event via orchestrator

**Implementation**:
```typescript
async executeHandler(
  handlerId: string,
  req: Request,
  res: Response
): Promise<void> {
  const handler = this.handlers.get(handlerId);
  if (!handler) {
    throw new Error(`Handler "${handlerId}" not found`);
  }

  if (this.config.enableMetrics) {
    this.requestCount++;
  }

  const lctx = createLocalContext({
    meta: {
      timestamp: Date.now(),
      instanceId: this.gctx.instance.id,
      region: this.gctx.instance.region,
      method: req.method,
      path: req.path,
    },
  });

  // Continue in next subtask...
}
```

**Tests**:
- [ ] Test: Throws when handler not found
- [ ] Test: Creates new LocalContext per request
- [ ] Test: Increments request count

---

#### Subtask 19.3.2: Implement executeHandler Method - Execution
**Acceptance Criteria**:
- [ ] Executes before hooks via `orchestrator.executeBefore(lctx, gctx)`
- [ ] Invokes handler with exact signature: `handler(req, res, gctx, lctx)`
- [ ] Handles both sync and async handlers
- [ ] Executes after hooks via `orchestrator.executeAfter(lctx, gctx)`
- [ ] Wraps execution in try-catch for error handling
- [ ] On error: executes catch hooks via `orchestrator.executeCatch(error, lctx, gctx)`
- [ ] On error: increments `errorCount` if metrics enabled
- [ ] Always cleans up LocalContext via `cleanupLocalContext(lctx)`

**Implementation**:
```typescript
async executeHandler(
  handlerId: string,
  req: Request,
  res: Response
): Promise<void> {
  const handler = this.handlers.get(handlerId);
  if (!handler) {
    throw new Error(`Handler "${handlerId}" not found`);
  }

  if (this.config.enableMetrics) {
    this.requestCount++;
  }

  const lctx = createLocalContext({
    meta: {
      timestamp: Date.now(),
      instanceId: this.gctx.instance.id,
      region: this.gctx.instance.region,
      method: req.method,
      path: req.path,
    },
  });

  try {
    // Execute before hooks
    await this.orchestrator.executeBefore(lctx, this.gctx);

    // Invoke handler with correct signature
    await Promise.resolve(handler(req, res, this.gctx, lctx));

    // Execute after hooks
    await this.orchestrator.executeAfter(lctx, this.gctx);
  } catch (error) {
    if (this.config.enableMetrics) {
      this.errorCount++;
    }

    // Execute catch hooks
    const err = error instanceof Error ? error : new Error(String(error));
    await this.orchestrator.executeCatch(err, lctx, this.gctx);

    throw error;
  } finally {
    // Always cleanup
    await cleanupLocalContext(lctx);
  }
}
```

**Tests**:
- [ ] Test: Executes sync handler successfully
- [ ] Test: Executes async handler successfully
- [ ] Test: Executes before hooks before handler
- [ ] Test: Executes after hooks after handler
- [ ] Test: Executes catch hooks on error
- [ ] Test: Increments error count on failure
- [ ] Test: Always cleans up LocalContext
- [ ] Test: Passes correct parameters to handler

---

### Task 19.4: Implement Health Check

#### Subtask 19.4.1: Implement getHealthStatus Method
**Acceptance Criteria**:
- [ ] `getHealthStatus(): HealthStatus` method defined
- [ ] Returns HealthStatus object with:
  - [ ] `status: 'healthy' | 'degraded' | 'unhealthy'`
  - [ ] `checks` object with individual check results
  - [ ] `timestamp: number`
- [ ] Checks handler availability (pass if > 0 handlers)
- [ ] Checks GlobalContext health (always pass for MVP)
- [ ] Includes uptime metric
- [ ] Includes request count metric
- [ ] Includes error rate metric
- [ ] Status is 'healthy' if all checks pass
- [ ] Status is 'degraded' if error rate > 10%
- [ ] Status is 'unhealthy' if no handlers or error rate > 50%

**Implementation**:
```typescript
getHealthStatus(): HealthStatus {
  const uptime = Date.now() - this.startTime;
  const errorRate = this.requestCount > 0 
    ? (this.errorCount / this.requestCount) * 100 
    : 0;

  const checks: HealthStatus['checks'] = {
    handlers: {
      status: this.handlers.size > 0 ? 'pass' : 'fail',
      message: `${this.handlers.size} handler(s) registered`,
    },
    globalContext: {
      status: 'pass',
      message: 'Global context available',
    },
    uptime: {
      status: 'pass',
      message: `${uptime}ms`,
      duration: uptime,
    },
    requests: {
      status: 'pass',
      message: `${this.requestCount} requests processed`,
    },
    errors: {
      status: errorRate > 50 ? 'fail' : errorRate > 10 ? 'warn' : 'pass',
      message: `${this.errorCount} errors (${errorRate.toFixed(2)}% error rate)`,
    },
  };

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (this.handlers.size === 0 || errorRate > 50) {
    status = 'unhealthy';
  } else if (errorRate > 10) {
    status = 'degraded';
  }

  return {
    status,
    checks,
    timestamp: Date.now(),
  };
}
```

**Tests**:
- [ ] Test: Returns 'healthy' with handlers and no errors
- [ ] Test: Returns 'unhealthy' with no handlers
- [ ] Test: Returns 'degraded' with error rate > 10%
- [ ] Test: Returns 'unhealthy' with error rate > 50%
- [ ] Test: Includes all required checks
- [ ] Test: Uptime increases over time

---

### Task 19.5: Export and Integration

#### Subtask 19.5.1: Export from index.ts
**Acceptance Criteria**:
- [ ] `HandlerWorker` class exported from `packages/runtime/src/index.ts`
- [ ] `HandlerWorkerConfig` interface exported
- [ ] JSDoc comments added to exports
- [ ] TypeScript compilation succeeds

**Implementation**:
```typescript
// In packages/runtime/src/index.ts
export { HandlerWorker } from './handler-worker.js';
export type { HandlerWorkerConfig } from './handler-worker.js';
```

**Tests**:
- [ ] Test: Can import HandlerWorker from @gati-framework/runtime
- [ ] Test: Can import HandlerWorkerConfig type

---

## PHASE 2: Property-Based Testing

### Task 19.1: Property Test Implementation

#### Subtask 19.1.1: Setup Test File
**Acceptance Criteria**:
- [ ] Create `packages/runtime/src/handler-worker.test.ts`
- [ ] Import fast-check, vitest, and required types
- [ ] Create test fixtures:
  - [ ] Mock Request generator
  - [ ] Mock Response generator
  - [ ] Mock Handler generator (sync and async)
  - [ ] GlobalContext fixture
- [ ] Setup describe block for HandlerWorker tests

**Implementation**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HandlerWorker } from './handler-worker.js';
import { createGlobalContext } from './global-context.js';
import type { Handler, Request, Response } from './types/index.js';

describe('HandlerWorker', () => {
  let gctx: GlobalContext;
  let worker: HandlerWorker;

  beforeEach(() => {
    gctx = createGlobalContext();
    worker = new HandlerWorker(gctx);
  });

  // Tests go here...
});
```

---

#### Subtask 19.1.2: Property 1 - Handler Signature Conformance
**Acceptance Criteria**:
- [ ] Property test validates handler signature conformance
- [ ] Runs minimum 100 iterations
- [ ] Tests sync handlers execute correctly
- [ ] Tests async handlers execute correctly
- [ ] Tests all 4 parameters are passed to handler
- [ ] Tests handler return values are handled
- [ ] Tests stateless execution (no state leakage between calls)
- [ ] Tests error isolation between handlers
- [ ] All assertions pass consistently

**Implementation**:
```typescript
describe('Property Tests', () => {
  it('Property 1: Handler signature conformance', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.boolean(),
        fc.record({
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          path: fc.string(),
          body: fc.anything(),
        }),
        async (handlerId, isAsync, reqData) => {
          const worker = new HandlerWorker(createGlobalContext());
          
          let receivedParams: unknown[] = [];
          const handler: Handler = isAsync
            ? async (req, res, gctx, lctx) => {
                receivedParams = [req, res, gctx, lctx];
              }
            : (req, res, gctx, lctx) => {
                receivedParams = [req, res, gctx, lctx];
              };

          worker.registerHandler(handlerId, handler);

          const req = {
            method: reqData.method,
            path: reqData.path,
            body: reqData.body,
          } as Request;
          const res = {} as Response;

          await worker.executeHandler(handlerId, req, res);

          // Verify all 4 parameters were passed
          expect(receivedParams).toHaveLength(4);
          expect(receivedParams[0]).toBe(req);
          expect(receivedParams[1]).toBe(res);
          expect(receivedParams[2]).toBeDefined(); // gctx
          expect(receivedParams[3]).toBeDefined(); // lctx
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Tests**:
- [ ] Test passes with 100+ iterations
- [ ] Test validates sync handlers
- [ ] Test validates async handlers
- [ ] Test validates parameter passing
- [ ] Test validates stateless execution

---

#### Subtask 19.1.3: Unit Tests
**Acceptance Criteria**:
- [ ] Test: Handler registration succeeds
- [ ] Test: Handler registration validates ID
- [ ] Test: Handler registration validates function
- [ ] Test: Handler registration validates parameter count
- [ ] Test: Handler registration rejects duplicates
- [ ] Test: Handler unregistration works
- [ ] Test: Handler execution succeeds
- [ ] Test: Handler execution throws on not found
- [ ] Test: Health check returns correct structure
- [ ] Test: Metrics tracking works
- [ ] Test: LocalContext cleanup happens
- [ ] All tests pass

**Implementation**:
```typescript
describe('Unit Tests', () => {
  it('registers handler successfully', () => {
    const handler: Handler = (req, res, gctx, lctx) => {};
    worker.registerHandler('test', handler);
    expect(worker.getHandlerCount()).toBe(1);
  });

  it('throws on duplicate handler ID', () => {
    const handler: Handler = (req, res, gctx, lctx) => {};
    worker.registerHandler('test', handler);
    expect(() => worker.registerHandler('test', handler)).toThrow();
  });

  it('unregisters handler', () => {
    const handler: Handler = (req, res, gctx, lctx) => {};
    worker.registerHandler('test', handler);
    expect(worker.unregisterHandler('test')).toBe(true);
    expect(worker.getHandlerCount()).toBe(0);
  });

  it('executes handler successfully', async () => {
    let executed = false;
    const handler: Handler = (req, res, gctx, lctx) => {
      executed = true;
    };
    worker.registerHandler('test', handler);
    
    const req = { method: 'GET', path: '/' } as Request;
    const res = {} as Response;
    
    await worker.executeHandler('test', req, res);
    expect(executed).toBe(true);
  });

  it('returns health status', () => {
    const status = worker.getHealthStatus();
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('checks');
    expect(status).toHaveProperty('timestamp');
  });
});
```

---

#### Subtask 19.1.4: Integration Tests
**Acceptance Criteria**:
- [ ] Test: Full request lifecycle with hooks
- [ ] Test: Before hooks execute before handler
- [ ] Test: After hooks execute after handler
- [ ] Test: Catch hooks execute on error
- [ ] Test: Multiple concurrent requests are isolated
- [ ] All tests pass

**Implementation**:
```typescript
describe('Integration Tests', () => {
  it('executes full lifecycle with hooks', async () => {
    const order: string[] = [];
    
    worker['orchestrator'].registerBefore({
      id: 'before',
      fn: () => { order.push('before'); },
      level: 'global',
    });
    
    const handler: Handler = () => { order.push('handler'); };
    worker.registerHandler('test', handler);
    
    worker['orchestrator'].registerAfter({
      id: 'after',
      fn: () => { order.push('after'); },
      level: 'global',
    });
    
    const req = { method: 'GET', path: '/' } as Request;
    const res = {} as Response;
    
    await worker.executeHandler('test', req, res);
    
    expect(order).toEqual(['before', 'handler', 'after']);
  });

  it('isolates concurrent requests', async () => {
    const handler: Handler = async (req, res, gctx, lctx) => {
      lctx.state.value = req.body;
      await new Promise(resolve => setTimeout(resolve, 10));
    };
    
    worker.registerHandler('test', handler);
    
    const req1 = { method: 'POST', path: '/', body: 'req1' } as Request;
    const req2 = { method: 'POST', path: '/', body: 'req2' } as Request;
    const res = {} as Response;
    
    await Promise.all([
      worker.executeHandler('test', req1, res),
      worker.executeHandler('test', req2, res),
    ]);
    
    // If isolated correctly, no errors should occur
    expect(true).toBe(true);
  });
});
```

---

## PHASE 3: Documentation and Completion

### Task 19.6: Documentation

#### Subtask 19.6.1: Add JSDoc Comments
**Acceptance Criteria**:
- [ ] All public methods have JSDoc comments
- [ ] All interfaces have JSDoc comments
- [ ] Examples provided in JSDoc
- [ ] Parameter descriptions included
- [ ] Return value descriptions included

---

#### Subtask 19.6.2: Update tasks.md
**Acceptance Criteria**:
- [ ] Mark Task 19 as complete in tasks.md
- [ ] Mark Task 19.1 as complete in tasks.md
- [ ] Update status with completion date
- [ ] Add file references

---

## Summary Checklist

### Implementation Complete
- [ ] HandlerWorker class created
- [ ] Handler registration/unregistration implemented
- [ ] Handler execution implemented
- [ ] Health check implemented
- [ ] Stateless execution verified
- [ ] Exported from index.ts

### Testing Complete
- [ ] Property test for signature conformance (100+ runs)
- [ ] Unit tests for all methods
- [ ] Integration tests for lifecycle
- [ ] All tests passing

### Documentation Complete
- [ ] JSDoc comments added
- [ ] tasks.md updated
- [ ] Examples provided

### Validation
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Code follows minimal implementation principle
- [ ] No unnecessary complexity added
