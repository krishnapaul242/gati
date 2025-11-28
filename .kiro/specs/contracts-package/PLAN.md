# @gati/contracts - Implementation Plan

**Last Updated:** 2025-01-XX  
**Status:** ✅ ALL PHASES COMPLETE  
**Overall Progress:** 18/18 tasks complete (100%)

## 📋 Plan Overview

- [x] **Phase 0:** Planning & Analysis (Task 0) - ✅ Complete
- [x] **Phase 1:** Core Contracts Foundation (Tasks 1-4) - ✅ Complete
- [x] **Phase 2:** Context & Module Contracts (Tasks 5-6) - ✅ Complete
- [x] **Phase 3:** Type System & Timescape (Tasks 7-8) - ✅ Complete
- [x] **Phase 4:** Serialization & Schemas (Tasks 9-10) - ✅ Complete
- [x] **Phase 5:** Tooling & Validation (Tasks 11-13) - ✅ Complete
- [x] **Phase 6:** Testing & Quality (Tasks 14-15) - ✅ Complete
- [x] **Phase 7:** Documentation & Publishing (Tasks 16-17) - ✅ Complete

---

## Phase 0: Planning & Analysis ✅ COMPLETE

**Goal:** Understand current state and create implementation plan  
**Status:** 1/1 tasks complete (100%)  
**Completion Date:** 2025-01-XX

### Tasks

- [x] **Task 0:** Analyze existing implementation vs. spec
  - Investigated packages/contracts/ current structure
  - Compared with tasks.md requirements
  - Documented gaps and findings in IMPLEMENTATION_STATUS.md
  - Created phase-based implementation plan
  - **Status:** ✅ Complete
  - **Deliverables:** IMPLEMENTATION_STATUS.md, PLAN.md

**Key Findings:**
- Current package implements observability/deployment contracts (not in spec)
- Spec requires core runtime contracts (envelopes, handlers, contexts)
- ~5% of spec requirements currently implemented
- Need to add src/types/, schemas/, proto/ directories
- GType system exists in runtime package, needs to be moved

---

## Phase 1: Core Contracts Foundation ✅ COMPLETE

**Goal:** Establish package structure and implement core envelope/error contracts  
**Status:** 4/4 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~45 minutes

### Tasks

- [x] **Task 1:** Set up package structure and configuration
  - Create src/types/ directory for TypeScript interfaces
  - Create schemas/ directory for JSON Schema files
  - Create proto/ directory for Protobuf definitions
  - Create test/fixtures/ directory for test data
  - Create scripts/ directory for build utilities
  - Update tsconfig.json for strict mode
  - Update package.json with proper exports
  - **Requirements:** 1.1, 1.2, 1.3, 1.4
  - **Status:** ✅ Complete
  - **Completed:** Directories created, package.json updated with types export
  - **Note:** Kept existing observability/ and deployment/ directories

- [x] **Task 2:** Implement core envelope contracts
  - Create src/types/envelope.ts with GatiRequestEnvelope interface
  - Create src/types/envelope.ts with GatiResponseEnvelope interface
  - Add comprehensive JSDoc comments
  - Define all required and optional fields per spec
  - **Requirements:** 2.1, 2.2, 2.3, 3.1, 3.2
  - **Status:** ✅ Complete
  - **Completed:** GatiRequestEnvelope and GatiResponseEnvelope with full JSDoc

- [x] **Task 3:** Implement error contract
  - Create src/types/error.ts with GatiError interface
  - Define message as required field
  - Define optional fields (code, status, details, traceId)
  - Add JSDoc with error code examples
  - **Requirements:** 4.1, 4.2, 4.3, 4.4
  - **Status:** ✅ Complete
  - **Completed:** GatiError with dot-notation code examples

- [x] **Task 4:** Implement interface contracts
  - Create src/types/ingress.ts with IngressContract interface
  - Create src/types/route-manager.ts with RouteManagerContract interface
  - Create src/types/handler.ts with HandlerFunction type
  - Add comprehensive JSDoc for all methods
  - **Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
  - **Status:** ✅ Complete
  - **Completed:** IngressContract, RouteManagerContract, HandlerFunction with full JSDoc

