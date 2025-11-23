# Runtime Architecture - Next Steps & Implementation Plan

**Last Updated:** 2025-11-23 (Updated)  
**Current Status:** 55% Complete (468/468 tests passing)  
**Property Tests:** 13/47 (28%)  
**Tasks Complete:** 6/30 (20%)

> **Note:** See `IMPLEMENTATION_PLAN.md` for comprehensive implementation plan with detailed task breakdowns, timelines, and code examples.

---

## 🎯 Current State

### ✅ Completed (6 tasks)
1. **Task 2.1-2.4:** Local Context property tests (4 tasks)
2. **Task 4:** GType System with validation
3. **Task 5:** LCC Lifecycle Orchestration
4. **Task 6:** Snapshot/Restore
5. **Task 8:** Handler Manifest Generation (80% - MVP)

### 📊 Test Coverage
- **Total Tests:** 468 passing
- **Property Tests:** 13/47 complete
- **Pass Rate:** 100%
- **Test Runs:** 1,850+ property test iterations

---

## 🚀 Recommended Implementation Plan

### Phase 1: Complete Core Context (1-2 days) ⭐ PRIORITY

**Goal:** Finish all property tests for Local and Global Context

#### Task 3.1: Global Context Module Registry Test
- **Property 28:** Module registry completeness
- **Effort:** 30 minutes
- **Files:** `tests/unit/runtime/global-context.test.ts`
- **Validates:** Requirements 8.1

#### Task 3.2: Global Context Configuration Immutability Test
- **Property 32:** Configuration immutability
- **Effort:** 20 minutes
- **Files:** `tests/unit/runtime/global-context.test.ts`
- **Validates:** Requirements 8.5

**Outcome:** All core context property tests complete (15/47 = 32%)

---

### Phase 2: Infrastructure Components (3-5 days)

**Goal:** Implement critical infrastructure for request processing

#### Task 11: Ingress Component (1 day)
- **Priority:** HIGH
- **Effort:** 1 day
- **Property Tests:** 1 (Property 3: Request ID uniqueness)

**Implementation:**
1. Create `packages/runtime/src/ingress.ts`
2. Implement HTTP request reception
3. Add authentication (JWT, API keys)
4. Implement header normalization
5. Add request ID generation with metadata
6. Implement request descriptor publishing

**Files to Create:**
- `packages/runtime/src/ingress.ts` (~300 lines)
- `packages/runtime/src/ingress.test.ts` (~200 lines)

**Validates:** Requirements 1.3

---

#### Task 12: Route Manager Version Resolution (2 days)
- **Priority:** HIGH
- **Effort:** 2 days
- **Property Tests:** 5 (Properties 14-17, 33, 36)

**Implementation:**
1. Integrate Timescape version resolution
2. Add manifest caching
3. Implement transformer execution
4. Add health status tracking
5. Implement version routing logic

**Files to Modify:**
- `packages/runtime/src/route-manager.ts` (add ~400 lines)

**Files to Create:**
- `packages/runtime/src/route-manager.test.ts` (~400 lines)

**Validates:** Requirements 4.1-4.4, 9.1, 9.5

---

#### Task 17: Secrets Manager (1 day)
- **Priority:** HIGH
- **Effort:** 1 day
- **Property Tests:** 2 (Properties 29, 41)

**Implementation:**
1. Create SecretManager interface
2. Implement secure retrieval
3. Add TTL-based caching
4. Integrate with Global Context

**Files to Create:**
- `packages/runtime/src/secrets-manager.ts` (~200 lines)
- `packages/runtime/src/secrets-manager.test.ts` (~150 lines)

**Validates:** Requirements 8.2, 12.4

---

#### Task 18: Metrics & Observability (1 day)
- **Priority:** HIGH
- **Effort:** 1 day
- **Property Tests:** 3 (Properties 22, 30, 42)

**Implementation:**
1. Create MetricsClient with OpenTelemetry
2. Implement counter, gauge, histogram methods
3. Add distributed tracing integration
4. Implement structured logging
5. Add audit logging

