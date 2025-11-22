# Requirements Document

## Introduction

The Gati Runtime & Context Architecture provides a comprehensive framework for executing handlers with isolated, version-aware, and observable request processing. The system enables developers to write minimal code while the platform automates routing, lifecycle management, context orchestration, and multi-version deployments through Timescape. The architecture supports polyglot modules, type-driven validation, and full lifecycle tracing for debugging and observability.

## Glossary

- **Gati Runtime**: The execution environment that orchestrates request processing, handler invocation, and lifecycle management
- **Handler**: A stateless function that processes requests with signature `(req, res, lctx, gctx) => Promise<void> | void`
- **Local Context (lctx)**: Per-request ephemeral state and lifecycle hooks controller
- **Global Context (gctx)**: Shared runtime services including modules, secrets, metrics, and configuration
- **Route Manager (RM)**: Component responsible for path-to-handler version resolution and routing
- **Local Context Controller (LCC)**: The orchestrator that executes lifecycle hooks and manages per-request state
- **Timescape**: Version management system that handles multiple concurrent handler versions and transformers
- **GType**: Runtime type schema generated from TypeScript types for validation
- **Module**: Polyglot service (Node/WASM/OCI) that provides capabilities like database access, AI models, or caches
- **Manifest**: Auto-generated metadata describing handler paths, types, hooks, policies, and version fingerprints
- **Ingress**: Entry point that receives external requests and enriches them with metadata
- **Playground**: Web UI for inspecting request lifecycle, debugging, and simulating traffic
- **Hook**: Lifecycle function executed before, after, or on error during request processing

## Requirements

### Requirement 1

**User Story:** As a developer, I want to write minimal handler code with automatic platform orchestration, so that I can focus on business logic without managing infrastructure concerns.

#### Acceptance Criteria

1. WHEN a developer creates a handler function THEN the Gati Runtime SHALL accept handlers with signature `(req, res, lctx, gctx) => Promise<void> | void`
2. WHEN a handler is deployed THEN the Gati Runtime SHALL automatically generate manifests including handler ID, path, methods, GType references, and hook definitions
3. WHEN a request arrives THEN the Gati Runtime SHALL automatically assign a request ID, resolve the handler version, and orchestrate the complete lifecycle
4. WHEN a developer accesses modules THEN the Global Context SHALL provide typed client stubs with automatic serialization and connection pooling
5. THE Gati Runtime SHALL generate TypeScript type definitions from handler manifests for compile-time safety

### Requirement 2

**User Story:** As a platform operator, I want fault-isolated handler and module execution with safe restarts, so that failures in one component do not cascade to others.

#### Acceptance Criteria

1. WHEN a handler throws an exception THEN the Local Context Controller SHALL execute registered catch hooks and isolate the failure to that request
2. WHEN a module process crashes THEN the Gati Runtime SHALL restart the module without affecting other modules or active handlers
3. WHEN a handler version fails health checks THEN the Route Manager SHALL route traffic to healthy versions and decommission the failing version
4. THE Gati Runtime SHALL execute handlers in stateless processes to enable horizontal scaling and independent restarts
5. WHEN a handler times out THEN the Local Context Controller SHALL cancel the request gracefully and execute cleanup hooks

### Requirement 3

**User Story:** As a developer, I want TypeScript types to automatically generate runtime validators, so that I have type safety from development through production.

#### Acceptance Criteria

1. WHEN a developer defines TypeScript request and response types THEN the Analyzer SHALL extract types and generate GType schemas
2. WHEN a request arrives THEN the Local Context Controller SHALL validate the request body against the GType schema in the before phase
3. WHEN a handler returns a response THEN the Local Context Controller SHALL validate the response against the GType schema in the after phase
4. WHEN validation fails THEN the Gati Runtime SHALL reject the request with structured diagnostic information
5. THE Gati Runtime SHALL generate validator functions at build time from GType schemas

### Requirement 4

**User Story:** As a platform operator, I want to deploy multiple concurrent handler versions with automatic routing, so that I can perform zero-downtime deployments and gradual rollouts.

#### Acceptance Criteria

