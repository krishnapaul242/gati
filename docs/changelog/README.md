# Changelog

All notable changes and releases for the Gati framework.

## Latest Release

**Current Version**: v2.0.3 (Runtime), v1.0.7 (CLI), v0.4.3 (Core)  
**Release Date**: November 22, 2025  
**Status**: ✅ Production Ready with CI/CD

See [Current State](./current-state.md) for detailed status.

---

## Recent Updates

### November 22, 2025 - CI/CD Pipeline Complete 🎉

**Major Achievement**: Automated CI/CD pipeline now operational!

- ✅ Automated testing on every push
- ✅ Automated npm publishing with changesets
- ✅ Documentation deployment to GitHub Pages
- ✅ Core and Types packages in CI/CD
- 🚧 Other packages temporarily excluded (TypeScript strict mode issues)

See [CI/CD Complete](./2025-11-22-ci-cd-complete.md) for full details.

---

## Version History

### Runtime v2.0.0 (November 10, 2025)

**Major Changes**:

- ✅ Simplified handler API (Express.js compatible)
- ✅ Fixed dependency resolution (runtime → core)
- ✅ Explicit app initialization with `createApp()`
- ✅ Auto-discovery with `loadHandlers()`
- ✅ Graceful shutdown support

**Breaking Changes**:

- Handler signature changed from `(req, res, gctx, lctx)` to `(req, res)`
- Context now available via `req.gatiContext` when needed
- Requires explicit `createApp()` call

**Migration Guide**: See [Getting Started](../onboarding/getting-started.md)

### CLI v1.0.0 (November 10, 2025)

**Features**:

- ✅ Project scaffolding with `gati create`
- ✅ Development server with hot reload
- ✅ Local Kubernetes deployment
- ✅ Health check validation
- ✅ Port forwarding support
- ✅ Auto-tagging for images

**Commands**:

- `gati create <name>` - Create new project
- `gati dev` - Start development server
- `gati build` - Build for production
- `gati deploy <env> --local` - Deploy to local K8s

### Core v0.4.1 (November 8, 2025)

**Features**:

- ✅ TypeScript type definitions
- ✅ Base configuration (`tsconfig.base.json`)
- ✅ Handler, Request, Response interfaces
- ✅ Context types (GlobalContext, LocalContext)

---

## Milestone Completion

### M1: Foundation & Core Runtime ✅ Complete

**Completion Date**: November 9, 2025  
**Duration**: 15 days  
**Issues Closed**: 17/17

See [MVP Completion Report](./mvp-completion.md) for full details.

**Deliverables**:

- Handler execution pipeline
- Request/Response objects
- Global and local context
- Route registration and routing
- Module system foundation
- CLI scaffolding
- Development server
- Build system
- Local Kubernetes deployment
- Comprehensive documentation

**Test Coverage**: 99.3% (290/292 tests passing)

---

## Upcoming Milestones

### M2: Cloud Infrastructure (In Progress)

**Target**: December 2025  
**Status**: Planning

**Planned Features**:

- AWS EKS deployment
- GCP GKE deployment
- Azure AKS deployment
- Multi-cloud abstraction
- Secret management
- Observability stack (Prometheus, Loki)

### M3: API Versioning (Q1 2026)

**Planned Features**:

- Timestamp-based routing
- Semantic versioning
- Version diff analyzer
- Backward compatibility

### M4: Control Panel (Q2 2026)

**Planned Features**:

- Read-only admin UI
- Live monitoring
- Log viewer
- Metrics dashboard

### M5: SDK Generation (Q2 2026)

**Planned Features**:

- Auto-generated typed clients
- NPM package publishing
- Version-aware SDKs

---

## Documentation Updates

### November 22, 2025

- ✅ Updated for CI/CD completion
- ✅ Added CI/CD status documentation
- ✅ Updated package versions across docs
- ✅ Added CI/CD changelog entry
- ✅ Updated roadmap timelines

### November 12, 2025

- ✅ Reorganized documentation structure
- ✅ Created onboarding section
- ✅ Added API reference
- ✅ Improved navigation
- ✅ Added examples

### November 10, 2025

- ✅ Updated for Runtime v2.0.0
- ✅ New handler examples
- ✅ GatiC usage guide
- ✅ Current project structure

### November 9, 2025

- ✅ MVP completion report
- ✅ Task completion summary
- ✅ Architecture analysis

---

## Breaking Changes Log

### Runtime v1.x → v2.0.0

**Handler Signature**:

Before:

```typescript
const handler = (req, res, gctx, lctx) => { ... }
```

After:

```typescript
const handler: Handler = (req, res) => { ... }
// Context available via req.gatiContext if needed
```

**Migration**: Update all handler signatures

---

## Known Issues

### Current

- 2 flaky network tests (intermittent failures)
- Markdown linting warnings (non-blocking)

### Resolved

- ✅ Template generation fixed (CLI v1.0.0)
- ✅ Dependency resolution fixed (Runtime v2.0.0)

---

## Release Notes Archive

- [CI/CD Complete](./2025-11-22-ci-cd-complete.md) - CI/CD pipeline completion (Nov 22, 2025)
- [Current State](./current-state.md) - Latest status and features
- [MVP Completion](./mvp-completion.md) - M1 milestone report
- [Task Summary](./task-completion-summary.md) - Completed tasks
- [Documentation Summary](./documentation-summary.md) - Docs changelog

---

## Versioning Policy

Gati follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)

---

## Support Policy

| Version | Status | Support Until | Notes |
|---------|--------|---------------|-------|
| 2.x.x | ✅ Active | Ongoing | Current release |
| 1.x.x | ⚠️ Deprecated | January 2026 | Migrate to 2.x |
| 0.x.x | ❌ Unsupported | - | Alpha/Beta only |

---

*Last Updated: November 22, 2025*