**Files to Create:**
- `packages/runtime/src/metrics-client.ts` (~250 lines)
- `packages/runtime/src/tracing.ts` (~150 lines)
- `packages/runtime/src/audit-logger.ts` (~100 lines)
- `packages/runtime/src/metrics-client.test.ts` (~200 lines)

**Validates:** Requirements 6.5, 8.3, 12.5

**Outcome:** Core infrastructure complete, 24/47 property tests (51%)

---

### Phase 3: Advanced Features (2-3 days)

**Goal:** Complete remaining infrastructure and advanced features

#### Task 13: Policy Enforcement (1 day)
- **Priority:** MEDIUM
- **Effort:** 1 day
- **Property Tests:** 3 (Properties 7, 34, 35)

**Implementation:**
1. Implement rate limiting in Route Manager
2. Add authentication verification
3. Implement warm pool management
4. Add usage tracking

**Files to Modify:**
- `packages/runtime/src/route-manager.ts` (add ~200 lines)

**Validates:** Requirements 2.3, 9.2, 9.3

---

#### Task 15: Queue Fabric (1 day)
- **Priority:** MEDIUM
- **Effort:** 1 day
- **Property Tests:** 3 (Properties 26, 31, 43)

**Implementation:**
1. Create Queue Fabric interface
2. Implement topic-based pub/sub
3. Add backpressure enforcement
4. Implement delivery semantics

**Files to Create:**
- `packages/runtime/src/queue-fabric.ts` (~300 lines)
- `packages/runtime/src/queue-fabric.test.ts` (~250 lines)

**Validates:** Requirements 13.3, 7.4, 8.4

---

#### Task 9: Module Manifest & Capabilities (1 day)
- **Priority:** MEDIUM
- **Effort:** 1 day
- **Property Tests:** 2 (Properties 19, 40)

**Implementation:**
1. Create Module Manifest structure
2. Add capability declaration and validation
3. Implement capability enforcement in Global Context
4. Add network access configuration

**Files to Create:**
- `packages/runtime/src/module-manifest.ts` (~200 lines)
- `packages/runtime/src/capability-enforcer.ts` (~150 lines)
- `packages/runtime/src/module-manifest.test.ts` (~200 lines)

**Validates:** Requirements 5.3, 12.1, 12.2

**Outcome:** 32/47 property tests (68%)

---

### Phase 4: Module RPC & Codegen (2-3 days)

#### Task 10: Module RPC Adapters (1 day)
- **Priority:** MEDIUM
- **Effort:** 1 day
- **Property Tests:** 2 (Properties 4, 18)

**Implementation:**
1. Create ModuleClient interface with typed stubs
2. Implement automatic serialization/deserialization
3. Add retry logic with exponential backoff
4. Implement connection pooling
5. Add timeout handling

**Files to Create:**
- `packages/runtime/src/module-client.ts` (~300 lines)
- `packages/runtime/src/module-client.test.ts` (~250 lines)

**Validates:** Requirements 1.4, 5.2

---

#### Task 19: Codegen (2 days)
- **Priority:** MEDIUM
- **Effort:** 2 days
- **Property Tests:** 2 (Properties 5, 38)

**Implementation:**
1. Create validator function generator from GType schemas
2. Implement TypeScript type definition generator
3. Add SDK client stub generator
4. Generate manifest bundles

**Files to Create:**
- `packages/cli/src/codegen/validator-generator.ts` (~250 lines)
- `packages/cli/src/codegen/type-generator.ts` (~200 lines)
- `packages/cli/src/codegen/sdk-generator.ts` (~300 lines)
- `packages/cli/src/codegen/codegen.test.ts` (~300 lines)

**Validates:** Requirements 1.5, 3.5, 11.2, 11.3

**Outcome:** 36/47 property tests (77%)

---

### Phase 5: Testing & Polish (2-3 days)

#### Task 20: Handler Worker (1 day)
- **Priority:** LOW
- **Effort:** 1 day
- **Property Tests:** 1 (Property 1)

**Implementation:**
1. Create HandlerWorker class
2. Implement handler invocation
3. Add health check endpoint
4. Ensure stateless execution

**Files to Create:**
- `packages/runtime/src/handler-worker.ts` (~200 lines)
- `packages/runtime/src/handler-worker.test.ts` (~150 lines)

