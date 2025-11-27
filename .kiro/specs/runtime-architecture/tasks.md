# Implementation Plan

## Current Status Summary

**Completed (Tasks 1-21):**
- ✅ Project structure and type definitions
- ✅ Local Context (lctx) with state management, hooks, and snapshot/restore
- ✅ Global Context (gctx) with module registry and lifecycle management
- ✅ GType schema system with validation
- ✅ Hook Orchestrator (LCC) with lifecycle management, validation, and compensating actions
- ✅ Snapshot and restore functionality
- ✅ Handler Manifest generation (in CLI analyzer)
- ✅ Enhanced Route Manager with version resolution and Timescape integration
- ✅ Module Manifest and capability system
- ✅ Module RPC adapters with typed stubs and serialization
- ✅ Ingress component with authentication and request ID generation
- ✅ Transformer execution for version compatibility
- ✅ Pub/Sub Queue Fabric with backpressure enforcement
- ✅ Manifest & Schema Store with persistence for all data types
- ✅ Secrets Manager with TTL-based caching and audit logging
- ✅ Metrics and Observability with OpenTelemetry integration
- ✅ Codegen for validators, types, SDK, and bundles with CLI integration
- ✅ Handler Worker execution engine
- ✅ Property-based testing infrastructure with fast-check
- ✅ Property tests for Local Context (Properties 21, 23, 24, 27, 47)
- ✅ Property tests for Hook Orchestrator (Properties 6, 8, 10, 11, 20, 25)
- ✅ Property tests for Route Manager (Properties 3, 7, 14, 15, 16, 17, 33, 34, 35, 36)
- ✅ Property tests for Module System (Properties 4, 18, 19, 40)
- ✅ Property tests for Queue Fabric (Properties 26, 31, 43)
- ✅ Property tests for Ingress (Property 3)
- ✅ Property tests for Manifest Store (Property 39)
- ✅ Property tests for Secrets Manager (Properties 29, 41)
- ✅ Property tests for Metrics (Properties 22, 30, 42)
- ✅ Property tests for Codegen (Properties 5, 38)
- ✅ Property tests for Handler Worker (Property 1)
- ✅ Hook manifest recording with extraction, storage, and playback
- ✅ Property tests for Hook Manifest (Property 37)

**In Progress:**
- None currently

**Not Started (Tasks 22-29):**
- Testing harness (@gati/testing)
- Runtime simulation (@gati/simulate)
- Kubernetes Operator
- End-to-end integration
- Example handlers and modules
- Documentation

**Note:** Property-based tests (marked with *) are optional and can be implemented after core functionality is complete.

**Latest Completion:** Task 20 - Playground Request Inspection (2025-01-24)
- 20/20 subtasks complete (including integration & E2E tests)
- 103 tests total (70 unit + 6 integration + 27 E2E)
- 24 files created (runtime: 7, playground: 6, tests: 6, docs: 5)
- Full trace collection, storage, replay, and debug gate system
- Comprehensive documentation and test coverage

---

- [x] 1. Set up project structure and core type definitions
  - Create directory structure for runtime components
  - Define TypeScript interfaces for Handler, LocalContext, GlobalContext
  - Set up testing framework (Jest/Vitest) and fast-check for property-based testing
  - Configure build system and TypeScript compiler
  - _Requirements: 1.1, 7.1, 8.1_
  - **Status**: Core types exist, but fast-check needs to be installed

- [x] 2. Implement Local Context (lctx) with state management and hooks
  - Create LocalContext class with ephemeral key-value storage
  - Implement get, set, delete, and clean operations
  - Add hook registration methods (before, after, catch)
  - Implement event publishing to request-scoped topics
  - Add metadata property with requestId, path, version, flags
  - _Requirements: 7.1, 7.2, 7.4, 7.5_
  - **Status**: Implemented in packages/runtime/src/local-context.ts

- [x] 2.1 Install and configure fast-check for property-based testing
  - Add fast-check to devDependencies
  - Configure vitest to work with property-based tests
  - Create example property test to verify setup
  - _Requirements: All (testing infrastructure)_
  - **Status**: Complete - fast-check 4.3.0 installed and working with 10+ property tests

- [x] 2.2 Write property test for Local Context state isolation
  - **Property 23: Local Context operations**
  - **Validates: Requirements 7.1**
  - **Status**: Complete - 4 property tests with 300 runs total

