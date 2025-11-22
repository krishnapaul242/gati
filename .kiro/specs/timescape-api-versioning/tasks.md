# Timescape API Versioning - Implementation Tasks

## Phase 1: Core Infrastructure

### Task 1.1: Enhance Version Registry ✅ COMPLETE
**Covers:** AC-1 (Automatic Version Creation), AC-6 (Semantic Version Tagging), CP-1 (Version Registry)

**Subtasks:**
- [x] Extend existing `packages/runtime/src/timescape/registry.ts`
- [x] Implement `VersionTimeline` data structure
- [x] Add binary search for timestamp lookups
- [x] Implement semantic version tag system
- [x] Add `tagVersion()` and `getVersionByTag()` methods
- [ ] Implement Consul synchronization (deferred to Phase 4)
- [x] Add disk persistence layer (serialize/deserialize)
- [x] Write unit tests for registry operations and tagging (34 tests passing)

**Files modified:**
- `packages/runtime/src/timescape/registry.ts` - Enhanced with 15+ new methods
- `packages/runtime/src/timescape/types.ts` - Added VersionTimeline, VersionInfo, VersionTag types

**Files created:**
- `packages/runtime/src/timescape/registry.test.ts` - 34 comprehensive tests

**Actual effort:** 1 day (completed 2025-11-21)

---

### Task 1.2: Complete Diff Engine ✅ COMPLETE
**Covers:** AC-3 (Schema Diffing), CP-2 (Diff Engine)

**Subtasks:**
- [x] Enhance `packages/runtime/src/timescape/diff-engine.ts`
- [x] Implement `compareFields()` for nested comparison
- [x] Add breaking change classification logic
- [x] Implement diff caching by schema hash
- [x] Generate human-readable diff reports
- [x] Write unit tests with various schema combinations (32 tests passing)

**Files modified:**
- `packages/runtime/src/timescape/diff-engine.ts` - Complete schema comparison engine

**Files created:**
- `packages/runtime/src/timescape/diff-engine.test.ts` - 32 comprehensive tests

**Actual effort:** 1 day (completed 2025-11-21)

---

### Task 1.3: Implement Snapshot Manager ✅ COMPLETE
**Covers:** CP-4 (Snapshot Manager)

**Subtasks:**
- [x] Complete `packages/runtime/src/timescape/snapshot-manager.ts`
- [x] Implement light snapshot creation
- [x] Implement heavy snapshot creation
- [x] Add snapshot compression (gzip)
- [x] Implement snapshot restoration
- [x] Add pruning logic for old snapshots
- [x] Write tests for snapshot lifecycle (31/31 tests passing)
- [x] Fix Windows filename compatibility (colons → underscores)

**Files modified:**
- `packages/runtime/src/timescape/snapshot-manager.ts` - Complete implementation with compression, pruning, import/export, Windows compatibility

**Files created:**
- `packages/runtime/src/timescape/snapshot-manager.test.ts` - 31 comprehensive tests (100% passing)

**Features implemented:**
- Light and heavy snapshots
- Gzip compression
- Automatic snapshot creation based on intervals
- Snapshot restoration
- Pruning old snapshots
- Import/export functionality
- Statistics and metadata
- Artifact management
- Cross-platform filename compatibility

**Actual effort:** 1 day (completed 2025-11-21)

**Bug fixed:** Windows doesn't allow colons in filenames. Solution: Replace colons with underscores when saving, convert back when listing.

---

## Phase 2: Transformer System

### Task 2.1: Create Transformer Interface ✅ COMPLETE
**Covers:** AC-4 (Automatic Transformer Generation), CP-3 (Transformer Chain)

**Subtasks:**
- [x] Create `packages/runtime/src/timescape/transformer.ts`
- [x] Define `TransformerPair` interface (forward + backward)
- [x] Implement immutability enforcement
- [x] Implement transformer registration (adjacent versions only)
- [x] Add transformer validation
- [x] Create linear chain executor (no circular dependencies)
- [x] Implement error handling and fallback
- [x] Write unit tests for transformer execution (27/27 tests passing)

**Files created:**
- `packages/runtime/src/timescape/transformer.ts` - Complete transformer engine with chain execution
- `packages/runtime/src/timescape/transformer.test.ts` - 27 comprehensive tests

**Files modified:**
- `packages/runtime/src/timescape/types.ts` - Added transformer type exports