---

## Phase 2: Context & Module Contracts ✅ COMPLETE

**Goal:** Define context and module communication contracts  
**Status:** 2/2 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~30 minutes

### Tasks

- [x] **Task 5:** Implement context contracts
  - Create src/types/local-context.ts with LocalContext interface
  - Define key-value storage methods (get, set, delete, clean)
  - Define hook registration methods (before, after, catch)
  - Define state management methods (snapshot, restore)
  - Define event and logging methods (publishLocal, log)
  - Create src/types/global-context.ts with GlobalContext interface
  - Define appId, env, modules fields
  - Define secrets, metrics, timescape interfaces
  - Define publish and callAgent methods
  - Add comprehensive JSDoc for all methods
  - **Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5
  - **Status:** ✅ Complete
  - **Completed:** LocalContext and GlobalContext with all specified methods

- [x] **Task 6:** Implement module contracts
  - Create src/types/module-client.ts with ModuleClient interface
  - Define id field, call method, health method
  - Create src/types/handler-version.ts with HandlerVersion interface
  - Define required fields (handlerId, versionId, createdAt)
  - Define optional fields (image, entrypoint, exportedFunctions, etc.)
  - Create src/types/module-manifest.ts with ModuleManifest interface
  - Define required fields (name, id, version, type)
  - Define optional fields (exports, capabilities, resources, signature)
  - Define type union for module types
  - Add comprehensive JSDoc with examples
  - **Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5
  - **Status:** ✅ Complete
  - **Completed:** ModuleClient, HandlerVersion, ModuleManifest with full examples

---

## Phase 3: Type System & Timescape ✅ COMPLETE

**Goal:** Implement GType system and Timescape contracts  
**Status:** 2/2 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~20 minutes

### Tasks

- [x] **Task 7:** Implement GType system
  - Create src/types/gtype.ts with GType TypeScript types
  - Define GTypeKind union type
  - Define GTypeBase interface
  - Define GPrimitiveType, GObjectType, GArrayType, GRefType interfaces
  - Create discriminated union GType
  - Add comprehensive JSDoc explaining type system
  - **Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5
  - **Status:** ✅ Complete
  - **Completed:** Full GType system with discriminated unions and constraints

- [x] **Task 8:** Implement Timescape contracts
  - Create src/types/timescape.ts with TimescapeClientContract interface
  - Define SchemaDiff interface
  - Define diff method signature
  - Define registerVersion method signature
  - Define listVersions method signature
  - Add comprehensive JSDoc explaining version resolution
  - **Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5
  - **Status:** ✅ Complete
  - **Completed:** TimescapeClientContract with SchemaDiff and all methods

---

## Phase 4: Serialization & Schemas ✅ COMPLETE

**Goal:** Create JSON Schema and Protobuf definitions for all contracts  
**Status:** 2/2 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~20 minutes

### Tasks

- [x] **Task 9:** Create JSON schemas
  - Create schemas/envelope.schema.json for request/response envelopes
  - Include $id and $schema fields
  - Define required fields and constraints
  - Add GatiError to envelope schema
  - Create schemas/manifest.schema.json for ModuleManifest
  - Create schemas/gtype.schema.json for GType definitions
  - Validate schemas are valid JSON Schema draft-07
  - **Requirements:** 2.4, 3.4, 4.5, 13.1, 13.2, 13.3, 13.4
  - **Status:** ✅ Complete
  - **Completed:** All JSON schemas with proper $id, $schema, and constraints

- [x] **Task 10:** Create Protobuf definitions
  - Create proto/envelope.proto with proto3 syntax
  - Define Header message for key-value pairs
  - Define GatiRequestEnvelope and GatiResponseEnvelope messages
  - Add GatiError message
  - Create proto/manifest.proto for module manifests
  - Create proto/gtype.proto for GType definitions
  - Validate proto files compile correctly
  - **Requirements:** 2.4, 3.4, 4.5, 14.1, 14.2, 14.3, 14.4
  - **Status:** ✅ Complete
  - **Completed:** All Protobuf definitions with proto3 syntax