- [x] 2.3 Write property test for hook registration
  - **Property 24: Hook registration support**
  - **Validates: Requirements 7.2, 10.5**
  - **Status**: Complete - 7 property tests with 550 runs total

- [x] 2.4 Write property test for metadata availability
  - **Property 27: Metadata availability**
  - **Validates: Requirements 7.5**
  - **Status**: Complete - 6 property tests with 600 runs total

- [x] 3. Implement Global Context (gctx) with module registry
  - Create GlobalContext class with module registry
  - Implement getModule method with typed client stubs
  - Add secrets manager interface
  - Add metrics client with OpenTelemetry integration
  - Implement global pub/sub capabilities
  - Add read-only configuration access
  - Add Timescape client interface
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - **Status**: Implemented in packages/runtime/src/global-context.ts (secrets manager and metrics client interfaces need implementation)

- [ ]* 3.1 Write property test for module registry completeness
  - **Property 28: Module registry completeness**
  - **Validates: Requirements 8.1**

- [ ]* 3.2 Write property test for configuration immutability
  - **Property 32: Configuration immutability**
  - **Validates: Requirements 8.5**

- [x] 4. Implement GType schema system and validation
  - Create GType data structures (object, array, primitive, union, intersection)
  - Implement GType validator generator
  - Add validation error formatting with structured diagnostics
  - Create TypeScript type extractor from GType schemas
  - _Requirements: 3.1, 3.4, 3.5_
  - **Status**: Complete - All GType components implemented with comprehensive tests

- [x] 4.1 Write property test for GType schema generation
  - **Property 9: GType schema generation**
  - **Validates: Requirements 3.1**
  - **Status**: Complete - 3 property tests with 300 runs

- [x] 4.2 Write property test for validator function generation
  - **Property 13: Validator function generation**
  - **Validates: Requirements 3.5**
  - **Status**: Complete - 6 property tests with 600 runs

- [x] 4.3 Write property test for validation error structure
  - **Property 12: Validation error structure**
  - **Validates: Requirements 3.4**
  - **Status**: Complete - 5 property tests with 500 runs

- [x] 5. Implement Local Context Controller (LCC) lifecycle orchestration
  - Create LCC class with hook registry
  - Implement before hook execution in registration order
  - Implement after hook execution in reverse order
  - Implement catch hook execution in reverse order
  - Add async hook orchestration with timeout and retry logic
  - Implement lifecycle event emission (hookStart, hookEnd, hookError, handlerStart, handlerEnd)
  - Add request and response validation integration
  - _Requirements: 2.1, 2.5, 3.2, 3.3, 6.1, 7.3, 10.1, 10.3, 10.5_
  - **Status**: ✅ Complete - Hook orchestrator fully implemented with all tests passing

- [x] 5.1 Write property test for hook execution order
  - **Property 25: Hook execution order**
  - **Validates: Requirements 7.3, 10.1, 10.3**
  - **Status**: ✅ Complete

- [x] 5.2 Write property test for error isolation
  - **Property 6: Error isolation**
  - **Validates: Requirements 2.1**
  - **Status**: ✅ Complete

- [x] 5.3 Write property test for timeout cleanup
  - **Property 8: Timeout cleanup**
  - **Validates: Requirements 2.5**
  - **Status**: ✅ Complete

- [x] 5.4 Write property test for lifecycle event emission
  - **Property 20: Lifecycle event emission**
  - **Validates: Requirements 6.1**
  - **Status**: ✅ Complete

- [x] 5.5 Write property test for request validation
  - **Property 10: Request validation**
  - **Validates: Requirements 3.2**
  - **Status**: ✅ Complete

- [x] 5.6 Write property test for response validation
  - **Property 11: Response validation**
  - **Validates: Requirements 3.3**
  - **Status**: ✅ Complete

- [x] 6. Implement snapshot and restore functionality
  - Add snapshot() method to serialize lctx state
  - Capture outstanding promises with status
  - Record last hook index
  - Store handler version in snapshot
  - Implement restore() method to recreate state
  - _Requirements: 6.3, 15.1, 15.4_
  - **Status**: ✅ Complete - Snapshot/restore implemented in LocalContext

- [x] 6.1 Write property test for snapshot completeness
  - **Property 21: Snapshot completeness**
  - **Validates: Requirements 6.3**
  - **Status**: ✅ Complete

- [x] 6.2 Write property test for snapshot restoration fidelity
  - **Property 47: Snapshot restoration fidelity**
  - **Validates: Requirements 15.4**
  - **Status**: ✅ Complete

