# Task 20: Playground Request Inspection

## Overview
Implement comprehensive request inspection system for the Playground that enables developers to visualize, debug, and replay requests through the entire Gati runtime pipeline (ingress → RM → LCC → handler → modules).

## Requirements
- **Requirement 15.1**: Snapshot storage and retrieval
- **Requirement 15.2**: Request replay execution
- **Requirement 15.3**: Version diff computation
- **Requirement 15.5**: Debug gate functionality
- **Property 44**: Snapshot storage persistence
- **Property 45**: Request replay execution consistency
- **Property 46**: Version diff computation correctness

## Status
- **Current Status**: Not Started
- **Started**: TBD
- **Completed**: TBD
- **Files Created**: 0/21
- **Tests Passing**: 0/0
- **E2E Tests**: 0/22 scenarios

## Dependencies
All dependencies are complete ✅:
- ✅ LocalContext with snapshots (`packages/runtime/src/local-context.ts`)
- ✅ GlobalContext (`packages/runtime/src/global-context.ts`)
- ✅ HookOrchestrator (`packages/runtime/src/hook-orchestrator.ts`)
- ✅ RouteManager (`packages/runtime/src/route-manager.ts`)
- ✅ ManifestStore (`packages/runtime/src/manifest-store.ts`)
- ✅ MetricsClient (`packages/runtime/src/metrics-client.ts`)
- ✅ Playground package (`packages/playground/`)
- ✅ fast-check (installed and configured)

## Files to Create/Modify

### New Files - Runtime Components
1. `packages/runtime/src/trace-collector.ts` - Pipeline trace collection (~150 lines)
2. `packages/runtime/src/trace-storage.ts` - Trace persistence (~100 lines)
3. `packages/runtime/src/request-replayer.ts` - Replay engine (~200 lines)
4. `packages/runtime/src/debug-gate-manager.ts` - Breakpoint system (~150 lines)
5. `packages/runtime/src/diff-engine.ts` - Snapshot comparison (~100 lines)
6. `packages/runtime/src/types/trace.ts` - Type definitions (~80 lines)

### New Files - Playground API
7. `packages/playground/src/api/trace-endpoints.ts` - REST API (~150 lines)
8. `packages/playground/src/api/websocket-server.ts` - Debug gate WS (~100 lines)

### New Files - Playground UI
9. `packages/playground/src/components/RequestFlowDiagram.tsx` - Pipeline viz (~200 lines)
10. `packages/playground/src/components/SnapshotViewer.tsx` - Snapshot inspector (~150 lines)
11. `packages/playground/src/components/SnapshotDiff.tsx` - Comparison view (~150 lines)
12. `packages/playground/src/components/DebugGateControls.tsx` - Breakpoint UI (~100 lines)

### New Files - Tests
13. `packages/runtime/src/tests/property/replay.test.ts` - Task 20.1 (~80 lines)
14. `packages/runtime/src/tests/property/diff.test.ts` - Task 20.2 (~80 lines)
15. `packages/runtime/src/tests/property/storage.test.ts` - Task 20.3 (~80 lines)

### New Files - E2E Tests (Playwright)
16. `packages/playground/e2e/trace-visualization.spec.ts` - Trace flow visualization (~100 lines)
17. `packages/playground/e2e/snapshot-inspection.spec.ts` - Snapshot viewer/diff (~100 lines)
18. `packages/playground/e2e/debug-gates.spec.ts` - Debug gate controls (~100 lines)
19. `packages/playground/e2e/request-replay.spec.ts` - Replay functionality (~100 lines)
20. `packages/playground/e2e/fixtures/test-server.ts` - Test server setup (~80 lines)
21. `packages/playground/playwright.config.ts` - Playwright configuration (~50 lines)

### Modified Files
1. `packages/runtime/src/index.ts` - Export new components
2. `packages/playground/src/index.ts` - Export new API/components
3. `packages/playground/package.json` - Add Playwright dependencies
4. `.kiro/specs/runtime-architecture/tasks.md` - Mark tasks complete

## Architecture