---

## Phase 5: Tooling & Validation ✅ COMPLETE

**Goal:** Build validation utilities, test fixtures, and CLI tool  
**Status:** 3/3 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~30 minutes

### Tasks

- [x] **Task 11:** Create test fixtures
  - Create test/fixtures/envelope.example.json
  - Include valid GatiRequestEnvelope example
  - Include valid GatiResponseEnvelope example
  - Include edge cases (empty body, no optional fields)
  - Create test/fixtures/manifest.example.json
  - Include valid ModuleManifest examples for each type
  - Include HandlerVersion examples
  - Create test/fixtures/gtype.example.json
  - Include examples of each GType kind
  - Include nested object and array examples
  - **Requirements:** 16.1, 16.2, 16.3, 16.4
  - **Status:** ✅ Complete
  - **Completed:** All test fixtures with valid and edge case examples

- [x] **Task 12:** Implement validation utilities
  - Create src/utils/validation.ts
  - Implement validateEnvelope using Ajv
  - Implement validateManifest using Ajv
  - Return detailed error messages with paths
  - Create src/utils/serialization.ts
  - Implement JSON serialization/deserialization
  - Implement Protobuf serialization/deserialization (stub)
  - Implement MessagePack serialization/deserialization (stub)
  - **Requirements:** 17.1, 17.2, 17.3, 17.5
  - **Status:** ✅ Complete
  - **Completed:** Validation with Ajv, JSON serialization, Protobuf/MessagePack stubs

- [x] **Task 13:** Implement CLI tool
  - Create src/cli/validate.ts
  - Parse command-line arguments
  - Load file and detect format
  - Validate against appropriate schema
  - Display validation results with colors
  - Exit with appropriate status code
  - Add bin entry to package.json
  - **Requirements:** 17.4
  - **Status:** ✅ Complete
  - **Completed:** CLI tool gati-contracts-validate with bin entry

---

## Phase 6: Testing & Quality ✅ COMPLETE

**Goal:** Write comprehensive tests for all contracts and utilities  
**Status:** 2/2 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~20 minutes

### Tasks

- [x] **Task 14:** Write contract validation tests
  - Create test/validation.test.ts
  - Test valid GatiRequestEnvelope passes validation
  - Test invalid envelope fails with correct errors
  - Test optional field handling
  - Test Protobuf stubs (round-trips via JSON)
  - Verify equality with original
  - Test valid ModuleManifest passes validation
  - Test invalid manifest fails with correct errors
  - Test GType basic validation
  - Test round-trip serialization
  - **Requirements:** 15.1, 15.2, 15.3, 15.4, 15.5
  - **Status:** ✅ Complete
  - **Completed:** 16 validation tests passing, JSON serialization tests

- [x] **Task 15:** Write TypeScript type tests
  - Create test/types.test.ts
  - Test optional vs required field enforcement at compile time
  - Test discriminated union type narrowing
  - Test generic type parameters in LocalContext
  - Use vitest expectTypeOf for compile-time type testing
  - **Requirements:** 20.1, 20.2, 20.3, 20.5
  - **Status:** ✅ Complete
  - **Completed:** 8 type tests passing with expectTypeOf

---

## Phase 7: Documentation & Publishing ✅ COMPLETE

**Goal:** Complete documentation and prepare for publishing  
**Status:** 2/2 tasks complete (100%)  
**Completion Date:** 2025-01-XX  
**Actual Time:** ~20 minutes

### Tasks

- [x] **Task 16:** Create documentation
  - Update README.md with installation and usage
  - Document each contract with examples
  - Add code examples for all major contracts
  - Create MIGRATION.md guide template
  - Document versioning strategy
  - Add API reference for all exported types
  - Update package.json description and keywords
  - **Requirements:** 18.3, 19.1, 19.2, 19.3, 19.4
  - **Status:** ✅ Complete
  - **Completed:** Comprehensive README with all contracts, examples, and usage