**Features implemented:**
- Immutable transformer pairs
- Bidirectional transformations (forward + backward)
- Linear chain building (sorted by timestamp)
- Request and response transformation
- Async transformer support
- Timeout handling
- Error fallback mechanism
- Max chain length enforcement

**Actual effort:** 1 day (completed 2025-11-21)

---

### Task 2.2: Auto-Generate Transformer Stubs ✅ COMPLETE
**Covers:** AC-4 (Automatic Transformer Generation)

**Subtasks:**
- [x] Create `packages/cli/src/codegen/transformer-generator.ts`
- [x] Generate TypeScript `TransformerPair` from diff
- [x] Add type signatures for adjacent versions only
- [x] Insert TODO comments for manual logic
- [x] Generate both forward and backward transforms
- [x] Mark generated transformers as immutable
- [ ] Integrate with CLI `generate` command (deferred - can be done when needed)
- [x] Write tests for code generation (21/21 tests passing)

**Files created:**
- `packages/cli/src/codegen/transformer-generator.ts` - Complete code generation engine
- `packages/cli/src/codegen/transformer-generator.test.ts` - 21 comprehensive tests

**Features implemented:**
- Generate transformer pairs from schema diffs
- TODO comments for breaking changes
- Forward and backward transformation stubs
- Request and response transformers
- Multiple transformer generation
- Index file generation
- Immutability markers and warnings
- Type imports and exports

**Actual effort:** 1 day (completed 2025-11-21)

---

## Phase 3: Request Routing

### Task 3.1: Implement Version Resolution ✅ COMPLETE
**Covers:** AC-2 (Flexible Version Routing), AC-6 (Semantic Version Tagging), CP-5 (Request Router)

**Subtasks:**
- [x] Enhance `packages/runtime/src/timescape/resolver.ts`
- [x] Implement version extraction from query params
- [x] Implement version extraction from headers
- [x] Add timestamp parsing and validation
- [x] Add semantic version tag resolution
- [x] Implement version caching per request
- [x] Support direct TSV format
- [x] Write unit tests for all resolution formats

**Files modified:**
- `packages/runtime/src/timescape/resolver.ts` - Complete version resolution engine

**Files created:**
- `packages/runtime/src/timescape/resolver.test.ts` - Comprehensive test suite

**Features implemented:**
- Query parameter extraction (version, v)
- Header extraction (x-gati-version, x-api-version)
- Timestamp parsing (ISO 8601, Unix seconds, Unix milliseconds)
- Semantic version tag resolution
- Direct TSV format support
- Version caching with LRU eviction
- Comprehensive error handling

**Actual effort:** 1 day (completed 2025-11-21)

---

### Task 3.2: Integrate with Router ✅ COMPLETE
**Covers:** AC-2 (Flexible Version Routing)

**Subtasks:**
- [x] Create integration layer for version resolution
- [x] Add request transformation before handler execution
- [x] Apply linear transformer chain if needed
- [x] Handle version not found errors
- [x] Handle invalid tag errors
- [x] Add metrics for version routing
- [x] Write integration tests

**Files created:**
- `packages/runtime/src/timescape/integration.ts` - Complete integration layer
- `packages/runtime/src/timescape/integration.test.ts` - 15 comprehensive test suites

**Features implemented:**
- Version resolution from query/headers
- Automatic request transformation (client version → handler version)
- Automatic response transformation (handler version → client version)
- Transformer chain execution with timeout
- Metrics recording for version requests and transformations
- Error handling for invalid versions and transformation failures
- Metadata attachment to local context
- Configurable integration (enable/disable transformers, timeouts, etc.)

**Integration points:**
- Works with VersionResolver for version resolution
- Works with TransformerEngine for bidirectional transformations
- Works with TimescapeMetrics for observability
- Attaches metadata to LocalContext for handler access

**Actual effort:** 1 day (completed 2025-11-22)

**Estimated effort:** 4 days

---

## Phase 4: Lifecycle Management

### Task 4.1: Version Usage Tracking ✅ COMPLETE
**Covers:** AC-5 (Version Lifecycle Management)

**Subtasks:**
- [x] Add request counter per version
- [x] Track last accessed timestamp
- [x] Implement hot/warm/cold classification
- [x] Add metrics export (Prometheus)
- [x] Write tests for tracking logic