- [x] 7. Implement compensating actions for error handling
  - Add compensation registry to LCC
  - Implement registerCompensatingAction method
  - Execute compensating actions in reverse order on errors
  - Add logging for compensating action execution
  - Emit alerts when compensating actions fail
  - _Requirements: 2.1_
  - **Status**: ✅ Complete - Implemented in HookOrchestrator

- [x] 8. Implement Handler Manifest generation
  - Create Analyzer to extract TypeScript types from handler code
  - Generate handler ID, path, and methods from handler definition
  - Extract GType references for request/response/params/headers
  - Extract hook definitions from handler code
  - Generate security policies (roles, rate limits)
  - Generate Timescape fingerprint
  - Extract module and plugin dependencies
  - _Requirements: 1.2, 11.1_
  - **Status**: ✅ Complete - Implemented in packages/cli/src/analyzer/manifest-generator.ts

- [ ]* 8.1 Write property test for manifest generation completeness
  - **Property 2: Manifest generation completeness**
  - **Validates: Requirements 1.2, 11.1**

- [x] 9. Implement Route Manager with version resolution and Timescape integration
  - Create enhanced Route Manager class with version resolution
  - Implement Timescape integration for version queries
  - Add manifest, GType, and health status caching
  - Implement version resolution based on path and preference
  - Add handler instance selection and routing
  - Implement policy enforcement (rate limiting, authentication)
  - Add warm pool management for critical versions
  - Implement usage tracking for auto-decommissioning
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.5, 2.3_
  - **Status**: ✅ Complete - Enhanced Route Manager implemented with comprehensive tests

- [x]* 9.1 Write property test for version resolution
  - **Property 33: Version resolution**
  - **Validates: Requirements 9.1**
  - **Status**: Complete

- [x]* 9.2 Write property test for breaking change detection
  - **Property 14: Breaking change detection**
  - **Validates: Requirements 4.1**
  - **Status**: Complete

- [x]* 9.3 Write property test for non-breaking version activation
  - **Property 15: Non-breaking version activation**
  - **Validates: Requirements 4.2**
  - **Status**: Complete

- [x]* 9.4 Write property test for multi-version routing
  - **Property 16: Multi-version routing**
  - **Validates: Requirements 4.3**
  - **Status**: Complete

- [x]* 9.5 Write property test for manifest caching
  - **Property 36: Manifest caching**
  - **Validates: Requirements 9.5**
  - **Status**: Complete

- [x]* 9.6 Write property test for rate limit enforcement
  - **Property 34: Rate limit enforcement**
  - **Validates: Requirements 9.2**
  - **Status**: Complete

- [x]* 9.7 Write property test for authentication enforcement
  - **Property 35: Authentication enforcement**
  - **Validates: Requirements 9.3**
  - **Status**: Complete

- [x]* 9.8 Write property test for unhealthy version routing
  - **Property 7: Unhealthy version routing**
  - **Validates: Requirements 2.3**
  - **Status**: Complete

- [x] 10. Implement Module Manifest and capability system
  - Create Module Manifest structure
  - Add capability declaration and validation
  - Implement capability enforcement in Global Context
  - Add network access configuration
  - Create module method definitions with input/output types
  - _Requirements: 5.3, 12.1, 12.2_
  - **Status**: ✅ Complete - Module Manifest and capability system fully implemented

- [x]* 10.1 Write property test for module capability declaration
  - **Property 40: Module capability declaration**
  - **Validates: Requirements 12.1**
  - **Status**: Complete

- [x]* 10.2 Write property test for capability enforcement
  - **Property 19: Capability enforcement**
  - **Validates: Requirements 5.3, 12.2**
  - **Status**: Complete

- [x] 11. Implement Module RPC adapters









  - Create ModuleClient interface with typed stubs
  - Implement automatic serialization and deserialization
  - Add retry logic with exponential backoff
  - Implement connection pooling
  - Add timeout handling
  - _Requirements: 1.4, 5.2_

- [x]* 11.1 Write property test for module client type safety
  - **Property 4: Module client type safety**
  - **Validates: Requirements 1.4**
  - **Status**: Complete

- [x]* 11.2 Write property test for RPC serialization
  - **Property 18: Module RPC serialization**
  - **Validates: Requirements 5.2**
  - **Status**: Complete

- [x] 12. Implement Ingress component





  - Create Ingress class to receive HTTP requests
  - Implement authentication (JWT, API keys, OAuth)
  - Add header normalization
  - Implement request ID generation with metadata
  - Add request descriptor publishing to routing fabric
  - _Requirements: 1.3_