1. WHEN a new handler manifest is deployed THEN the Route Manager SHALL determine if the version is breaking via GType diff analysis
2. WHEN a non-breaking version is deployed THEN the Route Manager SHALL activate the new version and route traffic based on configuration
3. WHEN a breaking version is deployed without transformers THEN the Route Manager SHALL maintain both old and new versions and route based on request version headers
4. WHEN transformers are present THEN the Route Manager SHALL route to the new version and execute inbound transformers for old-version requests
5. WHEN traffic drains from an old version THEN the Operator SHALL decommission the old handler instances automatically

### Requirement 5

**User Story:** As a developer, I want to use polyglot modules for different capabilities, so that I can choose the best runtime for each service.

#### Acceptance Criteria

1. WHEN a module is registered THEN the Gati Runtime SHALL support Node, WASM, OCI container, and binary executable runtimes
2. WHEN a handler calls a module THEN the Global Context SHALL provide RPC adapters with automatic serialization and retry logic
3. WHEN a module declares capabilities THEN the Global Context SHALL enforce capability restrictions and prevent unauthorized access
4. THE Gati Runtime SHALL isolate untrusted modules in WASM sandboxes or sidecar containers
5. WHEN a module is updated THEN the Gati Runtime SHALL reload the module without restarting handlers

### Requirement 6

**User Story:** As a developer, I want full lifecycle tracing and debugging capabilities, so that I can understand request flow and diagnose issues quickly.

#### Acceptance Criteria

1. WHEN a request is processed THEN the Local Context Controller SHALL emit structured events for each lifecycle stage including hook start, hook end, hook error, handler start, and handler end
2. WHEN a developer uses Playground THEN the system SHALL display the complete request path from ingress through route manager to handlers and modules
3. WHEN a developer creates a snapshot THEN the Local Context SHALL serialize lctx state, outstanding promises, and last hook index for time-travel debugging
4. WHEN a developer sets a debug gate THEN the Playground SHALL pause execution before or after hooks and allow state mutation before resuming
5. THE Gati Runtime SHALL integrate with OpenTelemetry for distributed tracing with request ID, handler ID, and version in all spans

### Requirement 7

**User Story:** As a developer, I want to manage per-request state and lifecycle hooks through Local Context, so that I can control request-specific behavior without global side effects.

#### Acceptance Criteria

1. WHEN a handler accesses Local Context THEN the system SHALL provide get, set, delete, and clean operations for ephemeral key-value storage
2. WHEN a developer registers hooks THEN the Local Context SHALL support before, after, and catch hook registration with sync or async execution
3. WHEN hooks are executed THEN the Local Context Controller SHALL run them in registration order for before hooks and reverse order for after and catch hooks
4. WHEN a handler publishes an event THEN the Local Context SHALL publish to request-scoped topics for local listeners
5. THE Local Context SHALL provide request metadata including request ID, path, version, and flags

### Requirement 8

**User Story:** As a developer, I want to access shared runtime services through Global Context, so that I can use databases, caches, secrets, and metrics without managing connections.

#### Acceptance Criteria

1. WHEN a handler accesses Global Context THEN the system SHALL provide a module registry with typed client stubs for all registered modules
2. WHEN a handler retrieves secrets THEN the Global Context SHALL provide a secrets manager with secure retrieval and short-lived caching
3. WHEN a handler emits metrics THEN the Global Context SHALL provide a metrics client with OpenTelemetry integration
4. WHEN a handler publishes to global topics THEN the Global Context SHALL provide pub/sub capabilities across all requests
5. THE Global Context SHALL provide read-only access to application configuration and Timescape client for version queries

### Requirement 9

**User Story:** As a platform operator, I want automatic request routing with version resolution and policy enforcement, so that requests reach the correct handler version with appropriate rate limiting and authentication.

#### Acceptance Criteria

1. WHEN a request arrives at the Route Manager THEN the system SHALL resolve the handler version using Timescape based on path and version preference
2. WHEN a handler has rate limit policies THEN the Route Manager SHALL enforce rate limits per handler manifest configuration
3. WHEN a handler requires authentication THEN the Route Manager SHALL verify required roles before routing the request
4. WHEN a handler version is warming up THEN the Route Manager SHALL maintain a warm pool for critical or pinned versions to avoid cold starts
5. THE Route Manager SHALL maintain a local cache of manifests, GTypes, and handler version health status

### Requirement 10

**User Story:** As a developer, I want declarative lifecycle hook registration with ordered execution, so that I can compose cross-cutting concerns like validation, authentication, and logging.

#### Acceptance Criteria