### Data Model
```typescript
interface RequestTrace {
  id: string;
  timestamp: number;
  request: Request;
  response?: Response;
  stages: TraceStage[];
  snapshots: Map<string, Snapshot>;
  duration: number;
  status: 'pending' | 'success' | 'error';
  error?: Error;
}

interface TraceStage {
  name: 'ingress' | 'route-manager' | 'lcc' | 'handler' | 'module';
  startTime: number;
  endTime?: number;
  snapshotId: string;
  metadata: Record<string, unknown>;
  children?: TraceStage[];
}

interface DebugGate {
  id: string;
  traceId: string;
  stage: string;
  condition?: string;
  status: 'active' | 'triggered' | 'released';
}
```

### Execution Flow
```
Request → TraceCollector.start()
  ↓
Ingress → captureStage('ingress')
  ↓
RouteManager → captureStage('route-manager')
  ↓
LCC → captureStage('lcc') + hook snapshots
  ↓
Handler → captureStage('handler')
  ↓
Modules → captureStage('module') per RPC
  ↓
TraceCollector.end() → TraceStorage.store()
```

## Progress Tracking

### Task 20: Playground Request Inspection

#### Subtask 20.1: Examine Existing Playground Structure
- [ ] Read `packages/playground/` directory structure
- [ ] Identify existing components and APIs
- [ ] Review current visualization capabilities
- [ ] Determine integration points with runtime
- [ ] Document findings

**Acceptance Criteria:**
- ✅ Directory structure documented
- ✅ Existing APIs identified
- ✅ Integration points mapped

#### Subtask 20.2: Design Trace Data Model
- [ ] Create `packages/runtime/src/types/trace.ts`
- [ ] Define `RequestTrace` interface
- [ ] Define `TraceStage` interface
- [ ] Define `DebugGate` interface
- [ ] Define `SnapshotPoint` interface
- [ ] Ensure JSON-serializable
- [ ] Add JSDoc documentation

**Acceptance Criteria:**
- ✅ All interfaces defined with complete types
- ✅ JSON-serializable (no functions, circular refs)
- ✅ JSDoc comments on all exports
- ✅ Exported from runtime index

#### Subtask 20.3: Implement TraceCollector
- [ ] Create `packages/runtime/src/trace-collector.ts`
- [ ] Implement `TraceCollector` class
- [ ] Add `startTrace(request)` method
- [ ] Add `captureStage(stage, metadata)` method
- [ ] Add `captureSnapshot(stage, lctx)` method
- [ ] Add `endTrace(response?, error?)` method
- [ ] Integrate with existing pipeline stages
- [ ] Add configurable retention policy
- [ ] Add memory limits

**Acceptance Criteria:**
- ✅ TraceCollector class implemented
- ✅ Captures all pipeline stages
- ✅ Stores snapshots at each stage
- ✅ Memory-bounded (configurable limit)
- ✅ Thread-safe for concurrent requests
- ✅ Unit tests passing

#### Subtask 20.4: Implement TraceStorage
- [ ] Create `packages/runtime/src/trace-storage.ts`
- [ ] Implement `TraceStorage` interface
- [ ] Add `storeTrace(trace)` method
- [ ] Add `getTrace(traceId)` method
- [ ] Add `listTraces(filter?)` method
- [ ] Add `deleteTrace(traceId)` method
- [ ] Implement in-memory storage with TTL
- [ ] Add optional persistent storage adapter
- [ ] Implement trace compression

**Acceptance Criteria:**
- ✅ TraceStorage interface defined
- ✅ In-memory implementation complete
- ✅ TTL-based expiration working
- ✅ Compression reduces storage by >50%
- ✅ Retrieval performance <10ms
- ✅ Unit tests passing

#### Subtask 20.5: Implement DiffEngine
- [ ] Create `packages/runtime/src/diff-engine.ts`
- [ ] Implement `computeDiff(snap1, snap2)` method
- [ ] Detect added/removed/modified keys
- [ ] Handle nested objects and arrays
- [ ] Implement `applyDiff(snapshot, diff)` method
- [ ] Add diff visualization helpers
- [ ] Support deep equality checks

**Acceptance Criteria:**
- ✅ Diff computation accurate for all data types
- ✅ Handles nested structures correctly
- ✅ applyDiff(snap, computeDiff(snap, snap2)) === snap2
- ✅ Performance <5ms for typical snapshots
- ✅ Unit tests passing