- [x] **Task 17:** Final validation and publishing setup
  - Update src/index.ts to export all types
  - Export validation utilities
  - Export serialization helpers
  - Add package-level JSDoc
  - Set up package.json exports field
  - Configure files to include in package
  - Add LICENSE file (MIT)
  - Run all tests and ensure they pass
  - Validate all fixtures against schemas
  - Check TypeScript compilation with strict mode
  - Verify package builds correctly
  - Test local installation with npm pack
  - Test CLI tool with sample files
  - **Requirements:** 1.5, 15.5, 16.5, 18.5, 20.1, 20.4
  - **Status:** ✅ Complete
  - **Completed:** All tests passing (24/24), CLI working, LICENSE added, package ready

---

## 📊 Progress Summary

**By Phase:**
- Phase 0: 1/1 tasks (100%) ✅
- Phase 1: 4/4 tasks (100%) ✅
- Phase 2: 2/2 tasks (100%) ✅
- Phase 3: 2/2 tasks (100%) ✅
- Phase 4: 2/2 tasks (100%) ✅
- Phase 5: 3/3 tasks (100%) ✅
- Phase 6: 2/2 tasks (100%) ✅
- Phase 7: 2/2 tasks (100%) ✅

**Overall:** 18/18 tasks complete (100%) ✅

**Estimated Total Time:** 18-24 hours  
**Actual Time:** ~3.5 hours

**Status:** ✅ IMPLEMENTATION COMPLETE

---

## 🔄 Update Protocol

After completing each task:
1. Change `- [ ]` to `- [x]`
2. Update status from `⏳ Not Started` to `✅ Complete`
3. Add completion notes (files created, tests passing, etc.)
4. Update phase progress percentage
5. Update overall progress at document top
6. Update "Last Updated" timestamp
7. If phase completes, add **Completion Date** and update phase status to ✅
8. Move focus to next task

---

## 📝 Implementation Notes

### Key Decisions

1. **Keep Existing Contracts:** The current observability/ and deployment/ contracts will remain in the package alongside the new core contracts.

2. **Directory Structure:** New structure will be:
   ```
   packages/contracts/
   ├── src/
   │   ├── types/           # NEW - Core runtime contracts
   │   ├── schemas/         # NEW - JSON Schema files
   │   ├── proto/           # NEW - Protobuf definitions
   │   ├── utils/           # NEW - Validation utilities
   │   ├── cli/             # NEW - CLI tool
   │   ├── observability/   # EXISTING - Keep as-is
   │   └── deployment/      # EXISTING - Keep as-is
   ├── test/
   │   └── fixtures/        # NEW - Test data
   └── scripts/             # NEW - Build utilities
   ```

3. **GType System:** Will reference existing implementation in packages/runtime/src/gtype/ but create clean contract definitions.

4. **Protobuf Stubs:** Initial Protobuf serialization will be stubs (return JSON) until full implementation is needed.

5. **Backward Compatibility:** All changes will be additive. No breaking changes to existing observability/deployment contracts.

### Dependencies to Add

- `ajv` - JSON Schema validation
- `ajv-formats` - Additional format validators
- `protobufjs` - Protobuf serialization (optional)
- `@types/node` - Node.js types

### Testing Strategy

- Unit tests for each contract type
- Integration tests for validation utilities
- Type tests for compile-time guarantees
- Fixture validation tests
- CLI tool integration tests

---

## 🚀 Getting Started

To begin implementation:

1. **Start with Task 1:** Set up package structure
2. **Follow phase order:** Complete Phase 1 before moving to Phase 2
3. **Update this plan:** Mark tasks complete immediately after finishing
4. **Write minimal code:** Only implement what's specified
5. **Test as you go:** Validate each component works before moving on

**Next Action:** Begin Task 1 - Set up package structure and configuration
