# Task 22: Testing Harness (@gati/testing) - Implementation Plan

## Overview

Create a comprehensive testing harness package that enables developers to write integration tests for handlers with fake LocalContext and GlobalContext implementations, module mocks, and helper utilities.

**Requirement:** 14.2 - "WHEN writing integration tests THEN the developer SHALL use the testing harness to run handlers with fake Global Context and Local Context"

## Analysis

### Current State
- ✅ LocalContext implementation exists in `packages/runtime/src/local-context.ts`
- ✅ GlobalContext implementation exists in `packages/runtime/src/global-context.ts`
- ✅ HandlerWorker execution engine exists in `packages/runtime/src/handler-worker.ts`
- ✅ HookOrchestrator exists in `packages/runtime/src/hook-orchestrator.ts`
- ✅ Existing test files show patterns for mocking contexts (e.g., `handler-worker.test.ts`, `hook-orchestrator.test.ts`)

### Requirements from Spec
From `requirements.md` Requirement 14.2:
- Provide fake LocalContext implementation
- Provide fake GlobalContext implementation
- Enable module mocking
- Support handler testing without full runtime
- Allow controlled test scenarios

### Design Decisions

1. **Package Structure**: Create `packages/testing/` as a new workspace package
2. **Minimal Implementation**: Focus on essential testing utilities only
3. **Reuse Existing Code**: Leverage real LocalContext/GlobalContext where possible, only fake what's necessary
4. **Type Safety**: Maintain full TypeScript type safety
5. **Developer Experience**: Simple, intuitive API for common testing scenarios

## Implementation Plan

### Step 1: Package Setup (15 min)
**Goal**: Create package structure and configuration

**Files to Create**:
- `packages/testing/package.json`
- `packages/testing/tsconfig.json`
- `packages/testing/tsconfig.build.json`
- `packages/testing/README.md`
- `packages/testing/src/index.ts`

**Dependencies**:
- `@gati-framework/runtime` (peer dependency)
- `@gati-framework/core` (peer dependency)
- `vitest` (dev dependency)

### Step 2: Create Test Harness Core (30 min)
**Goal**: Implement `createTestHarness` function

**File**: `packages/testing/src/test-harness.ts`

**Interface**:
```typescript
interface TestHarness {
  // Execute handler with test contexts
  executeHandler(handler: Handler, options?: ExecuteOptions): Promise<TestResult>;
  
  // Get test contexts
  getLocalContext(): LocalContext;
  getGlobalContext(): GlobalContext;
  
  // Cleanup
  cleanup(): Promise<void>;
}

interface ExecuteOptions {
  request?: Partial<Request>;
  modules?: Record<string, unknown>;
  config?: Record<string, unknown>;
  hooks?: {
    before?: Hook[];
    after?: Hook[];
    catch?: Hook[];
  };
}

interface TestResult {
  response: Response;
  lctx: LocalContext;
  error?: Error;
  events: LifecycleEvent[];
}
```

**Implementation**:
- Use real `createLocalContext` from runtime
- Use real `createGlobalContext` from runtime
- Wrap with test-friendly defaults
- Capture lifecycle events
- Provide simple cleanup

### Step 3: Fake LocalContext Builder (20 min)
**Goal**: Create builder for customizing LocalContext in tests

**File**: `packages/testing/src/fake-local-context.ts`

**Interface**:
```typescript
class FakeLocalContextBuilder {
  withRequestId(id: string): this;
  withState(state: Record<string, unknown>): this;
  withMetadata(meta: Partial<LocalContextMetadata>): this;
  build(): LocalContext;
}

function createFakeLocalContext(options?: Partial<LocalContextOptions>): LocalContext;
```

**Implementation**:
- Thin wrapper around real `createLocalContext`
- Provide sensible test defaults
- Allow easy customization

### Step 4: Fake GlobalContext Builder (20 min)
**Goal**: Create builder for customizing GlobalContext in tests

**File**: `packages/testing/src/fake-global-context.ts`

**Interface**:
```typescript
class FakeGlobalContextBuilder {
  withModule(name: string, module: unknown): this;
  withConfig(config: Record<string, unknown>): this;
  withMetrics(client: MetricsClient): this;
  build(): GlobalContext;
}

function createFakeGlobalContext(options?: Partial<GlobalContextOptions>): GlobalContext;
```

**Implementation**:
- Thin wrapper around real `createGlobalContext`
- Provide test-friendly defaults (no-op metrics, empty modules)
- Allow easy module registration

### Step 5: Module Mock Utilities (25 min)
**Goal**: Create utilities for mocking modules