**Validates:** Requirements 1.1

---

#### Task 16: Manifest Store (1 day)
- **Priority:** LOW
- **Effort:** 1 day
- **Property Tests:** 1 (Property 39)

**Implementation:**
1. Create Manifest Store interface
2. Implement manifest persistence
3. Add GType schema storage
4. Implement version graph storage

**Files to Create:**
- `packages/runtime/src/manifest-store.ts` (~250 lines)
- `packages/runtime/src/manifest-store.test.ts` (~200 lines)

**Validates:** Requirements 11.5

---

#### Task 22: Hook Manifest Recording (1 day)
- **Priority:** LOW
- **Effort:** 1 day
- **Property Tests:** 1 (Property 37)

**Implementation:**
1. Add hook definition recording to manifest generation
2. Store hook metadata
3. Enable playback in Playground

**Files to Modify:**
- `packages/cli/src/analyzer/manifest-generator.ts` (add ~100 lines)

**Validates:** Requirements 10.4

**Outcome:** 39/47 property tests (83%)

---

## 📅 Timeline Estimates

### Option 1: MVP Focus (1-2 weeks) ⭐ RECOMMENDED

**Week 1:**
- Days 1-2: Phase 1 (Global Context tests)
- Days 3-5: Phase 2 (Ingress, Route Manager, Secrets, Metrics)

**Week 2:**
- Days 1-3: Phase 3 (Policy, Queue, Module Manifest)
- Days 4-5: Testing & Documentation

**Outcome:** 32/47 property tests (68%), core functionality complete

---

### Option 2: Full Completion (3-4 weeks)

**Week 1:** Phases 1-2 (Global Context + Infrastructure)  
**Week 2:** Phase 3 (Advanced Features)  
**Week 3:** Phase 4 (Module RPC + Codegen)  
**Week 4:** Phase 5 (Testing & Polish)

**Outcome:** 39/47 property tests (83%), production-ready

---

## 🎯 Immediate Next Actions

### This Session (2-3 hours)
1. ✅ Update spec documents (DONE)
2. **Task 3.1:** Global Context module registry test (30 min)
3. **Task 3.2:** Global Context configuration immutability test (20 min)
4. **Start Task 11:** Ingress component implementation (1-2 hours)

### Next Session (4-6 hours)
5. **Complete Task 11:** Ingress component + tests
6. **Start Task 12:** Route Manager version resolution
7. Update progress to 60%

---

## 📊 Success Metrics

### MVP Success (68% property tests)
- ✅ All core context tests complete
- ✅ Ingress component working
- ✅ Route Manager with version resolution
- ✅ Secrets Manager integrated
- ✅ Metrics & Observability working
- ✅ 32+ property tests passing

### Full Success (83% property tests)
- ✅ All MVP criteria
- ✅ Module RPC adapters working
- ✅ Codegen producing validators and SDK stubs
- ✅ Policy enforcement active
- ✅ Queue Fabric operational
- ✅ 39+ property tests passing

---

## 🚧 Known Gaps

### Not Planned (8 property tests remaining)
- Task 7: Compensating actions (no property tests)
- Task 21: Playground enhancements (3 property tests - 44, 45, 46)
- Task 23-24: Testing infrastructure (no property tests)
- Task 25: Operator (no property tests)
- Task 26: End-to-end integration (no property tests)
- Task 27-30: Documentation & examples (no property tests)

**Reason:** These are advanced features or infrastructure that can be added later without blocking core functionality.

---

## 💡 Key Recommendations

1. **Focus on Phase 1-2 first** - Complete core context and infrastructure
2. **Prioritize property tests** - They validate correctness across edge cases
3. **Keep tests passing** - Don't move forward with failing tests
4. **Document as you go** - Add inline comments and examples
5. **Benchmark early** - Validate performance assumptions

---

## 📝 Notes

- All 468 existing tests are passing
- GType system is production-ready
- Hook orchestrator is fully functional
- Snapshot/restore enables time-travel debugging
- Manifest generation works for basic handlers

**Status:** Strong foundation in place, ready for infrastructure phase