#### Subtask 20.6: Implement RequestReplayer
- [ ] Create `packages/runtime/src/request-replayer.ts`
- [ ] Implement `RequestReplayer` class
- [ ] Add `replay(traceId, fromStage?)` method
- [ ] Restore LocalContext from snapshot
- [ ] Re-execute from specified stage
- [ ] Support input modifications
- [ ] Compare replay vs original results
- [ ] Handle replay errors gracefully

**Acceptance Criteria:**
- ✅ Replay produces consistent results
- ✅ Can replay from any stage
- ✅ Input modifications work correctly
- ✅ Comparison highlights differences
- ✅ Error handling prevents crashes
- ✅ Unit tests passing

#### Subtask 20.7: Implement DebugGateManager
- [ ] Create `packages/runtime/src/debug-gate-manager.ts`
- [ ] Implement `DebugGateManager` class
- [ ] Add `createGate(traceId, stage, condition?)` method
- [ ] Add `checkGate(traceId, stage)` method (pauses if triggered)
- [ ] Add `releaseGate(gateId)` method
- [ ] Support conditional breakpoints
- [ ] Implement step-over/step-into
- [ ] Add WebSocket notification on trigger

**Acceptance Criteria:**
- ✅ Gates pause execution reliably
- ✅ Conditional gates evaluate correctly
- ✅ Release resumes execution
- ✅ WebSocket notifications sent
- ✅ No deadlocks or race conditions
- ✅ Unit tests passing

#### Subtask 20.8: Build Playground API Endpoints
- [ ] Create `packages/playground/src/api/trace-endpoints.ts`
- [ ] Implement `GET /api/traces` - List traces
- [ ] Implement `GET /api/traces/:traceId` - Get trace details
- [ ] Implement `GET /api/traces/:traceId/snapshots` - Get snapshots
- [ ] Implement `GET /api/traces/:traceId/snapshots/:stage` - Get stage snapshot
- [ ] Implement `POST /api/traces/:traceId/replay` - Replay request
- [ ] Implement `POST /api/traces/:traceId/gates` - Create debug gate
- [ ] Implement `DELETE /api/traces/:traceId` - Delete trace
- [ ] Add error handling and validation

**Acceptance Criteria:**
- ✅ All endpoints implemented
- ✅ Request validation working
- ✅ Error responses structured
- ✅ Integration with TraceStorage
- ✅ API tests passing

#### Subtask 20.9: Build WebSocket Server for Debug Gates
- [ ] Create `packages/playground/src/api/websocket-server.ts`
- [ ] Implement WebSocket connection handling
- [ ] Add gate trigger notifications
- [ ] Add gate release commands
- [ ] Add step-over/step-into commands
- [ ] Handle client disconnections
- [ ] Add reconnection support

**Acceptance Criteria:**
- ✅ WebSocket server running
- ✅ Real-time gate notifications
- ✅ Commands processed correctly
- ✅ Handles disconnections gracefully
- ✅ Multiple clients supported

#### Subtask 20.10: Build RequestFlowDiagram Component
- [ ] Create `packages/playground/src/components/RequestFlowDiagram.tsx`
- [ ] Visualize pipeline stages as connected nodes
- [ ] Show timing information per stage
- [ ] Highlight errors in red
- [ ] Display module interactions as sub-flows
- [ ] Add zoom/pan controls
- [ ] Add stage click to view snapshot
- [ ] Responsive design

**Acceptance Criteria:**
- ✅ All stages visualized correctly
- ✅ Timing displayed accurately
- ✅ Errors highlighted
- ✅ Interactive (click, zoom, pan)
- ✅ Responsive on mobile
- ✅ Performance <100ms render

#### Subtask 20.11: Build SnapshotViewer Component
- [ ] Create `packages/playground/src/components/SnapshotViewer.tsx`
- [ ] Display LocalContext state
- [ ] Show hook execution status
- [ ] Render request/response with syntax highlighting
- [ ] Add JSON tree view
- [ ] Support snapshot export (JSON download)
- [ ] Support snapshot import
- [ ] Add search/filter functionality

**Acceptance Criteria:**
- ✅ All snapshot data displayed
- ✅ Syntax highlighting working
- ✅ Export/import functional
- ✅ Search filters results
- ✅ Performance <50ms render