**File**: `packages/testing/src/module-mocks.ts`

**Interface**:
```typescript
// Create a mock module with spy functions
function createMockModule<T extends Record<string, (...args: any[]) => any>>(
  methods: T
): MockModule<T>;

// Create a module that returns predefined values
function createStubModule<T>(
  stubs: Record<keyof T, unknown>
): T;

// Spy on module method calls
interface MockModule<T> {
  module: T;
  calls: Record<keyof T, Array<{ args: unknown[]; result: unknown; error?: Error }>>;
  reset(): void;
}
```

**Implementation**:
- Simple spy/stub implementation
- Track method calls and arguments
- Support async methods
- Provide reset functionality

### Step 6: Helper Functions (20 min)
**Goal**: Create convenience helpers for common testing patterns

**File**: `packages/testing/src/helpers.ts`

**Functions**:
```typescript
// Create a test request
function createTestRequest(options?: Partial<Request>): Request;

// Create a test response
function createTestResponse(): Response;

// Execute handler with minimal setup
async function testHandler(
  handler: Handler,
  request?: Partial<Request>,
  modules?: Record<string, unknown>
): Promise<TestResult>;

// Assert response status
function assertStatus(response: Response, expected: number): void;

// Assert response body
function assertBody(response: Response, expected: unknown): void;
```

**Implementation**:
- Provide sensible defaults
- Reduce boilerplate in tests
- Type-safe assertions

### Step 7: Documentation (15 min)
**Goal**: Write comprehensive README with examples

**File**: `packages/testing/README.md`

**Sections**:
1. Installation
2. Quick Start
3. API Reference
4. Examples:
   - Basic handler test
   - Testing with modules
   - Testing with hooks
   - Testing error scenarios
5. Best Practices

### Step 8: Unit Tests (30 min)
**Goal**: Test the testing harness itself

**File**: `packages/testing/src/test-harness.test.ts`

**Test Cases**:
- ✅ Creates test harness with defaults
- ✅ Executes handler successfully
- ✅ Captures lifecycle events
- ✅ Provides access to contexts
- ✅ Handles handler errors
- ✅ Cleans up resources
- ✅ Supports custom modules
- ✅ Supports custom hooks
- ✅ Isolates test executions

### Step 9: Integration Tests (20 min)
**Goal**: Validate harness with real-world scenarios

**File**: `packages/testing/src/integration.test.ts`

**Test Cases**:
- ✅ Test handler with database module mock
- ✅ Test handler with before/after hooks
- ✅ Test handler error handling
- ✅ Test concurrent handler executions
- ✅ Test state isolation between tests

### Step 10: Export and Build (10 min)
**Goal**: Configure exports and build system

**Tasks**:
- Update `packages/testing/src/index.ts` with all exports
- Configure TypeScript build
- Test package build
- Verify imports work correctly

## Detailed Task Breakdown

### Task 22.1: Package Setup
**Estimated Time**: 15 minutes
**Dependencies**: None

**Subtasks**:
1. Create `packages/testing/` directory
2. Create `package.json` with dependencies
3. Create `tsconfig.json` and `tsconfig.build.json`
4. Create initial `README.md`
5. Create `src/index.ts` with placeholder exports

**Acceptance Criteria**:
- Package builds successfully
- TypeScript configuration is correct
- Package can be imported in tests

### Task 22.2: Implement createTestHarness
**Estimated Time**: 30 minutes
**Dependencies**: 22.1

**Subtasks**:
1. Define `TestHarness` interface
2. Implement `createTestHarness` function
3. Implement `executeHandler` method
4. Implement context getters
5. Implement cleanup method
6. Add event capture functionality

**Acceptance Criteria**:
- Can execute handlers with test contexts
- Captures lifecycle events
- Provides access to contexts
- Cleans up resources properly

### Task 22.3: Implement Fake LocalContext Builder
**Estimated Time**: 20 minutes
**Dependencies**: 22.1

**Subtasks**:
1. Create `FakeLocalContextBuilder` class
2. Implement builder methods
3. Create `createFakeLocalContext` helper
4. Add sensible test defaults

**Acceptance Criteria**:
- Builder pattern works correctly
- Can customize all LocalContext properties
- Provides good defaults for tests

### Task 22.4: Implement Fake GlobalContext Builder
**Estimated Time**: 20 minutes
**Dependencies**: 22.1

**Subtasks**:
1. Create `FakeGlobalContextBuilder` class
2. Implement builder methods
3. Create `createFakeGlobalContext` helper
4. Add test-friendly defaults (no-op metrics)

**Acceptance Criteria**:
- Builder pattern works correctly
- Can register modules easily
- Provides good defaults for tests

