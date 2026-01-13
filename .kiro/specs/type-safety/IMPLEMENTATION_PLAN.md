# Type Safety Integration - Implementation Plan

**Last Updated:** 2025-01-XX  
**Status:** Phase 1 - In Progress  
**Overall Progress:** 2/15 tasks complete (13.3%)

---

## 📋 Plan Overview

| Phase | Tasks | Status | Progress |
|-------|-------|--------|----------|
| Phase 1: Handler Schema Extraction | 1-5 | 🚧 In Progress | 2/5 (40%) |
| Phase 2: Dev Mode Integration | 6-9 | ⏳ Not Started | 0/4 (0%) |
| Phase 3: Runtime Handler<Schema> | 10-13 | ⏳ Not Started | 0/4 (0%) |
| Phase 4: Testing & Documentation | 14-15 | ⏳ Not Started | 0/2 (0%) |

---

## Phase 1: Handler Schema Extraction 🚧 IN PROGRESS

**Goal:** Connect handler-analyzer to type-extractor to extract request/response schemas  
**Status:** 2/5 tasks complete (40%)  
**Started:** 2025-01-XX

### Tasks

- [x] **Task 1:** Add schema extraction to handler-analyzer
  - Extract handler function/variable declaration
  - Get handler parameters (req, res, gctx, lctx)
  - Extract req parameter type
  - Find body property type
  - **Status:** ✅ Complete - Added extractHandlerSchemas function
  - **Completed:** 2025-01-XX
  - **Dependencies:** None

- [x] **Task 2:** Integrate type-extractor into handler analysis
  - Import TypeExtractor into handler-analyzer
  - Convert req.body TypeScript type → GType schema
  - Handle edge cases (no body type, any type, unknown type)
  - Cache extracted schemas
  - **Status:** ✅ Complete - TypeExtractor integrated with caching
  - **Completed:** 2025-01-XX
  - **Estimated:** 2 hours
  - **Dependencies:** Task 1

- [ ] **Task 3:** Extract response schema from handler body
  - Analyze res.json() calls in handler body
  - Extract return type from res.json() argument
  - Convert to GType schema
  - Handle multiple res.json() calls
  - **Status:** ⏳ Not Started
  - **Estimated:** 3 hours
  - **Dependencies:** Task 2

- [ ] **Task 4:** Update HandlerInfo interface to include schemas
  - Add requestSchema?: GType field
  - Add responseSchema?: GType field
  - Update manifest-generator to serialize schemas
  - Update manifest format version
  - **Status:** ⏳ Not Started
  - **Estimated:** 1 hour
  - **Dependencies:** Task 3

- [ ] **Task 5:** Test schema extraction with Todo API
  - Extract schemas from todos.ts handler
  - Extract schemas from todos/[id].ts handler
  - Validate GType schemas are correct
  - Verify caching works
  - Write unit tests
  - **Status:** ⏳ Not Started
  - **Estimated:** 2 hours
  - **Dependencies:** Task 4

---

## 📊 Progress Summary

### Current Focus
🎯 **Task 1:** Add schema extraction to handler-analyzer

### Key Files to Modify
- `packages/cli/src/analyzer/handler-analyzer.ts` - Add schema extraction
- `packages/cli/src/commands/dev.ts` - Add validator generation
- `packages/runtime/src/types/handler.ts` - Add Handler<Schema>