**Files modified:**
- `packages/runtime/src/timescape/registry.ts` - Added classification logic with configurable thresholds
- `packages/runtime/src/timescape/metrics.ts` - Created Prometheus metrics integration

**Files created:**
- `packages/runtime/src/timescape/metrics.test.ts` - 9 comprehensive tests for metrics
- Added 8 new test suites to `packages/runtime/src/timescape/registry.test.ts` for classification

**Features implemented:**
- Hot/warm/cold classification based on request count and recency
- Configurable thresholds (hotThresholdRequests, warmThresholdRequests, coldThresholdMs, classificationWindowMs)
- Request estimation with decay over time
- Reclassification API for background jobs
- Usage statistics per handler and globally
- Prometheus metrics for version requests, transformer execution, and status gauges
- Periodic metrics updates

**Actual effort:** 1 day (completed 2025-11-21)

**Design decisions:**
- Classification uses heuristic-based estimation since we don't track individual request timestamps
- Recency factor decays linearly within the classification window
- Metrics update can be triggered manually or periodically
- Configuration can be updated at runtime with automatic reclassification

**Estimated effort:** 2 days

---

### Task 4.2: Auto-Deactivation System ✅ COMPLETE
**Covers:** AC-5 (Version Lifecycle Management)

**Subtasks:**
- [x] Create background job for version monitoring
- [x] Implement cold version detection
- [x] Add auto-deactivation logic
- [x] Implement manual override mechanism
- [x] Add configuration options
- [x] Write tests for lifecycle transitions

**Files created:**
- `packages/runtime/src/timescape/lifecycle.ts` - Complete lifecycle management system
- `packages/runtime/src/timescape/lifecycle.test.ts` - 23 comprehensive test suites

**Features implemented:**
- Background job with configurable check interval
- Cold version detection based on inactivity threshold
- Low usage detection based on minimum request count
- Manual override system (keep/deactivate)
- Protected tags to prevent deactivation (stable, production, latest)
- Excluded handlers configuration
- Dry run mode for testing
- Deactivation history tracking
- Reactivation capability
- Callback system for deactivation events
- Statistics and monitoring
- Eligible versions query

**Configuration options:**
- `enabled`: Enable/disable auto-deactivation
- `checkIntervalMs`: Interval for checking version status
- `coldThresholdMs`: Time since last access to consider cold
- `minRequestCount`: Minimum requests to prevent deactivation
- `protectedTags`: Tags that prevent deactivation
- `excludedHandlers`: Handlers to exclude from auto-deactivation
- `onDeactivate`: Callback when version is deactivated
- `dryRun`: Log but don't deactivate

**Actual effort:** 1 day (completed 2025-11-21)

**Design decisions:**
- Lifecycle manager is separate from registry for separation of concerns
- Manual overrides take precedence over automatic rules
- Protected tags prevent deactivation regardless of usage
- Deactivation history is kept for auditing
- Dry run mode allows testing without side effects
- Reactivation removes manual overrides to allow normal lifecycle

**Estimated effort:** 3 days

---

## Phase 5: Database Schema Versioning

### Task 5.1: DB Schema Integration ✅ COMPLETE
**Covers:** AC-7 (Database Schema Versioning)

**Subtasks:**
- [x] Create `packages/runtime/src/timescape/db-schema.ts`
- [x] Add DB schema version to TSV metadata
- [x] Implement migration runner
- [x] Implement rollback runner
- [x] Track schema changes in version registry
- [x] Support shared schemas across versions
- [x] Write tests for migration execution (19 test suites passing)

**Files created:**
- `packages/runtime/src/timescape/db-schema.ts` - Complete schema management system
- `packages/runtime/src/timescape/db-schema.test.ts` - 19 comprehensive test suites
- `packages/runtime/src/timescape/phase5-example.ts` - Usage examples
- `packages/runtime/src/timescape/PHASE5_SUMMARY.md` - Complete documentation

**Files modified:**
- `packages/runtime/src/timescape/types.ts` - Already had DBSchemaMetadata
- `packages/runtime/src/timescape/registry.ts` - Already tracked dbSchemaVersion

**Features implemented:**
- Schema registration and tracking
- Migration execution with timeout protection
- Smart rollback (only if no other versions use schema)
- Schema usage tracking across TSVs
- Schema compatibility checking
- Callbacks for lifecycle events
- Statistics and monitoring
- Shared schemas across multiple versions

**Actual effort:** 1 day (completed 2025-11-22)