### Task 22.5: Implement Module Mock Utilities
**Estimated Time**: 25 minutes
**Dependencies**: 22.1

**Subtasks**:
1. Implement `createMockModule` function
2. Implement `createStubModule` function
3. Add call tracking
4. Add reset functionality
5. Support async methods

**Acceptance Criteria**:
- Can create mock modules
- Tracks method calls and arguments
- Can reset mocks
- Works with async methods

### Task 22.6: Implement Helper Functions
**Estimated Time**: 20 minutes
**Dependencies**: 22.2, 22.3, 22.4

**Subtasks**:
1. Implement `createTestRequest`
2. Implement `createTestResponse`
3. Implement `testHandler` convenience function
4. Implement assertion helpers

**Acceptance Criteria**:
- Helpers reduce test boilerplate
- Type-safe and intuitive API
- Good defaults for common scenarios

### Task 22.7: Write Documentation
**Estimated Time**: 15 minutes
**Dependencies**: 22.2-22.6

**Subtasks**:
1. Write installation instructions
2. Write quick start guide
3. Document API reference
4. Add usage examples
5. Document best practices

**Acceptance Criteria**:
- Clear and comprehensive documentation
- Examples cover common use cases
- Easy to follow for new users

### Task 22.8: Write Unit Tests
**Estimated Time**: 30 minutes
**Dependencies**: 22.2-22.6

**Subtasks**:
1. Test `createTestHarness`
2. Test `FakeLocalContextBuilder`
3. Test `FakeGlobalContextBuilder`
4. Test module mocks
5. Test helper functions

**Acceptance Criteria**:
- All core functionality is tested
- Tests are clear and maintainable
- Edge cases are covered

### Task 22.9: Write Integration Tests
**Estimated Time**: 20 minutes
**Dependencies**: 22.8

**Subtasks**:
1. Test real-world handler scenarios
2. Test with module mocks
3. Test with hooks
4. Test error scenarios
5. Test isolation

**Acceptance Criteria**:
- Integration tests pass
- Real-world scenarios work correctly
- Tests demonstrate proper usage

### Task 22.10: Finalize and Export
**Estimated Time**: 10 minutes
**Dependencies**: 22.9

**Subtasks**:
1. Update `src/index.ts` with all exports
2. Build package
3. Verify exports
4. Update root README if needed

**Acceptance Criteria**:
- Package builds successfully
- All exports are accessible
- Package is ready for use

## Total Estimated Time

**Total**: 3 hours 25 minutes (205 minutes)

**Breakdown**:
- Setup: 15 min
- Core Implementation: 115 min (30 + 20 + 20 + 25 + 20)
- Documentation: 15 min
- Testing: 50 min (30 + 20)
- Finalization: 10 min

## Success Criteria

1. ✅ Package builds without errors
2. ✅ All unit tests pass
3. ✅ All integration tests pass
4. ✅ Documentation is complete and clear
5. ✅ Can write handler tests with minimal boilerplate
6. ✅ Module mocking works correctly
7. ✅ Contexts are properly isolated between tests
8. ✅ Cleanup prevents memory leaks

## Example Usage

```typescript
import { createTestHarness, createMockModule } from '@gati-framework/testing';
import { myHandler } from './handlers/my-handler';

describe('myHandler', () => {
  it('should process request successfully', async () => {
    // Create test harness
    const harness = createTestHarness({
      modules: {
        db: createMockModule({
          findUser: async (id: string) => ({ id, name: 'Test User' }),
        }),
      },
    });

    // Execute handler
    const result = await harness.executeHandler(myHandler, {
      request: {
        method: 'GET',
        path: '/users/123',
        params: { id: '123' },
      },
    });

    // Assert results
    expect(result.response.statusCode).toBe(200);
    expect(result.response.body).toEqual({ id: '123', name: 'Test User' });

    // Cleanup
    await harness.cleanup();
  });
});
```

## Dependencies

**Runtime Dependencies**:
- `@gati-framework/runtime` (peer)
- `@gati-framework/core` (peer)

**Dev Dependencies**:
- `vitest`
- `@types/node`
- `typescript`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-engineering | High | Keep implementation minimal, only essential features |
| Breaking changes in runtime | Medium | Use peer dependencies, document version compatibility |
| Complex API | Medium | Focus on simple, intuitive API with good defaults |
| Memory leaks in tests | Low | Implement proper cleanup, test cleanup functionality |

## Future Enhancements (Out of Scope)

- Property-based testing utilities
- Snapshot testing support
- Time travel debugging integration
- Performance profiling helpers
- Visual test reports
