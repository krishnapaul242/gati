# Task 19: Handler Worker Execution Engine

## Overview
Implement the Handler Worker execution engine that invokes handlers with the correct signature `(req, res, gctx, lctx)`, ensures stateless execution, provides health checks, and includes property-based tests for handler signature conformance.

## Requirements
- **Requirement 1.1**: Handler signature `(req, res, lctx, gctx) => Promise<void> | void`
- **Property 1**: Handler signature conformance validation

## Status
- **Current Status**: ✅ Complete
- **Started**: 2025-01-XX
- **Completed**: 2025-01-XX
- **Files Created**: 2/2
- **Tests Passing**: 22/22 (100%)

## Dependencies
All dependencies are complete ✅:
- ✅ LocalContext (`packages/runtime/src/local-context.ts`)
- ✅ GlobalContext (`packages/runtime/src/global-context.ts`)
- ✅ HookOrchestrator (`packages/runtime/src/hook-orchestrator.ts`)
- ✅ Handler type definition (`packages/runtime/src/types/handler.ts`)
- ✅ Request/Response types (`packages/runtime/src/types/request.ts`, `packages/runtime/src/types/response.ts`)
- ✅ MetricsClient (`packages/runtime/src/metrics-client.ts`)
- ✅ fast-check (installed and configured)

## Files to Create/Modify

### New Files
1. `packages/runtime/src/handler-worker.ts` - Main implementation (~200-250 lines)
2. `packages/runtime/src/handler-worker.test.ts` - Property tests (~100-150 lines)

### Modified Files
1. `packages/runtime/src/index.ts` - Export HandlerWorker
2. `.kiro/specs/runtime-architecture/tasks.md` - Mark tasks complete

## Architecture

### HandlerWorker Class Structure
```typescript
export class HandlerWorker {
  private handlers: Map<string, Handler>;
  private orchestrator: HookOrchestrator;
  private gctx: GlobalContext;
  private config: HandlerWorkerConfig;
  private startTime: number;
  private requestCount: number;
  private errorCount: number;
  
  constructor(gctx: GlobalContext, config?: HandlerWorkerConfig);
  registerHandler(id: string, handler: Handler): void;
  unregisterHandler(id: string): boolean;
  async executeHandler(handlerId: string, req: Request, res: Response): Promise<void>;
  getHealthStatus(): HealthStatus;
  getHandlerCount(): number;
}
```

### Execution Flow
```
Request → HandlerWorker.executeHandler()
  ↓
1. Validate handler exists
  ↓
2. Create fresh LocalContext (stateless)
  ↓
3. Execute before hooks (via HookOrchestrator)
  ↓
4. Invoke handler(req, res, gctx, lctx)
  ↓
5. Execute after hooks
  ↓
6. Cleanup LocalContext
  ↓
Error? → Execute catch hooks → Cleanup
```

## Progress Tracking

### Task 19: Handler Worker Implementation

#### Subtask 19.1: Create HandlerWorker Class Structure
- [x] Create `packages/runtime/src/handler-worker.ts`
- [x] Define `HandlerWorkerConfig` interface
- [x] Define `HandlerWorker` class with constructor
- [x] Add handler registry (Map<string, Handler>)
- [x] Initialize HookOrchestrator
- [x] Add metrics tracking (request count, error count, uptime)

#### Subtask 19.2: Implement Handler Registration
- [x] Implement `registerHandler(id, handler)` method
- [x] Validate handler signature (4 parameters)
- [x] Prevent duplicate handler IDs
- [x] Implement `unregisterHandler(id)` method
- [x] Implement `getHandlerCount()` method

#### Subtask 19.3: Implement Handler Execution
- [x] Implement `executeHandler(handlerId, req, res)` method
- [x] Validate handler exists
- [x] Create fresh LocalContext per request
- [x] Execute before hooks via HookOrchestrator
- [x] Invoke handler with (req, res, gctx, lctx) signature
- [x] Execute after hooks
- [x] Handle errors with catch hooks
- [x] Cleanup LocalContext after execution
- [x] Update metrics (request count, error count)