- [x]* 12.1 Write property test for request ID uniqueness
  - **Property 3: Request ID uniqueness**
  - **Validates: Requirements 1.3**
  - **Status**: Complete

- [x] 13. Implement transformer execution for version compatibility





  - Add transformer registry to Route Manager
  - Implement transformer execution for old-version requests
  - Add transformer chaining for multi-step transformations
  - Integrate with Timescape to fetch transformers
  - _Requirements: 4.4_

- [x]* 13.1 Write property test for transformer execution
  - **Property 17: Transformer execution**
  - **Validates: Requirements 4.4**
  - **Status**: Complete

- [x] 14. Implement Pub/Sub Queue Fabric





  - Create Queue Fabric interface
  - Implement topic-based publish/subscribe
  - Add backpressure enforcement
  - Implement at-least-once and exactly-once delivery semantics
  - Add result delivery to originating request contexts
  - _Requirements: 13.3_

- [x]* 14.1 Write property test for backpressure propagation
  - **Property 43: Backpressure propagation**
  - **Validates: Requirements 13.3**
  - **Status**: Complete

- [x]* 14.2 Write property test for event publishing scope
  - **Property 26: Event publishing scope**
  - **Validates: Requirements 7.4**
  - **Status**: Complete

- [x]* 14.3 Write property test for global pub/sub delivery
  - **Property 31: Global pub/sub delivery**
  - **Validates: Requirements 8.4**
  - **Status**: Complete

- [x] 15. Implement Manifest & Schema Store
  - Create Manifest Store interface
  - Implement manifest persistence (handlers and modules)
  - Add GType schema storage and retrieval
  - Implement version graph storage
  - Add transformer stub storage
  - Implement Timescape metadata persistence
  - _Requirements: 11.5_
  - **Status**: ✅ Complete - Implemented in packages/runtime/src/manifest-store.ts

- [x]* 15.1 Write property test for manifest store persistence
  - **Property 39: Manifest store persistence**
  - **Validates: Requirements 11.5**
  - **Status**: ✅ Complete - Comprehensive property tests with 100+ iterations

- [x] 16. Implement Secrets Manager
  - Create SecretManager interface
  - Implement secure secret retrieval
  - Add short-lived caching with TTL
  - Ensure secrets are not directly accessible to handlers
  - _Requirements: 8.2, 12.4_
  - **Status**: ✅ Complete - Implemented with comprehensive tests and documentation

- [x]* 16.1 Write property test for secrets caching
  - **Property 29: Secrets caching**
  - **Validates: Requirements 8.2**
  - **Status**: ✅ Complete - 6 property tests with TTL validation

- [x]* 16.2 Write property test for secrets manager access control
  - **Property 41: Secrets manager access control**
  - **Validates: Requirements 12.4**
  - **Status**: ✅ Complete - 7 property tests with audit logging validation

- [x] 17. Implement Metrics and Observability integration
  - Create MetricsClient with OpenTelemetry integration
  - Implement counter, gauge, and histogram methods
  - Add tracing with request ID, handler ID, and version in spans
  - Implement structured logging with request context
  - _Requirements: 6.5, 8.3, 12.5_
  - **Status**: ✅ Complete - Implemented RuntimeMetricsClient with comprehensive tests

- [x]* 17.1 Write property test for metrics emission
  - **Property 30: Metrics emission**
  - **Validates: Requirements 8.3**
  - **Status**: ✅ Complete - 3 property tests with 150 runs total

- [x]* 17.2 Write property test for tracing metadata
  - **Property 22: Tracing metadata**
  - **Validates: Requirements 6.5**
  - **Status**: ✅ Complete - 3 property tests with 70 runs total

- [x]* 17.3 Write property test for audit logging completeness
  - **Property 42: Audit logging completeness**
  - **Validates: Requirements 12.5**
  - **Status**: ✅ Complete - 4 property tests with 140 runs total

- [x] 18. Implement Codegen for validators and SDK stubs
  - Create validator function generator from GType schemas
  - Implement TypeScript type definition generator from manifests
  - Add SDK client stub generator for handlers
  - Generate manifest bundles for operator deployment
  - Add CLI commands with watch mode
  - _Requirements: 1.5, 3.5, 11.2, 11.3_
  - **Status**: ✅ Complete - All generators, orchestrator, property tests, and CLI integration