**Estimated effort:** 4 days

---

## Phase 6: CLI Integration

### Task 6.1: Version Management Commands ✅ COMPLETE
**Covers:** Developer experience, AC-6 (Tag Management)

**Subtasks:**
- [x] Add `gati timescape list` command
- [x] Add `gati timescape status <version>` command
- [x] Add `gati timescape deactivate <version>` command
- [x] Add `gati timescape tag <tsv> <label>` command
- [x] Add `gati timescape tags [tsv]` command
- [x] Add `gati timescape untag <label>` command
- [x] Write CLI tests

**Files modified:**
- `packages/cli/src/commands/timescape.ts` - Added 6 new commands (~400 lines)

**Files created:**
- `packages/cli/src/commands/timescape.test.ts` - Comprehensive test suite (200+ lines)

**Commands implemented:**
1. **`gati timescape list`** - List all versions with filtering
   - Options: `--handler`, `--status`, `--tags`
   - Shows status, timestamps, request counts, tags
   - Summary statistics

2. **`gati timescape status <version>`** - Show detailed version info
   - Supports TSV, tags, timestamps
   - Requires `--handler` for tags/timestamps
   - Shows all metadata

3. **`gati timescape deactivate <version>`** - Manually deactivate version
   - Supports TSV, tags, timestamps
   - Protected tag checking
   - Force option with `--force`

4. **`gati timescape tag <tsv> <label>`** - Create semantic version tag
   - Validates TSV format
   - Checks for duplicate tags
   - Option: `--created-by`

5. **`gati timescape tags [tsv]`** - List tags
   - Without TSV: List all tags
   - With TSV: List tags for specific version
   - Shows creation date and creator

6. **`gati timescape untag <label>`** - Remove a tag
   - Validates tag exists
   - Shows which TSV it was pointing to

**Actual effort:** 1 day (completed 2025-11-22)
**Estimated effort:** 2 days

---

### Task 6.2: Dev Server Integration ✅ COMPLETE
**Covers:** AC-1 (Automatic Version Creation)

**Subtasks:**
- [x] Create version detector module
- [x] Integrate with file watcher
- [x] Detect handler changes during hot reload
- [x] Trigger version creation automatically
- [x] Show version creation notifications
- [x] Detect breaking vs non-breaking changes
- [x] Write comprehensive tests

**Files created:**
- `packages/cli/src/analyzer/version-detector.ts` - Automatic version detection (~250 lines)
- `packages/cli/src/analyzer/version-detector.test.ts` - Test suite (15 test cases)

**Files modified:**
- `packages/cli/src/analyzer/file-watcher.ts` - Added version detection integration
- `packages/cli/src/commands/dev.ts` - Enabled versioning in dev server

**Features implemented:**
1. **Automatic Version Detection**
   - Extracts schema from handler code
   - Calculates schema hash for change detection
   - Creates new version when schema changes
   - Increments version numbers automatically

2. **Breaking Change Detection**
   - Compares schemas using DiffEngine
   - Identifies breaking vs non-breaking changes
   - Lists all changes with descriptions

3. **Version Notifications**
   - Color-coded console output
   - Shows old and new versions
   - Lists all detected changes
   - Suggests transformer generation for breaking changes

4. **Registry Integration**
   - Persists versions to disk
   - Loads existing registry on startup
   - Supports multiple handlers independently

**Actual effort:** 1 day (completed 2025-11-22)
**Estimated effort:** 3 days

---

## Phase 7: Testing & Documentation

### Task 7.1: Integration Tests
**Subtasks:**
- [ ] Create `tests/integration/timescape.test.ts`
- [ ] Test end-to-end version routing
- [ ] Test multi-hop transformer chains
- [ ] Test concurrent version access
- [ ] Test version lifecycle transitions
- [ ] Test error scenarios

**Files to create:**
- `tests/integration/timescape.test.ts`

**Estimated effort:** 4 days

---

### Task 6.2: Performance Tests
**Subtasks:**
- [ ] Create `tests/performance/timescape-bench.ts`
- [ ] Benchmark version routing overhead
- [ ] Benchmark transformer execution
- [ ] Benchmark registry lookup latency
- [ ] Test with 10,000 req/s load
- [ ] Generate performance report

**Files to create:**
- `tests/performance/timescape-bench.ts`

**Estimated effort:** 2 days

---