#### Subtask 20.12: Build SnapshotDiff Component
- [ ] Create `packages/playground/src/components/SnapshotDiff.tsx`
- [ ] Side-by-side comparison view
- [ ] Highlight added keys (green)
- [ ] Highlight removed keys (red)
- [ ] Highlight modified keys (yellow)
- [ ] Show timing deltas
- [ ] Support version-to-version comparison
- [ ] Add unified/split view toggle

**Acceptance Criteria:**
- ✅ Diff visualization accurate
- ✅ Color coding clear
- ✅ Timing deltas displayed
- ✅ View toggle working
- ✅ Performance <100ms render

#### Subtask 20.13: Build DebugGateControls Component
- [ ] Create `packages/playground/src/components/DebugGateControls.tsx`
- [ ] Display active gates
- [ ] Add gate creation form
- [ ] Add conditional breakpoint editor
- [ ] Add resume/step-over/step-into buttons
- [ ] Show gate trigger status
- [ ] Add gate deletion
- [ ] Real-time updates via WebSocket

**Acceptance Criteria:**
- ✅ All controls functional
- ✅ Gate creation working
- ✅ Conditional editor validates syntax
- ✅ Real-time updates working
- ✅ UI responsive

#### Subtask 20.14: Integration Testing
- [ ] Wire TraceCollector to Ingress
- [ ] Wire TraceCollector to RouteManager
- [ ] Wire TraceCollector to HookOrchestrator
- [ ] Wire TraceCollector to HandlerWorker
- [ ] Wire TraceCollector to Module RPC
- [ ] Test full pipeline trace capture
- [ ] Test Playground API with real traces
- [ ] Test WebSocket communication
- [ ] Test replay with example handlers
- [ ] Verify no performance impact when disabled

**Acceptance Criteria:**
- ✅ All pipeline stages captured
- ✅ API returns correct data
- ✅ WebSocket notifications working
- ✅ Replay produces consistent results
- ✅ <5% performance overhead when enabled
- ✅ 0% overhead when disabled

#### Subtask 20.15: Setup Playwright E2E Testing
- [ ] Install Playwright in playground package
- [ ] Create `packages/playground/playwright.config.ts`
- [ ] Configure test browsers (chromium, firefox, webkit)
- [ ] Setup test fixtures and helpers
- [ ] Create `packages/playground/e2e/fixtures/test-server.ts`
- [ ] Add test scripts to package.json
- [ ] Configure CI integration

**Acceptance Criteria:**
- ✅ Playwright installed and configured
- ✅ Test server fixture working
- ✅ Can run tests with `pnpm test:e2e`
- ✅ Tests run in headless mode
- ✅ CI integration configured

#### Subtask 20.16: E2E Test - Trace Visualization
- [ ] Create `packages/playground/e2e/trace-visualization.spec.ts`
- [ ] Test: Load Playground UI
- [ ] Test: Trigger request and capture trace
- [ ] Test: Verify trace appears in list
- [ ] Test: Click trace to view details
- [ ] Test: Verify RequestFlowDiagram renders all stages
- [ ] Test: Verify timing information displayed
- [ ] Test: Click stage to view snapshot
- [ ] Test: Verify error highlighting for failed requests
- [ ] Test: Verify zoom/pan controls work

**Acceptance Criteria:**
- ✅ All test scenarios passing
- ✅ Tests run in <30 seconds
- ✅ Screenshots captured on failure
- ✅ Covers happy path and error cases

#### Subtask 20.17: E2E Test - Snapshot Inspection
- [ ] Create `packages/playground/e2e/snapshot-inspection.spec.ts`
- [ ] Test: Open SnapshotViewer for a stage
- [ ] Test: Verify LocalContext state displayed
- [ ] Test: Verify request/response rendered
- [ ] Test: Test syntax highlighting
- [ ] Test: Export snapshot as JSON
- [ ] Test: Import snapshot from JSON
- [ ] Test: Search/filter functionality
- [ ] Test: Open SnapshotDiff for two snapshots
- [ ] Test: Verify diff highlighting (added/removed/modified)
- [ ] Test: Toggle unified/split view

**Acceptance Criteria:**
- ✅ All test scenarios passing
- ✅ Export/import verified
- ✅ Diff visualization accurate
- ✅ Tests run in <30 seconds