- [x]* 18.1 Write property test for TypeScript definition generation
  - **Property 5: TypeScript definition generation**
  - **Validates: Requirements 1.5**
  - **Status**: ✅ Complete - 114 test cases passing

- [x]* 18.2 Write property test for SDK client stub generation
  - **Property 38: SDK client stub generation**
  - **Validates: Requirements 11.3**
  - **Status**: ✅ Complete - 115 test cases passing

- [x] 19. Implement Handler Worker execution engine
  - Create HandlerWorker class
  - Implement handler invocation with (req, res, lctx, gctx) signature
  - Add health check endpoint
  - Ensure stateless execution
  - _Requirements: 1.1_
  - **Status**: ✅ Complete - Implemented in packages/runtime/src/handler-worker.ts

- [x]* 19.1 Write property test for handler signature conformance
  - **Property 1: Handler signature conformance**
  - **Validates: Requirements 1.1**
  - **Status**: ✅ Complete - 2 property tests with 150 runs total, 20 unit tests, 2 integration tests

- [x] 20. Implement Playground request inspection
  - Create Playground API for request trace inspection
  - Implement request path visualization (ingress → RM → LCC → handler → modules)
  - Add snapshot viewing and comparison
  - Implement debug gate functionality to pause execution
  - _Requirements: 15.2, 15.3_
  - **Status**: ✅ Complete - All components, tests, and documentation (103 tests passing)

- [ ]* 20.1 Write property test for request replay execution
  - **Property 45: Request replay execution**
  - **Validates: Requirements 15.2, 15.5**

- [ ]* 20.2 Write property test for version diff computation
  - **Property 46: Version diff computation**
  - **Validates: Requirements 15.3**

- [ ]* 20.3 Write property test for snapshot storage
  - **Property 44: Snapshot storage**
  - **Validates: Requirements 15.1**

- [x] 21. Implement hook manifest recording
  - Add hook definition recording to manifest generation
  - Store hook metadata (sync/async, timeout, retries)
  - Enable playback in Playground
  - _Requirements: 10.4_
  - **Status**: ✅ Complete - Hook extraction, storage, playback, and documentation

- [x]* 21.1 Write property test for hook manifest recording
  - **Property 37: Hook manifest recording**
  - **Validates: Requirements 10.4**
  - **Status**: ✅ Complete - 100 iterations validating completeness

- [ ] 22. Create testing harness (@gati/testing)
  - Implement createTestHarness function
  - Add fake LocalContext and GlobalContext implementations
  - Create module mock utilities
  - Add helper functions for handler testing
  - _Requirements: 14.2_
  - **Estimated Time**: 3 hours 25 minutes
  - **Plan**: See `.kiro/specs/runtime-architecture/task-22-testing-harness-plan.md`

- [x] 22.1 Package setup and configuration
  - Create packages/testing/ directory structure
  - Create package.json with dependencies (@gati-framework/runtime, @gati-framework/core as peers)
  - Create tsconfig.json and tsconfig.build.json
  - Create initial README.md and src/index.ts
  - _Estimated: 15 minutes_
  - _Dependencies: None_
  - **Status**: ✅ Complete - Package structure created, builds successfully

- [x] 22.2 Implement createTestHarness core function
  - Define TestHarness interface with executeHandler, getLocalContext, getGlobalContext, cleanup methods
  - Implement createTestHarness function using real LocalContext and GlobalContext
  - Add ExecuteOptions interface for request, modules, config customization
  - Implement TestResult interface with response, lctx, error, events
  - Add lifecycle event capture functionality
  - Implement cleanup method for resource management
  - _Estimated: 30 minutes_
  - _Dependencies: 22.1_
  - **Status**: ✅ Complete - Core test harness implemented with minimal code

- [x] 22.3 Implement Fake LocalContext builder
  - Create FakeLocalContextBuilder class with fluent API
  - Implement withRequestId, withTraceId, withClientId, withState, withMetadata methods
  - Create createFakeLocalContext helper function
  - Provide test-friendly defaults (predictable IDs, no-op functions)
  - Add sensible defaults for test scenarios
  - _Estimated: 20 minutes_
  - _Dependencies: 22.1_
  - **Status**: ✅ Complete - Builder pattern with 5 methods, helper function with defaults