#### Subtask 19.4: Implement Health Check
- [x] Implement `getHealthStatus()` method
- [x] Check handler availability
- [x] Verify GlobalContext health
- [x] Include uptime metric
- [x] Include request count metric
- [x] Include error rate metric
- [x] Return structured HealthStatus object

#### Subtask 19.5: Ensure Stateless Execution
- [x] Verify new LocalContext created per request
- [x] Ensure no state leakage between requests
- [x] Verify LocalContext cleanup after execution
- [x] Add isolation validation tests

#### Subtask 19.6: Export and Integration
- [x] Export HandlerWorker from `packages/runtime/src/index.ts`
- [x] Export HandlerWorkerConfig interface
- [x] Add JSDoc documentation
- [x] Update package exports

### Task 19.1: Property Test Implementation

#### Subtask 19.1.1: Setup Test Infrastructure
- [x] Create `packages/runtime/src/handler-worker.test.ts`
- [x] Import fast-check and testing utilities
- [x] Create test fixtures (mock handlers, requests, responses)
- [x] Setup GlobalContext for tests

#### Subtask 19.1.2: Property 1 - Handler Signature Conformance
- [x] Test: Valid sync handlers execute correctly
- [x] Test: Valid async handlers execute correctly
- [x] Test: All 4 parameters (req, res, gctx, lctx) are passed
- [x] Test: Handler return values handled correctly
- [x] Test: Stateless execution (no state leakage)
- [x] Test: Error isolation between handlers
- [x] Test: Concurrent handler executions are isolated
- [x] Run with minimum 100 iterations

#### Subtask 19.1.3: Unit Tests
- [x] Test: Handler registration
- [x] Test: Handler unregistration
- [x] Test: Duplicate handler ID rejection
- [x] Test: Handler not found error
- [x] Test: Health check response structure
- [x] Test: Metrics tracking (request count, error count)
- [x] Test: LocalContext cleanup

#### Subtask 19.1.4: Integration Tests
- [x] Test: Full request lifecycle with hooks
- [x] Test: Before/after/catch hook execution
- [x] Test: Error handling and recovery
- [x] Test: Multiple concurrent requests

## Acceptance Criteria

### Task 19: Handler Worker
- ✅ HandlerWorker class created with all methods
- ✅ Handler registration and unregistration working
- ✅ Handler invocation with correct `(req, res, gctx, lctx)` signature
- ✅ Fresh LocalContext created per request (stateless)
- ✅ Integration with HookOrchestrator for lifecycle management
- ✅ Health check endpoint returns structured status
- ✅ Metrics tracking (request count, error count, uptime)
- ✅ Error isolation between requests
- ✅ LocalContext cleanup after execution
- ✅ All unit tests passing
- ✅ Exported from index.ts

### Task 19.1: Property Tests
- ✅ Property test for handler signature conformance implemented
- ✅ Minimum 100 test iterations per property
- ✅ Tests validate Requirement 1.1
- ✅ Tests pass consistently
- ✅ Covers sync and async handlers
- ✅ Validates stateless execution
- ✅ Validates error isolation

## Test Coverage Goals
- Unit test coverage: >90%
- Property test iterations: ≥100 per property
- Integration test scenarios: ≥4

## Estimated Effort
- **Implementation**: 2-3 hours
- **Testing**: 1-2 hours
- **Documentation**: 30 minutes
- **Total**: 3.5-5.5 hours

## Notes
- Keep implementation minimal - focus on core functionality
- Reuse existing components (HookOrchestrator, LocalContext, GlobalContext)
- Ensure stateless execution is verifiable through tests
- Health check should be lightweight and fast
- Error handling must not affect other requests

## Completion Checklist
- [x] All subtasks completed
- [x] All acceptance criteria met
- [x] All tests passing (unit + property + integration)
- [x] Code reviewed for minimal implementation
- [x] Documentation complete
- [x] Exported from index.ts
- [x] tasks.md updated with completion status