#### Subtask 20.18: E2E Test - Debug Gates
- [ ] Create `packages/playground/e2e/debug-gates.spec.ts`
- [ ] Test: Open DebugGateControls
- [ ] Test: Create debug gate at specific stage
- [ ] Test: Trigger request that hits gate
- [ ] Test: Verify execution paused (WebSocket notification)
- [ ] Test: Verify gate status shows "triggered"
- [ ] Test: Click resume button
- [ ] Test: Verify execution continues
- [ ] Test: Create conditional gate
- [ ] Test: Verify condition evaluation
- [ ] Test: Delete gate

**Acceptance Criteria:**
- ✅ All test scenarios passing
- ✅ WebSocket communication verified
- ✅ Pause/resume working correctly
- ✅ Conditional gates functional
- ✅ Tests run in <30 seconds

#### Subtask 20.19: E2E Test - Request Replay
- [ ] Create `packages/playground/e2e/request-replay.spec.ts`
- [ ] Test: Select trace from list
- [ ] Test: Click replay button
- [ ] Test: Verify replay executes
- [ ] Test: Verify replay results displayed
- [ ] Test: Compare replay vs original
- [ ] Test: Modify input and replay
- [ ] Test: Verify modified results differ
- [ ] Test: Replay from specific stage
- [ ] Test: Verify partial replay works

**Acceptance Criteria:**
- ✅ All test scenarios passing
- ✅ Replay consistency verified
- ✅ Input modification working
- ✅ Stage selection functional
- ✅ Tests run in <30 seconds

#### Subtask 20.20: Run E2E Tests and Validate
- [ ] Run all E2E tests in headless mode
- [ ] Run tests across all browsers (chromium, firefox, webkit)
- [ ] Verify all tests pass
- [ ] Review test coverage
- [ ] Fix any failing tests
- [ ] Capture screenshots/videos for documentation
- [ ] Validate user experience matches requirements

**Acceptance Criteria:**
- ✅ All E2E tests passing (100%)
- ✅ Tests pass in all configured browsers
- ✅ Total E2E test time <2 minutes
- ✅ No flaky tests
- ✅ User experience validated

### Task 20.1: Property Test - Request Replay Execution

#### Subtask 20.1.1: Setup Test Infrastructure
- [ ] Create `packages/runtime/src/tests/property/replay.test.ts`
- [ ] Import fast-check and testing utilities
- [ ] Create arbitrary generators for RequestTrace
- [ ] Create arbitrary generators for snapshots
- [ ] Setup mock GlobalContext

**Acceptance Criteria:**
- ✅ Test file created
- ✅ Arbitraries generate valid data
- ✅ Mock context functional

#### Subtask 20.1.2: Property 45 - Replay Consistency
- [ ] Test: Replaying same snapshot produces identical results
- [ ] Test: Replay from different stages works correctly
- [ ] Test: Modified inputs produce different results
- [ ] Test: Replay errors handled gracefully
- [ ] Test: Concurrent replays are isolated
- [ ] Run with minimum 100 iterations

**Acceptance Criteria:**
- ✅ Property test implemented
- ✅ Validates Requirements 15.2, 15.5
- ✅ Minimum 100 iterations
- ✅ All assertions passing
- ✅ Covers edge cases

### Task 20.2: Property Test - Version Diff Computation

#### Subtask 20.2.1: Setup Test Infrastructure
- [ ] Create `packages/runtime/src/tests/property/diff.test.ts`
- [ ] Import fast-check and testing utilities
- [ ] Create arbitrary generators for snapshots
- [ ] Create arbitrary generators for nested objects

**Acceptance Criteria:**
- ✅ Test file created
- ✅ Arbitraries generate complex structures
- ✅ Edge cases covered

#### Subtask 20.2.2: Property 46 - Diff Correctness
- [ ] Test: computeDiff + applyDiff = identity
- [ ] Test: Diff detects all changes
- [ ] Test: Diff handles nested structures
- [ ] Test: Diff handles arrays correctly
- [ ] Test: Diff is minimal (no redundant operations)
- [ ] Run with minimum 100 iterations

**Acceptance Criteria:**
- ✅ Property test implemented
- ✅ Validates Requirement 15.3
- ✅ Minimum 100 iterations
- ✅ All assertions passing
- ✅ Covers nested/array cases

### Task 20.3: Property Test - Snapshot Storage