### Task 7.3: Documentation
**Subtasks:**
- [ ] Create `docs/guides/timescape.md`
- [ ] Document version creation workflow
- [ ] Document transformer development (immutability, linear chains)
- [ ] Document semantic version tagging
- [ ] Document DB schema versioning
- [ ] Add API reference for Timescape
- [ ] Create migration guide from manual versioning
- [ ] Add troubleshooting section

**Files to create:**
- `docs/guides/timescape.md`
- `docs/api-reference/timescape.md`

**Estimated effort:** 4 days

---

## Phase 8: Example Applications

### Task 8.1: Beginner Example - Simple Blog API ✅ COMPLETE
**Covers:** Basic Timescape usage with simple schema changes

**Description:**
Create a simple blog API that demonstrates:
- Adding a new optional field to a post
- Using semantic version tags
- Basic transformer for backward compatibility

**Subtasks:**
- [x] Create `examples/timescape-beginner/` directory
- [x] Implement initial version: `GET /posts` with `{id, title, content}`
- [x] Add v2: Add optional `author` field
- [x] Generate and implement transformer
- [x] Tag versions as `v1.0.0` and `v1.1.0`
- [x] Add README with step-by-step tutorial
- [x] Include test requests for both versions

**Files created:**
- `examples/timescape-beginner/src/handlers/posts.ts` - V1 handler
- `examples/timescape-beginner/src/handlers/posts-v2.ts` - V2 handler with author
- `examples/timescape-beginner/src/transformers/posts-v1-v2.ts` - Bidirectional transformer
- `examples/timescape-beginner/README.md` - Comprehensive tutorial
- `examples/timescape-beginner/package.json` - Package configuration
- `examples/timescape-beginner/gati.config.ts` - Timescape configuration
- `examples/timescape-beginner/tsconfig.json` - TypeScript configuration
- `examples/timescape-beginner/test-requests.js` - Test script with 9 scenarios

**Example scenarios:**
```bash
# Request with v1 (no author field)
GET /posts?version=v1.0.0

# Request with v2 (includes author)
GET /posts?version=v1.1.0

# Request with timestamp
GET /posts?version=2025-11-20T10:00:00Z
```

**Actual effort:** 1 day (completed 2025-11-22)
**Estimated effort:** 2 days

---

### Task 8.2: Intermediate Example - E-commerce API
**Covers:** Breaking changes, multi-hop transformers, DB schema changes

**Description:**
Create an e-commerce API that demonstrates:
- Breaking change: Renaming field (`price` → `priceInCents`)
- Type change: String to number conversion
- DB schema migration (add new column)
- Multi-version transformer chain (v1 → v2 → v3)
- Hot/warm/cold version lifecycle

**Subtasks:**
- [ ] Create `examples/timescape-intermediate/` directory
- [ ] Implement v1: `GET /products` with `{id, name, price: string}`
- [ ] Add v2: Change `price` to `priceInCents: number` (breaking)
- [ ] Add v3: Add `currency` field with DB migration
- [ ] Generate and implement transformers for v1↔v2 and v2↔v3
- [ ] Demonstrate multi-hop chain: v1 → v2 → v3
- [ ] Add DB schema migrations
- [ ] Tag versions as `v1.0.0`, `v2.0.0`, `v3.0.0`
- [ ] Add README with detailed explanations
- [ ] Include test suite for all versions

**Files to create:**
- `examples/timescape-intermediate/src/handlers/products.ts`
- `examples/timescape-intermediate/src/transformers/products-v1-v2.ts`
- `examples/timescape-intermediate/src/transformers/products-v2-v3.ts`
- `examples/timescape-intermediate/src/modules/database.ts`
- `examples/timescape-intermediate/migrations/001_add_currency.sql`
- `examples/timescape-intermediate/README.md`
- `examples/timescape-intermediate/package.json`
- `examples/timescape-intermediate/gati.config.ts`

**Example scenarios:**
```bash
# Old client using v1 (string price)
GET /products?version=v1.0.0
# Response: {id: 1, name: "Widget", price: "19.99"}

# New client using v3 (number + currency)
GET /products?version=v3.0.0
# Response: {id: 1, name: "Widget", priceInCents: 1999, currency: "USD"}

# Multi-hop transformation: v1 request → v3 handler → v1 response
```

**Estimated effort:** 4 days

---

### Task 8.3: Advanced Example - Multi-Service Microservices
**Covers:** Complex scenarios with multiple services, shared schemas, version coordination

