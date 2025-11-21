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

### Task 2.1: Create Transformer Interface
**Covers:** AC-4 (Automatic Transformer Generation), CP-3 (Transformer Chain)

**Subtasks:**
- [ ] Create `packages/runtime/src/timescape/transformer.ts`
- [ ] Define `TransformerPair` interface (forward + backward)
- [ ] Implement immutability enforcement
- [ ] Implement transformer registration (adjacent versions only)
- [ ] Add transformer validation
- [ ] Create linear chain executor (no circular dependencies)
- [ ] Implement error handling and fallback
- [ ] Write unit tests for transformer execution

**Files to create:**
- `packages/runtime/src/timescape/transformer.ts`

**Estimated effort:** 4 days

---

### Task 2.2: Auto-Generate Transformer Stubs
**Covers:** AC-4 (Automatic Transformer Generation)

**Subtasks:**
- [ ] Create `packages/cli/src/codegen/transformer-generator.ts`
- [ ] Generate TypeScript `TransformerPair` from diff
- [ ] Add type signatures for adjacent versions only
- [ ] Insert TODO comments for manual logic
- [ ] Generate both forward and backward transforms
- [ ] Mark generated transformers as immutable
- [ ] Integrate with CLI `generate` command
- [ ] Write tests for code generation

**Files to create:**
- `packages/cli/src/codegen/transformer-generator.ts`

**Files to modify:**
- `packages/cli/src/commands/generate-types.ts`

**Estimated effort:** 5 days

---

## Phase 3: Request Routing

### Task 3.1: Implement Version Resolution
**Covers:** AC-2 (Flexible Version Routing), AC-6 (Semantic Version Tagging), CP-5 (Request Router)

**Subtasks:**
- [ ] Enhance `packages/runtime/src/timescape/resolver.ts`
- [ ] Implement version extraction from query params
- [ ] Implement version extraction from headers
- [ ] Add timestamp parsing and validation
- [ ] Add semantic version tag resolution
- [ ] Implement version caching per request
- [ ] Support direct TSV format
- [ ] Write unit tests for all resolution formats

**Files to modify:**
- `packages/runtime/src/timescape/resolver.ts`

**Estimated effort:** 4 days

---

### Task 3.2: Integrate with Router
**Covers:** AC-2 (Flexible Version Routing)

**Subtasks:**
- [ ] Modify `packages/runtime/src/route-manager.ts`
- [ ] Add version resolution before handler execution
- [ ] Apply linear transformer chain if needed
- [ ] Handle version not found errors
- [ ] Handle invalid tag errors
- [ ] Add metrics for version routing
- [ ] Write integration tests

**Files to modify:**
- `packages/runtime/src/route-manager.ts`
- `packages/runtime/src/handler-engine.ts`

**Estimated effort:** 4 days

---

## Phase 4: Lifecycle Management

### Task 4.1: Version Usage Tracking
**Covers:** AC-5 (Version Lifecycle Management)

**Subtasks:**
- [ ] Add request counter per version
- [ ] Track last accessed timestamp
- [ ] Implement hot/warm/cold classification
- [ ] Add metrics export (Prometheus)
- [ ] Write tests for tracking logic

**Files to modify:**
- `packages/runtime/src/timescape/registry.ts`
- `packages/observability/src/metrics.ts`

**Estimated effort:** 2 days

---

### Task 4.2: Auto-Deactivation System
**Covers:** AC-5 (Version Lifecycle Management)

**Subtasks:**
- [ ] Create background job for version monitoring
- [ ] Implement cold version detection
- [ ] Add auto-deactivation logic
- [ ] Implement manual override mechanism
- [ ] Add configuration options
- [ ] Write tests for lifecycle transitions

**Files to create:**
- `packages/runtime/src/timescape/lifecycle.ts`

**Estimated effort:** 3 days

---

## Phase 5: Database Schema Versioning

### Task 5.1: DB Schema Integration
**Covers:** AC-7 (Database Schema Versioning)

**Subtasks:**
- [ ] Create `packages/runtime/src/timescape/db-schema.ts`
- [ ] Add DB schema version to TSV metadata
- [ ] Implement migration runner
- [ ] Implement rollback runner
- [ ] Track schema changes in version registry
- [ ] Support shared schemas across versions
- [ ] Write tests for migration execution

**Files to create:**
- `packages/runtime/src/timescape/db-schema.ts`

**Files to modify:**
- `packages/runtime/src/timescape/types.ts`
- `packages/runtime/src/timescape/registry.ts`

**Estimated effort:** 4 days

---

## Phase 6: CLI Integration

### Task 6.1: Version Management Commands
**Covers:** Developer experience

**Subtasks:**
- [ ] Add `gati timescape list` command
- [ ] Add `gati timescape diff <v1> <v2>` command
- [ ] Add `gati timescape deactivate <version>` command
- [ ] Add `gati timescape status` command
- [ ] Write CLI tests

**Files to modify:**
- `packages/cli/src/commands/timescape.ts`

**Estimated effort:** 2 days

---

### Task 6.2: Dev Server Integration
**Covers:** AC-1 (Automatic Version Creation)

**Subtasks:**
- [ ] Modify `packages/cli/src/commands/dev.ts`
- [ ] Detect handler changes during hot reload
- [ ] Trigger version creation automatically
- [ ] Show version creation notifications
- [ ] Generate immutable transformer pairs if breaking changes detected
- [ ] Prevent modification of old transformers

**Files to modify:**
- `packages/cli/src/commands/dev.ts`
- `packages/cli/src/analyzer/handler-analyzer.ts`

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

### Task 8.1: Beginner Example - Simple Blog API
**Covers:** Basic Timescape usage with simple schema changes

**Description:**
Create a simple blog API that demonstrates:
- Adding a new optional field to a post
- Using semantic version tags
- Basic transformer for backward compatibility

**Subtasks:**
- [ ] Create `examples/timescape-beginner/` directory
- [ ] Implement initial version: `GET /posts` with `{id, title, content}`
- [ ] Add v2: Add optional `author` field
- [ ] Generate and implement transformer
- [ ] Tag versions as `v1.0.0` and `v1.1.0`
- [ ] Add README with step-by-step tutorial
- [ ] Include test requests for both versions

**Files to create:**
- `examples/timescape-beginner/src/handlers/posts.ts`
- `examples/timescape-beginner/src/transformers/posts-v1-v2.ts`
- `examples/timescape-beginner/README.md`
- `examples/timescape-beginner/package.json`
- `examples/timescape-beginner/gati.config.ts`

**Example scenarios:**
```bash
# Request with v1 (no author field)
GET /posts?version=v1.0.0

# Request with v2 (includes author)
GET /posts?version=v1.1.0

# Request with timestamp
GET /posts?version=2025-11-20T10:00:00Z
```

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
- Phase 4 can run parallel to Phase 3
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