#### Subtask 20.3.1: Setup Test Infrastructure
- [ ] Create `packages/runtime/src/tests/property/storage.test.ts`
- [ ] Import fast-check and testing utilities
- [ ] Create arbitrary generators for RequestTrace
- [ ] Setup TraceStorage instance

**Acceptance Criteria:**
- ✅ Test file created
- ✅ Arbitraries generate valid traces
- ✅ Storage instance configured

#### Subtask 20.3.2: Property 44 - Storage Persistence
- [ ] Test: Stored traces retrieved without data loss
- [ ] Test: All snapshots preserved
- [ ] Test: Metadata preserved
- [ ] Test: TTL expiration works correctly
- [ ] Test: Concurrent storage operations safe
- [ ] Run with minimum 100 iterations

**Acceptance Criteria:**
- ✅ Property test implemented
- ✅ Validates Requirement 15.1
- ✅ Minimum 100 iterations
- ✅ All assertions passing
- ✅ Covers concurrent access

## Acceptance Criteria

### Task 20: Playground Request Inspection
- ✅ TraceCollector captures all pipeline stages
- ✅ TraceStorage persists and retrieves traces
- ✅ DiffEngine computes accurate diffs
- ✅ RequestReplayer produces consistent results
- ✅ DebugGateManager pauses execution reliably
- ✅ Playground API endpoints functional
- ✅ WebSocket server handles debug gates
- ✅ RequestFlowDiagram visualizes pipeline
- ✅ SnapshotViewer displays all data
- ✅ SnapshotDiff highlights changes
- ✅ DebugGateControls functional
- ✅ Integration tests passing
- ✅ <5% performance overhead when enabled
- ✅ 0% overhead when disabled
- ✅ All components exported

### Task 20.1: Property Test - Replay
- ✅ Property 45 implemented
- ✅ Validates Requirements 15.2, 15.5
- ✅ Minimum 100 iterations
- ✅ Tests pass consistently
- ✅ Covers edge cases

### Task 20.2: Property Test - Diff
- ✅ Property 46 implemented
- ✅ Validates Requirement 15.3
- ✅ Minimum 100 iterations
- ✅ Tests pass consistently
- ✅ Covers nested structures

### Task 20.3: Property Test - Storage
- ✅ Property 44 implemented
- ✅ Validates Requirement 15.1
- ✅ Minimum 100 iterations
- ✅ Tests pass consistently
- ✅ Covers concurrent access

## Test Coverage Goals
- Unit test coverage: >85%
- Property test iterations: ≥100 per property
- Integration test scenarios: ≥5
- E2E test scenarios: ≥22 (across 4 test files)
- E2E browser coverage: chromium, firefox, webkit

## Estimated Effort
- **Subtasks 20.1-20.2**: 1 hour (planning)
- **Subtasks 20.3-20.7**: 8-10 hours (runtime components)
- **Subtasks 20.8-20.9**: 3-4 hours (API layer)
- **Subtasks 20.10-20.13**: 8-10 hours (UI components)
- **Subtask 20.14**: 3-4 hours (integration)
- **Subtasks 20.15-20.20**: 4-6 hours (E2E tests with Playwright)
- **Tasks 20.1-20.3**: 3-4 hours (property tests)
- **Documentation**: 1-2 hours
- **Total**: 31-41 hours (~5-6 days)

## Performance Requirements
- Trace capture overhead: <5% when enabled, 0% when disabled
- Trace retrieval: <10ms
- Diff computation: <5ms for typical snapshots
- Replay execution: <2x original request time
- UI render: <100ms for complex traces
- WebSocket latency: <50ms

## Security Considerations
- Sanitize sensitive data in traces (passwords, tokens)
- Restrict trace access to authenticated users
- Validate all API inputs
- Rate limit replay requests
- Prevent trace storage DoS

## Notes
- Keep implementations minimal - focus on core functionality
- Reuse existing snapshot functionality from LocalContext
- Ensure trace collection is opt-in (disabled by default in production)
- UI should be responsive and performant with large traces
- Debug gates should not affect production traffic

## Completion Checklist
- [ ] All subtasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing (unit + property + integration + e2e)
- [ ] Code reviewed for minimal implementation
- [ ] Performance requirements met
- [ ] Security considerations addressed
- [ ] Documentation complete
- [ ] Exported from index files
- [ ] tasks.md updated with completion status