1. WHEN hooks are registered at different levels THEN the system SHALL execute global hooks, route-level hooks, and local hooks in that order
2. WHEN entering a request THEN the Local Context Controller SHALL execute before hooks in order: global, route-level, local, then handler, then after hooks in reverse order
3. WHEN an error occurs THEN the Local Context Controller SHALL execute catch hooks in reverse registration order
4. WHEN hooks are defined in manifests THEN the system SHALL record hook definitions to support playback in Playground
5. THE Local Context Controller SHALL support both synchronous and asynchronous hook execution with timeout and retry configuration

### Requirement 11

**User Story:** As a developer, I want automatic manifest generation with GType schemas, so that I have consistent API contracts and validation without manual configuration.

#### Acceptance Criteria

1. WHEN a handler is analyzed THEN the Analyzer SHALL generate a manifest containing handler ID, path, methods, GType references, hook definitions, security policies, Timescape fingerprint, and module dependencies
2. WHEN manifests are generated THEN the Codegen SHALL produce runtime validator functions from GType schemas
3. WHEN manifests are generated THEN the Codegen SHALL produce TypeScript SDK client stubs for type-safe API consumption
4. WHEN manifests are published THEN the Operator SHALL use manifest bundles to deploy handler versions
5. THE Manifest Store SHALL persist manifests, GTypes, version graphs, transformer stubs, and Timescape metadata

### Requirement 12

**User Story:** As a security engineer, I want least-privilege module execution with capability enforcement, so that modules cannot access unauthorized resources.

#### Acceptance Criteria

1. WHEN a module is registered THEN the module SHALL declare required capabilities in its manifest
2. WHEN a module attempts to access resources THEN the Global Context SHALL enforce declared capabilities and reject unauthorized access
3. WHEN a module requires network access THEN the system SHALL deny external egress by default unless explicitly allowed in the manifest
4. WHEN a handler retrieves secrets THEN the secrets SHALL be delivered via the secrets manager with short TTLs and not directly accessible to handlers
5. THE Gati Runtime SHALL log every handler execution with request ID, version, handler manifest hash, and Local Context Controller lifecycle events for audit trails

### Requirement 13

**User Story:** As a platform operator, I want horizontal scaling with backpressure management, so that the system handles load gracefully without cascading failures.

#### Acceptance Criteria

1. WHEN load increases THEN the Operator SHALL scale stateless handler processes horizontally based on metrics
2. WHEN modules require scaling THEN the Operator SHALL scale module processes independently from handlers
3. WHEN the queue fabric reaches capacity THEN the system SHALL enforce backpressure and propagate timeouts to the Local Context Controller for graceful cancellation
4. WHEN handler versions have low usage THEN the Route Manager SHALL track cold usage and Timescape SHALL auto-decommission drained versions
5. THE Gati Runtime SHALL maintain warm pools for critical handler versions to minimize cold start latency

### Requirement 14

**User Story:** As a developer, I want to test handlers with different strategies, so that I can verify correctness from unit tests through end-to-end scenarios.

#### Acceptance Criteria

1. WHEN writing unit tests THEN the developer SHALL test pure business logic functions without runtime dependencies
2. WHEN writing integration tests THEN the developer SHALL use the testing harness to run handlers with fake Global Context and Local Context
3. WHEN writing runtime simulation tests THEN the developer SHALL use the simulate package to emulate Route Manager, Local Context Controller hooks, and module RPCs in-process
4. WHEN writing end-to-end tests THEN the developer SHALL run a local Kubernetes cluster with the Operator to test Timescape behaviors
5. WHEN validating API contracts THEN the developer SHALL use contract tests to validate GType compatibility between handler and module manifests

### Requirement 15

**User Story:** As a developer, I want request replay capabilities with stored snapshots, so that I can test handler versions against historical requests.

#### Acceptance Criteria

1. WHEN a request is processed THEN the Local Context Controller SHALL optionally store a snapshot of the request, lctx state, and lifecycle events
2. WHEN a developer replays a request THEN the Playground SHALL execute the stored request against a specified handler version
3. WHEN comparing versions THEN the Playground SHALL show diffs between handler responses and lifecycle traces across versions
4. WHEN debugging THEN the developer SHALL restore a snapshot to recreate the exact request state at any lifecycle point
5. THE Playground SHALL support replaying requests against older or newer handler versions for Timescape testing