- [x] 22.4 Implement Fake GlobalContext builder
  - Create FakeGlobalContextBuilder class with fluent API
  - Implement withModule, withConfig, withInstanceId, withRegion methods
  - Create createFakeGlobalContext helper function
  - Wrap real createGlobalContext with test-friendly defaults
  - Add easy module registration for tests
  - _Estimated: 20 minutes_
  - _Dependencies: 22.1_
  - **Status**: ✅ Complete - Builder pattern with 4 methods, uses real createGlobalContext

- [x] 22.5 Implement module mock utilities
  - Create createMockModule function with spy functionality
  - Implement MockModule interface with module, calls, reset properties
  - Create createStubModule function for predefined return values
  - Add call tracking for method invocations (args, result, error, timestamp)
  - Support async methods in mocks
  - Implement reset functionality to clear call history
  - _Estimated: 25 minutes_
  - _Dependencies: 22.1_
  - **Status**: ✅ Complete - Mock and stub utilities with call tracking

- [x] 22.6 Implement helper functions
  - Create createTestRequest function with sensible defaults
  - Create createTestResponse function
  - Implement testHandler convenience function for minimal setup
  - Add assertStatus helper for response status assertions
  - Add assertBody helper for response body assertions
  - Ensure type safety across all helpers
  - _Estimated: 20 minutes_
  - _Dependencies: 22.2, 22.3, 22.4_
  - **Status**: ✅ Complete - 5 helper functions for simplified testing

- [x] 22.7 Write comprehensive documentation
  - Write installation instructions in README.md
  - Create quick start guide with basic example
  - Document API reference for all exported functions and classes
  - Add usage examples: basic handler test, testing with modules, error scenarios
  - Document best practices for handler testing
  - _Estimated: 15 minutes_
  - _Dependencies: 22.2-22.6_
  - **Status**: ✅ Complete - Full README with API docs, examples, and best practices

- [ ] 22.8 Write unit tests for testing harness
  - Test createTestHarness with defaults and custom options
  - Test executeHandler success and error scenarios
  - Test lifecycle event capture
  - Test context access (getLocalContext, getGlobalContext)
  - Test cleanup functionality
  - Test FakeLocalContextBuilder and FakeGlobalContextBuilder
  - Test module mock utilities (createMockModule, createStubModule)
  - Test helper functions (createTestRequest, createTestResponse, testHandler)
  - Test isolation between test executions
  - _Estimated: 30 minutes_
  - _Dependencies: 22.2-22.6_

- [ ] 22.9 Write integration tests
  - Test handler with database module mock
  - Test handler with before/after hooks
  - Test handler error handling with catch hooks
  - Test concurrent handler executions
  - Test state isolation between tests
  - Test real-world scenarios (CRUD operations, authentication, validation)
  - _Estimated: 20 minutes_
  - _Dependencies: 22.8_

- [ ] 22.10 Finalize package and exports
  - Update src/index.ts with all public exports
  - Configure TypeScript build (tsconfig.build.json)
  - Build package and verify output
  - Test imports work correctly from external packages
  - Update root README if needed with testing package reference
  - _Estimated: 10 minutes_
  - _Dependencies: 22.9_

- [ ] 23. Create runtime simulation package (@gati/simulate)
  - Implement simulateRuntime function
  - Add in-process Route Manager emulation
  - Add LCC hook emulation
  - Add module RPC emulation
  - _Requirements: 14.3_

- [ ] 24. Implement Operator for Kubernetes deployment
  - Create Kubernetes Operator for handler deployment
  - Implement module deployment
  - Add handler and module scaling logic
  - Implement Timescape rollout orchestration
  - Add version decommissioning after traffic drains
  - _Requirements: 4.5_

- [ ] 25. Create end-to-end integration
  - Wire Ingress to Route Manager via Queue Fabric
  - Connect Route Manager to LCC
  - Integrate LCC with Handler Workers
  - Connect Handler Workers to Module Processes
  - Add observability throughout the pipeline
  - _Requirements: 1.3_

- [ ] 26. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests (minimum 100 iterations each)
  - Run integration tests
  - Run runtime simulation tests
  - Ensure all tests pass, ask the user if questions arise

- [ ] 27. Create example handlers and modules
  - Create example user creation handler
  - Create example database module
  - Create example email notification module
  - Add example with hooks and transformers
  - Document example usage patterns
  - _Requirements: 1.1, 1.2_

- [ ] 28. Write documentation
  - Document handler development guide
  - Document module development guide
  - Document manifest format
  - Document GType schema format
  - Document testing strategies
  - Document deployment guide
  - _Requirements: All_

- [ ] 29. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