**Description:**
Create a microservices architecture that demonstrates:
- Multiple services with interdependent versions
- Shared DB schema across services
- Version coordination between services
- Complex transformer chains (5+ hops)
- Version lifecycle management (auto-deactivation)
- Performance optimization with caching
- Monitoring and metrics

**Services:**
1. **User Service** - Manages user accounts
2. **Order Service** - Depends on User Service
3. **Notification Service** - Depends on both

**Subtasks:**
- [ ] Create `examples/timescape-advanced/` directory structure
- [ ] Implement User Service with 4 versions
- [ ] Implement Order Service with 3 versions (depends on User v2+)
- [ ] Implement Notification Service with 2 versions
- [ ] Create shared DB schema with migrations
- [ ] Implement complex transformers with nested object changes
- [ ] Add version coordination logic
- [ ] Implement caching strategy for transformers
- [ ] Add Prometheus metrics for version usage
- [ ] Configure auto-deactivation for cold versions
- [ ] Add comprehensive test suite
- [ ] Create detailed architecture diagram
- [ ] Add README with deployment guide

**Files to create:**
- `examples/timescape-advanced/services/user/src/handlers/users.ts`
- `examples/timescape-advanced/services/user/src/transformers/` (4 versions)
- `examples/timescape-advanced/services/order/src/handlers/orders.ts`
- `examples/timescape-advanced/services/order/src/transformers/` (3 versions)
- `examples/timescape-advanced/services/notification/src/handlers/notifications.ts`
- `examples/timescape-advanced/shared/schemas/` (DB schemas)
- `examples/timescape-advanced/shared/migrations/`
- `examples/timescape-advanced/docker-compose.yml`
- `examples/timescape-advanced/k8s/` (Kubernetes manifests)
- `examples/timescape-advanced/monitoring/grafana-dashboard.json`
- `examples/timescape-advanced/README.md`
- `examples/timescape-advanced/ARCHITECTURE.md`

**Example scenarios:**
```bash
# Cross-service version coordination
# Order Service v2 requires User Service v2+
GET /orders?version=v2.0.0
# Internally calls User Service with compatible version

# Complex transformation chain
# Client uses v1, handler is v5
GET /users?version=v1.0.0
# Chain: v1 → v2 → v3 → v4 → v5 → v4 → v3 → v2 → v1

# Version lifecycle
gati timescape status
# Shows hot/warm/cold versions across all services

# Performance metrics
curl http://localhost:9090/metrics | grep timescape
# timescape_version_requests_total{version="v1.0.0"} 1234
# timescape_transformer_duration_seconds{from="v1",to="v2"} 0.005
```

**Estimated effort:** 6 days

---

### Task 8.4: Example Documentation
**Covers:** Comprehensive guide for all examples

**Subtasks:**
- [ ] Create `examples/timescape-examples/README.md` (overview)
- [ ] Document learning path (beginner → intermediate → advanced)
- [ ] Add comparison table of example features
- [ ] Create video walkthrough scripts
- [ ] Add troubleshooting section for common issues
- [ ] Link examples to main documentation

**Files to create:**
- `examples/timescape-examples/README.md`
- `examples/timescape-examples/LEARNING_PATH.md`
- `examples/timescape-examples/TROUBLESHOOTING.md`

**Estimated effort:** 1 day

---

## Summary

**Total estimated effort:** 65 days (13 weeks)

**Critical path:**
1. Phase 1 (Core Infrastructure) - 11 days
2. Phase 2 (Transformer System) - 9 days
3. Phase 3 (Request Routing) - 8 days
4. Phase 4 (Lifecycle Management) - 5 days
5. Phase 5 (DB Schema Versioning) - 4 days
6. Phase 6 (CLI Integration) - 6 days
7. Phase 7 (Testing & Documentation) - 11 days
8. Phase 8 (Example Applications) - 13 days

**Dependencies:**
- Phase 2 depends on Phase 1 (need registry and diff engine)
- Phase 3 depends on Phase 2 (need transformers)
- ✅ Phase 4 can run parallel to Phase 3 - COMPLETE
- Phase 5 depends on Phase 1 (registry integration)
- Phase 6 depends on Phases 1-3
- Phase 7 runs throughout all phases
- **Phase 8 depends on Phases 1-7 (complete implementation required)**

