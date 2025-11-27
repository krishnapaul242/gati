# Task 22: Testing Harness (@gati/testing) - Summary

## 📋 Overview

Create a comprehensive testing harness package (`@gati-framework/testing`) that enables developers to write integration tests for Gati handlers with minimal boilerplate. The package provides fake context implementations, module mocking utilities, and helper functions.

## 🎯 Goal

Enable developers to test handlers in isolation without requiring a full runtime environment, while maintaining type safety and providing an intuitive API.

## 📊 Analysis Complete

### Current State
✅ **Existing Infrastructure**:
- LocalContext implementation in `packages/runtime/src/local-context.ts`
- GlobalContext implementation in `packages/runtime/src/global-context.ts`
- HandlerWorker execution engine
- HookOrchestrator for lifecycle management
- Existing test patterns in `handler-worker.test.ts` and `hook-orchestrator.test.ts`

### Requirements
From `requirements.md` Requirement 14.2:
> "WHEN writing integration tests THEN the developer SHALL use the testing harness to run handlers with fake Global Context and Local Context"

## 📦 Deliverables

### 1. Core Package Structure
```
packages/testing/
├── src/
│   ├── index.ts                    # Public exports
│   ├── test-harness.ts             # Main test harness
│   ├── fake-local-context.ts       # LocalContext builder
│   ├── fake-global-context.ts      # GlobalContext builder
│   ├── module-mocks.ts             # Module mocking utilities
│   ├── helpers.ts                  # Convenience helpers
│   ├── test-harness.test.ts        # Unit tests
│   └── integration.test.ts         # Integration tests
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

### 2. Key APIs

#### Test Harness
```typescript
interface TestHarness {
  executeHandler(handler: Handler, options?: ExecuteOptions): Promise<TestResult>;
  getLocalContext(): LocalContext;
  getGlobalContext(): GlobalContext;
  cleanup(): Promise<void>;
}

const harness = createTestHarness({
  modules: { db: mockDb },
  config: { apiKey: 'test' },
});
```

#### Context Builders
```typescript
// LocalContext with builder pattern
const lctx = new FakeLocalContextBuilder()
  .withRequestId('test-123')
  .withState({ userId: '456' })
  .build();

// GlobalContext with builder pattern
const gctx = new FakeGlobalContextBuilder()
  .withModule('db', mockDb)
  .withConfig({ env: 'test' })
  .build();
```

#### Module Mocks
```typescript
// Mock with call tracking
const mockDb = createMockModule({
  findUser: async (id: string) => ({ id, name: 'Test' }),
  saveUser: async (user: User) => user,
});

// Check calls
expect(mockDb.calls.findUser).toHaveLength(1);
expect(mockDb.calls.findUser[0].args).toEqual(['123']);
```

#### Helper Functions
```typescript
// Minimal handler testing
const result = await testHandler(myHandler, {
  method: 'GET',
  path: '/users/123',
  params: { id: '123' },
}, {
  db: mockDb,
});

assertStatus(result.response, 200);
assertBody(result.response, { id: '123', name: 'Test' });
```

## 📝 Task Breakdown

| Task | Description | Time | Dependencies |
|------|-------------|------|--------------|
| **22.1** | Package setup and configuration | 15 min | None |
| **22.2** | Implement createTestHarness core | 30 min | 22.1 |
| **22.3** | Implement Fake LocalContext builder | 20 min | 22.1 |
| **22.4** | Implement Fake GlobalContext builder | 20 min | 22.1 |
| **22.5** | Implement module mock utilities | 25 min | 22.1 |
| **22.6** | Implement helper functions | 20 min | 22.2-22.4 |
| **22.7** | Write comprehensive documentation | 15 min | 22.2-22.6 |
| **22.8** | Write unit tests | 30 min | 22.2-22.6 |
| **22.9** | Write integration tests | 20 min | 22.8 |
| **22.10** | Finalize package and exports | 10 min | 22.9 |

**Total Estimated Time**: 3 hours 25 minutes (205 minutes)

## 🎨 Design Principles

1. **Minimal Implementation**: Only essential features, no over-engineering
2. **Reuse Real Code**: Leverage actual LocalContext/GlobalContext implementations
3. **Type Safety**: Full TypeScript support with IntelliSense
4. **Developer Experience**: Simple, intuitive API with sensible defaults
5. **Isolation**: Proper cleanup to prevent test pollution

## 💡 Example Usage

```typescript
import { createTestHarness, createMockModule } from '@gati-framework/testing';
import { getUserHandler } from './handlers/users';

describe('getUserHandler', () => {
  it('should fetch user from database', async () => {
    // Setup
    const mockDb = createMockModule({
      findUser: async (id: string) => ({ 
        id, 
        name: 'John Doe',
        email: 'john@example.com' 
      }),
    });

    const harness = createTestHarness({
      modules: { db: mockDb },
    });

    // Execute
    const result = await harness.executeHandler(getUserHandler, {
      request: {
        method: 'GET',
        path: '/users/123',
        params: { id: '123' },
      },
    });

    // Assert
    expect(result.response.statusCode).toBe(200);
    expect(result.response.body).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(mockDb.calls.findUser).toHaveLength(1);
    expect(mockDb.calls.findUser[0].args).toEqual(['123']);

    // Cleanup
    await harness.cleanup();
  });

  it('should handle database errors', async () => {
    const mockDb = createMockModule({
      findUser: async () => {
        throw new Error('Database connection failed');
      },
    });

    const harness = createTestHarness({
      modules: { db: mockDb },
    });

    const result = await harness.executeHandler(getUserHandler, {
      request: {
        method: 'GET',
        path: '/users/123',
        params: { id: '123' },
      },
    });

    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Database connection failed');
    expect(result.response.statusCode).toBe(500);

    await harness.cleanup();
  });
});
```

## ✅ Success Criteria

1. ✅ Package builds without errors
2. ✅ All unit tests pass (minimum 9 test suites)
3. ✅ All integration tests pass (minimum 5 scenarios)
4. ✅ Documentation is complete with examples
5. ✅ Can write handler tests with <10 lines of code
6. ✅ Module mocking tracks calls correctly
7. ✅ Contexts are isolated between tests
8. ✅ Cleanup prevents memory leaks

## 🔗 Dependencies

**Peer Dependencies**:
- `@gati-framework/runtime` - For real context implementations
- `@gati-framework/core` - For type definitions

**Dev Dependencies**:
- `vitest` - Testing framework
- `@types/node` - Node.js types
- `typescript` - TypeScript compiler

## 📚 Documentation

Comprehensive documentation will include:
1. **Installation** - How to add to project
2. **Quick Start** - 5-minute getting started guide
3. **API Reference** - Complete API documentation
4. **Examples** - Common testing scenarios
5. **Best Practices** - Testing guidelines

## 🚀 Next Steps

1. Review and approve this plan
2. Begin implementation with Task 22.1 (Package Setup)
3. Follow sequential task order for dependencies
4. Run tests after each subtask
5. Complete documentation before finalization

## 📖 Related Documents

- **Detailed Plan**: `.kiro/specs/runtime-architecture/task-22-testing-harness-plan.md`
- **Tasks File**: `.kiro/specs/runtime-architecture/tasks.md` (updated with subtasks)
- **Requirements**: `.kiro/specs/runtime-architecture/requirements.md` (Requirement 14.2)

---

**Status**: ✅ Analysis Complete, Ready for Implementation
**Estimated Effort**: 3 hours 25 minutes
**Complexity**: Medium
**Priority**: High (enables developer testing workflow)