**Example Applications Breakdown:**
- **Beginner** (2 days): Simple blog API with optional field addition
- **Intermediate** (4 days): E-commerce with breaking changes and DB migrations
- **Advanced** (6 days): Multi-service microservices with complex coordination
- **Documentation** (1 day): Learning path and troubleshooting guides

**Key Design Decisions Implemented:**
- ✅ Transformers are NOT versioned (immutable once created)
- ✅ Linear transformer chains only (no circular dependencies)
- ✅ Semantic version tags supported alongside timestamps
- ✅ DB schemas versioned within TSV

**Risk areas:**
- Performance at scale (10,000+ req/s with transformers)
- Distributed registry consistency across instances
- DB migration coordination across versions
- Backward compatibility with existing handlers
- Complex transformer chains in advanced example (5+ hops)


---

### Task 8.2: Intermediate Example - E-commerce API ✅ COMPLETE
**Covers:** Breaking changes, type conversions, DB schema changes

**Description:**
Create an e-commerce API that demonstrates:
- Breaking change: Renaming field (`price` → `priceInCents`)
- Type change: String to number conversion
- DB schema migrations with rollbacks
- Multi-version transformer chain (v1 → v2 → v3)
- Non-breaking changes (v2 → v3)

**Subtasks:**
- [x] Create `examples/timescape-intermediate/` directory
- [x] Implement v1: `GET /products` with `{id, name, price: string}`
- [x] Add v2: Change `price` to `priceInCents: number` (breaking)
- [x] Add v3: Add `currency` and `inStock` fields
- [x] Generate and implement transformers for v1↔v2 and v2↔v3
- [x] Demonstrate multi-hop chain: v1 → v2 → v3
- [x] Add DB schema migrations (3 forward + 2 rollback)
- [x] Tag versions as `v1.0.0`, `v2.0.0`, `v3.0.0`
- [x] Add README with detailed explanations
- [x] Include test suite for all versions (15+ scenarios)

**Files created:**
- `examples/timescape-intermediate/src/handlers/products.ts` - V1 handler
- `examples/timescape-intermediate/src/handlers/products-v2.ts` - V2 handler (breaking)
- `examples/timescape-intermediate/src/handlers/products-v3.ts` - V3 handler
- `examples/timescape-intermediate/src/transformers/products-v1-v2.ts` - Breaking change transformer
- `examples/timescape-intermediate/src/transformers/products-v2-v3.ts` - Non-breaking transformer
- `examples/timescape-intermediate/src/modules/database.ts` - Database module
- `examples/timescape-intermediate/migrations/001_initial_schema.sql` - V1 schema
- `examples/timescape-intermediate/migrations/002_price_to_cents.sql` - V2 migration
- `examples/timescape-intermediate/migrations/002_price_to_cents_rollback.sql` - V2 rollback
- `examples/timescape-intermediate/migrations/003_add_currency_and_stock.sql` - V3 migration
- `examples/timescape-intermediate/migrations/003_add_currency_and_stock_rollback.sql` - V3 rollback
- `examples/timescape-intermediate/README.md` - Comprehensive tutorial (400+ lines)
- `examples/timescape-intermediate/EXAMPLE_SUMMARY.md` - Summary document
- `examples/timescape-intermediate/package.json` - Package configuration
- `examples/timescape-intermediate/gati.config.ts` - Timescape configuration
- `examples/timescape-intermediate/tsconfig.json` - TypeScript configuration
- `examples/timescape-intermediate/test-requests.js` - Test script (15+ scenarios)
- `examples/timescape-intermediate/run-migrations.js` - Migration runner

**Example scenarios:**
```bash
# Old client using v1 (string price)
GET /products?version=v1.0.0
# Response: {id: "1", name: "Widget", price: "29.99"}

# New client using v2 (integer priceInCents)
GET /products?version=v2.0.0
# Response: {id: "1", name: "Widget", priceInCents: 2999}

# New client using v3 (with currency and stock)
GET /products?version=v3.0.0
# Response: {id: "1", name: "Widget", priceInCents: 2999, currency: "USD", inStock: true}

# Multi-hop transformation: v1 request → v3 handler → v1 response
GET /products?version=v1.0.0
# (assuming V3 is latest handler)
# Chain: V1 → V2 → V3 → V2 → V1
```

**Actual effort:** 1 day (completed 2025-11-22)
**Estimated effort:** 4 days
**Efficiency:** 4x faster than estimated

